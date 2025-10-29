'use client'

import { useState, useCallback } from 'react'
import { useMockData } from './use-mock-data'

// Demo mode that uses mock data but simulates user authentication
export function useDemoData() {
  const mockData = useMockData()
  const [demoUser] = useState({
    id: 'demo-user',
    email: 'demo@capling.app',
    user_metadata: {
      full_name: 'Demo User'
    }
  })

  // Override the mock data to work in demo mode
  return {
    ...mockData,
    user: demoUser,
    loading: false,
    error: null,
    // Demo mode specific functions
    isDemoMode: true,
    createTransaction: async (transactionData: any) => {
      // In demo mode, we can still use the mock data system
      return await mockData.createTransaction('demo-account', transactionData)
    }
  }
}
