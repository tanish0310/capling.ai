#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Capling OpenAI Setup');
console.log('======================');
console.log('');
console.log('This script will help you set up your OpenAI API key for Capling.');
console.log('Get your API key from: https://platform.openai.com/api-keys');
console.log('');

rl.question('Enter your OpenAI API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Exiting...');
    rl.close();
    return;
  }

  const envContent = `# OpenAI API Configuration
OPENAI_API_KEY=${apiKey.trim()}

# Optional: Override the model (defaults to gpt-3.5-turbo)
# OPENAI_MODEL=gpt-4
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('');
    console.log('✅ API key saved to .env.local');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Add some transactions to see GPT analysis in action!');
    console.log('');
    console.log('💡 Try these examples:');
    console.log('   - "Emergency vet bill - $300" (should be responsible)');
    console.log('   - "New gaming setup - $500" (should be impulsive)');
    console.log('   - "Grocery shopping - $120" (should be responsible)');
  } catch (error) {
    console.log('❌ Error saving API key:', error.message);
  }
  
  rl.close();
});
