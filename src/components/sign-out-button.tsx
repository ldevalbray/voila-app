'use client'

import { signOutAction } from './sign-out-action'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function SignOutButton() {
  const t = useTranslations('ui')
  return (
    <form action={signOutAction}>
      <Button 
        type="submit" 
        variant="ghost" 
        size="sm" 
        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        {t('logout')}
      </Button>
    </form>
  )
}

