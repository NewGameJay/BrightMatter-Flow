import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import BrandDashboard from './pages/BrandDashboard'
import CreatorDashboard from './pages/CreatorDashboard'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-veri-green">
                BrightMatter
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/brand"
                className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Brand Dashboard
              </Link>
              <Link
                to="/creator"
                className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Creator Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/brand" element={<BrandDashboard />} />
          <Route path="/creator" element={<CreatorDashboard />} />
          <Route
            path="/"
            element={
              <div className="text-center py-16">
                <h1 className="text-4xl font-bold mb-4">Welcome to BrightMatter</h1>
                <p className="text-gray-400 mb-8">Choose your dashboard to get started</p>
                <div className="flex justify-center gap-4">
                  <Link
                    to="/brand"
                    className="btn-primary px-8 py-3 text-lg"
                  >
                    Brand Dashboard
                  </Link>
                  <Link
                    to="/creator"
                    className="btn-primary px-8 py-3 text-lg"
                  >
                    Creator Dashboard
                  </Link>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  )
}

export default App
