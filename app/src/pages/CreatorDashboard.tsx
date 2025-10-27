/**
 * Creator Dashboard
 * 
 * Dashboard for creators to discover campaigns, join open campaigns,
 * submit content, and view leaderboards
 */

import React, { useState, useEffect } from 'react'
import { getCampaign, getLeaderboard, joinCampaign, submitPost, type Campaign, type LeaderboardEntry } from '../lib/api/campaigns'

const CreatorDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [postUrl, setPostUrl] = useState('')
  const [message, setMessage] = useState({ type: '' as 'success' | 'error' | '', text: '' })

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://brightmatter-oracle.fly.dev'}/api/campaigns`)
      const data = await response.json()
      if (data.success && data.campaigns) {
        // Filter to only show open campaigns
        const openCampaigns = data.campaigns.filter((c: Campaign) => c.type === 'open')
        setCampaigns(openCampaigns)
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
      setCampaigns([])
    }
  }

  const handleSelectCampaign = async (campaignId: string) => {
    try {
      const response = await getCampaign(campaignId)
      if (response.success && response.campaign) {
        setSelectedCampaign(response.campaign)
        
        // Load leaderboard
        const leaderboardResponse = await getLeaderboard(campaignId)
        if (leaderboardResponse.success && leaderboardResponse.leaderboard) {
          setLeaderboard(leaderboardResponse.leaderboard)
        }
      }
    } catch (error) {
      console.error('Failed to load campaign:', error)
      showMessage('error', 'Failed to load campaign details')
    }
  }

  const handleJoinCampaign = async (campaignId: string) => {
    const creatorAddr = '0x0000000000000000000000000000000000000000' // TODO: Get from wallet
    const signature = '' // TODO: Add wallet signature
    
    setIsJoining(true)
    try {
      await joinCampaign(campaignId, creatorAddr, signature)
      showMessage('success', 'Successfully joined campaign!')
      setShowJoinForm(false)
      handleSelectCampaign(campaignId)
    } catch (error: any) {
      console.error('Failed to join campaign:', error)
      showMessage('error', error?.message || 'Failed to join campaign')
    } finally {
      setIsJoining(false)
    }
  }

  const handleSubmitPost = async () => {
    if (!selectedCampaign || !postUrl) return
    
    setIsSubmitting(true)
    try {
      const creatorAddr = '0x0000000000000000000000000000000000000000' // TODO: Get from wallet
      
      // Generate a unique post ID from the URL
      const postId = postUrl.split('/').pop() || Date.now().toString()
      
      const result = await submitPost(selectedCampaign.id, {
        creatorAddr,
        platform: 'twitter', // TODO: Auto-detect platform
        url: postUrl,
        postId,
        timestamp: new Date().toISOString(),
        metrics: {}
      })
      
      const score = result.resonanceScore || '0.00'
      showMessage('success', `Post submitted! Resonance score: ${score}`)
      setPostUrl('')
      setShowSubmitForm(false)
      
      // Refresh leaderboard
      if (selectedCampaign) {
        const leaderboardResponse = await getLeaderboard(selectedCampaign.id)
        if (leaderboardResponse.success && leaderboardResponse.leaderboard) {
          setLeaderboard(leaderboardResponse.leaderboard)
        }
      }
    } catch (error: any) {
      console.error('Failed to submit post:', error)
      showMessage('error', error?.message || 'Failed to submit post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Join open campaigns, submit your content, and earn FLOW based on performance
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`card ${message.type === 'success' ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
          <p className={`${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Available Campaigns */}
      {!selectedCampaign && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Open Campaigns</h2>
          {campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">Campaign {campaign.id}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-400">Budget:</span>
                          <div className="font-medium text-white">{campaign.budgetFlow} FLOW</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Deadline:</span>
                          <div className="font-medium text-white">
                            {new Date(campaign.deadline).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <div className="font-medium text-white">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              campaign.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                              campaign.status === 'paid' ? 'bg-green-900/50 text-green-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectCampaign(campaign.id)}
                      className="btn-primary ml-4"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No open campaigns available.</p>
            </div>
          )}
        </div>
      )}

      {/* Campaign Details & Leaderboard */}
      {selectedCampaign && (
        <>
          <div className="card">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-white">Campaign {selectedCampaign.id}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-400">Total Budget:</span>
                    <div className="font-medium text-white text-lg">{selectedCampaign.budgetFlow} FLOW</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Deadline:</span>
                    <div className="font-medium text-white">
                      {new Date(selectedCampaign.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <div className="font-medium text-white">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedCampaign.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                        selectedCampaign.status === 'paid' ? 'bg-green-900/50 text-green-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {selectedCampaign.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Participants:</span>
                    <div className="font-medium text-white">{leaderboard.length}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCampaign(null)
                  setShowSubmitForm(false)
                }}
                className="btn-secondary"
              >
                Back to List
              </button>
            </div>
          </div>

          {/* Join / Submit Actions */}
          <div className="card">
            <div className="flex gap-4">
              <button
                onClick={() => setShowJoinForm(true)}
                className="btn-primary"
              >
                Join Campaign
              </button>
              <button
                onClick={() => setShowSubmitForm(true)}
                className="btn-primary"
                disabled={selectedCampaign.status === 'paid'}
              >
                Submit Post
              </button>
            </div>
          </div>

          {/* Join Campaign Modal */}
          {showJoinForm && (
            <div className="card bg-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Join Campaign</h3>
              <p className="text-gray-400 mb-4">
                Joining this campaign will allow you to submit posts and compete for a share of the prize pool.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleJoinCampaign(selectedCampaign.id)}
                  disabled={isJoining}
                  className="btn-primary"
                >
                  {isJoining ? 'Joining...' : 'Confirm Join'}
                </button>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Submit Post Form */}
          {showSubmitForm && (
            <div className="card bg-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Submit Post</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Post URL</label>
                  <input
                    type="url"
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    placeholder="https://twitter.com/username/status/..."
                    className="input"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Enter a link to your social media post
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleSubmitPost}
                    disabled={isSubmitting || !postUrl}
                    className="btn-primary"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Post'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSubmitForm(false)
                      setPostUrl('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-4">Leaderboard</h3>
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">Rank</th>
                      <th className="text-left py-3 px-4 text-gray-400">Creator</th>
                      <th className="text-right py-3 px-4 text-gray-400">Resonance Score</th>
                      <th className="text-right py-3 px-4 text-gray-400">Submissions</th>
                      <th className="text-right py-3 px-4 text-gray-400">Share %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={entry.creatorAddr} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-3 px-4 text-white font-medium">
                          #{index + 1}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {entry.creatorAddr.slice(0, 8)}...{entry.creatorAddr.slice(-6)}
                        </td>
                        <td className="py-3 px-4 text-right text-white">
                          {entry.totalScore.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-400">
                          {entry.submissionCount}
                        </td>
                        <td className="py-3 px-4 text-right text-green-400 font-medium">
                          {entry.percent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No submissions yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default CreatorDashboard
