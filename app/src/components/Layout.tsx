/**
 * Layout Component
 * 
 * Main layout wrapper for the application
 * Includes navigation, header, and footer
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useFCL } from '../config/fcl.tsx'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isConnected, connect, disconnect } = useFCL()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-veri-dark">
      {/* Header */}
      <header className="bg-veri-gray shadow-lg border-b border-veri-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-veri-green to-veri-green/60 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-display font-bold text-white">Veri x Flow</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/creator"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/creator')
                    ? 'bg-veri-green text-white shadow-lg'
                    : 'text-gray-300 hover:text-veri-green hover:bg-veri-light-gray'
                }`}
              >
                Creator
              </Link>
              <Link
                to="/brand"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/brand')
                    ? 'bg-veri-green text-white shadow-lg'
                    : 'text-gray-300 hover:text-veri-green hover:bg-veri-light-gray'
                }`}
              >
                Brand
              </Link>
            </nav>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-300">
                    <div className="font-medium">
                      {user?.addr ? `${user.addr.slice(0, 6)}...${user.addr.slice(-4)}` : 'Connected'}
                    </div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="btn-secondary text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  className="btn-primary"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-veri-gray border-t border-veri-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Veri x Flow</h3>
              <p className="text-gray-400 text-sm">
                Building the future of creator economy with on-chain verification and automated payouts.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Built with Flow</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Soulbound Creator Profiles</li>
                <li>• Automated Campaign Escrow</li>
                <li>• Forte Scheduled Transactions</li>
                <li>• USDF Stablecoin Integration</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Hackathon Project</h4>
              <p className="text-gray-400 text-sm">
                Built for Flow Forte Hacks 2025<br />
                Targeting "Best Use of Forte" and "Killer App on Flow" tracks
              </p>
            </div>
          </div>
          <div className="border-t border-veri-border mt-8 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Veri x Flow. Built with ❤️ for the Flow ecosystem.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout

