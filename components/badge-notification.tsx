'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Confetti } from './confetti'

interface BadgeNotificationProps {
  badge: {
    id: string
    title: string
    description: string
    emoji: string
    earned: boolean
  }
  show: boolean
  onComplete: () => void
}

export function BadgeNotification({ badge, show, onComplete }: BadgeNotificationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    console.log('🔔 BadgeNotification useEffect - show:', show, 'badge:', badge?.title)
    if (show) {
      setVisible(true)
    }
  }, [show, badge])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onComplete, 500) // Wait for animation to complete
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only dismiss if clicking on the backdrop, not the card
    if (e.target === e.currentTarget) {
      handleDismiss()
    }
  }

  if (!show || !visible) return null

  return (
    <>
      <Confetti show={show} />
      <div 
        className="fixed inset-0 z-40 flex items-center justify-center p-4 cursor-pointer"
        onClick={handleBackdropClick}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <Card className="relative z-10 p-8 max-w-md mx-auto text-center animate-in zoom-in-95 duration-500 cursor-default">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="space-y-4">
            <div className="text-6xl animate-bounce">
              {badge.emoji}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                🎉 Badge Earned! 🎉
              </h3>
              <h4 className="text-xl font-semibold text-primary mb-2">
                {badge.title}
              </h4>
              <p className="text-muted-foreground">
                {badge.description}
              </p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              Achievement Unlocked!
            </Badge>
            
            {/* Dismiss Button */}
            <div className="pt-2">
              <Button 
                onClick={handleDismiss}
                variant="outline"
                className="w-full"
              >
                Awesome! 🎉
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}