/**
 * Home Page
 * 
 * Landing page with project overview and wallet connection
 * Displays key features and guides users to creator or brand dashboards
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { useFCL } from '../config/fcl.tsx'

const Home: React.FC = () => {
  const { isConnected, connect } = useFCL()

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
          Veri x <span className="text-flow-blue">Flow</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          The future of creator economy is here. On-chain reputation, automated payouts, 
          and trustless campaign management powered by Flow blockchain.
        </p>
        
        {!isConnected && (
          <button
            onClick={connect}
            className="btn-primary text-lg px-8 py-3"
          >
            Connect Your Flow Wallet
          </button>
        )}
        
        {isConnected && (
          <div className="space-x-4">
            <Link to="/creator" className="btn-primary text-lg px-8 py-3">
              Creator Dashboard
            </Link>
            <Link to="/brand" className="btn-secondary text-lg px-8 py-3">
              Brand Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card text-center">
          <div className="w-12 h-12 bg-flow-blue/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-flow-blue text-2xl">👤</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Soulbound Profiles</h3>
          <p className="text-gray-300">
            Non-transferable on-chain creator profiles with VeriScore and campaign history. 
            Your reputation travels with you across the Flow ecosystem.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-veri-green/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-veri-green text-2xl">💰</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Automated Escrow</h3>
          <p className="text-gray-300">
            Trustless campaign management with USDF escrow. Automatic payouts when KPIs are met, 
            automatic refunds when deadlines expire.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-veri-orange/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-veri-orange text-2xl">⚡</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Forte Automation</h3>
          <p className="text-gray-300">
            Powered by Flow Forte's scheduled transactions. No manual intervention needed - 
            everything runs automatically on-chain.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-veri-gray rounded-2xl p-8 shadow-lg border border-veri-border">
        <h2 className="text-3xl font-display font-bold text-white mb-8 text-center">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Creator Flow */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">For Creators</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-flow-blue text-veri-dark rounded-full flex items-center justify-center text-sm font-medium shadow-lg">1</div>
                <div>
                  <p className="font-medium text-white">Connect Your Wallet</p>
                  <p className="text-gray-300 text-sm">Link your Flow wallet to create your on-chain profile</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-flow-blue text-veri-dark rounded-full flex items-center justify-center text-sm font-medium shadow-lg">2</div>
                <div>
                  <p className="font-medium text-white">Submit Content</p>
                  <p className="text-gray-300 text-sm">Share your social media posts for VeriScore analysis</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-flow-blue text-veri-dark rounded-full flex items-center justify-center text-sm font-medium shadow-lg">3</div>
                <div>
                  <p className="font-medium text-white">Get Paid</p>
                  <p className="text-gray-300 text-sm">Receive automatic payouts when campaigns hit their KPIs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Flow */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">For Brands</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-veri-green text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg">1</div>
                <div>
                  <p className="font-medium text-white">Create Campaign</p>
                  <p className="text-gray-300 text-sm">Set up campaigns with VeriScore thresholds and deadlines</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-veri-green text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg">2</div>
                <div>
                  <p className="font-medium text-white">Fund Escrow</p>
                  <p className="text-gray-300 text-sm">Deposit USDF tokens into the campaign escrow</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-veri-green text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg">3</div>
                <div>
                  <p className="font-medium text-white">Monitor Results</p>
                  <p className="text-gray-300 text-sm">Track campaign performance and automatic payouts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="bg-veri-darker rounded-2xl p-8 text-white border border-veri-border">
        <h2 className="text-3xl font-display font-bold mb-8 text-center">Built with Flow</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-flow-blue mb-2">Cadence</div>
            <p className="text-gray-400 text-sm">Smart Contracts</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-flow-blue mb-2">Forte</div>
            <p className="text-gray-400 text-sm">Scheduled Transactions</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-flow-blue mb-2">USDF</div>
            <p className="text-gray-400 text-sm">Stablecoin Payments</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-flow-blue mb-2">FCL</div>
            <p className="text-gray-400 text-sm">Wallet Integration</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

