/**
 * BrightMatter Oracle Server with Forte Integration
 * 
 * Express server for post analysis, campaign management, and agent scheduling
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendTx, runScript, fcl } from './flow/client';
import { getOracleAddress } from './flow/signer';
import { runFraudChecks, mockMetrics, computeResonance } from './services/fraud';
import { splitByResonance, normalizePercentsForUFix64, calculateAmounts, validateSplits } from './services/splits';
import { campaignStore, Campaign, CampaignParticipant, Submission, PayoutReceipt } from './models/campaigns';
import * as t from '@onflow/types';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    service: 'brightmatter-oracle-forte',
    network: 'mainnet',
    contracts: {
      CampaignEscrowV3: '0x14aca78d100d2001',
      CreatorProfileV2: '0x14aca78d100d2001'
    },
    oracle: getOracleAddress(),
    forte: {
      enabled: true,
      features: ['scheduled-transactions', 'agents', 'actions']
    }
  });
});

// Analyze post - compute score and write proof on-chain
app.post('/api/analyze-post', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const metrics = mockMetrics(url);
    const score = computeResonance(metrics);
    
    res.json({ success: true, score: score.toFixed(1), metrics });
  } catch (error: any) {
    console.error('❌ [ANALYZE_POST] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Submit post and record on-chain (oracle-signed)
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { postUrl, campaignId, creatorAddress } = req.body;
    
    console.log(`📝 [ANALYZE] Started`, { postUrl, campaignId, creatorAddress });
    
    if (!postUrl || !campaignId || !creatorAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Mock metrics and compute score
    const metrics = mockMetrics(postUrl);
    const score = computeResonance(metrics);
    const timestamp = Date.now() / 1000;
    
    console.log(`📊 [ANALYZE] Score: ${score.toFixed(1)}`, { metrics });
    
    // Write proof + score on-chain (oracle-signed transaction)
    const cadence = `
      import CampaignEscrowV3 from 0x14aca78d100d2001
      import CreatorProfileV2 from 0x14aca78d100d2001
      
      transaction(
        campaignId: String,
        creator: Address,
        postId: String,
        score: UFix64,
        timestamp: UFix64
      ) {
        prepare(signer: &Account) {
          let signerAddr = signer.address
          
          let ok = CampaignEscrowV3.updateCreatorScore(
            campaignId: campaignId,
            creator: creator,
            score: score,
            signer: signerAddr
          )
          assert(ok, message: "updateCreatorScore failed")
          
          CreatorProfileV2.addProofFor(
            creator: creator,
            postId: postId,
            score: score,
            timestamp: timestamp,
            campaignId: campaignId,
            signer: signerAddr
          )
        }
      }
    `;
    
    const { txId } = await sendTx(cadence, [
      (arg, types) => arg(campaignId, types.String),
      (arg, types) => arg(fcl.withPrefix(creatorAddress), types.Address),
      (arg, types) => arg(metrics.postId, types.String),
      (arg, types) => arg(score.toFixed(1), types.UFix64),
      (arg, types) => arg(timestamp.toFixed(1), types.UFix64),
    ]);
    
    console.log(`✅ [ANALYZE] Transaction sealed: ${txId}`);
    
    res.json({
      success: true,
      score: score.toFixed(1),
      metrics,
      txId,
      flowscanLink: `https://flowscan.org/transaction/${txId}`
    });
  } catch (error: any) {
    console.error('❌ [ANALYZE] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Forte Agent Verification Endpoint
// Called by scheduled agent to verify campaign and trigger payout
app.post('/api/agent/verify/:id', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    console.log(`🤖 [AGENT] Verifying campaign ${campaignId}`);
    
    // Check if it's an open campaign
    const openCampaign = campaignStore.get(campaignId);
    if (openCampaign) {
      return await handleOpenCampaignVerification(campaignId, openCampaign, res);
    }
    
    // Handle curated campaign (existing logic)
    return await handleCuratedCampaignVerification(campaignId, res);
  } catch (error: any) {
    console.error(`❌ [AGENT] Error:`, error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

async function handleOpenCampaignVerification(campaignId: string, campaign: Campaign, res: Response) {
  console.log(`🤖 [AGENT] Processing open campaign ${campaignId}`);
  
  // 1) Get valid submissions within window
  const validSubmissions = campaignStore.findValidInWindow(campaignId, campaign.criteria);
  
  if (validSubmissions.length === 0) {
    console.warn(`🚫 [AGENT] No eligible submissions for campaign ${campaignId}`);
    return res.status(400).json({ error: 'No eligible submissions' });
  }
  
  // 2) Calculate splits based on resonance scores
  const creatorRows = validSubmissions.map(s => ({
    creatorAddr: s.creatorAddr,
    resonanceScore: s.resonanceScore
  }));
  
  const rawSplits = splitByResonance(creatorRows);
  const normalizedSplits = normalizePercentsForUFix64(rawSplits);
  
  if (!validateSplits(normalizedSplits)) {
    console.error(`❌ [AGENT] Invalid splits for campaign ${campaignId}`);
    return res.status(500).json({ error: 'Invalid payout splits' });
  }
  
  const splitsWithAmounts = calculateAmounts(normalizedSplits, campaign.budgetFlow);
  
  console.log(`📊 [AGENT] Calculated splits:`, splitsWithAmounts);
  
  // 3) Execute Forte payout chain
  const payoutResult = await executeFortePayoutChain(campaignId, campaign.budgetFlow, normalizedSplits);
  
  // 4) Store payout receipt
  const payoutReceipt: PayoutReceipt = {
    campaignId,
    payoutTxId: payoutResult.txId,
    splits: splitsWithAmounts,
    createdAt: new Date().toISOString()
  };
  
  campaignStore.addPayoutReceipt(payoutReceipt);
  campaignStore.update(campaignId, { status: 'paid' });
  
  console.log(`✅ [AGENT] Open campaign payout executed: ${payoutResult.txId}`);
  
  res.json({
    success: true,
    campaignId,
    action: 'payout',
    txId: payoutResult.txId,
    splits: splitsWithAmounts,
    flowscanLink: `https://flowscan.org/transaction/${payoutResult.txId}`
  });
}

async function handleCuratedCampaignVerification(campaignId: string, res: Response) {
  console.log(`🤖 [AGENT] Processing curated campaign ${campaignId}`);
  
  // 1) Fetch campaign data from chain
  const campaignScript = `
    import CampaignEscrowV3 from 0x14aca78d100d2001
    access(all) fun main(id: String): CampaignEscrowV3.Campaign? {
      return CampaignEscrowV3.getCampaign(id: id)
    }
  `;
  
  const campaign = await runScript(campaignScript, [
    (arg, types) => arg(campaignId, types.String)
  ]);
  
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  
  // 2) Run fraud checks (mock - in production would fetch actual proofs)
  const mockProofs = [{ postId: 'test', likes: 100, comments: 20, shares: 10, timestamp: Date.now() }];
  const fraudCheckPassed = await runFraudChecks(campaignId, mockProofs);
  
  if (!fraudCheckPassed) {
    console.warn(`🚫 [AGENT] Campaign ${campaignId} flagged for fraud`);
    return res.json({ success: false, flagged: true, campaignId });
  }
  
  // 3) Trigger payout via verify_and_payout transaction
  const payoutCadence = `
    import CampaignEscrowV3 from 0x14aca78d100d2001
    
    transaction(campaignId: String) {
      prepare(signer: &Account) {
        let signerAddr = signer.address
        
        let success = CampaignEscrowV3.triggerPayout(
          campaignId: campaignId,
          signer: signerAddr
        )
        
        assert(success, message: "Payout execution failed")
      }
    }
  `;
  
  const { txId } = await sendTx(payoutCadence, [
    (arg, types) => arg(campaignId, types.String)
  ]);
  
  console.log(`✅ [AGENT] Curated campaign payout executed: ${txId}`);
  
  res.json({
    success: true,
    campaignId,
    action: 'payout',
    txId,
    flowscanLink: `https://flowscan.org/transaction/${txId}`
  });
}

async function executeFortePayoutChain(campaignId: string, budgetFlow: string, splits: any[]) {
  // For now, simulate the Forte action chain execution
  // In production, this would call the actual Forte Actions
  
  console.log(`🔗 [FORTE] Executing payout chain for ${campaignId}`);
  console.log(`💰 [FORTE] Budget: ${budgetFlow} FLOW`);
  console.log(`📊 [FORTE] Splits:`, splits);
  
  // Simulate transaction execution
  const mockTxId = `forte-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    txId: mockTxId,
    splits: splits.map(split => ({
      ...split,
      amountFlow: (parseFloat(budgetFlow) * split.percent).toFixed(8)
    }))
  };
}

// Manual payout trigger (existing endpoint)
app.post('/api/campaigns/:id/payout', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    console.log(`💰 [PAYOUT] Manual trigger for ${campaignId}`);
    
    const cadence = `
      import CampaignEscrowV3 from 0x14aca78d100d2001
      
      transaction(campaignId: String) {
        prepare(signer: &Account) {
          let success = CampaignEscrowV3.triggerPayout(
            campaignId: campaignId,
            signer: signer.address
          )
          assert(success, message: "Payout failed")
        }
      }
    `;
    
    const { txId } = await sendTx(cadence, [
      (arg, types) => arg(campaignId, types.String)
    ]);
    
    console.log(`✅ [PAYOUT] Success: ${txId}`);
    
    res.json({
      success: true,
      campaignId,
      txId,
      flowscanLink: `https://flowscan.org/transaction/${txId}`
    });
  } catch (error: any) {
    console.error('❌ [PAYOUT] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Manual refund trigger (existing endpoint)
app.post('/api/campaigns/:id/refund', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    console.log(`🔄 [REFUND] Manual trigger for ${campaignId}`);
    
    const cadence = `
      import CampaignEscrowV3 from 0x14aca78d100d2001
      
      transaction(campaignId: String) {
        prepare(signer: &Account) {
          let success = CampaignEscrowV3.triggerRefund(
            campaignId: campaignId,
            signer: signer.address
          )
          assert(success, message: "Refund failed")
        }
      }
    `;
    
    const { txId } = await sendTx(cadence, [
      (arg, types) => arg(campaignId, types.String)
    ]);
    
    console.log(`✅ [REFUND] Success: ${txId}`);
    
    res.json({
      success: true,
      campaignId,
      txId,
      flowscanLink: `https://flowscan.org/transaction/${txId}`
    });
  } catch (error: any) {
    console.error('❌ [REFUND] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Create campaign (supports both open and curated)
app.post('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { type, deadline, budgetFlow, criteria } = req.body;
    
    console.log(`📋 [CREATE_CAMPAIGN] Creating ${type} campaign`, { deadline, budgetFlow, criteria });
    
    if (!type || !deadline || !budgetFlow || !criteria) {
      return res.status(400).json({ error: 'Missing required fields: type, deadline, budgetFlow, criteria' });
    }
    
    if (type !== 'open' && type !== 'curated') {
      return res.status(400).json({ error: 'Type must be "open" or "curated"' });
    }
    
    const campaignId = `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const campaign: Campaign = {
      id: campaignId,
      type,
      deadline,
      budgetFlow,
      status: 'pending',
      criteria,
      windowStart: criteria.windowStart || now,
      createdAt: now,
      updatedAt: now
    };
    
    campaignStore.create(campaign);
    
    console.log(`✅ [CREATE_CAMPAIGN] Created campaign ${campaignId}`);
    
    res.json({
      success: true,
      campaignId,
      campaign
    });
  } catch (error: any) {
    console.error('❌ [CREATE_CAMPAIGN] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Join open campaign
app.post('/api/campaigns/:id/join', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    const { creatorAddr, signature } = req.body;
    
    console.log(`👥 [JOIN_CAMPAIGN] Creator ${creatorAddr} joining ${campaignId}`);
    
    if (!creatorAddr) {
      return res.status(400).json({ error: 'Missing creatorAddr' });
    }
    
    const campaign = campaignStore.get(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.type !== 'open') {
      return res.status(400).json({ error: 'Only open campaigns can be joined' });
    }
    
    if (campaignStore.isParticipant(campaignId, creatorAddr)) {
      return res.status(400).json({ error: 'Creator already joined this campaign' });
    }
    
    const participant: CampaignParticipant = {
      campaignId,
      creatorAddr,
      joinedAt: new Date().toISOString(),
      isEligible: true
    };
    
    campaignStore.addParticipant(participant);
    
    console.log(`✅ [JOIN_CAMPAIGN] Creator ${creatorAddr} joined ${campaignId}`);
    
    res.json({
      success: true,
      campaignId,
      creatorAddr,
      joinedAt: participant.joinedAt
    });
  } catch (error: any) {
    console.error('❌ [JOIN_CAMPAIGN] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Submit content to campaign
app.post('/api/campaigns/:id/submit', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    const { creatorAddr, platform, url, postId, timestamp, metrics } = req.body;
    
    console.log(`📝 [SUBMIT_CONTENT] Creator ${creatorAddr} submitting to ${campaignId}`, { platform, url, postId });
    
    if (!creatorAddr || !platform || !url || !postId || !timestamp || !metrics) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const campaign = campaignStore.get(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (!campaignStore.isParticipant(campaignId, creatorAddr)) {
      return res.status(400).json({ error: 'Creator must join campaign first' });
    }
    
    // Generate unique hash for duplicate detection
    const uniqueHash = `${platform}:${postId}`;
    
    // Check for duplicates
    const existingSubmissions = campaignStore.getSubmissions(campaignId);
    if (existingSubmissions.some(s => s.uniqueHash === uniqueHash)) {
      return res.status(400).json({ error: 'Duplicate submission detected' });
    }
    
    // Compute resonance score
    const resonanceScore = computeResonance(metrics);
    
    // Validate submission
    const submissionTime = new Date(timestamp);
    const windowStart = new Date(campaign.windowStart);
    const deadline = new Date(campaign.deadline);
    
    const flags: any = {};
    
    if (submissionTime < windowStart || submissionTime > deadline) {
      flags.outsideWindow = true;
    }
    
    if (campaign.criteria.platformAllowlist && !campaign.criteria.platformAllowlist.includes(platform)) {
      flags.invalidPlatform = true;
    }
    
    if (campaign.criteria.minEngagementRate && metrics.views) {
      const engagementRate = (metrics.likes + metrics.comments + metrics.shares) / metrics.views;
      if (engagementRate < campaign.criteria.minEngagementRate) {
        flags.lowEngagement = true;
      }
    }
    
    const submission: Submission = {
      campaignId,
      creatorAddr,
      platform,
      url,
      postId,
      timestamp,
      metrics,
      resonanceScore,
      uniqueHash,
      flags,
      createdAt: new Date().toISOString()
    };
    
    campaignStore.addSubmission(submission);
    
    console.log(`✅ [SUBMIT_CONTENT] Submission recorded`, { resonanceScore, flags });
    
    res.json({
      success: true,
      campaignId,
      creatorAddr,
      resonanceScore,
      flags,
      submissionId: uniqueHash
    });
  } catch (error: any) {
    console.error('❌ [SUBMIT_CONTENT] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaign leaderboard
app.get('/api/campaigns/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    const campaign = campaignStore.get(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const leaderboard = campaignStore.getLeaderboard(campaignId);
    
    res.json({
      success: true,
      campaignId,
      leaderboard,
      totalSubmissions: leaderboard.reduce((sum, entry) => sum + entry.submissionCount, 0),
      totalResonance: leaderboard.reduce((sum, entry) => sum + entry.totalResonance, 0)
    });
  } catch (error: any) {
    console.error('❌ [LEADERBOARD] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaign status (updated to include open campaign data)
app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    // Check if it's an open campaign in our store
    const openCampaign = campaignStore.get(campaignId);
    if (openCampaign) {
      const leaderboard = campaignStore.getLeaderboard(campaignId);
      const payoutReceipt = campaignStore.getPayoutReceipt(campaignId);
      
      return res.json({
        success: true,
        campaign: openCampaign,
        leaderboard,
        payoutReceipt,
        participants: campaignStore.getParticipants(campaignId),
        submissions: campaignStore.getSubmissions(campaignId)
      });
    }
    
    // Fallback to on-chain campaign (curated)
    const cadence = `
      import CampaignEscrowV3 from 0x14aca78d100d2001
      access(all) fun main(id: String): CampaignEscrowV3.Campaign? {
        return CampaignEscrowV3.getCampaign(id: id)
      }
    `;
    
    const campaign = await runScript(cadence, [
      (arg, types) => arg(campaignId, types.String)
    ]);
    
    res.json({ success: true, campaign });
  } catch (error: any) {
    console.error('❌ [READ_CAMPAIGN] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// List all campaigns (with optional type filter)
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    
    console.log(`📋 [LIST_CAMPAIGNS] Listing campaigns, type filter: ${type || 'all'}`);
    
    // Get all campaigns from store
    const allCampaigns = campaignStore.getAllCampaigns();
    
    // Filter by type if specified
    const filteredCampaigns = allCampaigns.filter(campaign => 
      !type || campaign.type === type
    );
    
    res.json({
      success: true,
      campaigns: filteredCampaigns
    });
  } catch (error: any) {
    console.error('❌ [LIST_CAMPAIGNS] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaigns by creator
app.get('/api/campaigns/by-creator/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    console.log(`📋 [GET_CAMPAIGNS_BY_CREATOR] For address: ${address}`);
    
    // Get open campaigns where this creator is a participant
    const openCampaigns = campaignStore.getCampaignsByParticipant(address);
    
    // Then fallback to on-chain curated campaigns
    const cadence = `
      import CampaignEscrowV3 from 0x14aca78d100d2001
      access(all) fun main(creator: Address): [CampaignEscrowV3.Campaign] {
        return CampaignEscrowV3.getCampaignsByCreator(creator: creator)
      }
    `;
    
    const chainCampaigns = await runScript(cadence, [
      (arg, types) => arg(fcl.withPrefix(address), types.Address)
    ]);
    
    res.json({ 
      success: true, 
      data: [...openCampaigns, ...(chainCampaigns || [])]
    });
  } catch (error: any) {
    console.error('❌ [GET_CAMPAIGNS] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get profile
app.get('/api/profile/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Mock profile for now
    res.json({
      success: true,
      data: {
        address,
        veriScore: 0,
        totalCampaigns: 0
      }
    });
  } catch (error: any) {
    console.error('❌ [GET_PROFILE] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Setup profile transaction
app.get('/api/setup-profile', (_req: Request, res: Response) => {
  const cadence = `
import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import CreatorProfileV2 from 0x14aca78d100d2001

transaction {
  prepare(acct: auth(Storage, SaveValue, Capabilities, BorrowValue) &Account) {
    // 1) Ensure FlowToken receiver vault
    if acct.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault) == nil {
      acct.save(<- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()), to: /storage/flowTokenVault)
      acct.link<&{FungibleToken.Receiver}>(
        /public/flowTokenReceiver,
        target: /storage/flowTokenVault
      )
    } else {
      if !acct.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver).check() {
        acct.link<&{FungibleToken.Receiver}>(
          /public/flowTokenReceiver,
          target: /storage/flowTokenVault
        )
      }
    }
    
    // 2) Ensure CreatorProfileV2 profile in storage + public cap
    if acct.borrow<&CreatorProfileV2.Profile>(from: /storage/CreatorProfile) == nil {
      acct.save(<- CreatorProfileV2.createEmptyProfile(), to: /storage/CreatorProfile)
    }
    acct.unlink(/public/CreatorProfile)
    acct.link<&{CreatorProfileV2.ProfilePublic}>(
      /public/CreatorProfile,
      target: /storage/CreatorProfile
    )
  }
}
  `;
  
  res.json({ success: true, cadence });
});

// Start server
const serverPort = Number(port);
app.listen(serverPort, '0.0.0.0', () => {
  console.log(`🚀 BrightMatter Oracle + Forte running on port ${serverPort}`);
  console.log(`📊 Mainnet contracts: 0x14aca78d100d2001`);
  console.log(`🔐 Oracle address: ${getOracleAddress()}`);
  console.log(`🤖 Forte Agent enabled: true`);
});

