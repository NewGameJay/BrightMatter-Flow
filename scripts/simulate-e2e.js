/**
 * End-to-End Simulation Script
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const BRAND_ADDRESS = '0x14aca78d100d2001';
const CREATOR_ADDRESS = '0x1234567890123456789012345678901234567890';

class EndToEndSimulation {
    constructor() {
        this.campaignId = null;
        this.postId = null;
        this.logs = [];
    }
    
    log(message, data = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            message,
            data
        };
        this.logs.push(entry);
        console.log(`[${entry.timestamp}] ${message}`, JSON.stringify(data, null, 2));
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async phase1_brandCreatesCampaign() {
        this.log('🧱 PHASE 1: Brand Creates Campaign');
        
        try {
            const campaignData = {
                id: `campaign-${Date.now()}`,
                payout: 100,
                threshold: 1000,
                deadline: Date.now() + (6 * 60 * 60 * 1000),
                deliverables: ['Post about our new product', 'Include hashtag #NewProduct']
            };
            
            this.log('✅ Creating campaign via oracle API', campaignData);
            
            const response = await axios.post(`${BASE_URL}/api/campaigns`, {
                ...campaignData,
                creator: BRAND_ADDRESS
            });
            
            if (response.data.success) {
                this.campaignId = campaignData.id;
                this.log('✅ Campaign created successfully', {
                    campaignId: this.campaignId,
                    txHash: response.data.txHash
                });
                return true;
            } else {
                this.log('❌ Campaign creation failed', response.data);
                return false;
            }
        } catch (error) {
            this.log('❌ Campaign creation error', { error: error.message });
            return false;
        }
    }
    
    async phase2_creatorSubmitsPost() {
        this.log('👤 PHASE 2: Creator Submits Post');
        
        try {
            const postData = {
                postUrl: 'https://twitter.com/testcreator/status/1234567890',
                campaignId: this.campaignId,
                creatorAddress: CREATOR_ADDRESS,
                mockMetrics: {
                    likes: 1250,
                    comments: 89,
                    shares: 156,
                    views: 8500
                }
            };
            
            this.log('✅ Submitting post for analysis', postData);
            
            const response = await axios.post(`${BASE_URL}/api/analyze`, postData);
            
            if (response.data.success) {
                this.postId = response.data.postId;
                this.log('✅ Post analyzed and score recorded', {
                    postId: this.postId,
                    score: response.data.score
                });
                return true;
            } else {
                this.log('❌ Post analysis failed', response.data);
                return false;
            }
        } catch (error) {
            this.log('❌ Post submission error', { error: error.message });
            return false;
        }
    }
    
    async runSimulation() {
        console.log('🚀 Starting End-to-End Simulation');
        console.log('Brand Address:', BRAND_ADDRESS);
        console.log('Creator Address:', CREATOR_ADDRESS);
        console.log('API URL:', BASE_URL);
        
        const phase1 = await this.phase1_brandCreatesCampaign();
        if (!phase1) return this.generateReport({phase1: false});
        
        await this.sleep(2000);
        
        const phase2 = await this.phase2_creatorSubmitsPost();
        if (!phase2) return this.generateReport({phase1, phase2: false});
        
        return this.generateReport({phase1, phase2});
    }
    
    generateReport(results) {
        console.log('\n📊 SIMULATION REPORT');
        console.log('Phase 1:', results.phase1);
        console.log('Phase 2:', results.phase2);
        return results.phase1 && results.phase2;
    }
}

// Run simulation
if (require.main === module) {
    const simulation = new EndToEndSimulation();
    simulation.runSimulation().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = EndToEndSimulation;
