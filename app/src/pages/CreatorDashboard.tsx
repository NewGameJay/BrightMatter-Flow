/**
 * Creator Dashboard
 * 
 * Main dashboard for creators to manage their profiles and campaigns
 * Includes post analysis, score management, and campaign tracking
 */

import React, { useState, useEffect } from 'react'
import { useFCL } from '../config/fcl.tsx'
import { apiClient } from '../utils/api'
import * as fcl from '@onflow/fcl'

const CreatorDashboard: React.FC = () => {
  const { user, isConnected } = useFCL()
  const [postUrl, setPostUrl] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimingCampaignId, setClaimingCampaignId] = useState<string | null>(null)
  const [view, setView] = useState<'my-campaigns' | 'open-campaigns'>('my-campaigns')
  const [openCampaigns, setOpenCampaigns] = useState<any[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [joiningCampaignId, setJoiningCampaignId] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && user?.addr) {
      loadProfile()
      loadCampaigns()
    }
  }, [isConnected, user])

  useEffect(() => {
    if (view === 'open-campaigns') {
      loadOpenCampaigns()
    }
  }, [view])

  const loadProfile = async () => {
    if (!user?.addr) return
    
    try {
      const response = await apiClient.getProfile(user.addr)
      if (response.success) {
        setProfile(response.data)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
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

  const loadOpenCampaigns = async () => {
    try {
      const apiUrl = (window as any).__API_URL__ || 'https://brightmatter-oracle.fly.dev'
      const response = await fetch(`${apiUrl}/api/campaigns?type=open`)
      const data = await response.json()
      
      if (data.success && data.campaigns) {
        // Filter out campaigns that are already paid or that the user already joined
        const availableCampaigns = data.campaigns.filter((c: any) => 
          c.status === 'pending' && !campaigns.some((mc: any) => mc.id === c.id)
        )
        setOpenCampaigns(availableCampaigns)
      } else {
        setOpenCampaigns([])
      }
    } catch (error) {
      console.error('Failed to load open campaigns:', error)
      setOpenCampaigns([])
    }
  }

  const handleJoin = async (campaignId: string) => {
    if (!user?.addr) {
      alert('Please connect your wallet')
      return
    }
    
    setIsJoining(true)
    setJoiningCampaignId(campaignId)
    
    try {
      const apiUrl = (window as any).__API_URL__ || 'https://brightmatter-oracle.fly.dev'
      const response = await fetch(`${apiUrl}/api/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorAddr: user.addr })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccessMessage(`✅ Successfully joined campaign ${campaignId}!`)
        setShowSuccess(true)
        
        // Refresh both lists
        await loadCampaigns()
        await loadOpenCampaigns()
        
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
      } else {
        throw new Error(data.error || 'Failed to join campaign')
      }
    } catch (error: any) {
      console.error('Failed to join campaign:', error)
      alert(`Failed to join campaign: ${error.message}`)
    } finally {
      setIsJoining(false)
      setJoiningCampaignId(null)
    }
  }

  const setupProfile = async () => {
    if (!user?.addr) return
    
    setIsSettingUp(true)
    try {
      // Get setup transaction from backend
      const apiUrl = (window as any).__API_URL__ || 'https://brightmatter-oracle.fly.dev'
      const response = await fetch(`${apiUrl}/api/setup-profile`)
      const data = await response.json()
      
      // Execute the setup transaction (user signs)
      const txId = await fcl.mutate({
        cadence: data.cadence,
        args: (arg: any, t: any) => [],
        limit: 9999,
      })
      
      await fcl.tx(txId).onceSealed()
      
      console.log('Profile setup complete:', txId)
      await loadProfile()
    } catch (error) {
      console.error('Failed to setup profile:', error)
      alert('Failed to setup profile. Please try again.')
    } finally {
      setIsSettingUp(false)
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
      // Submit to backend - oracle will analyze, sign, and execute transaction
      const apiUrl = (window as any).__API_URL__ || 'https://brightmatter-oracle.fly.dev'
      const analysisResponse = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postUrl,
          campaignId: selectedCampaign.id,
          creatorAddress: user.addr
        })
      })
      
      const analysisData = await analysisResponse.json()
      
      if (!analysisData.success) {
        throw new Error(analysisData.error || 'Analysis failed')
      }
      
      const { score, txId } = analysisData
      
      console.log('✅ Content submitted successfully!', analysisData)
      
      setSuccessMessage(`🎉 Content submitted successfully!\nScore: ${score}\nTransaction: ${txId}`)
      setShowSuccess(true)
      
      // Reload campaigns to see updated score
      await loadCampaigns()
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setPostUrl('')
        setSelectedCampaign(null)
        setShowSuccess(false)
      }, 3000)
      
    } catch (error: any) {
      console.error('Failed to analyze post:', error)
      
      // If profile doesn't exist, try to set it up
      if (error.message?.includes('profile not found') || error.message?.includes('Creator profile not found')) {
        if (confirm('Your profile is not set up. Would you like to set it up now?')) {
          await setupProfile()
        }
      } else {
        alert(`Failed to submit content: ${error.message || String(error)}`)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const claimPayout = async (campaignId: string) => {
    if (!user?.addr) {
      alert('Please connect your wallet')
      return
    }
    
    setIsClaiming(true)
    setClaimingCampaignId(campaignId)
    
    try {
      const apiUrl = (window as any).__API_URL__ || 'https://brightmatter-oracle.fly.dev'
      const response = await fetch(`${apiUrl}/api/campaigns/${campaignId}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccessMessage(`💰 Payout claimed successfully! TX: ${data.txId}`)
        setShowSuccess(true)
        
        // Reload campaigns to see updated status
        await loadCampaigns()
        await loadProfile()
        
        setTimeout(() => {
          setShowSuccess(false)
        }, 5000)
      } else {
        throw new Error(data.error || 'Failed to claim payout')
      }
    } catch (error: any) {
      console.error('Failed to claim payout:', error)
      alert(`Failed to claim payout: ${error.message}`)
    } finally {
      setIsClaiming(false)
      setClaimingCampaignId(null)
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
          Manage your campaigns and submit content for analysis
        </p>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-flow-blue mx-auto"></div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(isAnalyzing || isSettingUp || isClaiming) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-flow-blue mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isSettingUp ? 'Setting up profile...' : isClaiming ? 'Processing payout...' : 'Analyzing & Recording...'}
            </p>
          </div>
        </div>
      )}

      {/* Profile Status */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
        {profile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-flow-blue">{profile.veriScore || 0}</div>
              <div className="text-sm text-gray-600">Current Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-veri-green">{profile.totalCampaigns || 0}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-veri-orange">
                {user?.addr ? `${user.addr.slice(0, 6)}...${user.addr.slice(-4)}` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Wallet Address</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Profile not set up. Click below to initialize.</p>
            <button 
              onClick={setupProfile}
              disabled={isSettingUp}
              className="btn-primary"
            >
              {isSettingUp ? 'Setting up...' : 'Setup Profile'}
            </button>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setView('my-campaigns')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            view === 'my-campaigns' 
              ? 'bg-veri-green text-white' 
              : 'bg-veri-gray text-gray-300 hover:bg-veri-border'
          }`}
        >
          My Campaigns
        </button>
        <button
          onClick={() => setView('open-campaigns')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            view === 'open-campaigns' 
              ? 'bg-veri-green text-white' 
              : 'bg-veri-gray text-gray-300 hover:bg-veri-border'
          }`}
        >
          Open Campaigns
        </button>
      </div>

      {/* Open Campaigns View */}
      {view === 'open-campaigns' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Join Open Campaigns</h2>
          <p className="text-gray-300 mb-6">
            Browse and join open campaigns that anyone can participate in. Earn FLOW based on your content performance!
          </p>
          {openCampaigns && openCampaigns.length > 0 ? (
            <div className="grid gap-4">
              {openCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-veri-gray p-6 rounded-lg border border-veri-border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{campaign.title || campaign.id}</h3>
                      <p className="text-sm text-gray-400 mt-1">ID: {campaign.id}</p>
                    </div>
                    <div className="px-3 py-1 bg-veri-green/20 text-veri-green rounded-full text-sm">
                      Open to Join
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total Payout:</span>
                      <div className="text-lg font-bold text-veri-green">{campaign.budgetFlow} FLOW</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Deadline:</span>
                      <div className="font-medium text-white">
                        {new Date(campaign.deadline).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Min Threshold:</span>
                      <div className="font-medium text-white">
                        {campaign.criteria?.minResonanceScore || 'Any'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Payout Type:</span>
                      <div className="font-medium text-veri-orange">
                        Proportional
                      </div>
                    </div>
                  </div>
                  {campaign.criteria && (
                    <div className="text-xs text-gray-400 mb-4">
                      {campaign.criteria.minEngagementRate && (
                        <p>Min Engagement Rate: {(campaign.criteria.minEngagementRate * 100).toFixed(1)}%</p>
                      )}
                      {campaign.criteria.platformAllowlist && (
                        <p>Platforms: {campaign.criteria.platformAllowlist.join(', ')}</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleJoin(campaign.id)}
                    disabled={isJoining && joiningCampaignId === campaign.id}
                    className="w-full px-4 py-2 bg-veri-green text-white rounded-lg font-medium hover:bg-veri-green/90 transition disabled:opacity-50"
                  >
                    {isJoining && joiningCampaignId === campaign.id ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </span>
                    ) : (
                      '🚀 Join Campaign'
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No open campaigns available right now.</p>
              <p className="text-sm text-gray-500">Check back later or create your first campaign as a brand!</p>
            </div>
          )}
        </div>
      )}

      {/* Campaign Selection */}
      {view === 'my-campaigns' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Campaign</h2>
          {campaigns && campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div 
                  key={campaign.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCampaign?.id === campaign.id 
                      ? 'border-flow-blue bg-flow-blue bg-opacity-5' 
                      : 'border-gray-200 hover:border-flow-blue hover:border-opacity-50'
                  }`}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">Campaign {campaign.id}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>💰 Payout: <span className="font-medium text-flow-blue">{parseFloat(campaign.payout).toFixed(1)} FLOW</span></p>
                        <p>🎯 Threshold: <span className="font-medium">{parseFloat(campaign.threshold).toFixed(1)} points</span></p>
                        <p>📊 Current Score: <span className="font-medium">{parseFloat(campaign.totalScore).toFixed(1)}</span></p>
                        <p>📅 Deadline: <span className="font-medium">{new Date(parseFloat(campaign.deadline) * 1000).toLocaleString()}</span></p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      parseFloat(campaign.totalScore) >= parseFloat(campaign.threshold)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {parseFloat(campaign.totalScore) >= parseFloat(campaign.threshold) ? 'Eligible' : 'Active'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No campaigns found.</p>
          )}
        </div>
      )}

      {/* Content Submission */}
      {view === 'my-campaigns' && selectedCampaign && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Content</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Social Media Post URL</label>
              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="input"
                disabled={isAnalyzing}
              />
            </div>
            <button
              onClick={analyzePost}
              disabled={!postUrl.trim() || isAnalyzing}
              className="btn-primary w-full"
            >
              {isAnalyzing ? 'Processing...' : 'Submit Content'}
            </button>
          </div>
        </div>
      )}

      {/* Your Campaigns */}
      {view === 'my-campaigns' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Campaigns</h2>
          {campaigns && campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const isEligible = parseFloat(campaign.totalScore) >= parseFloat(campaign.threshold)
                const isPaidOut = campaign.paidOut === true
                const isClaimingThis = isClaiming && claimingCampaignId === campaign.id
                
                return (
                  <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Campaign {campaign.id}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Threshold: {parseFloat(campaign.threshold).toFixed(1)} | 
                          Payout: {parseFloat(campaign.payout).toFixed(1)} FLOW |
                          Score: {parseFloat(campaign.totalScore).toFixed(1)}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        isPaidOut
                          ? 'bg-gray-100 text-gray-800'
                          : isEligible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isPaidOut ? 'Paid Out' : isEligible ? 'Eligible' : 'Active'}
                      </div>
                    </div>
                    
                    {isEligible && !isPaidOut && (
                      <button
                        onClick={() => claimPayout(campaign.id)}
                        disabled={isClaimingThis}
                        className="btn-primary w-full"
                      >
                        {isClaimingThis ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Claiming...
                          </span>
                        ) : (
                          `💰 Claim ${parseFloat(campaign.payout).toFixed(1)} FLOW`
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No campaigns found.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default CreatorDashboard
