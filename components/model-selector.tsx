'use client'

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

const models = [
  { id: 'gpt-4o', name: 'GPT-4o', badge: 'Latest' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', badge: 'Advanced' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', badge: 'Fast' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', badge: 'Powerful' },
]

export default function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const currentModel = models.find((m) => m.id === selectedModel)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-border text-foreground hover:bg-card/80"
        >
          <span className="text-sm">{currentModel?.name}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className="flex items-center justify-between cursor-pointer hover:bg-primary/10"
          >
            <span className="text-foreground">{model.name}</span>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
              {model.badge}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
