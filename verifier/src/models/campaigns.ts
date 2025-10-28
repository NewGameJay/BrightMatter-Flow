/**
 * Campaign Data Models
 * 
 * Types for open campaigns with resonance-based payouts
 */

export interface Campaign {
  id: string;
  title?: string;
  type: "open" | "curated";
  deadline: string; // ISO string
  budgetFlow: string; // UFix64 string
  status: "pending" | "verifying" | "paid" | "refunded";
  criteria: CampaignCriteria;
  windowStart: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  // Additional fields for compatibility
  payout?: number;
  threshold?: number;
  paidOut?: boolean;
}

export interface CampaignCriteria {
  minEngagementRate?: number;
  platformAllowlist?: string[];
  maxPostsPerCreator?: number;
  minResonanceScore?: number;
}

export interface CampaignParticipant {
  campaignId: string;
  creatorAddr: string;
  joinedAt: string; // ISO string
  isEligible: boolean;
}

export interface Submission {
  campaignId: string;
  creatorAddr: string;
  platform: string;
  url: string;
  postId: string;
  timestamp: string; // ISO string
  metrics: SubmissionMetrics;
  resonanceScore: number;
  uniqueHash: string;
  flags: SubmissionFlags;
  createdAt: string; // ISO string
}

export interface SubmissionMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  [key: string]: any;
}

export interface SubmissionFlags {
  duplicate?: boolean;
  lowEngagement?: boolean;
  outsideWindow?: boolean;
  suspicious?: boolean;
}

export interface PayoutReceipt {
  campaignId: string;
  payoutTxId: string;
  splits: PayoutSplit[];
  createdAt: string; // ISO string
}

export interface PayoutSplit {
  creatorAddr: string;
  percent: number;
  amountFlow: string;
}

export interface LeaderboardEntry {
  creatorAddr: string;
  totalResonance: number;
  submissionCount: number;
  percent: number;
  submissions: Submission[];
}

// In-memory storage (replace with database in production)
class CampaignStore {
  private campaigns = new Map<string, Campaign>();
  private participants = new Map<string, CampaignParticipant[]>();
  private submissions = new Map<string, Submission[]>();
  private payouts = new Map<string, PayoutReceipt>();

  // Campaign methods
  create(campaign: Campaign): void {
    this.campaigns.set(campaign.id, campaign);
    this.participants.set(campaign.id, []);
    this.submissions.set(campaign.id, []);
  }

  get(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }

  update(id: string, updates: Partial<Campaign>): void {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      this.campaigns.set(id, { ...campaign, ...updates, updatedAt: new Date().toISOString() });
    }
  }

  // Participant methods
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

  // Submission methods
  addSubmission(submission: Submission): void {
    const submissions = this.submissions.get(submission.campaignId) || [];
    submissions.push(submission);
    this.submissions.set(submission.campaignId, submissions);
  }

  getSubmissions(campaignId: string): Submission[] {
    return this.submissions.get(campaignId) || [];
  }

  findValidInWindow(campaignId: string, criteria: CampaignCriteria): Submission[] {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return [];

    const submissions = this.submissions.get(campaignId) || [];
    const now = new Date();
    const windowStart = new Date(campaign.windowStart);
    const deadline = new Date(campaign.deadline);

    return submissions.filter(submission => {
      const submissionTime = new Date(submission.timestamp);
      
      // Check time window
      if (submissionTime < windowStart || submissionTime > deadline) {
        return false;
      }

      // Check platform allowlist
      if (criteria.platformAllowlist && !criteria.platformAllowlist.includes(submission.platform)) {
        return false;
      }

      // Check minimum resonance score
      if (criteria.minResonanceScore && submission.resonanceScore < criteria.minResonanceScore) {
        return false;
      }

      // Check for flags
      if (submission.flags.duplicate || submission.flags.lowEngagement || submission.flags.suspicious) {
        return false;
      }

      return true;
    });
  }

  // Payout methods
  addPayoutReceipt(receipt: PayoutReceipt): void {
    this.payouts.set(receipt.campaignId, receipt);
  }

  getPayoutReceipt(campaignId: string): PayoutReceipt | undefined {
    return this.payouts.get(campaignId);
  }

  // Leaderboard methods
  getLeaderboard(campaignId: string): LeaderboardEntry[] {
    const submissions = this.findValidInWindow(campaignId, {});
    const creatorTotals = new Map<string, { total: number; count: number; submissions: Submission[] }>();

    // Calculate totals per creator
    for (const submission of submissions) {
      const existing = creatorTotals.get(submission.creatorAddr) || { total: 0, count: 0, submissions: [] };
      existing.total += submission.resonanceScore;
      existing.count += 1;
      existing.submissions.push(submission);
      creatorTotals.set(submission.creatorAddr, existing);
    }

    const grandTotal = Array.from(creatorTotals.values()).reduce((sum, entry) => sum + entry.total, 0);

    return Array.from(creatorTotals.entries()).map(([creatorAddr, data]) => ({
      creatorAddr,
      totalResonance: data.total,
      submissionCount: data.count,
      percent: grandTotal > 0 ? data.total / grandTotal : 0,
      submissions: data.submissions
    })).sort((a, b) => b.totalResonance - a.totalResonance);
  }

  // List all campaigns
  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  // Get campaigns by participant
  getCampaignsByParticipant(creatorAddr: string): Campaign[] {
    const participatingCampaignIds = new Set<string>();
    
    for (const [campaignId, participants] of this.participants.entries()) {
      if (participants.some(p => p.creatorAddr === creatorAddr)) {
        participatingCampaignIds.add(campaignId);
      }
    }
    
    return Array.from(participatingCampaignIds)
      .map(id => this.campaigns.get(id))
      .filter((c): c is Campaign => c !== undefined);
  }
}

// Export singleton instance
export const campaignStore = new CampaignStore();
