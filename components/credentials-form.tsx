'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { AUTH_DISABLED } from '@/lib/auth-config'

interface CredentialPayload {
  geminiApiKey: string
  huggingfaceApiKey: string
  groqApiKey: string
  openaiApiKey: string
  anthropicApiKey: string
  perplexityApiKey: string
  notionToken: string
}

const defaultPayload: CredentialPayload = {
  geminiApiKey: '',
  huggingfaceApiKey: '',
  groqApiKey: '',
  openaiApiKey: '',
  anthropicApiKey: '',
  perplexityApiKey: '',
  notionToken: '',
}

export default function CredentialsForm() {
  const { status } = useSession()
  const isAuthenticated = AUTH_DISABLED || status === 'authenticated'
  const [formState, setFormState] = useState<CredentialPayload>(defaultPayload)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchCredentials = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/credentials')
        if (!response.ok) throw new Error('Unable to load credentials')
        const data = await response.json()
        setFormState({
          geminiApiKey: data.geminiApiKey || '',
          huggingfaceApiKey: data.huggingfaceApiKey || '',
          groqApiKey: data.groqApiKey || '',
          openaiApiKey: data.openaiApiKey || '',
          anthropicApiKey: data.anthropicApiKey || '',
          perplexityApiKey: data.perplexityApiKey || '',
          notionToken: data.notionToken || '',
        })
      } catch (error) {
        console.error(error)
        setMessage('Could not load saved credentials.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCredentials()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to connect your provider credentials.
      </p>
    )
  }

  const handleChange = (
    field: keyof CredentialPayload,
    value: string,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      })
      if (!response.ok) {
        throw new Error('Failed to save credentials')
      }
      setMessage('Credentials updated')
    } catch (error) {
      console.error(error)
      setMessage('Unable to save credentials. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {AUTH_DISABLED && (
        <p className="text-xs text-muted-foreground">
          Authentication is disabled. Keys are stored in the shared demo profile.
        </p>
      )}
      {isLoading && (
        <p className="text-xs text-muted-foreground">
          Loading your saved keys...
        </p>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="gemini">
          Gemini API key
        </label>
        <input
          id="gemini"
          type="password"
          value={formState.geminiApiKey}
          onChange={(e) => handleChange('geminiApiKey', e.target.value)}
          placeholder="Enter your Google AI Studio key"
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="hf">
          Hugging Face token
        </label>
        <input
          id="hf"
          type="password"
          value={formState.huggingfaceApiKey}
          onChange={(e) => handleChange('huggingfaceApiKey', e.target.value)}
          placeholder="hf_..."
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="groq">
          Groq API key
        </label>
        <input
          id="groq"
          type="password"
          value={formState.groqApiKey}
          onChange={(e) => handleChange('groqApiKey', e.target.value)}
          placeholder="gsk_..."
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="openai">
          OpenAI API key
        </label>
        <input
          id="openai"
          type="password"
          value={formState.openaiApiKey}
          onChange={(e) => handleChange('openaiApiKey', e.target.value)}
          placeholder="sk-..."
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="anthropic">
          Anthropic API key
        </label>
        <input
          id="anthropic"
          type="password"
          value={formState.anthropicApiKey}
          onChange={(e) => handleChange('anthropicApiKey', e.target.value)}
          placeholder="sk-ant-..."
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="perplexity">
          Perplexity API key
        </label>
        <input
          id="perplexity"
          type="password"
          value={formState.perplexityApiKey}
          onChange={(e) => handleChange('perplexityApiKey', e.target.value)}
          placeholder="pplx-..."
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor="notion">
          Notion token (optional)
        </label>
        <input
          id="notion"
          type="password"
          value={formState.notionToken}
          onChange={(e) => handleChange('notionToken', e.target.value)}
          placeholder="secret_..."
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save credentials'}
      </Button>
    </form>
  )
}
