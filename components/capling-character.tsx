"use client"

import { cn } from "@/lib/utils"

type CaplingMood = "happy" | "neutral" | "worried" | "sad"

interface CaplingCharacterProps {
  mood: CaplingMood
  className?: string
}

function DinosaurSVG({ mood }: { mood: CaplingMood }) {
  const getEyeExpression = () => {
    switch (mood) {
      case "happy":
        return (
          <>
            <circle cx="35" cy="45" r="4" fill="#2d3748" />
            <circle cx="65" cy="45" r="4" fill="#2d3748" />
            <circle cx="36" cy="44" r="1.5" fill="white" />
            <circle cx="66" cy="44" r="1.5" fill="white" />
          </>
        )
      case "neutral":
        return (
          <>
            <circle cx="35" cy="45" r="3.5" fill="#2d3748" />
            <circle cx="65" cy="45" r="3.5" fill="#2d3748" />
          </>
        )
      case "worried":
        return (
          <>
            <ellipse cx="35" cy="47" rx="4" ry="3" fill="#2d3748" />
            <ellipse cx="65" cy="47" rx="4" ry="3" fill="#2d3748" />
          </>
        )
      case "sad":
        return (
          <>
            <path d="M 33 48 Q 35 46 37 48" stroke="#2d3748" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 63 48 Q 65 46 67 48" stroke="#2d3748" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )
    }
  }

  const getMouthExpression = () => {
    switch (mood) {
      case "happy":
        return <path d="M 35 60 Q 50 70 65 60" stroke="#2d3748" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      case "neutral":
        return <line x1="38" y1="62" x2="62" y2="62" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
      case "worried":
        return <path d="M 35 65 Q 50 62 65 65" stroke="#2d3748" strokeWidth="2" fill="none" strokeLinecap="round" />
      case "sad":
        return <path d="M 35 65 Q 50 58 65 65" stroke="#2d3748" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    }
  }

  return (
    <svg viewBox="0 0 100 120" className="w-full h-full text-ring">
      {/* Body */}
      <ellipse cx="50" cy="75" rx="35" ry="30" fill="#4ade80" />

      {/* Head */}
      <circle cx="50" cy="40" r="28" fill="#4ade80" />

      {/* Belly spot */}
      <ellipse cx="50" cy="78" rx="22" ry="18" fill="#86efac" opacity="0.6" />

      {/* Spikes on back */}
      <path d="M 30 70 L 25 60 L 30 65 Z" fill="#22c55e" />
      <path d="M 40 72 L 37 60 L 42 68 Z" fill="#22c55e" />
      <path d="M 50 73 L 48 60 L 52 70 Z" fill="#22c55e" />
      <path d="M 60 72 L 58 60 L 63 68 Z" fill="#22c55e" />
      <path d="M 70 70 L 68 60 L 73 65 Z" fill="#22c55e" />

      {/* Arms */}
      <ellipse cx="22" cy="70" rx="8" ry="12" fill="#4ade80" />
      <ellipse cx="78" cy="70" rx="8" ry="12" fill="#4ade80" />

      {/* Feet */}
      <ellipse cx="38" cy="100" rx="10" ry="8" fill="#4ade80" />
      <ellipse cx="62" cy="100" rx="10" ry="8" fill="#4ade80" />

      {/* Tail */}
      <path d="M 80 80 Q 95 85 92 95" stroke="#4ade80" strokeWidth="12" fill="none" strokeLinecap="round" />

      {/* Cheeks */}
      {mood === "happy" && (
        <>
          <circle className="opacity-100" cx="25" cy="50" r="5" fill="#fb923c" opacity="0.4" />
          <circle cx="75" cy="50" r="5" fill="#fb923c" opacity="0.4" />
        </>
      )}

      {/* Eyes */}
      {getEyeExpression()}

      {/* Mouth */}
      {getMouthExpression()}

      {/* Nostrils */}
      <circle cx="45" cy="52" r="1.5" fill="#2d3748" opacity="0.6" />
      <circle cx="55" cy="52" r="1.5" fill="#2d3748" opacity="0.6" />
    </svg>
  )
}

export function CaplingCharacter({ mood, className }: CaplingCharacterProps) {
  const getMoodColor = () => {
    switch (mood) {
      case "happy":
        return "from-green-400 to-emerald-500"
      case "neutral":
        return "from-blue-400 to-cyan-500"
      case "worried":
        return "from-yellow-400 to-orange-500"
      case "sad":
        return "from-red-400 to-pink-500"
      default:
        return "from-green-400 to-emerald-500"
    }
  }

  const getMoodEmoji = () => {
    switch (mood) {
      case "happy":
        return "😊"
      case "neutral":
        return "😐"
      case "worried":
        return "😟"
      case "sad":
        return "😢"
      default:
        return "😊"
    }
  }

  const getMoodMessage = () => {
    switch (mood) {
      case "happy":
        return "Great job! Keep it up!"
      case "neutral":
        return "You're doing okay!"
      case "worried":
        return "Let's be more careful!"
      case "sad":
        return "We can do better!"
      default:
        return "Great job! Keep it up!"
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div
        className={cn(
          "relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl transition-all duration-700 p-12 border-4 border-white/20",
          getMoodColor(),
        )}
      >
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-full blur-xl opacity-30 transition-all duration-700",
          getMoodColor()
        )} />
        
        {/* Character */}
        <div className="relative z-10 animate-bounce-subtle scale-90">
          <DinosaurSVG mood={mood} />
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-foreground">Capling</h3>
        <p className="text-base font-medium text-muted-foreground">
          {getMoodMessage()}
        </p>
      </div>
    </div>
  )
}
