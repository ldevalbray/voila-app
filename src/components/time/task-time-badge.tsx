'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { formatDuration } from '@/lib/time-utils'
import { getTotalTimeByTaskId } from '@/lib/actions/time-entries'

interface TaskTimeBadgeProps {
  taskId: string
}

export function TaskTimeBadge({ taskId }: TaskTimeBadgeProps) {
  const [totalMinutes, setTotalMinutes] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTotalTime = async () => {
      setIsLoading(true)
      const result = await getTotalTimeByTaskId(taskId)
      setTotalMinutes(result.data || 0)
      setIsLoading(false)
    }

    loadTotalTime()
  }, [taskId])

  if (isLoading || totalMinutes === null || totalMinutes === 0) {
    return null
  }

  return (
    <Badge variant="outline" className="text-xs flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {formatDuration(totalMinutes)}
    </Badge>
  )
}

