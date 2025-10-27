/**
 * BrightMatter Oracle Server
 * Express server for post analysis and campaign management
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BrightMatterScorer } from './src/computeScore';
import * as cadenceClient from './src/cadenceClient';

// Force image rebuild - v2 with contract-level addProof wrapper

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8080);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    service: 'brightmatter-oracle',
    network: 'mainnet',
    contracts: {
      CampaignEscrowV2: '0x14aca78d100d2001',
      CreatorProfileV2: '0x14aca78d100d2001'
    },
    oracle: process.env.FLOW_ADDRESS || '14aca78d100d2001'
  });
});

// Mock analyze post (returns fixed score of 5.0)
app.post('/api/analyze-post', async (req: Request, res: Response) => {
  try {
    const { postUrl } = req.body;
    
    if (!postUrl || typeof postUrl !== 'string') {
      return res.status(400).json({ error: 'postUrl is required' });
    }
    
    console.log(`📝 [MOCK_ANALYZE] Analyzing post: ${postUrl}`);
    
    // Return mock data with 5.0 resonance score
    const mockResponse = {
      success: true,
      data: {
        score: 5.0,
        platform: postUrl.includes('youtube') ? 'YouTube' : postUrl.includes('twitter') || postUrl.includes('x.com') ? 'Twitter' : 'Unknown',
        post_id: postUrl.split('/').pop() || `post_${Date.now()}`,
        timestamp: Math.floor(Date.now() / 1000),
        metrics: {
          likes: 1000,
          views: 5000,
          comments: 50,
          shares: 100,
          engagement_rate: 8.5,
          reach: 7500,
          impressions: 12000
        },
        breakdown: {
          engagement_score: 2.0,
          reach_score: 2.0,
          virality_score: 1.0
        }
      }
    };
    
    console.log(`✅ [MOCK_ANALYZE] Returning mock score: 5.0`);
    
    res.json(mockResponse);
  } catch (error: any) {
    console.error('❌ [MOCK_ANALYZE] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Analyze post and compute score (old endpoint)
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { postUrl, campaignId, creatorAddress } = req.body;
    
    // Input validation
    if (!postUrl || typeof postUrl !== 'string') {
      return res.status(400).json({ error: 'postUrl is required and must be a string' });
    }
    if (!campaignId || typeof campaignId !== 'string') {
      return res.status(400).json({ error: 'campaignId is required and must be a string' });
    }
    if (!creatorAddress || typeof creatorAddress !== 'string') {
      return res.status(400).json({ error: 'creatorAddress is required and must be a string' });
    }
    
    console.log(`📝 [POST_ANALYSIS] Started analysis`, {
      postUrl,
      campaignId,
      creatorAddress,
      timestamp: new Date().toISOString()
    });
    
    // Analyze post and compute score
    const scoreResult = await BrightMatterScorer.analyzePost(postUrl);
    
    console.log(`📊 [POST_ANALYSIS] Score computed`, {
      score: scoreResult.score,
      metrics: scoreResult.metrics
    });
    
    // Update creator score on-chain with proof
    const postId = postUrl.split('/').pop() || `post_${Date.now()}`;
    const timestamp = Date.now() / 1000; // Unix timestamp in seconds
    
    const txResult = await cadenceClient.updateCreatorScore(
      campaignId,
      creatorAddress,
      scoreResult.score,
      postId,
      timestamp
    );
    
    console.log(`✅ [POST_ANALYSIS] On-chain update successful`, {
      campaignId,
      creatorAddress,
      score: scoreResult.score,
      txId: txResult.txId,
      sealed: txResult.sealed,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      campaignId,
      creatorAddress,
      score: scoreResult.score,
      metrics: scoreResult.metrics,
      txResult,
      flowscanLink: getFlowscanLink(txResult.txId)
    });
  } catch (error: any) {
    console.error('❌ [POST_ANALYSIS] Error:', {
      campaignId: req.body?.campaignId,
      creatorAddress: req.body?.creatorAddress,
      error: error.message || String(error),
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: error.message || String(error),
      campaignId: req.body?.campaignId 
    });
  }
});

// Trigger campaign payout
app.post('/api/campaigns/:id/payout', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    console.log(`💰 [PAYOUT] Triggering payout for campaign ${campaignId}`);
    
    const result = await cadenceClient.triggerPayout(campaignId);
    
    console.log(`✅ [PAYOUT] Payout successful`, {
      campaignId,
      txId: result.txId,
      sealed: result.sealed,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      campaignId,
      result,
      flowscanLink: getFlowscanLink(result.txId)
    });
  } catch (error: any) {
    console.error('❌ [PAYOUT] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Trigger campaign refund
app.post('/api/campaigns/:id/refund', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    console.log(`🔄 [REFUND] Triggering refund for campaign ${campaignId}`);
    
    const result = await cadenceClient.triggerRefund(campaignId);
    
    console.log(`✅ [REFUND] Refund successful`, {
      campaignId,
      txId: result.txId,
      sealed: result.sealed,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      campaignId,
      result,
      flowscanLink: getFlowscanLink(result.txId)
    });
  } catch (error: any) {
    console.error('❌ [REFUND] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Read campaign data by ID
app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    const campaign = await cadenceClient.readCampaign(campaignId);
    
    res.json({
      success: true,
      campaign
    });
  } catch (error: any) {
    console.error('❌ [READ_CAMPAIGN] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaigns by creator address
app.get('/api/campaigns/by-creator/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    console.log(`📋 [GET_CAMPAIGNS_BY_CREATOR] Requested campaigns for creator: ${address}`);
    
    // Query on-chain campaigns for this creator
    const campaigns = await cadenceClient.getCampaignsByCreator(address);
    
    console.log(`✅ [GET_CAMPAIGNS_BY_CREATOR] Found ${campaigns.length} campaigns for ${address}`);
    
    res.json({
      success: true,
      data: campaigns || []
    });
  } catch (error: any) {
    console.error('❌ [GET_CAMPAIGNS_BY_CREATOR] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get creator profile
app.get('/api/profile/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    console.log(`📋 [GET_PROFILE] Requested profile for address: ${address}`);
    
    // For now, return a mock profile structure
    // In production, you'd query the on-chain CreatorProfileV2 resource
    res.json({
      success: true,
      data: {
        address,
        veriScore: 0.0,
        totalCampaigns: 0,
        lastUpdated: Date.now() / 1000
      }
    });
  } catch (error: any) {
    console.error('❌ [GET_PROFILE] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get setup profile transaction for frontend
app.get('/api/setup-profile', (_req: Request, res: Response) => {
  const setupTx = `
import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import CreatorProfileV2 from 0x14aca78d100d2001

transaction {
  prepare(signer: auth(Storage, SaveValue, Capabilities, BorrowValue) &Account) {
    // 1) Ensure FlowToken receiver vault
    let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
    if vaultRef == nil {
      signer.storage.save(<- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()), to: /storage/flowTokenVault)
      let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(/storage/flowTokenVault)
      signer.capabilities.publish(cap, at: /public/flowTokenReceiver)
    } else {
      // Make sure the public receiver link exists
      let receiverCap = signer.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
      if !receiverCap.check() {
        let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(/storage/flowTokenVault)
        signer.capabilities.publish(cap, at: /public/flowTokenReceiver)
      }
    }

    // 2) Ensure CreatorProfileV2 profile in storage + public cap
    let profileRef = signer.storage.borrow<&CreatorProfileV2.Profile>(from: /storage/CreatorProfile)
    if profileRef == nil {
      signer.storage.save(<- CreatorProfileV2.createEmptyProfile(), to: /storage/CreatorProfile)
    }
    
    // Unpublish and republish the public capability
    signer.capabilities.unpublish(/public/CreatorProfile)
    let profileCap = signer.capabilities.storage.issue<&{CreatorProfileV2.ProfilePublic}>(/storage/CreatorProfile)
    signer.capabilities.publish(profileCap, at: /public/CreatorProfile)
  }
}
  `.trim();

  res.json({
    cadence: setupTx,
    description: 'Setup CreatorProfile and FlowToken vault',
    network: 'mainnet'
  });
});

// Helper function to generate Flowscan link
function getFlowscanLink(txId: string): string {
  return `https://flowscan.org/transaction/${txId}`;
}

// Start server
const host = '0.0.0.0';
app.listen(port, host, () => {
  console.log(`🚀 BrightMatter Oracle running on ${host}:${port}`);
  console.log(`📊 Mainnet contracts: 0x14aca78d100d2001`);
  console.log(`🔐 Oracle address: ${process.env.FLOW_ADDRESS || '14aca78d100d2001'}`);
});
