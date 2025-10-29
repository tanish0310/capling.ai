#!/usr/bin/env node

/**
 * Setup script for Capling app environment variables
 * This script helps users configure their Nessie API integration
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function setupEnvironment() {
  console.log('🌱 Welcome to Capling Setup!')
  console.log('This script will help you configure your Nessie API integration.\n')
  
  console.log('📦 First, make sure you have installed dependencies:')
  console.log('   npm install --legacy-peer-deps\n')

  console.log('First, you need to get your Nessie API key:')
  console.log('1. Visit: http://api.nessieisreal.com/')
  console.log('2. Sign in with GitHub')
  console.log('3. Go to your profile to get your API key\n')

  const apiKey = await question('Enter your Nessie API key: ')
  
  if (!apiKey.trim()) {
    console.log('❌ API key is required. Please run the script again.')
    rl.close()
    return
  }

  const customerId = await question('Enter your customer ID (optional, press Enter to skip): ')

  const envContent = `# Nessie API Configuration
# Get your API key from: http://api.nessieisreal.com/
NEXT_PUBLIC_NESSIE_API_KEY=${apiKey.trim()}

# Optional: Default customer ID for development
${customerId.trim() ? `NEXT_PUBLIC_DEFAULT_CUSTOMER_ID=${customerId.trim()}` : '# NEXT_PUBLIC_DEFAULT_CUSTOMER_ID=your_customer_id_here'}
`

  const envPath = path.join(process.cwd(), '.env.local')
  
  try {
    fs.writeFileSync(envPath, envContent)
    console.log('\n✅ Environment variables configured successfully!')
    console.log(`📁 Created: ${envPath}`)
    console.log('\n🚀 You can now run: npm run dev')
  } catch (error) {
    console.log('\n❌ Error creating .env.local file:', error.message)
    console.log('Please create the file manually with the following content:')
    console.log('\n' + envContent)
  }

  rl.close()
}

setupEnvironment().catch(console.error)
