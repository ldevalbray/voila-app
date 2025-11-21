'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/lib/projects'
import { Client } from '@/lib/clients'
import { updateProjectClient } from '@/lib/actions/projects'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { MembersSection } from '@/components/projects/members-section'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'

interface SettingsPageClientProps {
  projectId: string
  project: Project
  clients: Client[]
  currentUserId: string
  isAdmin: boolean
}

export function SettingsPageClient({
  projectId,
  project,
  clients,
  currentUserId,
  isAdmin,
}: SettingsPageClientProps) {
  const t = useTranslations('projects.settings')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const NONE_CLIENT_VALUE = '__none__'
  const [selectedClientId, setSelectedClientId] = useState<string>(
    project.client_id || NONE_CLIENT_VALUE
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general')

  useEffect(() => {
    setSelectedClientId(project.client_id || NONE_CLIENT_VALUE)
  }, [project.client_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateProjectClient({
        project_id: projectId,
        client_id: selectedClientId === NONE_CLIENT_VALUE ? null : selectedClientId,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Recharger la page pour mettre à jour les données
        router.refresh()
        // Réinitialiser le message de succès après 3 secondes
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentClient = clients.find((c) => c.id === project.client_id)

  return (
    <div>
      {/* SegmentedControl aligné avec Global/Project */}
      <div className="w-full mb-6">
        <SegmentedControl
          options={[
            { value: 'general', label: t('generalTab') },
            { value: 'members', label: t('membersTab') },
          ]}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'general' | 'members')}
          className="w-full"
        />
      </div>

      {/* Contenu conditionnel */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">{t('clientSection')}</CardTitle>
              </div>
              <CardDescription>{t('clientSectionDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400">
                    {t('clientUpdatedSuccess')}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="client">{t('client')}</Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder={t('selectClient')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_CLIENT_VALUE}>
                        <span className="text-muted-foreground">
                          {t('noClient')}
                        </span>
                      </SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentClient && (
                    <p className="text-xs text-muted-foreground">
                      {t('currentClient')}: <strong>{currentClient.name}</strong>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('clientHint')}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="default"
                  >
                    {isSubmitting ? tCommon('saving') : tCommon('save')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <MembersSection
            projectId={projectId}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  )
}

