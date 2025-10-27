/**
 * API Client
 * 
 * Axios client for communicating with the verifier service
 * Handles all API requests to the backend oracle service
 */

import axios from 'axios'
import { API_BASE_URL } from './constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error)
    return Promise.reject(error)
  }
)

export interface PostAnalysisRequest {
  postUrl: string
}

export interface PostAnalysisResponse {
  success: boolean
  data: {
    score: number
    metrics: {
      likes: number
      views: number
      comments: number
      shares: number
      engagement_rate: number
      reach: number
      impressions: number
    }
    platform: string
    post_id: string
    timestamp: number
    breakdown: {
      engagement_score: number
      reach_score: number
      virality_score: number
    }
  }
}

export interface UpdateScoreRequest {
  userAddress: string
  score: number
}

export interface UpdateScoreResponse {
  success: boolean
  data: {
    transactionId: string
    status: string
  }
}

export interface ProfileResponse {
  success: boolean
  data: {
    veriScore: number
    campaignScores: { [campaignId: string]: number }
    lastUpdated: number
    totalCampaigns: number
  }
}

export interface CampaignResponse {
  success: boolean
  data: {
    id: string
    creator: string
    brand: string
    threshold: number
    payout: number
    paidOut: boolean
    deadline: number
    createdAt: number
    scheduledTxId?: string
  }
}

export interface CampaignsResponse {
  success: boolean
  data: Array<CampaignResponse['data']>
}

export const apiClient = {
  // Analyze post
  async analyzePost(postUrl: string): Promise<PostAnalysisResponse> {
    const response = await api.post<PostAnalysisResponse>('/api/analyze-post', { postUrl })
    return response.data
  },

  // Update VeriScore
  async updateScore(userAddress: string, score: number): Promise<UpdateScoreResponse> {
    const response = await api.post<UpdateScoreResponse>('/api/update-score', { userAddress, score })
    return response.data
  },

  // Get profile
  async getProfile(address: string): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>(`/api/profile/${address}`)
    return response.data
  },

  // Get campaigns for address
  async getCampaigns(address: string): Promise<CampaignsResponse> {
    const response = await api.get<CampaignsResponse>(`/api/campaigns/by-creator/${address}`)
    return response.data
  },

  // Get campaign by ID
  async getCampaign(campaignId: string): Promise<CampaignResponse> {
    const response = await api.get<CampaignResponse>(`/api/campaign/${campaignId}`)
    return response.data
  },

  // Get vault balance
  async getVaultBalance(): Promise<{ success: boolean; data: { balance: number } }> {
    const response = await api.get('/api/vault-balance')
    return response.data
  },

  // Check campaigns
  async checkCampaigns(creatorAddress: string): Promise<CampaignsResponse> {
    const response = await api.post<CampaignsResponse>('/api/check-campaigns', { creatorAddress })
    return response.data
  }
}

export default apiClient

