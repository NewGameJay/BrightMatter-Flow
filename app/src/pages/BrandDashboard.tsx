/**
 * Brand Dashboard
 * 
 * Dashboard for brands to create and manage campaigns
 * Includes campaign creation form and campaign monitoring
 */

import React, { useState, useEffect } from 'react'
import { useFCL } from '../config/fcl'
import { apiClient } from '../utils/api'

const BrandDashboard: React.FC = () => {
  const { user, isConnected } = useFCL()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Campaign form state
  const [formData, setFormData] = useState({
    campaignId: '',
    creatorAddress: '',
    threshold: '',
    payout: '',
    deadline: ''
  })

  useEffect(() => {
    if (isConnected && user?.addr) {
      loadCampaigns()
    }
  }, [isConnected, user])

  const loadCampaigns = async () => {
    if (!user?.addr) return
    
    try {
      const response = await apiClient.getCampaigns(user.addr)
      if (response.success) {
        setCampaigns(response.data)
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    }
  }

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      // This would normally call the smart contract
      // For now, we'll just show a success message
      alert('Campaign created successfully! (This would create a real campaign on Flow)')
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
      alert('Failed to create campaign. Please try again.')
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Campaign</h2>
          <form onSubmit={createCampaign} className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="label">Payout Amount (USDF)</label>
                <input
                  type="number"
                  name="payout"
                  value={formData.payout}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="0"
                  className="input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Deadline (days from now)</label>
              <input
                type="number"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                placeholder="30"
                min="1"
                className="input"
                required
              />
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
        {campaigns.length > 0 ? (
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

