/**
 * Profile Page
 * 
 * Public profile viewer for any address
 * Shows VeriScore, campaign history, and composability demo
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { apiClient } from '../utils/api'

const Profile: React.FC = () => {
  const { address } = useParams<{ address: string }>()
  const [profile, setProfile] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      loadProfileData()
    }
  }, [address])

  const loadProfileData = async () => {
    if (!address) return
    
    setLoading(true)
    try {
      const [profileResponse, campaignsResponse] = await Promise.all([
        apiClient.getProfile(address),
        apiClient.getCampaigns(address)
      ])

      if (profileResponse.success) {
        setProfile(profileResponse.data)
      }

      if (campaignsResponse.success) {
        setCampaigns(campaignsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
        <p className="text-gray-600">No profile found for address: {address}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-flow-blue to-flow-purple rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">
            {address?.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Creator Profile</h1>
        <p className="text-gray-600 font-mono text-sm">{address}</p>
      </div>

      {/* VeriScore Display */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">VeriScore</h2>
        <div className="text-center">
          <div className="text-6xl font-bold text-flow-blue mb-2">{profile.veriScore.toFixed(2)}</div>
          <div className="text-gray-600 mb-4">Overall Performance Score</div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-flow-blue h-4 rounded-full transition-all duration-300"
              style={{ width: `${profile.veriScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-veri-green">{profile.totalCampaigns}</div>
          <div className="text-sm text-gray-600">Total Campaigns</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-veri-orange">
            {Object.keys(profile.campaignScores).length}
          </div>
          <div className="text-sm text-gray-600">Completed Campaigns</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-flow-purple">
            {new Date(profile.lastUpdated * 1000).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-600">Last Updated</div>
        </div>
      </div>

      {/* Campaign History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign History</h2>
        {Object.keys(profile.campaignScores).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(profile.campaignScores).map(([campaignId, score]) => (
              <div key={campaignId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Campaign {campaignId}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-flow-blue">{Number(score).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No campaign history available.</p>
        )}
      </div>

      {/* Active Campaigns */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Campaigns</h2>
        {campaigns.filter(c => !c.paidOut).length > 0 ? (
          <div className="space-y-3">
            {campaigns.filter(c => !c.paidOut).map((campaign) => (
              <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">Campaign {campaign.id}</h3>
                    <p className="text-sm text-gray-600">
                      Threshold: {campaign.threshold} | Payout: {campaign.payout} USDF
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No active campaigns.</p>
        )}
      </div>

      {/* Composability Demo */}
      <div className="card bg-gradient-to-r from-flow-blue/10 to-flow-purple/10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Composability Demo</h2>
        <p className="text-gray-600 mb-4">
          This profile data is publicly readable on-chain and can be used by other dApps in the Flow ecosystem.
        </p>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Other dApps can read this profile data
const profile = await fcl.query({
  cadence: \`
    import CreatorProfile from 0xCreatorProfile
    pub fun main(address: Address): CreatorProfile.Profile? {
      // Read profile data
    }
  \`,
  args: [fcl.arg("${address}", fcl.t.Address)]
})`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default Profile

