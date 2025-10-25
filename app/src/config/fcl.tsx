/**
 * FCL Provider Component
 * 
 * Provides Flow Client Library context to the app
 * Handles wallet connection state and user authentication
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import * as fcl from '@onflow/fcl'
import { FlowUser } from '@onflow/fcl/types'

interface FCLContextType {
  user: FlowUser | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  hasProfile: boolean
  setHasProfile: (has: boolean) => void
}

const FCLContext = createContext<FCLContextType | undefined>(undefined)

export const useFCL = () => {
  const context = useContext(FCLContext)
  if (!context) {
    throw new Error('useFCL must be used within an FCLProvider')
  }
  return context
}

interface FCLProviderProps {
  children: React.ReactNode
}

export const FCLProvider: React.FC<FCLProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FlowUser | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean>(false)

  useEffect(() => {
    // Subscribe to user changes
    fcl.currentUser.subscribe(setUser)
  }, [])

  const connect = async () => {
    try {
      await fcl.authenticate()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const disconnect = async () => {
    try {
      await fcl.unauthenticate()
      setHasProfile(false)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const isConnected = !!user?.addr

  const value: FCLContextType = {
    user,
    isConnected,
    connect,
    disconnect,
    hasProfile,
    setHasProfile
  }

  return (
    <FCLContext.Provider value={value}>
      {children}
    </FCLContext.Provider>
  )
}

