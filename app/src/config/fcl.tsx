import * as fcl from '@onflow/fcl'
import { useState, useEffect } from 'react'

fcl.config({
  'accessNode.api': import.meta.env.VITE_ACCESS_NODE || 'https://mainnet.onflow.org',
  'flow.network': 'mainnet',
  'app.detail.title': 'BrightMatter',
  'app.detail.icon': 'https://placekitten.com/g/200/200',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
  '0xProfile': import.meta.env.VITE_PROFILE_CONTRACT,
  'walletconnect.projectId': import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''
})

export function useFCL() {
  const [user, setUser] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    fcl.currentUser.subscribe(user => {
      setUser(user)
      setIsConnected(user?.loggedIn || false)
    })
  }, [])

  return { user, isConnected, connect: fcl.authenticate, disconnect: fcl.unauthenticate }
}
