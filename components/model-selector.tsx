'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_OLLAMA_ENDPOINT } from '@/lib/ollama'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

interface ModelOption {
  id: string
  name: string
  badge?: string
  isLocal?: boolean
}

const defaultModels: ModelOption[] = [
  { id: 'gemini-pro', name: 'Gemini Pro', badge: 'Google', isLocal: false },
  {
    id: 'hf-meta-llama-3.1-8b',
    name: 'Meta Llama 3.1 8B (HF)',
    badge: 'Hugging Face',
    isLocal: false,
  },
  {
    id: 'groq-llama3-8b',
    name: 'Groq Llama3 8B',
    badge: 'Groq',
    isLocal: false,
  },
  {
    id: 'openai-gpt-4o-mini',
    name: 'GPT-4o mini',
    badge: 'OpenAI',
    isLocal: false,
  },
  {
    id: 'anthropic-claude-35-sonnet',
    name: 'Claude 3.5 Sonnet',
    badge: 'Anthropic',
    isLocal: false,
  },
  {
    id: 'perplexity-sonar',
    name: 'Perplexity Sonar',
    badge: 'Perplexity',
    isLocal: false,
  },
]

export default function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [localModels, setLocalModels] = useState<ModelOption[]>([])
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [controlState, setControlState] = useState<{
    model: string
    action: 'start' | 'stop'
  } | null>(null)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [controlFeedback, setControlFeedback] = useState<{
    type: 'info' | 'error'
    text: string
  } | null>(null)

  const fetchLocalModels = useCallback(async () => {
    setIsLoadingLocal(true)
    setLocalError(null)
    try {
      const storedEndpoint =
        localStorage.getItem('localEndpoint') || DEFAULT_OLLAMA_ENDPOINT
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: storedEndpoint,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to reach local models endpoint')
      }

      const data = await response.json()
      const modelsFromOllama: ModelOption[] = Array.isArray(data?.models)
        ? data.models.map((model: { name: string }) => ({
            id: model.name,
            name: `${model.name} (Local)`,
            badge: 'Local',
            isLocal: true,
          }))
        : []

      setLocalModels(modelsFromOllama)
    } catch (error) {
      console.error('Failed to load local models', error)
      setLocalModels([])
      setLocalError(
        'Could not detect local models. Make sure Ollama is running and accessible.'
      )
    } finally {
      setIsLoadingLocal(false)
    }
  }, [])

  useEffect(() => {
    fetchLocalModels()
    const handleEndpointChange = () => fetchLocalModels()
    window.addEventListener('local-endpoint-changed', handleEndpointChange)
    return () => {
      window.removeEventListener('local-endpoint-changed', handleEndpointChange)
    }
  }, [fetchLocalModels])

  const availableModels = useMemo(
    () => {
      const merged = [...defaultModels, ...localModels]
      if (selectedModel && !merged.some((model) => model.id === selectedModel)) {
        if (selectedModel !== '') {
          merged.push({
            id: selectedModel,
            name: selectedModel,
          })
        }
      }
      return merged
    },
    [localModels, selectedModel],
  )

  const currentModel =
    availableModels.find((m) => m.id === selectedModel) || null

  const handleControlModel = async (
    modelId: string,
    action: 'start' | 'stop'
  ) => {
    setControlState({ model: modelId, action })
    setControlFeedback(null)
    try {
      const storedEndpoint =
        localStorage.getItem('localEndpoint') || DEFAULT_OLLAMA_ENDPOINT
      const response = await fetch('/api/models/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          model: modelId,
          endpoint: storedEndpoint,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || `Failed to ${action === 'start' ? 'start' : 'stop'} model`
        )
      }

      if (action === 'start') {
        setActiveModel(modelId)
        onModelChange(modelId)
        setControlFeedback({
          type: 'info',
          text: `${modelId} is warming up locally.`,
        })
      } else {
        setActiveModel((prev) => (prev === modelId ? null : prev))
        setControlFeedback({
          type: 'info',
          text: `${modelId} has been stopped.`,
        })
      }
    } catch (error) {
      console.error('Model control error:', error)
      setControlFeedback({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to control the local model.',
      })
    } finally {
      setControlState(null)
    }
  }

  const isModelBusy = (modelId: string, action: 'start' | 'stop') =>
    controlState?.model === modelId && controlState?.action === action

  const handleModelSelect = (modelId: string) => {
    const selected = availableModels.find((model) => model.id === modelId)
    if (selected?.isLocal) {
      if (activeModel === modelId) {
        setControlFeedback({
          type: 'info',
          text: `${modelId} is already active. Use Stop to terminate it.`,
        })
        return
      }
      handleControlModel(modelId, 'start')
      return
    }
    setControlFeedback(null)
    onModelChange(modelId)
  }

  return (
    <div className="w-full min-w-[220px] space-y-2 sm:w-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Model
          </span>
          <span className="text-sm font-medium text-foreground">
            {currentModel?.name || 'Select a model'}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={fetchLocalModels}
          disabled={isLoadingLocal}
        >
          <RefreshCw className={`w-3 h-3 ${isLoadingLocal ? 'animate-spin' : ''}`} />
          <span className="text-xs hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <select
        value={selectedModel}
        onChange={(event) => handleModelSelect(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="" disabled>
          Choose a model
        </option>
        <optgroup label="Cloud providers">
          {defaultModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Local (Ollama)">
          {localModels.length === 0 && (
            <option value="__none" disabled>
              {isLoadingLocal ? 'Scanning for models...' : 'No local models found'}
            </option>
          )}
          {localModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
              {activeModel === model.id ? ' • active' : ''}
            </option>
          ))}
        </optgroup>
        {selectedModel &&
          !defaultModels.some((model) => model.id === selectedModel) &&
          !localModels.some((model) => model.id === selectedModel) && (
            <optgroup label="Custom">
              <option value={selectedModel}>{selectedModel}</option>
            </optgroup>
          )}
      </select>

      {controlFeedback && (
        <p
          className={`text-xs ${
            controlFeedback.type === 'error'
              ? 'text-destructive'
              : 'text-muted-foreground'
          }`}
        >
          {controlFeedback.text}
        </p>
      )}

      {localError && (
        <p className="text-xs text-destructive">
          {localError}
        </p>
      )}

      {activeModel && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="w-full"
          onClick={() => handleControlModel(activeModel, 'stop')}
          disabled={isModelBusy(activeModel, 'stop')}
        >
          {isModelBusy(activeModel, 'stop')
            ? `Stopping ${activeModel}...`
            : `Stop ${activeModel}`}
        </Button>
      )}
    </div>
  )
}
