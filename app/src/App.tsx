import { Routes, Route, Link } from 'react-router-dom'
import { FCLProvider } from './config/fcl.tsx'
import BrandDashboard from './pages/BrandDashboard'

function App() {
  return (
    <FCLProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-green-500">
              BrightMatter
            </Link>
            <nav>
              <Link to="/brand" className="mx-2 hover:text-green-500">
                Brand Dashboard
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/brand" element={<BrandDashboard />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 p-4 mt-auto">
          <div className="container mx-auto text-center text-gray-400">
            Built on Flow Blockchain
          </div>
        </footer>
      </div>
    </FCLProvider>
  )
}

function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4 text-green-500">Welcome to BrightMatter</h1>
      <p className="text-xl mb-8">Creator Campaign Platform on Flow</p>
      <Link 
        to="/brand" 
        className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
      >
        Create Campaign
      </Link>
    </div>
  )
}

export default App

