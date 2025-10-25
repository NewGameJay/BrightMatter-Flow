/**
 * Constants
 * 
 * Application constants and configuration values
 */

export const CONTRACTS = {
  CreatorProfile: '0xCreatorProfile',
  CampaignEscrow: '0xCampaignEscrow',
  FungibleToken: '0xf233dcee88fe0abe',
  FiatToken: '0x1e4aa0b87d10b141'
} as const

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'

export const FLOW_NETWORK = 'mainnet'

export const SUPPORTED_PLATFORMS = [
  'youtube',
  'twitter',
  'instagram',
  'tiktok'
] as const

export const PLATFORM_NAMES = {
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  tiktok: 'TikTok'
} as const

export const PLATFORM_COLORS = {
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  tiktok: '#000000'
} as const

export const SCORE_RANGES = {
  excellent: { min: 80, max: 100, color: '#10B981' },
  good: { min: 60, max: 79, color: '#F59E0B' },
  average: { min: 40, max: 59, color: '#EF4444' },
  poor: { min: 0, max: 39, color: '#6B7280' }
} as const

