"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Edit3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CaplingNameEditorProps {
  currentName: string
  onNameUpdate: (newName: string) => void
  userId: string
}

export function CaplingNameEditor({ currentName, onNameUpdate, userId }: CaplingNameEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Capling name cannot be empty",
        variant: "destructive"
      })
      return
    }

    if (name.length > 50) {
      toast({
        title: "Error", 
        description: "Capling name must be 50 characters or less",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/update-capling-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          caplingName: name.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Capling name')
      }

      onNameUpdate(data.caplingName)
      setIsOpen(false)
      
      toast({
        title: "Success",
        description: `Your Capling is now named "${data.caplingName}"!`,
      })
    } catch (error) {
      console.error('Error updating Capling name:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update Capling name",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(currentName)
    setIsOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 p-0"
      >
        <Edit3 className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Your Capling</DialogTitle>
            <DialogDescription>
              Give your financial advisor a personalized name!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capling-name">Capling Name</Label>
              <Input
                id="capling-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for your Capling"
                maxLength={50}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50 characters
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Name"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}