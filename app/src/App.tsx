import { Routes, Route } from 'react-router-dom'
import { FCLProvider } from './config/fcl'
import Home from './pages/Home'
import CreatorDashboard from './pages/CreatorDashboard'
import BrandDashboard from './pages/BrandDashboard'
import Profile from './pages/Profile'
import Layout from './components/Layout'

function App() {
  return (
    <FCLProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/creator" element={<CreatorDashboard />} />
          <Route path="/brand" element={<BrandDashboard />} />
          <Route path="/profile/:address" element={<Profile />} />
        </Routes>
      </Layout>
    </FCLProvider>
  )
}

export default App

