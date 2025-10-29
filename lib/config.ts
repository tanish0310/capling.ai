// Configuration for Capling app
export const config = {
  nessie: {
    apiKey: process.env.NEXT_PUBLIC_NESSIE_API_KEY || '',
    baseUrl: 'http://api.nessieisreal.com',
    defaultCustomerId: process.env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID || '',
  },
  app: {
    weeklyBudget: 500, // Default weekly budget
    currency: 'USD',
  }
}

// Mock data system - no API key needed
// The app now uses realistic mock data instead of external APIs
