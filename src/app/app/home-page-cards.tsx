'use client'

import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckSquare, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function MyTasksCard() {
  const t = useTranslations('home')
  const router = useRouter()

  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardHeader
        className="pb-2"
        primaryAction={{
          icon: ArrowRight,
          onClick: () => {
            router.push('/app/tasks')
          },
          label: t('viewAll'),
        }}
      >
        <div className="flex flex-row items-center">
          <CheckSquare className="h-4 w-4 text-muted-foreground mr-2" />
          <CardTitle className="text-sm font-medium">{t('myTasks')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">0</div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('assignedTasks')}
        </p>
      </CardContent>
    </Card>
  )
}

export function MyTasksSummaryCard() {
  const t = useTranslations('home')
  const router = useRouter()

  return (
    <Card className="border-border/50">
      <CardHeader
        primaryAction={{
          icon: ArrowRight,
          onClick: () => {
            router.push('/app/tasks')
          },
          label: t('viewAllTasks'),
        }}
      >
        <CardTitle className="text-lg">{t('myTasksTitle')}</CardTitle>
        <CardDescription>
          {t('myTasksDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            {t('noAssignedTasks')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

