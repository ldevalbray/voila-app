'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDuration } from '@/lib/time-utils'
import { getBillingStatsAction } from '@/lib/actions/billing-stats'
import { calculateBillingCoverage, formatBilledMinutes } from '@/lib/billing-utils'
import NextLink from 'next/link'

interface BillingSummaryWidgetProps {
  projectId: string
  compact?: boolean
}

export function BillingSummaryWidget({
  projectId,
  compact = false,
}: BillingSummaryWidgetProps) {
  const t = useTranslations('projects.billing')
  const [stats, setStats] = useState<{
    total_logged_minutes: number
    total_billed_minutes: number
    unbilled_minutes: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const result = await getBillingStatsAction(projectId)
        if (result.error) {
          console.error('Error loading billing stats:', result.error)
        } else {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Error loading billing stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [projectId])

  if (isLoading || !stats) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </CardContent>
      </Card>
    )
  }

  const coverage = calculateBillingCoverage(
    stats.total_logged_minutes,
    stats.total_billed_minutes
  )

  if (compact) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('unbilled')}
              </span>
              <span className="text-lg font-semibold">
                {formatDuration(stats.unbilled_minutes)}
              </span>
            </div>
            <NextLink href={`/app/projects/${projectId}/invoices`}>
              <Button variant="outline" size="sm" className="w-full">
                <Link className="mr-2 h-4 w-4" />
                {t('viewInvoices')}
              </Button>
            </NextLink>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">{t('summary')}</CardTitle>
        <CardDescription>{t('summaryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('totalLogged')}
            </span>
            <span className="text-lg font-semibold">
              {formatDuration(stats.total_logged_minutes)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('totalBilled')}
            </span>
            <span className="text-lg font-semibold">
              {formatBilledMinutes(stats.total_billed_minutes)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('unbilled')}
            </span>
            <span className="text-lg font-semibold">
              {formatDuration(stats.unbilled_minutes)}
            </span>
          </div>
          {coverage !== null && (
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm text-muted-foreground">
                {t('coverage')}
              </span>
              <span className="text-lg font-semibold">
                {coverage.toFixed(1)}%
              </span>
            </div>
          )}
          <div className="pt-2 border-t">
            <NextLink href={`/app/projects/${projectId}/invoices`}>
              <Button variant="outline" size="sm" className="w-full">
                <Link className="mr-2 h-4 w-4" />
                {t('viewInvoices')}
              </Button>
            </NextLink>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

