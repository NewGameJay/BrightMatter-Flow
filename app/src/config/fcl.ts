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
  'app.detail.title': 'Veri x Flow',
  'app.detail.icon': 'https://veri.flow.com/icon.png',
  'service.OpenFDA': {
    'fcl.limit': 1000
  }
})

export { fcl }

// Contract addresses (will be updated after deployment)
export const CONTRACTS = {
  CreatorProfile: '0xCreatorProfile',
  CampaignEscrow: '0xCampaignEscrow',
  FungibleToken: '0xf233dcee88fe0abe',
  FiatToken: '0x1e4aa0b87d10b141'
} as const

// API endpoints
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'

