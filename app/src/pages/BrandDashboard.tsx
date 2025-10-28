/**
 * Brand Dashboard
 * 
 * Dashboard for brands to create and manage campaigns
 * Includes campaign creation form and campaign monitoring
 */

import React, { useState, useEffect } from 'react'
import { useFCL } from '../config/fcl.tsx'
import * as fcl from '@onflow/fcl'
import { createCampaign, getCampaign, type CampaignType, type Campaign } from '../lib/api/campaigns'

const BrandDashboard: React.FC = () => {
  const { user, isConnected } = useFCL()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Campaign form state
  const [campaignType, setCampaignType] = useState<CampaignType>('open')
  const [formData, setFormData] = useState({
    campaignId: '',
    creatorAddress: '',
    threshold: '',
    payout: '',
    deadline: '',
    windowStart: '',
    minEngagementRate: '0.02'
  })

  useEffect(() => {
    if (isConnected && user?.addr) {
      loadCampaigns()
    }
  }, [isConnected, user])

  const loadCampaigns = async () => {
    if (!user?.addr) return
    
    try {
      // Load campaigns for this user
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://brightmatter-oracle.fly.dev'}/api/campaigns`)
      const data = await res.json()
      if (data && Array.isArray(data)) {
        setCampaigns(data)
      } else {
        setCampaigns([])
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
      setCampaigns([])
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      if (campaignType === 'open') {
        // Use new API for open campaigns
        const deadlineDate = new Date(Date.now() + (parseFloat(formData.deadline) * 3600 * 1000))
        const windowStartDate = formData.windowStart 
          ? new Date(formData.windowStart)
          : new Date()
        
        const result = await createCampaign({
          type: 'open',
          deadline: deadlineDate.toISOString(),
          budgetFlow: formData.payout,
          criteria: {
            windowStart: windowStartDate.toISOString(),
            minEngagementRate: parseFloat(formData.minEngagementRate),
            platformAllowlist: ['twitter', 'youtube', 'tiktok']
          }
        })
        
        alert(`Open campaign created!\nCampaign ID: ${result.campaignId}`)
        setShowCreateForm(false)
        loadCampaigns()
        return
      }
      
      // Curated campaign - use existing on-chain flow
      const deadlineTimestamp = Date.now() + (parseFloat(formData.deadline) * 3600 * 1000)
      const deadlineSeconds = Math.floor(deadlineTimestamp / 1000)
      
      const cadence = `
import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import CampaignEscrowV2 from 0x14aca78d100d2001

transaction(
  id: String,
  creator: Address,
  threshold: UFix64,
  payout: UFix64,
  deadline: UFix64,
  deposit: UFix64
) {
  prepare(signer: auth(Storage, BorrowValue) &Account) {
    let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("No FlowToken vault found for brand. Run the vault/profile setup first.")
    
    let payment <- vaultRef.withdraw(amount: deposit) as! @FlowToken.Vault
    
    let ok = CampaignEscrowV2.createCampaign(
      id: id,
      creator: creator,
      threshold: threshold,
      payout: payout,
      deadline: deadline,
      from: <- payment
    )
    assert(ok, message: "createCampaign failed")
  }
}
      `.trim()

      // Execute the transaction via FCL
      // Helper to format UFix64 with exactly one decimal place
      const formatUFix64 = (value: string | number): string => {
        const num = typeof value === 'string' ? parseFloat(value) : value
        return num.toFixed(1)
      }
      
      const txId = await fcl.mutate({
        cadence,
        args: (arg: any, t: any) => [
          arg(formData.campaignId, t.String),
          arg(formData.creatorAddress, t.Address),
          arg(formatUFix64(formData.threshold), t.UFix64),
          arg(formatUFix64(formData.payout), t.UFix64),
          arg(formatUFix64(deadlineSeconds), t.UFix64),
          arg(formatUFix64(formData.payout), t.UFix64) // deposit same as payout
        ],
        proposer: fcl.currentUser().authorization,
        payer: fcl.currentUser().authorization,
        authorizations: [fcl.currentUser().authorization],
        limit: 9999
      })

      // Wait for transaction to be sealed
      await fcl.tx(txId).onceSealed()

      alert(`Campaign created successfully!\nTransaction ID: ${txId}\nView: https://flowscan.org/transaction/${txId}`)
      
      setShowCreateForm(false)
      setFormData({
        campaignId: '',
        creatorAddress: '',
        threshold: '',
        payout: '',
        deadline: ''
      })
      loadCampaigns()
    } catch (error) {
      console.error('Failed to create campaign:', error)
      alert(`Failed to create campaign: ${error}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-8">Please connect your Flow wallet to access the brand dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Create and manage creator campaigns with automated payouts
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create Campaign
        </button>
      </div>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Create New Campaign</h2>
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            {/* Campaign Type */}
            <div>
              <label className="label">Campaign Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="campaignType"
                    value="open"
                    checked={campaignType === 'open'}
                    onChange={(e) => setCampaignType(e.target.value as CampaignType)}
                    className="mr-2"
                  />
                  <span className="text-white">Open (Multiple creators)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="campaignType"
                    value="curated"
                    checked={campaignType === 'curated'}
                    onChange={(e) => setCampaignType(e.target.value as CampaignType)}
                    className="mr-2"
                  />
                  <span className="text-white">Curated (Single creator)</span>
                </label>
              </div>
            </div>

            {campaignType === 'curated' && (
              <>
                <div>
                  <label className="label">Campaign ID</label>
                  <input
                    type="text"
                    name="campaignId"
                    value={formData.campaignId}
                    onChange={handleInputChange}
                    placeholder="campaign-001"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Creator Address</label>
                  <input
                    type="text"
                    name="creatorAddress"
                    value={formData.creatorAddress}
                    onChange={handleInputChange}
                    placeholder="0x1234567890abcdef"
                    className="input"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="label">Budget (FLOW)</label>
              <input
                type="number"
                name="payout"
                value={formData.payout}
                onChange={handleInputChange}
                placeholder={campaignType === 'open' ? '100' : '10'}
                min="0.00000001"
                step="0.1"
                className="input"
                required
              />
              <p className="text-sm text-gray-400 mt-1">
                {campaignType === 'open' 
                  ? 'Total budget split among creators based on resonance scores'
                  : 'Payout for single creator'}
              </p>
            </div>

            {campaignType === 'curated' && (
              <div>
                <label className="label">VeriScore Threshold</label>
                <input
                  type="number"
                  name="threshold"
                  value={formData.threshold}
                  onChange={handleInputChange}
                  placeholder="75"
                  min="0"
                  max="100"
                  className="input"
                  required
                />
              </div>
            )}

            {campaignType === 'open' && (
              <>
                <div>
                  <label className="label">Window Start (optional)</label>
                  <input
                    type="datetime-local"
                    name="windowStart"
                    value={formData.windowStart}
                    onChange={handleInputChange}
                    className="input"
                  />
                  <p className="text-sm text-gray-400 mt-1">Content posted before this time won't count</p>
                </div>
                <div>
                  <label className="label">Minimum Engagement Rate</label>
                  <input
                    type="number"
                    name="minEngagementRate"
                    value={formData.minEngagementRate}
                    onChange={handleInputChange}
                    placeholder="0.02"
                    min="0"
                    max="1"
                    step="0.01"
                    className="input"
                  />
                  <p className="text-sm text-gray-400 mt-1">Posts below this threshold will be rejected</p>
                </div>
              </>
            )}

            <div>
              <label className="label">Deadline (hours from now)</label>
              <input
                type="number"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                placeholder={campaignType === 'open' ? '168' : '24'}
                min="1"
                step="1"
                className="input"
                required
              />
              <p className="text-sm text-gray-400 mt-1">
                {campaignType === 'open'
                  ? 'Recommended: 7+ days for open campaigns'
                  : 'Minimum: 1 hour, recommended: 24+ hours'}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary"
              >
                {isCreating ? 'Creating...' : 'Create Campaign'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Campaigns</h2>
        {campaigns && campaigns.length > 0 ? (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Campaign {campaign.id}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Creator:</span>
                        <div className="font-medium">{campaign.creator.slice(0, 8)}...</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Threshold:</span>
                        <div className="font-medium">{campaign.threshold}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Payout:</span>
                        <div className="font-medium">{campaign.payout} USDF</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Deadline:</span>
                        <div className="font-medium">
                          {new Date(campaign.deadline * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    campaign.paidOut ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.paidOut ? 'Completed' : 'Active'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No campaigns created yet.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Your First Campaign
            </button>
          </div>
        )}
      </div>

      {/* Vault Balance */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Escrow Vault</h2>
        <div className="text-center py-4">
          <div className="text-2xl font-bold text-flow-blue">0 USDF</div>
          <div className="text-sm text-gray-600">Total in escrow</div>
        </div>
      </div>
    </div>
  )
}

export default BrandDashboard

