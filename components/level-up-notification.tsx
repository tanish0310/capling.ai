"use client"

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, Star } from 'lucide-react'

interface LevelUpNotificationProps {
  isVisible: boolean
  newLevel: number
  previousLevel: number
  onClose: () => void
}

export function LevelUpNotification({ isVisible, newLevel, previousLevel, onClose }: LevelUpNotificationProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true)
      const timer = setTimeout(() => {
        setShowAnimation(false)
        setTimeout(onClose, 500) // Wait for animation to complete
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop glow */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20",
        "animate-pulse"
      )} />
      
      {/* Main notification */}
      <div className={cn(
        "relative bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow-2xl",
        "transform transition-all duration-500",
        showAnimation 
          ? "scale-100 opacity-100 translate-y-0" 
          : "scale-75 opacity-0 translate-y-4"
      )}>
        {/* Sparkle effects */}
        <div className="absolute -top-2 -right-2">
          <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
        </div>
        <div className="absolute -bottom-2 -left-2">
          <Star className="h-5 w-5 text-yellow-300 animate-pulse" />
        </div>
        <div className="absolute top-1/2 -left-3">
          <Sparkles className="h-4 w-4 text-yellow-300 animate-bounce" />
        </div>
        <div className="absolute top-1/4 -right-3">
          <Star className="h-3 w-3 text-yellow-300 animate-ping" />
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <div className="text-6xl font-bold animate-bounce">
            🎉
          </div>
          <h2 className="text-3xl font-bold">
            Level Up!
          </h2>
          <div className="text-xl">
            <span className="text-yellow-300 font-semibold">Level {previousLevel}</span>
            <span className="mx-2">→</span>
            <span className="text-yellow-300 font-bold text-2xl">Level {newLevel}</span>
          </div>
          <p className="text-purple-100 text-lg">
            Capling is getting stronger! 💪
          </p>
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 opacity-30 blur-xl -z-10" />
      </div>
    </div>
  )
}