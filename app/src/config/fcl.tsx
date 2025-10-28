import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import * as fcl from '@onflow/fcl'

// FCL configuration
fcl.config({
  'accessNode.api': 'https://rest-mainnet.onflow.org',
  'flow.network': 'mainnet',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
  'app.detail.title': 'BrightMatter',
  'app.detail.icon': 'https://brightmatter-frontend.fly.dev/favicon.ico',
})

interface User {
  addr: string | null
  loggedIn: boolean
}

interface FCLContextType {
  user: User
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const FCLContext = createContext<FCLContextType | undefined>(undefined)

export const useFCL = () => {
  const context = useContext(FCLContext)
  if (!context) {
    throw new Error('useFCL must be used within FCLProvider')
  }
  return context
}

export const FCLProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({ addr: null, loggedIn: false })

  useEffect(() => {
    fcl.currentUser.subscribe(setUser)
  }, [])

  const connect = async () => {
    await fcl.authenticate()
  }

  const disconnect = () => {
    fcl.unauthenticate()
  }

  return (
    <FCLContext.Provider value={{ user, isConnected: user.loggedIn, connect, disconnect }}>
      {children}
    </FCLContext.Provider>
  )
}

export { fcl }

