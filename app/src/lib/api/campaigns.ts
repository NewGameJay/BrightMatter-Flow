/**
 * Campaign API Client
 * 
 * Client for interacting with campaign endpoints
 */

export type CampaignType = "open" | "curated";

export interface CreateCampaignInput {
  type: CampaignType;
  deadline: string;          // ISO
  budgetFlow: string;        // UFix64 string
  criteria?: {
    windowStart?: string;    // ISO
    minEngagementRate?: number;
    platformAllowlist?: string[];
    maxPostsPerCreator?: number;
  };
  creators?: { addr: string; weight: number }[]; // for curated
}

export interface Campaign {
  id: string;
  type: CampaignType;
  deadline: string;
  budgetFlow: string;
  status: "pending" | "verifying" | "paid";
  criteria?: any;
  createdAt?: string;
}

export interface LeaderboardEntry {
  creatorAddr: string;
  totalScore: number;
  submissionCount: number;
  percent: string;
}

export interface PayoutSplit {
  addr: string;
  percent: number;
  amountFlow: string;
}

export interface PayoutReceipt {
  campaignId: string;
  payoutTxId: string;
  splits: PayoutSplit[];
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://brightmatter-oracle.fly.dev';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function createCampaign(input: CreateCampaignInput): Promise<{ campaignId: string }> {
  return fetchAPI('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function joinCampaign(id: string, creatorAddr: string, signature: string): Promise<{ success: boolean; campaignId: string }> {
  return fetchAPI(`/api/campaigns/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorAddr, signature })
  });
}

export async function submitPost(
  id: string, 
  payload: {
    creatorAddr: string;
    platform: string;
    url: string;
    postId: string;
    timestamp: string;
    metrics: { views?: number; likes?: number; comments?: number; shares?: number };
  }
): Promise<{ success: boolean; campaignId: string; resonanceScore?: string }> {
  return fetchAPI(`/api/campaigns/${id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function getCampaign(id: string): Promise<{ success: boolean; campaign: Campaign; payout: PayoutReceipt | null }> {
  return fetchAPI(`/api/campaigns/${id}`);
}

export async function getLeaderboard(id: string): Promise<{ success: boolean; campaignId: string; leaderboard: LeaderboardEntry[] }> {
  return fetchAPI(`/api/campaigns/${id}/leaderboard`);
}

export async function verifyCampaign(id: string): Promise<{ 
  success: boolean; 
  campaignId: string; 
  action: string;
  type: string;
  splits?: PayoutSplit[];
  txId?: string;
  flowscanLink?: string | null;
}> {
  return fetchAPI(`/api/agent/verify/${id}`, {
    method: 'POST'
  });
}
