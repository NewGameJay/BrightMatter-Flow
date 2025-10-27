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
import { splitByResonance, normalizePercentsForUFix64, calculatePayoutAmounts } from './services/splits';
import { db } from './services/db';
import * as t from '@onflow/types';
import { createHash } from 'crypto';

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

// =============================================================================
// OPEN CAMPAIGN ENDPOINTS
// =============================================================================

// Create campaign (supports both open and curated types)
app.post('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { type, deadline, budgetFlow, criteria } = req.body;
    
    if (!type || !deadline || !budgetFlow) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const campaignId = `campaign-${Date.now()}`;
    const campaign = {
      id: campaignId,
      type,
      deadline,
      budgetFlow,
      status: 'pending' as const,
      criteria: criteria || {},
      createdAt: new Date().toISOString()
    };
    
    db.createCampaign(campaign);
    
    console.log(`📝 [CREATE_CAMPAIGN] Created ${type} campaign ${campaignId}`);
    
    res.json({ success: true, campaignId });
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
    
    if (!creatorAddr) {
      return res.status(400).json({ error: 'Missing creatorAddr' });
    }
    
    const campaign = db.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.type !== 'open') {
      return res.status(400).json({ error: 'Only open campaigns can be joined' });
    }
    
    // Check if already a participant
    if (db.isParticipant(campaignId, creatorAddr)) {
      return res.status(400).json({ error: 'Already a participant' });
    }
    
    const participant = {
      campaignId,
      creatorAddr,
      joinedAt: new Date().toISOString(),
      isEligible: true
    };
    
    db.addParticipant(participant);
    
    console.log(`👤 [JOIN] Creator ${creatorAddr} joined campaign ${campaignId}`);
    
    res.json({ success: true, campaignId });
  } catch (error: any) {
    console.error('❌ [JOIN] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Submit content to open campaign
app.post('/api/campaigns/:id/submit', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    const { creatorAddr, platform, url, postId, timestamp, metrics } = req.body;
    
    if (!creatorAddr || !platform || !url || !postId || !timestamp || !metrics) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const campaign = db.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Verify participant
    if (!db.isParticipant(campaignId, creatorAddr)) {
      return res.status(403).json({ error: 'Not a participant in this campaign' });
    }
    
    // Generate unique hash
    const uniqueHash = createHash('sha256')
      .update(`${platform}:${postId}:${campaignId}`)
      .digest('hex');
    
    // Check for duplicates
    if (db.hasSubmissionWithHash(campaignId, uniqueHash)) {
      return res.status(400).json({ error: 'Duplicate submission' });
    }
    
    // Compute resonance score
    const resonanceScore = computeResonance(metrics);
    
    const submission = {
      campaignId,
      creatorAddr,
      platform,
      url,
      postId,
      timestamp,
      metrics,
      resonanceScore,
      uniqueHash,
      flags: {}
    };
    
    db.addSubmission(submission);
    
    console.log(`📊 [SUBMIT] Creator ${creatorAddr} submitted to campaign ${campaignId}, score: ${resonanceScore.toFixed(1)}`);
    
    res.json({ success: true, campaignId, resonanceScore: resonanceScore.toFixed(1) });
  } catch (error: any) {
    console.error('❌ [SUBMIT] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get all campaigns
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = db.getAllCampaigns();
    res.json({ success: true, campaigns });
  } catch (error: any) {
    console.error('❌ [LIST_CAMPAIGNS] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaign leaderboard
app.get('/api/campaigns/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    const campaign = db.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const submissions = db.getSubmissions(campaignId);
    const splits = splitByResonance(
      submissions.map(s => ({ creatorAddr: s.creatorAddr, resonanceScore: s.resonanceScore }))
    );
    
    const leaderboard = splits.map(split => {
      const creatorSubs = submissions.filter(s => s.creatorAddr === split.addr);
      return {
        creatorAddr: split.addr,
        totalScore: creatorSubs.reduce((sum, s) => sum + s.resonanceScore, 0),
        submissionCount: creatorSubs.length,
        percent: (split.percent * 100).toFixed(2)
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
    
    res.json({ success: true, campaignId, leaderboard });
  } catch (error: any) {
    console.error('❌ [LEADERBOARD] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaign details
app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    const campaign = db.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const payout = db.getPayout(campaignId);
    
    res.json({
      success: true,
      campaign,
      payout: payout || null
    });
  } catch (error: any) {
    console.error('❌ [GET_CAMPAIGN] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Forte Agent Verification Endpoint
// Called by scheduled agent to verify campaign and trigger payout
app.post('/api/agent/verify/:id', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    console.log(`🤖 [AGENT] Verifying campaign ${campaignId}`);
    
    // Check if campaign exists in our database (open campaigns)
    const dbCampaign = db.getCampaign(campaignId);
    
    if (dbCampaign && dbCampaign.type === 'open') {
      // Handle open campaign with resonance-based splits
      console.log(`📊 [AGENT] Processing open campaign with resonance splits`);
      
      const validSubmissions = db.getValidSubmissionsInWindow(campaignId);
      
      if (validSubmissions.length === 0) {
        return res.status(400).json({ error: 'No eligible submissions found' });
      }
      
      const rawSplits = splitByResonance(
        validSubmissions.map(s => ({ creatorAddr: s.creatorAddr, resonanceScore: s.resonanceScore }))
      );
      
      if (rawSplits.length === 0) {
        return res.status(400).json({ error: 'Could not calculate splits' });
      }
      
      const normalizedSplits = normalizePercentsForUFix64(rawSplits);
      const payoutAmounts = calculatePayoutAmounts(normalizedSplits, dbCampaign.budgetFlow);
      
      console.log(`💰 [AGENT] Computed splits:`, payoutAmounts);
      
      // Execute Forte payout chain (placeholder for now - would call actual Forte Actions)
      // For now, just return success with calculated splits
      
      db.updateCampaignStatus(campaignId, 'paid');
      db.savePayout({
        campaignId,
        payoutTxId: 'mock-tx-' + Date.now(),
        splits: payoutAmounts,
        createdAt: new Date().toISOString()
      });
      
      return res.json({
        success: true,
        campaignId,
        action: 'payout',
        type: 'open',
        splits: payoutAmounts,
        flowscanLink: null
      });
    }
    
    // Handle curated campaign (existing flow)
    console.log(`📋 [AGENT] Processing curated campaign`);
    
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
    
    console.log(`✅ [AGENT] Payout executed: ${txId}`);
    
    res.json({
      success: true,
      campaignId,
      action: 'payout',
      type: 'curated',
      txId,
      flowscanLink: `https://flowscan.org/transaction/${txId}`
    });
  } catch (error: any) {
    console.error(`❌ [AGENT] Error:`, error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

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

// Get campaign data
app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
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

// Get campaigns by creator
app.get('/api/campaigns/by-creator/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    const cadence = `
      import CampaignEscrowV3 from 0x14aca78d100d2001
      access(all) fun main(creator: Address): [CampaignEscrowV3.Campaign] {
        return CampaignEscrowV3.getCampaignsByCreator(creator: creator)
      }
    `;
    
    const campaigns = await runScript(cadence, [
      (arg, types) => arg(fcl.withPrefix(address), types.Address)
    ]);
    
    res.json({ success: true, data: campaigns || [] });
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

