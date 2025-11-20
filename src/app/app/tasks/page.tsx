import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'

/**
 * Page "My tasks" globale (Internal mode)
 * Design moderne avec placeholder pour future table/board
 */
export default async function TasksPage() {
  const t = await getTranslations('tasks')
  
  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('newTask')}
        </Button>
      </div>

      {/* Content */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('tasksList')}</CardTitle>
          <CardDescription>
            {t('tasksListDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noTasks')}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {t('noTasksDescription')}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('createFirstTask')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

