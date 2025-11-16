'use client'

import { useEffect, useState } from 'react'

interface Star {
  id: number
  x: number
  y: number
  size: number
  animationDelay: number
  animationClass: string
}

export function StarsBackground() {
  const [stars, setStars] = useState<Star[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Generate random stars
    const starCount = 80 // More stars for better visibility
    const animationClasses = [
      'animate-twinkle',
      'animate-twinkle-delayed-1',
      'animate-twinkle-delayed-2',
      'animate-twinkle-delayed-3'
    ]

    const newStars = Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 3, // 3-7px stars (even larger for testing)
      animationDelay: Math.random() * 6, // Random delay up to 6 seconds
      animationClass: animationClasses[Math.floor(Math.random() * animationClasses.length)]
    }))

    setStars(newStars)
    setIsLoaded(true)
  }, [])
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {isLoaded && stars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full ${star.animationClass}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.animationDelay}s`,
            opacity: 1.0,
            backgroundColor: '#a855f7', // Bright purple for testing
            boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)'
          }}
        />
      ))}
    </div>
  )
}
