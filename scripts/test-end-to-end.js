/**
 * End-to-End Test Script
 * 
 * Tests the complete Veri x Flow Integration flow
 * Simulates brand and creator interactions
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

class EndToEndTester {
    constructor() {
        this.testResults = [];
        this.campaignId = null;
        this.creatorAddress = '0x1234567890123456789012345678901234567890';
    }
    
    async logTest(testName, success, details = {}) {
        const result = {
            test: testName,
            success,
            timestamp: new Date().toISOString(),
            details
        };
        
        this.testResults.push(result);
        console.log(`${success ? '✅' : '❌'} [E2E_TEST] ${testName}`, details);
    }
    
    async testHealthCheck() {
        try {
            const response = await axios.get(`${BASE_URL}/api/health`);
            await this.logTest('Health Check', true, { status: response.data.status });
            return true;
        } catch (error) {
            await this.logTest('Health Check', false, { error: error.message });
            return false;
        }
    }
    
    async testCampaignCreation() {
        try {
            const campaignData = {
                id: 'test-campaign-' + Date.now(),
                creator: this.creatorAddress,
                threshold: 1000,
                payout: 100,
                deadline: Date.now() + (6 * 60 * 60 * 1000) // 6 hours from now
            };
            
            const response = await axios.post(`${BASE_URL}/api/campaigns`, campaignData);
            
            if (response.data.success) {
                this.campaignId = campaignData.id;
                await this.logTest('Campaign Creation', true, {
                    campaignId: this.campaignId,
                    scheduledTransactions: response.data.scheduledTransactions
                });
                return true;
            } else {
                await this.logTest('Campaign Creation', false, { response: response.data });
                return false;
            }
        } catch (error) {
            await this.logTest('Campaign Creation', false, { error: error.message });
            return false;
        }
    }
    
    async testPostAnalysis() {
        try {
            const postData = {
                postUrl: 'https://twitter.com/test/status/1234567890',
                campaignId: this.campaignId,
                creatorAddress: this.creatorAddress
            };
            
            const response = await axios.post(`${BASE_URL}/api/analyze`, postData);
            
            if (response.data.success) {
                await this.logTest('Post Analysis', true, {
                    score: response.data.score,
                    metrics: response.data.metrics,
                    txResult: response.data.txResult
                });
                return true;
            } else {
                await this.logTest('Post Analysis', false, { response: response.data });
                return false;
            }
        } catch (error) {
            await this.logTest('Post Analysis', false, { error: error.message });
            return false;
        }
    }
    
    async testCampaignStatus() {
        try {
            const response = await axios.get(`${BASE_URL}/api/campaigns/${this.campaignId}`);
            
            if (response.data.campaign) {
                await this.logTest('Campaign Status Check', true, {
                    campaign: response.data.campaign
                });
                return true;
            } else {
                await this.logTest('Campaign Status Check', false, { response: response.data });
                return false;
            }
        } catch (error) {
            await this.logTest('Campaign Status Check', false, { error: error.message });
            return false;
        }
    }
    
    async testPayoutTrigger() {
        try {
            const response = await axios.post(`${BASE_URL}/api/campaigns/${this.campaignId}/trigger-payout`);
            
            if (response.data.success) {
                await this.logTest('Payout Trigger', true, {
                    result: response.data.result
                });
                return true;
            } else {
                await this.logTest('Payout Trigger', false, { response: response.data });
                return false;
            }
        } catch (error) {
            await this.logTest('Payout Trigger', false, { error: error.message });
            return false;
        }
    }
    
    async runAllTests() {
        console.log('🧪 [E2E_TEST] Starting End-to-End Tests...');
        console.log(`🔗 API Base URL: ${BASE_URL}`);
        
        const tests = [
            () => this.testHealthCheck(),
            () => this.testCampaignCreation(),
            () => this.testPostAnalysis(),
            () => this.testCampaignStatus(),
            () => this.testPayoutTrigger()
        ];
        
        let passedTests = 0;
        let totalTests = tests.length;
        
        for (const test of tests) {
            const success = await test();
            if (success) passedTests++;
        }
        
        console.log('\n📊 [E2E_TEST] Test Results Summary:');
        console.log(`✅ Passed: ${passedTests}/${totalTests}`);
        console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
        
        if (passedTests === totalTests) {
            console.log('🎉 [E2E_TEST] All tests passed! System is ready for production.');
        } else {
            console.log('⚠️ [E2E_TEST] Some tests failed. Please review the logs above.');
        }
        
        return passedTests === totalTests;
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new EndToEndTester();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = EndToEndTester;

