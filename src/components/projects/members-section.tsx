'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useProjectMembers } from '@/hooks/use-project-members'
import { updateMemberRole, removeProjectMember, ProjectMemberRole } from '@/lib/actions/members'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AddMemberDialog } from './add-member-dialog'
import { Users, UserPlus, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MembersSectionProps {
  projectId: string
  currentUserId: string
  isAdmin: boolean
}

export function MembersSection({ projectId, currentUserId, isAdmin }: MembersSectionProps) {
  const t = useTranslations('projects.settings.members')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { members, internalMembers, clientMembers, loading, error, refetch } =
    useProjectMembers(projectId)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const getRoleLabel = (role: ProjectMemberRole) => {
    switch (role) {
      case 'project_admin':
        return t('roleAdmin')
      case 'project_participant':
        return t('roleParticipant')
      case 'project_client':
        return t('roleClient')
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role: ProjectMemberRole) => {
    switch (role) {
      case 'project_admin':
        return 'default'
      case 'project_participant':
        return 'secondary'
      case 'project_client':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleRoleChange = async (userId: string, newRole: ProjectMemberRole) => {
    setUpdatingUserId(userId)
    try {
      const result = await updateMemberRole({
        project_id: projectId,
        user_id: userId,
        role: newRole,
      })

      if (result.error) {
        alert(result.error) // TODO: Utiliser un toast
      } else {
        await refetch()
        router.refresh()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : tCommon('error')) // TODO: Utiliser un toast
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleRemove = async (userId: string) => {
    setRemovingUserId(userId)
    try {
      const result = await removeProjectMember({
        project_id: projectId,
        user_id: userId,
      })

      if (result.error) {
        alert(result.error) // TODO: Utiliser un toast
      } else {
        await refetch()
        router.refresh()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : tCommon('error')) // TODO: Utiliser un toast
    } finally {
      setRemovingUserId(null)
    }
  }

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName[0].toUpperCase()
    }
    if (lastName) {
      return lastName[0].toUpperCase()
    }
    return email[0].toUpperCase()
  }

  const getFullName = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    if (firstName) {
      return firstName
    }
    if (lastName) {
      return lastName
    }
    return email
  }

  const canRemoveMember = (member: typeof internalMembers[0] | typeof clientMembers[0]) => {
    if (!isAdmin) return false
    if (member.user_id === currentUserId) {
      // Vérifier s'il y a au moins un autre admin
      const otherAdmins = members.filter(
        (m) => m.role === 'project_admin' && m.user_id !== currentUserId
      )
      return otherAdmins.length > 0
    }
    // Vérifier si c'est le dernier admin
    if (member.role === 'project_admin') {
      const otherAdmins = members.filter(
        (m) => m.role === 'project_admin' && m.user_id !== member.user_id
      )
      return otherAdmins.length > 0
    }
    return true
  }

  const canChangeRole = (member: typeof internalMembers[0] | typeof clientMembers[0]) => {
    if (!isAdmin) return false
    if (member.user_id === currentUserId && member.role === 'project_admin') {
      // Vérifier s'il y a au moins un autre admin avant de permettre le changement
      const otherAdmins = members.filter(
        (m) => m.role === 'project_admin' && m.user_id !== currentUserId
      )
      return otherAdmins.length > 0
    }
    return true
  }

  const renderMemberRow = (
    member: typeof internalMembers[0] | typeof clientMembers[0]
  ) => {
    const fullName = getFullName(member.user.first_name, member.user.last_name, member.user.email)
    const initials = getInitials(member.user.first_name, member.user.last_name, member.user.email)
    const isUpdating = updatingUserId === member.user_id
    const isRemoving = removingUserId === member.user_id

    return (
      <div
        key={member.id}
        className="flex items-center justify-between gap-4 rounded-lg border p-4"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar>
            <AvatarImage src={member.user.avatar || undefined} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{fullName}</div>
            <div className="text-sm text-muted-foreground truncate">{member.user.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Select
              value={member.role}
              onValueChange={(v) => handleRoleChange(member.user_id, v as ProjectMemberRole)}
              disabled={!canChangeRole(member) || isUpdating || isRemoving}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project_admin">{t('roleAdmin')}</SelectItem>
                <SelectItem value="project_participant">{t('roleParticipant')}</SelectItem>
                <SelectItem value="project_client">{t('roleClient')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={getRoleBadgeVariant(member.role)}>{getRoleLabel(member.role)}</Badge>
          )}

          {isAdmin && canRemoveMember(member) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(member.user_id)}
              disabled={isRemoving || isUpdating}
              className="text-destructive hover:text-destructive"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                {t('title')}
              </CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setAddDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('addMember')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section Collaborateurs internes */}
          <div>
            <h3 className="text-sm font-medium mb-3">{t('internalMembers')}</h3>
            {internalMembers.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                {t('noInternalMembers')}
              </div>
            ) : (
              <div className="space-y-2">
                {internalMembers.map(renderMemberRow)}
              </div>
            )}
          </div>

          {/* Section Collaborateurs clients */}
          <div>
            <h3 className="text-sm font-medium mb-3">{t('clientMembers')}</h3>
            {clientMembers.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                {t('noClientMembers')}
              </div>
            ) : (
              <div className="space-y-2">
                {clientMembers.map(renderMemberRow)}
              </div>
            )}
          </div>

          {!isAdmin && (
            <div className="text-xs text-muted-foreground pt-2">
              {t('onlyAdminsCanManage')}
            </div>
          )}
        </CardContent>
      </Card>

      <AddMemberDialog
        projectId={projectId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={refetch}
      />
    </>
  )
}

