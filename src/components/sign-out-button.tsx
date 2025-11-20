'use client'

import { signOutAction } from './sign-out-action'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm" className="w-full">
        Se déconnecter
      </Button>
    </form>
  )
}

