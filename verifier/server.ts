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
  res.json({ ok: true, service: 'brightmatter-oracle' });
});

// Analyze post and compute score
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { postUrl, campaignId, creatorAddress } = req.body;
    
    console.log(`📝 [POST_ANALYSIS] Started analysis`, {
      postUrl,
      campaignId,
      creatorAddress,
      timestamp: new Date().toISOString()
    });
    
    if (!postUrl || !campaignId || !creatorAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
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
    
    console.log(`✅ [POST_ANALYSIS] On-chain update successful`, { txResult });
    
    res.json({
      success: true,
      score: scoreResult.score,
      metrics: scoreResult.metrics,
      txResult
    });
  } catch (error: any) {
    console.error('❌ [POST_ANALYSIS] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Trigger campaign payout
app.post('/api/campaigns/:id/payout', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    
    console.log(`💰 [PAYOUT] Triggering payout for campaign ${campaignId}`);
    
    const result = await cadenceClient.triggerPayout(campaignId);
    
    console.log(`✅ [PAYOUT] Payout successful`, { result });
    
    res.json({
      success: true,
      campaignId,
      result
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
    
    console.log(`✅ [REFUND] Refund successful`, { result });
    
    res.json({
      success: true,
      campaignId,
      result
    });
  } catch (error: any) {
    console.error('❌ [REFUND] Error:', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Read campaign data
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

// Start server
const host = '0.0.0.0';
app.listen(port, host, () => {
  console.log(`🚀 BrightMatter Oracle running on ${host}:${port}`);
  console.log(`📊 Mainnet contracts: 0x14aca78d100d2001`);
  console.log(`🔐 Oracle address: ${process.env.FLOW_ADDRESS || '14aca78d100d2001'}`);
});
