/**
 * Constants
 * 
 * Application constants and configuration values
 */

export const CONTRACTS = {
  CreatorProfileV2: '0x14aca78d100d2001',
  CampaignEscrowV3: '0x14aca78d100d2001',
  FungibleToken: '0xf233dcee88fe0abe',
  FlowToken: '0x1654653399040a61'
} as const

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://brightmatter-oracle.fly.dev'

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

