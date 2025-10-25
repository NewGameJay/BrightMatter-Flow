/**
 * Verifier Server
 * 
 * Express REST API server for the BrightMatter oracle service
 * Handles post analysis, score computation, and on-chain updates
 * Provides endpoints for frontend integration
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scoreComputer, ScoreResult } from './computeScore';
import { flowSigner } from './signer';
import { cadenceClient, ProfileData, CampaignData } from './cadenceClient';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
let isInitialized = false;

async function initializeServices() {
  try {
    console.log('Initializing oracle services...');
    
    // Initialize Flow signer
    await flowSigner.initializeOracle();
    
    // Initialize Cadence client
    if (!cadenceClient.isReady()) {
      throw new Error('Cadence client failed to initialize');
    }
    
    isInitialized = true;
    console.log('Oracle services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    initialized: isInitialized,
    timestamp: new Date().toISOString(),
    oracleAddress: flowSigner.getOracleAddress()
  });
});

// Analyze post endpoint
app.post('/api/analyze-post', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' });
    }

    const { postUrl } = req.body;
    
    if (!postUrl) {
      return res.status(400).json({ error: 'postUrl is required' });
    }

    console.log(`Analyzing post: ${postUrl}`);
    
    const result = await scoreComputer.analyzePost(postUrl);
    
    if (!result) {
      return res.status(400).json({ error: 'Failed to analyze post' });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error analyzing post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update score endpoint
app.post('/api/update-score', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' });
    }

    const { userAddress, score } = req.body;
    
    if (!userAddress || score === undefined) {
      return res.status(400).json({ error: 'userAddress and score are required' });
    }

    if (!cadenceClient.isValidAddress(userAddress)) {
      return res.status(400).json({ error: 'Invalid user address' });
    }

    console.log(`Updating VeriScore for ${userAddress}: ${score}`);
    
    const result = await flowSigner.updateVeriScore(userAddress, score);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger campaign payout endpoint
app.post('/api/trigger-payout', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' });
    }

    const { campaignId, actualScore, creatorAddress } = req.body;
    
    if (!campaignId || actualScore === undefined || !creatorAddress) {
      return res.status(400).json({ error: 'campaignId, actualScore, and creatorAddress are required' });
    }

    if (!cadenceClient.isValidAddress(creatorAddress)) {
      return res.status(400).json({ error: 'Invalid creator address' });
    }

    console.log(`Triggering payout for campaign ${campaignId}: ${actualScore}`);
    
    const result = await flowSigner.triggerCampaignPayout(campaignId, actualScore, creatorAddress);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error triggering payout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get profile endpoint
app.get('/api/profile/:address', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' });
    }

    const { address } = req.params;
    
    if (!cadenceClient.isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    const profile = await cadenceClient.readProfile(address);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error reading profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get campaigns endpoint
app.get('/api/campaigns/:address', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' });
    }

    const { address } = req.params;
    
    if (!cadenceClient.isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    const campaigns = await cadenceClient.getCampaignsForAddress(address);
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Error reading campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get campaign by ID endpoint
app.get('/api/campaign/:id', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' });
    }

    const { id } = req.params;
    
    const campaign = await cadenceClient.readCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error reading campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vault balance endpoint
app.get('/api/vault-balance', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' });
    }

    const balance = await cadenceClient.getVaultBalance();
    
    res.json({
      success: true,
      data: { balance }
    });
  } catch (error) {
    console.error('Error reading vault balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check campaigns endpoint (for automated payout checking)
app.post('/api/check-campaigns', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'Service not initialized' });
    }

    // This endpoint would be called by a cron job or scheduled task
    // to check for campaigns that need payout evaluation
    
    const { creatorAddress } = req.body;
    
    if (!creatorAddress) {
      return res.status(400).json({ error: 'creatorAddress is required' });
    }

    const campaigns = await cadenceClient.getCampaignsForAddress(creatorAddress);
    const activeCampaigns = campaigns.filter(c => !c.paidOut);
    
    res.json({
      success: true,
      data: {
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        campaigns: activeCampaigns
      }
    });
  } catch (error) {
    console.error('Error checking campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`Verifier server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Oracle address: ${flowSigner.getOracleAddress()}`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

