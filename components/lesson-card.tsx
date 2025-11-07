'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Lightbulb, GraduationCap, Target } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Lesson } from '@/hooks/use-lessons'

interface LessonCardProps {
  lesson: Lesson
  isExpanded?: boolean
  onToggle?: () => void
}

export function LessonCard({ lesson, isExpanded = false, onToggle }: LessonCardProps) {
  const [isOpen, setIsOpen] = useState(isExpanded)
  const [hasAwardedXP, setHasAwardedXP] = useState(false)
  const [isAwardingXP, setIsAwardingXP] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
    onToggle?.()
  }

  // Award XP when lesson is first opened (only once per lesson)
  useEffect(() => {
    if (isOpen && !hasAwardedXP && !isAwardingXP) {
      setIsAwardingXP(true)
      
      fetch('/api/mark-lesson-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: lesson.user_id,
          lessonId: lesson.id
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.xpAwarded) {
          setHasAwardedXP(true)
          console.log(`🎉 Awarded ${data.xpGained} XP for reading lesson: ${lesson.title}`)
        }
      })
      .catch(error => {
        console.error('Error awarding XP for lesson:', error)
      })
      .finally(() => {
        setIsAwardingXP(false)
      })
    }
  }, [isOpen, hasAwardedXP, isAwardingXP, lesson.id, lesson.user_id, lesson.title])

  const getLessonIcon = () => {
    switch (lesson.lesson_type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4" />
      case 'vocabulary':
        return <BookOpen className="h-4 w-4" />
      case 'concept':
        return <GraduationCap className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getLessonTypeColor = () => {
    switch (lesson.lesson_type) {
      case 'tip':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'vocabulary':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'concept':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyColor = () => {
    switch (lesson.difficulty_level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }


  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getLessonIcon()}
            <CardTitle className="text-lg">{lesson.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            {isOpen ? 'Show Less' : 'Read More'}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge className={getLessonTypeColor()}>
            {lesson.lesson_type.charAt(0).toUpperCase() + lesson.lesson_type.slice(1)}
          </Badge>
          <Badge className={getDifficultyColor()}>
            {lesson.difficulty_level.charAt(0).toUpperCase() + lesson.difficulty_level.slice(1)}
          </Badge>
          <Badge variant="outline">
            {lesson.topic}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {formatDate(lesson.created_at)}
        </p>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0">
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {lesson.content}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}