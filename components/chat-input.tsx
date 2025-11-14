'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Paperclip, X } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void
  isLoading: boolean
  placeholder?: string
}

export default function ChatInput({
  onSend,
  isLoading,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() || files.length > 0) {
      onSend(input, files.length > 0 ? files : undefined)
      setInput('')
      setFiles([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        120
      ).toString() + 'px'
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-primary/10 text-primary px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-muted-foreground hover:text-foreground"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 resize-none bg-input text-foreground placeholder:text-muted-foreground rounded-lg border border-border p-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          rows={1}
        />
        <Button
          type="submit"
          disabled={isLoading || (!input.trim() && files.length === 0)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 h-auto"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
