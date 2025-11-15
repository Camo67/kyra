'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Sign in to Kira
        </h1>
        <p className="text-muted-foreground text-sm">
          Connect with Google to sync your provider credentials and chat history.
        </p>
        <Button
          className="w-full"
          onClick={() => signIn('google', { callbackUrl: '/' })}
        >
          Continue with Google
        </Button>
      </div>
    </div>
  )
}
