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
// Note: In-memory campaign store is no longer used - all campaigns are on-chain
// import { campaignStore, Campaign, CampaignParticipant, Submission, PayoutReceipt } from './models/campaigns';
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
      CampaignEscrowV4: '0x14aca78d100d2001',
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
    const { postUrl } = req.body;
    console.log(`📝 [ANALYZE_POST] Received postUrl:`, postUrl);
    
    if (!postUrl) {
      return res.status(400).json({ error: 'postUrl is required' });
    }
    
    const metrics = mockMetrics(postUrl);
    const score = computeResonance(metrics);
    
    console.log(`📊 [ANALYZE_POST] Generated score: ${score.toFixed(1)}`, { metrics });
    
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
    
    // Oracle signs and executes transaction to update score on-chain
    const cadence = `
      import CampaignEscrowV4 from 0x14aca78d100d2001
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
          
          // Update campaign score (oracle-signed)
          let ok = CampaignEscrowV4.updateCreatorScore(
            campaignId: campaignId,
            creator: creator,
            score: score,
            signer: signerAddr
          )
          assert(ok, message: "updateCreatorScore failed")
          
          // Add proof to creator profile (oracle-signed)
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
    
    console.log('🔗 Oracle executing transaction...');
    
    // Execute oracle-signed transaction using sendTx from client.ts
    const { txId } = await sendTx(cadence, [
      (arg: any, t: any) => arg(campaignId, t.String),
      (arg: any, t: any) => arg(creatorAddress, t.Address),
      (arg: any, t: any) => arg(metrics.postId, t.String),
      (arg: any, t: any) => arg(score.toFixed(1), t.UFix64),
      (arg: any, t: any) => arg(timestamp.toFixed(1), t.UFix64)
    ]);
    
    console.log('✅ Oracle transaction sealed:', txId);
    
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
    
    // Trigger payout on-chain (oracle-signed)
    const cadence = `
      import CampaignEscrowV4 from 0x14aca78d100d2001
      
      transaction(campaignId: String) {
        prepare(signer: &Account) {
          let signerAddr = signer.address
          let success = CampaignEscrowV4.triggerPayout(
            campaignId: campaignId,
            signer: signerAddr
          )
          assert(success, message: "Payout failed or threshold not met")
        }
      }
    `;
    
    const { txId } = await sendTx(cadence, [
      (arg: any, t: any) => arg(campaignId, t.String)
    ]);
    
    console.log(`✅ [AGENT] Campaign payout executed: ${txId}`);
    
    res.json({
      success: true,
      campaignId,
      action: 'payout',
      txId,
      flowscanLink: `https://flowscan.org/transaction/${txId}`
    });
  } catch (error: any) {
    console.error(`❌ [AGENT] Error:`, error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Old helper functions removed - all campaigns now on-chain

// Manual payout trigger (existing endpoint)
app.post('/api/campaigns/:id/payout', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    console.log(`💰 [PAYOUT] Manual trigger for ${campaignId}`);
    
    const cadence = `
      import CampaignEscrowV3 from 0x14aca78d100d2001
      
      transaction(campaignId: String) {
        prepare(signer: &Account) {
          let success = CampaignEscrowV4.triggerPayout(
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
          let success = CampaignEscrowV4.triggerRefund(
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
// Note: Campaigns are now created directly on-chain by the Brand Dashboard
// This endpoint is kept for backwards compatibility but just returns success
app.post('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    
    console.log(`📋 [CREATE_CAMPAIGN] Campaign ${id} created on-chain by brand`);
    
    res.json({
      success: true,
      campaignId: id,
      message: 'Campaign created on-chain successfully'
    });
  } catch (error: any) {
    console.error('❌ [CREATE_CAMPAIGN] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaigns by brand (campaigns they created)
app.get('/api/campaigns/by-brand/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    console.log(`📋 [GET_CAMPAIGNS_BY_BRAND] For address: ${address}`);
    
    // Get all on-chain campaigns
    const cadence = `
      import CampaignEscrowV4 from 0x14aca78d100d2001
      access(all) fun main(brandAddr: Address): [CampaignEscrowV4.Campaign] {
        // Get all campaigns and filter by brand
        let allCampaigns = CampaignEscrowV4.getAllCampaigns()
        let brandCampaigns: [CampaignEscrowV4.Campaign] = []
        for campaign in allCampaigns {
          if campaign.brand == brandAddr {
            brandCampaigns.append(campaign)
          }
        }
        return brandCampaigns
      }
    `;
    
    const chainCampaigns = await runScript(cadence, [
      (arg, types) => arg(address, types.Address)
    ]);
    
    res.json({ 
      success: true, 
      data: chainCampaigns || []
    });
  } catch (error: any) {
    console.error('❌ [GET_CAMPAIGNS_BY_BRAND] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Join open campaign
// Join an open campaign (oracle-signed transaction to add creator to allowlist)
app.post('/api/campaigns/:id/join', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    const { creatorAddr } = req.body;
    
    console.log(`👥 [JOIN_CAMPAIGN] Creator ${creatorAddr} joining ${campaignId}`);
    
    if (!creatorAddr) {
      return res.status(400).json({ error: 'Missing creatorAddr' });
    }
    
    // Oracle-signed transaction to join campaign on-chain
    const cadence = `
      import CampaignEscrowV4 from 0x14aca78d100d2001
      
      transaction(
        campaignId: String,
        creator: Address
      ) {
        prepare(signer: &Account) {
          let signerAddr = signer.address
          
          // Oracle adds creator to campaign allowlist
          let success = CampaignEscrowV4.joinCampaign(
            campaignId: campaignId,
            creator: creator,
            signer: signerAddr
          )
          assert(success, message: "Failed to join campaign")
        }
      }
    `;
    
    console.log('🔗 Oracle executing joinCampaign transaction...');
    
    // Execute oracle-signed transaction
    const { txId } = await sendTx(cadence, [
      (arg: any, t: any) => arg(campaignId, t.String),
      (arg: any, t: any) => arg(creatorAddr, t.Address)
    ]);
    
    console.log(`✅ [JOIN_CAMPAIGN] Creator ${creatorAddr} joined ${campaignId} - txId: ${txId}`);
    
    res.json({
      success: true,
      campaignId,
      creatorAddr,
      txId,
      flowscanLink: `https://flowscan.org/transaction/${txId}`
    });
  } catch (error: any) {
    console.error('❌ [JOIN_CAMPAIGN] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Note: Submit and leaderboard endpoints removed - content submission now handled by /api/analyze
// which writes directly to chain. Leaderboard data available from on-chain campaign.creatorScores

// Get campaign status (updated to include open campaign data)
// Get campaign by ID
app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    // Get campaign from chain
    const cadence = `
      import CampaignEscrowV4 from 0x14aca78d100d2001
      access(all) fun main(id: String): CampaignEscrowV4.Campaign? {
        return CampaignEscrowV4.getCampaign(id: id)
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
// List all campaigns (or filter by type: open/closed)
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { type, excludeCreator } = req.query;
    
    console.log(`📋 [LIST_CAMPAIGNS] Listing campaigns, type filter: ${type || 'all'}`);
    
    // Get all on-chain campaigns
    let cadence: string;
    let args: any[] = [];
    
    if (type === 'open' && excludeCreator) {
      // Get open campaigns excluding those the creator has already joined
      cadence = `
        import CampaignEscrowV4 from 0x14aca78d100d2001
        access(all) fun main(creatorAddr: Address): [CampaignEscrowV4.Campaign] {
          return CampaignEscrowV4.getOpenCampaigns(excludeCreator: creatorAddr)
        }
      `;
      args = [(arg, types) => arg(excludeCreator as string, types.Address)];
    } else {
      // Get all campaigns
      cadence = `
        import CampaignEscrowV4 from 0x14aca78d100d2001
        access(all) fun main(): [CampaignEscrowV4.Campaign] {
          return CampaignEscrowV4.getAllCampaigns()
        }
      `;
    }
    
    let campaigns = await runScript(cadence, args) || [];
    
    // Filter by type if specified (campaignType enum: 0=closed, 1=open)
    if (type === 'open') {
      campaigns = campaigns.filter((c: any) => c.campaignType === 1);
    } else if (type === 'closed') {
      campaigns = campaigns.filter((c: any) => c.campaignType === 0);
    }
    
    res.json({
      success: true,
      campaigns
    });
  } catch (error: any) {
    console.error('❌ [LIST_CAMPAIGNS] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaigns by creator (campaigns they're in the allowlist for)
app.get('/api/campaigns/by-creator/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    console.log(`📋 [GET_CAMPAIGNS_BY_CREATOR] For address: ${address}`);
    
    // Get all on-chain campaigns where this creator is in the allowlist
    const cadence = `
      import CampaignEscrowV4 from 0x14aca78d100d2001
      access(all) fun main(creator: Address): [CampaignEscrowV4.Campaign] {
        return CampaignEscrowV4.getCampaignsByCreator(creator: creator)
      }
    `;
    
    const chainCampaigns = await runScript(cadence, [
      (arg, types) => arg(address, types.Address)
    ]);
    
    res.json({ 
      success: true, 
      data: chainCampaigns || []
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

