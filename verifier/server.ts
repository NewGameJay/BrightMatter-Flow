/**
 * BrightMatter Oracle Server
 * 
 * Express server that handles:
 * - Post analysis and scoring
 * - Campaign management
 * - Flow blockchain interactions
 * - Forte scheduled transaction management
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BrightMatterScorer, ScoreResult } from './computeScore';
import { CadenceClient } from './cadenceClient';
import { ForteAgentManager } from './forteAgent';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Cadence client and Forte agent manager
const oracleAddress = process.env.ORACLE_ADDRESS || '0x14aca78d100d2001';
const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY || '654778a449ba7d2e2eba94e90b08d810d5ef1bfab036a16f24159f23ff316a23';
const cadenceClient = new CadenceClient(oracleAddress, oraclePrivateKey);
const forteAgent = new ForteAgentManager(oracleAddress, oraclePrivateKey);

// In-memory storage for demo (in production, use a database)
const campaigns = new Map<string, any>();
const creatorPosts = new Map<string, any[]>();

/**
 * POST /api/analyze
 * Analyze a social media post and compute score
 */
app.post('/api/analyze', async (req: Request, res: Response) => {
    try {
        const { postUrl, campaignId, creatorAddress } = req.body;
        
        console.log(`📝 [POST_ANALYSIS] Started analysis for campaign ${campaignId}`, {
            postUrl,
            creatorAddress,
            timestamp: new Date().toISOString()
        });
        
        if (!postUrl || !campaignId || !creatorAddress) {
            console.error('❌ [POST_ANALYSIS] Missing required fields', { postUrl, campaignId, creatorAddress });
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Analyze post and compute score
        console.log(`🔍 [POST_ANALYSIS] Analyzing post: ${postUrl}`);
        const scoreResult = await BrightMatterScorer.analyzePost(postUrl);
        
        console.log(`📊 [POST_ANALYSIS] Score computed`, {
            score: scoreResult.score,
            metrics: scoreResult.metrics,
            campaignId,
            creatorAddress
        });
        
        // Store post data
        if (!creatorPosts.has(campaignId)) {
            creatorPosts.set(campaignId, []);
            console.log(`📁 [POST_ANALYSIS] Created new campaign storage for ${campaignId}`);
        }
        
        const postData = {
            creator: creatorAddress,
            postUrl,
            score: scoreResult.score,
            metrics: scoreResult.metrics,
            timestamp: Date.now()
        };
        
        creatorPosts.get(campaignId)!.push(postData);
        console.log(`💾 [POST_ANALYSIS] Stored post data for campaign ${campaignId}`);
        
        // Update creator score on-chain
        console.log(`⛓️ [POST_ANALYSIS] Updating creator score on-chain`, {
            campaignId,
            creatorAddress,
            score: scoreResult.score
        });
        
        const txResult = await cadenceClient.updateCreatorScore(campaignId, creatorAddress, scoreResult.score);
        console.log(`✅ [POST_ANALYSIS] On-chain update successful`, { txResult });
        
        res.json({
            success: true,
            score: scoreResult.score,
            metrics: scoreResult.metrics,
            campaignId,
            creatorAddress,
            txResult
        });
        
    } catch (error) {
        console.error('❌ [POST_ANALYSIS] Error analyzing post:', error);
        res.status(500).json({ error: 'Failed to analyze post' });
    }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
app.post('/api/campaigns', async (req: Request, res: Response) => {
    try {
        const { id, creator, threshold, payout, deadline } = req.body;
        
        console.log(`🎯 [CAMPAIGN_CREATION] Started campaign creation`, {
            id,
            creator,
            threshold,
            payout,
            deadline,
            timestamp: new Date().toISOString()
        });
        
        if (!id || !creator || !threshold || !payout || !deadline) {
            console.error('❌ [CAMPAIGN_CREATION] Missing required fields', { id, creator, threshold, payout, deadline });
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Store campaign data
        const campaignData = {
            id,
            creator,
            threshold,
            payout,
            deadline,
            createdAt: Date.now(),
            status: 'active'
        };
        
        campaigns.set(id, campaignData);
        console.log(`💾 [CAMPAIGN_CREATION] Campaign stored`, campaignData);
        
        // Schedule Forte transactions for payout and refund
        try {
            console.log(`⏰ [CAMPAIGN_CREATION] Scheduling Forte transactions for campaign ${id}`);
            
            const payoutScheduleId = await forteAgent.schedulePayout(id, deadline);
            console.log(`✅ [CAMPAIGN_CREATION] Payout scheduled`, { payoutScheduleId });
            
            const refundScheduleId = await forteAgent.scheduleRefund(id, deadline);
            console.log(`✅ [CAMPAIGN_CREATION] Refund scheduled`, { refundScheduleId });
            
            // Update campaign with schedule IDs
            const campaign = campaigns.get(id);
            campaign.payoutScheduleId = payoutScheduleId;
            campaign.refundScheduleId = refundScheduleId;
            campaigns.set(id, campaign);
            
            console.log(`🎉 [CAMPAIGN_CREATION] Campaign created successfully`, {
                id,
                payoutScheduleId,
                refundScheduleId
            });
            
            res.json({
                success: true,
                campaign: campaigns.get(id),
                scheduledTransactions: {
                    payout: payoutScheduleId,
                    refund: refundScheduleId
                }
            });
        } catch (error) {
            console.error('❌ [CAMPAIGN_CREATION] Error scheduling Forte transactions:', error);
            res.json({
                success: true,
                campaign: campaigns.get(id),
                warning: 'Campaign created but Forte scheduling failed'
            });
        }
        
    } catch (error) {
        console.error('❌ [CAMPAIGN_CREATION] Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

/**
 * GET /api/campaigns/:id
 * Get campaign details
 */
app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;
        const campaign = campaigns.get(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        // Get on-chain campaign data
        const onChainCampaign = await cadenceClient.readCampaign(campaignId);
        
        res.json({
            campaign: {
                ...campaign,
                onChain: onChainCampaign
            }
        });
        
    } catch (error) {
        console.error('Error getting campaign:', error);
        res.status(500).json({ error: 'Failed to get campaign' });
    }
});

/**
 * POST /api/campaigns/:id/trigger-payout
 * Trigger campaign payout
 */
app.post('/api/campaigns/:id/trigger-payout', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;
        
        // Trigger payout on-chain
        const result = await cadenceClient.triggerPayout(campaignId);
        
        // Update campaign status
        const campaign = campaigns.get(campaignId);
        if (campaign) {
            campaign.status = 'paid';
            campaigns.set(campaignId, campaign);
        }
        
        res.json({
            success: true,
            result,
            campaignId
        });
        
    } catch (error) {
        console.error('Error triggering payout:', error);
        res.status(500).json({ error: 'Failed to trigger payout' });
    }
});

/**
 * POST /api/campaigns/:id/trigger-refund
 * Trigger campaign refund
 */
app.post('/api/campaigns/:id/trigger-refund', async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;
        
        // Trigger refund on-chain
        const result = await cadenceClient.triggerRefund(campaignId);
        
        // Update campaign status
        const campaign = campaigns.get(campaignId);
        if (campaign) {
            campaign.status = 'refunded';
            campaigns.set(campaignId, campaign);
        }
        
        res.json({
            success: true,
            result,
            campaignId
        });
        
    } catch (error) {
        console.error('Error triggering refund:', error);
        res.status(500).json({ error: 'Failed to trigger refund' });
    }
});

/**
 * GET /api/campaigns/:id/posts
 * Get all posts for a campaign
 */
app.get('/api/campaigns/:id/posts', (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;
        const posts = creatorPosts.get(campaignId) || [];
        
        res.json({
            posts,
            campaignId
        });
        
    } catch (error) {
        console.error('Error getting posts:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        oracleAddress
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 BrightMatter Oracle Server running on port ${port}`);
    console.log(`📊 Oracle Address: ${oracleAddress}`);
    console.log(`🔗 Health Check: http://localhost:${port}/api/health`);
    console.log(`🌐 Flow Network: Mainnet`);
    console.log(`📝 Logging Level: Production`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
});
