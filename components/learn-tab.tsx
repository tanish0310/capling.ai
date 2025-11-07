'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, History, Loader2, AlertCircle, GraduationCap, Lightbulb } from 'lucide-react'
import { useLessons, Lesson } from '@/hooks/use-lessons'
import { LessonCard } from './lesson-card'

export function LearnTab() {
  const { 
    lessons, 
    loading, 
    error, 
    generating, 
    hasTodaysLesson, 
    getTodaysLesson 
  } = useLessons()
  
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)

  // Auto-expand today's lesson if it exists
  useEffect(() => {
    const todaysLesson = getTodaysLesson()
    if (todaysLesson) {
      setExpandedLessonId(todaysLesson.id)
    }
  }, [lessons, getTodaysLesson])


  const handleLessonToggle = (lessonId: string) => {
    setExpandedLessonId(expandedLessonId === lessonId ? null : lessonId)
  }

  const todaysLesson = getTodaysLesson()
  const hasToday = hasTodaysLesson()

  // Group lessons by type for the tabs
  const tips = lessons.filter(lesson => lesson.lesson_type === 'tip')
  const vocabulary = lessons.filter(lesson => lesson.lesson_type === 'vocabulary')
  const concepts = lessons.filter(lesson => lesson.lesson_type === 'concept')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your lessons...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <span className="ml-2 text-destructive">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Learn
          </h2>
          <p className="text-muted-foreground">
            Daily financial literacy lessons to help you make smarter money decisions
          </p>
        </div>
        
        {generating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating today's lesson...
          </div>
        )}
      </div>

      {/* Today's Lesson Highlight */}
      {todaysLesson ? (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-primary">Today's Lesson</CardTitle>
              <Badge className="bg-primary text-primary-foreground">New</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <LessonCard 
              lesson={todaysLesson} 
              isExpanded={expandedLessonId === todaysLesson.id}
              onToggle={() => handleLessonToggle(todaysLesson.id)}
            />
          </CardContent>
        </Card>
      ) : generating ? (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-primary">Today's Lesson</CardTitle>
              <Badge className="bg-primary text-primary-foreground">Generating</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center gap-3 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">Creating your personalized lesson...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Lessons Tabs */}
      {lessons.length > 0 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              All ({lessons.length})
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2">
              💡 Tips ({tips.length})
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="flex items-center gap-2">
              📚 Terms ({vocabulary.length})
            </TabsTrigger>
            <TabsTrigger value="concepts" className="flex items-center gap-2">
              🎓 Concepts ({concepts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                isExpanded={expandedLessonId === lesson.id}
                onToggle={() => handleLessonToggle(lesson.id)}
              />
            ))}
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            {tips.length > 0 ? (
              tips.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isExpanded={expandedLessonId === lesson.id}
                  onToggle={() => handleLessonToggle(lesson.id)}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tips yet. Generate your first lesson!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vocabulary" className="space-y-4">
            {vocabulary.length > 0 ? (
              vocabulary.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isExpanded={expandedLessonId === lesson.id}
                  onToggle={() => handleLessonToggle(lesson.id)}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No vocabulary lessons yet. Generate your first lesson!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="concepts" className="space-y-4">
            {concepts.length > 0 ? (
              concepts.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isExpanded={expandedLessonId === lesson.id}
                  onToggle={() => handleLessonToggle(lesson.id)}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No concept lessons yet. Generate your first lesson!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Preparing Your First Lesson</h3>
            <p className="text-muted-foreground mb-6">
              We're generating your personalized financial literacy lesson. This will appear automatically each day to help you make smarter money decisions.
            </p>
            {generating && (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating your lesson...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}