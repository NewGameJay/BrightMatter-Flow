/**
 * Test Data Generator
 * 
 * Generates realistic mock data for end-to-end testing
 * Includes post metrics, campaign data, and user scenarios
 */

export interface TestPost {
    id: string;
    url: string;
    metrics: {
        likes: number;
        comments: number;
        shares: number;
        views: number;
    };
    timestamp: number;
}

export interface TestCampaign {
    id: string;
    creator: string;
    threshold: number;
    payout: number;
    deadline: number;
    deliverables: string[];
}

export interface TestUser {
    address: string;
    name: string;
    role: 'creator' | 'brand';
}

export class TestDataGenerator {
    
    /**
     * Generate test users
     */
    public static generateTestUsers(): TestUser[] {
        return [
            {
                address: '0x1234567890123456789012345678901234567890',
                name: 'Alice Creator',
                role: 'creator'
            },
            {
                address: '0x2345678901234567890123456789012345678901',
                name: 'Bob Creator',
                role: 'creator'
            },
            {
                address: '0x3456789012345678901234567890123456789012',
                name: 'Charlie Brand',
                role: 'brand'
            }
        ];
    }
    
    /**
     * Generate test campaigns
     */
    public static generateTestCampaigns(): TestCampaign[] {
        const now = Date.now();
        const sixHoursLater = now + (6 * 60 * 60 * 1000); // 6 hours from now
        
        return [
            {
                id: 'campaign-001',
                creator: '0x1234567890123456789012345678901234567890',
                threshold: 1000,
                payout: 100,
                deadline: sixHoursLater,
                deliverables: ['Post about our new product', 'Include hashtag #NewProduct']
            },
            {
                id: 'campaign-002',
                creator: '0x2345678901234567890123456789012345678901',
                threshold: 500,
                payout: 50,
                deadline: sixHoursLater,
                deliverables: ['Share our announcement', 'Tag us in your story']
            }
        ];
    }
    
    /**
     * Generate test posts with realistic metrics
     */
    public static generateTestPosts(): TestPost[] {
        return [
            {
                id: 'post-001',
                url: 'https://twitter.com/alice/status/1234567890',
                metrics: {
                    likes: 1250,
                    comments: 89,
                    shares: 156,
                    views: 8500
                },
                timestamp: Date.now() - 1000 * 60 * 30 // 30 minutes ago
            },
            {
                id: 'post-002',
                url: 'https://instagram.com/bob/post/abcdef123',
                metrics: {
                    likes: 890,
                    comments: 45,
                    shares: 23,
                    views: 4200
                },
                timestamp: Date.now() - 1000 * 60 * 45 // 45 minutes ago
            },
            {
                id: 'post-003',
                url: 'https://tiktok.com/@alice/video/xyz789',
                metrics: {
                    likes: 2100,
                    comments: 120,
                    shares: 89,
                    views: 12500
                },
                timestamp: Date.now() - 1000 * 60 * 15 // 15 minutes ago
            }
        ];
    }
    
    /**
     * Calculate V_res score from post metrics
     */
    public static calculateScore(metrics: TestPost['metrics']): number {
        return (
            metrics.likes * 1.0 +
            metrics.comments * 2.0 +
            metrics.shares * 3.0 +
            metrics.views * 0.1
        );
    }
    
    /**
     * Generate complete test scenario
     */
    public static generateTestScenario(): {
        users: TestUser[];
        campaigns: TestCampaign[];
        posts: TestPost[];
    } {
        return {
            users: this.generateTestUsers(),
            campaigns: this.generateTestCampaigns(),
            posts: this.generateTestPosts()
        };
    }
    
    /**
     * Log test scenario for debugging
     */
    public static logTestScenario(): void {
        const scenario = this.generateTestScenario();
        
        console.log('🧪 [TEST_DATA] Generated test scenario:');
        console.log('👥 Users:', scenario.users.length);
        scenario.users.forEach(user => {
            console.log(`   ${user.role}: ${user.name} (${user.address})`);
        });
        
        console.log('🎯 Campaigns:', scenario.campaigns.length);
        scenario.campaigns.forEach(campaign => {
            console.log(`   ${campaign.id}: ${campaign.payout} FLOW, threshold ${campaign.threshold}`);
        });
        
        console.log('📱 Posts:', scenario.posts.length);
        scenario.posts.forEach(post => {
            const score = this.calculateScore(post.metrics);
            console.log(`   ${post.id}: score ${score.toFixed(2)} (${post.metrics.likes} likes, ${post.metrics.comments} comments)`);
        });
    }
}

