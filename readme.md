# Capling - AI-Powered Personal Finance Companion 

**A gamified personal finance app featuring an AI-powered dinosaur companion that analyzes your spending and helps you build better financial habits.**

## What Makes This Special

### **AI-Powered Financial Analysis**
- **Gemini 2.0 flash Integration**: Every transaction gets analyzed by AI for responsible vs. irresponsible spending
- **Smart Insights**: Real-time feedback on your financial decisions
- **Context-Aware**: AI understands the difference between "emergency vet bill" vs "impulse shopping"

### **Gamified Experience**
- **Capling Character**: Your personal dinosaur companion that reacts to your spending
- **Happiness Streak**: Tracks consecutive days of good financial behavior
- **Level System**: Capling evolves and levels up based on your progress
- **Achievement Badges**: Unlock rewards for good financial habits

### **Smart Features**
- **Automatic Budget Adjustment**: AI adjusts your budget when you justify overspending
- **Real-time Mood Tracking**: Capling's mood reflects your financial health
- **Personalized Lessons**: AI-generated daily financial education
- **Transaction Justification**: Explain questionable purchases to AI

## Tech Stack

**Frontend:**
- Next.js 15.2.4 + TypeScript
- Tailwind CSS v4.1.14
- Radix UI + Lucide React

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL)

**Auth/Storage:**
- Supabase Auth
- Supabase Database
- Real-time subscriptions

**AI:**
- Google Gemini 2.0 flash
- Custom LLM analyzer

## Key Features

- **Secure Authentication** - Supabase Auth with JWT tokens
- **Real-time Dashboard** - Live spending analysis and budget tracking
- **AI Transaction Analysis** - Gemini classifies every purchase
- **Gamified Progress** - Happiness streaks and level progression
- **Smart Budgeting** - AI adjusts budgets based on justified spending
- **Personalized Learning** - AI-generated financial lessons
- **Achievement System** - Badges for good financial habits

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
npm run setup-gemini
npm run setup-supabase

# Start Supabase (local development)
supabase start
supabase db reset

# Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see Capling in action!

## How It Works

1. **Sign up** and meet Capling, your financial companion
2. **Add transactions** and watch AI analyze your spending
3. **Build your happiness streak** by making responsible financial decisions
4. **Level up Capling** as you develop better habits
5. **Learn** from personalized AI-generated financial lessons

## Environment Setup

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | OpenAI API key for GPT analysis | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

## Demo

Try these example transactions to see AI analysis in action:

- **Responsible**: "Whole Foods - $45" (groceries)
- **Borderline**: "Starbucks - $6.50" (coffee)  
- **Impulsive**: "Amazon - $150" (shopping)
- **Context Test**: "Emergency doc bill - $300" vs "New shoes - $300"

---

**Built for better financial habits**
