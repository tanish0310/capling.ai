'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string
}

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const progressValue = value || 0
  const transformValue = 100 - progressValue
  
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'h-full w-full flex-1 transition-all',
          indicatorClassName || 'bg-primary'
        )}
        style={{ 
          transform: `translateX(-${transformValue}%)`,
          width: `${progressValue}%`
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
