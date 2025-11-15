'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_OLLAMA_ENDPOINT } from '@/lib/ollama'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

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
]

export default function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [localModels, setLocalModels] = useState<ModelOption[]>([])
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [controlState, setControlState] = useState<{
    model: string
    action: 'start' | 'stop'
  } | null>(null)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [controlFeedback, setControlFeedback] = useState<{
    type: 'info' | 'error'
    text: string
  } | null>(null)

  const fetchLocalModels = useCallback(async (query?: string) => {
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
          query: query?.trim() || undefined,
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
    fetchLocalModels(searchFilter)
    const handleEndpointChange = () => fetchLocalModels(searchFilter)
    window.addEventListener('local-endpoint-changed', handleEndpointChange)
    return () => {
      window.removeEventListener('local-endpoint-changed', handleEndpointChange)
    }
  }, [fetchLocalModels, searchFilter])

  const availableModels = useMemo(
    () => [...defaultModels, ...localModels],
    [localModels],
  )
  const filteredModels = useMemo(() => {
    if (!searchFilter.trim()) return availableModels
    return availableModels.filter((model) =>
      model.name.toLowerCase().includes(searchFilter.toLowerCase())
    )
  }, [availableModels, searchFilter])

  const currentModel =
    availableModels.find((m) => m.id === selectedModel) || null

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    setSearchFilter(searchInput.trim())
    fetchLocalModels(searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchFilter('')
    fetchLocalModels()
  }

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

  const handleModelSelect = (model: ModelOption) => {
    if (model.isLocal) {
      if (activeModel === model.id) {
        setControlFeedback({
          type: 'info',
          text: `${model.id} is already active. Use Kill switch to stop it.`,
        })
      } else {
        handleControlModel(model.id, 'start')
      }
      return
    }

    onModelChange(model.id)
    setControlFeedback(null)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-border text-foreground hover:bg-card/80"
        >
          <span className="text-sm">
            {currentModel?.name || selectedModel || 'Select model'}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-card border-border space-y-1">
        <div className="p-3 border-b border-border/60 space-y-2">
          <form className="flex gap-2" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search models..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 rounded border border-border bg-input px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fetchLocalModels(searchFilter)}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              disabled={!searchFilter && !searchInput}
            >
              Clear
            </Button>
          </div>
        </div>
        {activeModel && (
          <div className="px-3">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full"
              disabled={isModelBusy(activeModel, 'stop')}
              onClick={() => handleControlModel(activeModel, 'stop')}
            >
              {isModelBusy(activeModel, 'stop')
                ? `Stopping ${activeModel}...`
                : `Kill ${activeModel}`}
            </Button>
          </div>
        )}
        {controlFeedback && (
          <div
            className={`px-3 py-2 text-xs ${
              controlFeedback.type === 'error'
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {controlFeedback.text}
          </div>
        )}
        {isLoadingLocal && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Scanning for local models...
          </div>
        )}
        {filteredModels.map((model) => {
          const isLocal = model.isLocal ?? model.badge === 'Local'
          const isActive = activeModel === model.id
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={(event) => {
                event.preventDefault()
                handleModelSelect(model)
              }}
              className={`flex flex-col gap-2 cursor-pointer ${
                isActive ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-foreground text-sm">{model.name}</span>
                {model.badge && (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {model.badge}
                    {isActive && ' • active'}
                  </span>
                )}
              </div>
              {isLocal && (
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isModelBusy(model.id, 'start')}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleControlModel(model.id, 'start')
                    }}
                  >
                    {isModelBusy(model.id, 'start') ? 'Starting...' : 'Start'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    disabled={isModelBusy(model.id, 'stop')}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleControlModel(model.id, 'stop')
                    }}
                  >
                    {isModelBusy(model.id, 'stop') ? 'Stopping...' : 'Stop'}
                  </Button>
                </div>
              )}
            </DropdownMenuItem>
          )
        })}
        {!isLoadingLocal && localError && (
          <div className="px-3 py-2 text-xs text-destructive">{localError}</div>
        )}
        {!isLoadingLocal &&
          !localError &&
          !searchFilter.trim() &&
          localModels.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No local models detected. Make sure Ollama is running.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
