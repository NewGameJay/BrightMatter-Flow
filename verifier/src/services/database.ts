/**
 * In-memory database for open campaigns
 * In production, this would be replaced with a real database
 */

export interface Campaign {
  id: string;
  type: "open" | "curated";
  deadline: string;
  budgetFlow: string;
  status: "pending" | "verifying" | "paid";
  criteria: {
    windowStart: string;
    minEngagementRate: number;
    platformAllowlist?: string[];
    maxPostsPerCreator?: number;
  };
  createdAt: string;
}

export interface CampaignParticipant {
  campaignId: string;
  creatorAddr: string;
  joinedAt: string;
  isEligible: boolean;
}

export interface Submission {
  campaignId: string;
  creatorAddr: string;
  platform: string;
  url: string;
  postId: string;
  timestamp: string;
  metrics: any;
  resonanceScore: number;
  uniqueHash: string;
  flags: any;
  createdAt: string;
}

export interface PayoutReceipt {
  campaignId: string;
  payoutTxId: string;
  splits: Array<{
    creatorAddr: string;
    percent: number;
    amountFlow: number;
  }>;
  createdAt: string;
}

// In-memory storage
const campaigns = new Map<string, Campaign>();
const participants = new Map<string, CampaignParticipant[]>();
const submissions = new Map<string, Submission[]>();
const payoutReceipts = new Map<string, PayoutReceipt>();

export const db = {
  campaigns: {
    create: (campaign: Campaign) => {
      campaigns.set(campaign.id, campaign);
      participants.set(campaign.id, []);
      submissions.set(campaign.id, []);
      return campaign;
    },
    
    get: (id: string): Campaign | undefined => {
      return campaigns.get(id);
    },
    
    update: (id: string, updates: Partial<Campaign>) => {
      const campaign = campaigns.get(id);
      if (campaign) {
        campaigns.set(id, { ...campaign, ...updates });
      }
    },
    
    list: (): Campaign[] => {
      return Array.from(campaigns.values());
    }
  },
  
  participants: {
    add: (participant: CampaignParticipant) => {
      const existing = participants.get(participant.campaignId) || [];
      const exists = existing.some(p => p.creatorAddr === participant.creatorAddr);
      if (!exists) {
        participants.set(participant.campaignId, [...existing, participant]);
      }
    },
    
    getByCampaign: (campaignId: string): CampaignParticipant[] => {
      return participants.get(campaignId) || [];
    },
    
    isParticipant: (campaignId: string, creatorAddr: string): boolean => {
      const campaignParticipants = participants.get(campaignId) || [];
      return campaignParticipants.some(p => p.creatorAddr === creatorAddr);
    }
  },
  
  submissions: {
    add: (submission: Submission) => {
      const existing = submissions.get(submission.campaignId) || [];
      submissions.set(submission.campaignId, [...existing, submission]);
    },
    
    getByCampaign: (campaignId: string): Submission[] => {
      return submissions.get(campaignId) || [];
    },
    
    findValidInWindow: (campaignId: string, criteria: Campaign['criteria']): Submission[] => {
      const campaignSubmissions = submissions.get(campaignId) || [];
      const windowStart = new Date(criteria.windowStart);
      const deadline = new Date(campaigns.get(campaignId)?.deadline || '');
      
      return campaignSubmissions.filter(sub => {
        const subTime = new Date(sub.timestamp);
        return subTime >= windowStart && subTime <= deadline;
      });
    },
    
    getByCreator: (campaignId: string, creatorAddr: string): Submission[] => {
      const campaignSubmissions = submissions.get(campaignId) || [];
      return campaignSubmissions.filter(sub => sub.creatorAddr === creatorAddr);
    }
  },
  
  payouts: {
    insert: (receipt: PayoutReceipt) => {
      payoutReceipts.set(receipt.campaignId, receipt);
    },
    
    get: (campaignId: string): PayoutReceipt | undefined => {
      return payoutReceipts.get(campaignId);
    }
  }
};
