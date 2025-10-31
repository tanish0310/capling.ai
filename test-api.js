// Test script for the Capling API system
// Run this in your browser console at http://localhost:3000

// First, let's get your user ID
function getUserID() {
  try {
    // Try to get from localStorage
    const authData = localStorage.getItem('supabase.auth.token')
    if (authData) {
      const parsed = JSON.parse(authData)
      console.log('🔍 Found auth data:', parsed)
      return parsed.currentSession?.user?.id
    }
    
    // Alternative: check if user ID is displayed in the page
    const userIDElement = document.querySelector('[data-user-id]')
    if (userIDElement) {
      return userIDElement.dataset.userId
    }
    
    console.log('❌ Could not find user ID automatically')
    console.log('💡 Please check the header of your app - your user ID should be displayed there')
    return null
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

async function testTransactionAPI() {
  console.log('🧪 Testing Capling API System...')
  
  // Get user ID first
  const userId = getUserID()
  if (!userId) {
    console.log('❌ Please provide your user ID manually')
    console.log('💡 Look at the header of your app - your user ID is displayed there')
    return
  }
  
  console.log('✅ Using user ID:', userId)
  
  // Test 1: Single Transaction
  console.log('\n1️⃣ Testing single transaction...')
  try {
    const response = await fetch('/api/process-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId, // Use the actual user ID
          merchant: 'Test Coffee Shop',
          amount: 4.50,
          category: 'dining',
          description: 'Morning coffee'
        })
    })
    
    const result = await response.json()
    console.log('✅ Single transaction result:', result)
  } catch (error) {
    console.error('❌ Single transaction failed:', error)
  }
  
  // Test 2: Fake Bank API
  console.log('\n2️⃣ Testing fake bank API...')
  try {
    const response = await fetch('/api/fake-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant: 'Test Store',
        amount: 25.99,
        category: 'shopping',
        description: 'Test purchase',
        accountNumber: '1234',
        routingNumber: '123456789'
      })
    })
    
    const result = await response.json()
    console.log('✅ Fake bank result:', result)
  } catch (error) {
    console.error('❌ Fake bank test failed:', error)
  }
  
  // Test 3: Transaction Simulation
  console.log('\n3️⃣ Testing transaction simulation...')
  try {
    const response = await fetch('/api/simulate-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId, // Use the actual user ID
          count: 3,
          incomeLevel: 'medium',
          timeRange: 'day'
        })
    })
    
    const result = await response.json()
    console.log('✅ Simulation result:', result)
   } catch (error) {
    console.error('❌ Simulation test failed:', error)
  }
  
  console.log('\n🎉 API testing complete!')
}

// Run the tests
testTransactionAPI()