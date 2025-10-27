/**
 * FCL Configuration
 * 
 * Configures Flow Client Library for mainnet
 * Sets up wallet discovery and network endpoints
 */

import * as fcl from '@onflow/fcl'

// Configure FCL for mainnet
fcl.config({
  'accessNode.api': 'https://rest-mainnet.onflow.org',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/mainnet/authn',
  'flow.network': 'mainnet',
  'app.detail.title': 'BrightMatter Flow',
  'app.detail.icon': 'https://brightmatter-oracle.fly.dev/icon.png',
  'walletconnect.projectId': import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'd433880630349d5f4fc2dbb859c9a5df',
  'service.OpenFDA': {
    'fcl.limit': 1000
  }
})

export { fcl }

// Contract addresses (production mainnet)
export const CONTRACTS = {
  CreatorProfileV2: '0x14aca78d100d2001',
  CampaignEscrowV3: '0x14aca78d100d2001',
  FungibleToken: '0xf233dcee88fe0abe',
  FlowToken: '0x1654653399040a61'
} as const

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://brightmatter-oracle.fly.dev'

