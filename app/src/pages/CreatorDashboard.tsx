/**
 * Creator Dashboard
 * 
 * Main dashboard for creators to manage their profiles and campaigns
 * Includes post analysis, score management, and campaign tracking
 */

import React, { useState, useEffect } from 'react'
import { useFCL } from '../config/fcl.tsx'
import { apiClient } from '../utils/api'

const CreatorDashboard: React.FC = () => {
  const { user, isConnected, hasProfile, setHasProfile } = useFCL()
  const [postUrl, setPostUrl] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])

  useEffect(() => {
    if (isConnected && user?.addr) {
      loadProfile()
      loadCampaigns()
    }
  }, [isConnected, user])

  const loadProfile = async () => {
    if (!user?.addr) return
    
    try {
      const response = await apiClient.getProfile(user.addr)
      if (response.success) {
        setProfile(response.data)
        setHasProfile(true)
      } else {
        setHasProfile(false)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      setHasProfile(false)
    }
  }

  const loadCampaigns = async () => {
    if (!user?.addr) return
    
    try {
      const response = await apiClient.getCampaigns(user.addr)
      if (response.success && response.data) {
        setCampaigns(Array.isArray(response.data) ? response.data : [])
      } else {
        setCampaigns([])
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
      setCampaigns([])
    }
  }

  const analyzePost = async () => {
    if (!postUrl.trim()) {
      alert('Please enter a post URL')
      return
    }
    
    if (!selectedCampaign) {
      alert('Please select a campaign')
      return
    }
    
    if (!user?.addr) {
      alert('Please connect your wallet')
      return
    }
    
    setIsAnalyzing(true)
    try {
      // Step 1: Analyze post (gets mock 5.0 score)
      const analysisResponse = await apiClient.analyzePost(postUrl)
      if (!analysisResponse.success) {
        throw new Error('Analysis failed')
      }
      
      setAnalysisResult(analysisResponse.data)
      
      // Step 2: Record score on-chain via /api/analyze
      const recordResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://brightmatter-oracle.fly.dev'}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postUrl,
          campaignId: selectedCampaign,
          creatorAddress: user.addr
        })
      })
      
      const recordData = await recordResponse.json()
      
      if (recordData.success) {
        alert(`✅ Post analyzed and recorded on-chain!\nScore: ${analysisResponse.data.score.toFixed(1)}\nCampaign: ${selectedCampaign}\nTx: ${recordData.txResult.txId}`)
        // Reload campaigns to see updated score
        loadCampaigns()
      } else {
        throw new Error(recordData.error || 'Failed to record score on-chain')
      }
    } catch (error) {
      console.error('Failed to analyze post:', error)
      alert('Failed to analyze post. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const updateScore = async () => {
    if (!analysisResult || !user?.addr) return
    
    setIsUpdating(true)
    try {
      const response = await apiClient.updateScore(user.addr, analysisResult.score)
      if (response.success) {
        alert('VeriScore updated successfully!')
        loadProfile()
        setAnalysisResult(null)
        setPostUrl('')
      }
    } catch (error) {
      console.error('Failed to update score:', error)
      alert('Failed to update score. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-8">Please connect your Flow wallet to access the creator dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your VeriScore and track your campaign performance
        </p>
      </div>

      {/* Profile Status */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Status</h2>
        {hasProfile && profile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-flow-blue">{profile.veriScore.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Current VeriScore</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-veri-green">{profile.totalCampaigns}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-veri-orange">
                {new Date(profile.lastUpdated * 1000).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No profile found. Create your profile to get started.</p>
            <button className="btn-primary">Create Profile</button>
          </div>
        )}
      </div>

      {/* Post Analysis */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Content for Campaign</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Select Campaign</label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="input"
            >
              <option value="">-- Select a campaign --</option>
              {campaigns && campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.id} - {parseFloat(campaign.payout).toFixed(1)} FLOW - Threshold: {parseFloat(campaign.threshold).toFixed(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Social Media Post URL</label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="input"
            />
          </div>
          <button
            onClick={analyzePost}
            disabled={!postUrl.trim() || !selectedCampaign || isAnalyzing}
            className="btn-primary"
          >
            {isAnalyzing ? 'Analyzing & Recording...' : 'Submit Content'}
          </button>
        </div>

        {analysisResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Analysis Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-flow-blue">{analysisResult.score.toFixed(2)}</div>
                <div className="text-sm text-gray-600">VeriScore</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{analysisResult.platform}</div>
                <div className="text-sm text-gray-600">Platform</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Engagement Score:</span>
                <span className="font-medium">{analysisResult.breakdown.engagement_score.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Reach Score:</span>
                <span className="font-medium">{analysisResult.breakdown.reach_score.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Virality Score:</span>
                <span className="font-medium">{analysisResult.breakdown.virality_score.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={updateScore}
              disabled={isUpdating}
              className="btn-primary mt-4"
            >
              {isUpdating ? 'Updating...' : 'Update VeriScore'}
            </button>
          </div>
        )}
      </div>

      {/* Campaigns */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Campaigns</h2>
        {campaigns && campaigns.length > 0 ? (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">Campaign {campaign.id}</h3>
                    <p className="text-sm text-gray-600">
                      Threshold: {campaign.threshold} | Payout: {campaign.payout} USDF
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    campaign.paidOut ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.paidOut ? 'Paid' : 'Active'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No campaigns found.</p>
        )}
      </div>
    </div>
  )
}

export default CreatorDashboard

