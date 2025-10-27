/**
 * In-Memory Database Service
 * 
 * Mock database for open campaign tracking
 * In production, this would connect to Postgres/Firestore
 */

export interface Campaign {
  id: string;
  type: 'open' | 'curated';
  deadline: string;
  budgetFlow: string;
  status: 'pending' | 'verifying' | 'paid';
  criteria: any;
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
  flags?: any;
}

export interface PayoutReceipt {
  campaignId: string;
  payoutTxId: string;
  splits: { addr: string; percent: number; amountFlow: string }[];
  createdAt: string;
}

class Database {
  private campaigns: Map<string, Campaign> = new Map();
  private participants: Map<string, CampaignParticipant[]> = new Map();
  private submissions: Map<string, Submission[]> = new Map();
  private payouts: Map<string, PayoutReceipt> = new Map();
  
  // Campaign operations
  createCampaign(campaign: Campaign): void {
    this.campaigns.set(campaign.id, campaign);
  }
  
  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }
  
  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }
  
  updateCampaignStatus(id: string, status: Campaign['status']): void {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      campaign.status = status;
      this.campaigns.set(id, campaign);
    }
  }
  
  // Participant operations
  addParticipant(participant: CampaignParticipant): void {
    const participants = this.participants.get(participant.campaignId) || [];
    participants.push(participant);
    this.participants.set(participant.campaignId, participants);
  }
  
  getParticipants(campaignId: string): CampaignParticipant[] {
    return this.participants.get(campaignId) || [];
  }
  
  isParticipant(campaignId: string, creatorAddr: string): boolean {
    const participants = this.participants.get(campaignId) || [];
    return participants.some(p => p.creatorAddr === creatorAddr);
  }
  
  // Submission operations
  addSubmission(submission: Submission): void {
    const submissions = this.submissions.get(submission.campaignId) || [];
    submissions.push(submission);
    this.submissions.set(submission.campaignId, submissions);
  }
  
  getSubmissions(campaignId: string): Submission[] {
    return this.submissions.get(campaignId) || [];
  }
  
  getSubmissionsByCreator(campaignId: string, creatorAddr: string): Submission[] {
    const submissions = this.submissions.get(campaignId) || [];
    return submissions.filter(s => s.creatorAddr === creatorAddr);
  }
  
  hasSubmissionWithHash(campaignId: string, uniqueHash: string): boolean {
    const submissions = this.submissions.get(campaignId) || [];
    return submissions.some(s => s.uniqueHash === uniqueHash);
  }
  
  getValidSubmissionsInWindow(campaignId: string): Submission[] {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return [];
    
    const submissions = this.submissions.get(campaignId) || [];
    const windowStart = new Date(campaign.criteria?.windowStart || 0).getTime();
    const deadline = new Date(campaign.deadline).getTime();
    
    return submissions.filter(sub => {
      const subTime = new Date(sub.timestamp).getTime();
      return subTime >= windowStart && subTime <= deadline && !sub.flags?.fraudulent;
    });
  }
  
  // Payout operations
  savePayout(receipt: PayoutReceipt): void {
    this.payouts.set(receipt.campaignId, receipt);
  }
  
  getPayout(campaignId: string): PayoutReceipt | undefined {
    return this.payouts.get(campaignId);
  }
}

export const db = new Database();
