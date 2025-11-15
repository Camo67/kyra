'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Settings, Plus, Send, Zap, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ChatMessage from '@/components/chat-message'
import ChatInput from '@/components/chat-input'
import ModelSelector from '@/components/model-selector'
import SettingsDrawer from '@/components/settings-drawer'

const terminalQuickActions = [
  { label: 'Show directory', command: 'pwd' },
  { label: 'List files', command: 'ls -la' },
  { label: 'Check Node version', command: 'node -v' },
  { label: 'List Ollama models', command: 'ollama list' },
  { label: 'Git status', command: 'git status -sb' },
  { label: 'Check npm deps', command: 'npm run lint' },
  { label: 'Monitor memory', command: 'free -h' },
]

interface FileAttachment {
  name: string
  type: string
  size: number
  data?: string
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  files?: FileAttachment[]
  mode: 'ai' | 'terminal'
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [interactionMode, setInteractionMode] = useState<'ai' | 'terminal'>('ai')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleTerminalCommand = async (command: string) => {
    if (!command.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: command,
      role: 'user',
      timestamp: new Date(),
      mode: 'terminal',
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })

      const data = await response.json()
      const stdout = (data.stdout || '').trim()
      const stderr = (data.stderr || '').trim()
      const outputParts: string[] = []
      if (stdout) outputParts.push(stdout)
      if (stderr) outputParts.push(`stderr:\n${stderr}`)
      const output = outputParts.join('\n\n') || 'Command executed.'

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: output,
        role: 'assistant',
        timestamp: new Date(),
        mode: 'terminal',
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Terminal command failed:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content:
            error instanceof Error
              ? `Command failed: ${error.message}`
              : 'Command failed. Check console for details.',
          role: 'assistant',
          timestamp: new Date(),
          mode: 'terminal',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickCommand = async (command: string) => {
    if (interactionMode !== 'terminal') {
      setInteractionMode('terminal')
    }
    await handleTerminalCommand(command)
  }

  const terminalHelperCard = (
    <Card className="p-4 bg-muted/40 border border-dashed border-border space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Terminal quick start
        </p>
        <p className="text-xs text-muted-foreground">
          Commands run on your local machine. Use the buttons below to quickly verify everything is wired up.
        </p>
      </div>
      <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
        <li>Test the working directory or list files.</li>
        <li>Check Node/Ollama to confirm the environment.</li>
        <li>Run your own commands in the input box.</li>
      </ol>
      <div className="flex flex-wrap gap-2">
        {terminalQuickActions.map((action) => (
          <Button
            key={action.command}
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleQuickCommand(action.command)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  )

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return

    if (interactionMode === 'terminal') {
      await handleTerminalCommand(content)
      return
    }

    const fileAttachments: FileAttachment[] = []

    // Convert files to attachments
    if (files) {
      for (const file of files) {
        const reader = new FileReader()
        await new Promise((resolve) => {
          reader.onload = async () => {
            fileAttachments.push({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result as string,
            })
            resolve(null)
          }
          reader.readAsDataURL(file)
        })
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      files: fileAttachments.length > 0 ? fileAttachments : undefined,
      mode: 'ai',
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const localAppsString = localStorage.getItem('localApps')
      const localApps = localAppsString ? JSON.parse(localAppsString) : []
      const localEndpoint = localStorage.getItem('localEndpoint') || 'http://localhost:11434/api/generate'

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          model: selectedModel,
          conversationHistory: messages.filter((message) => message.mode === 'ai'),
          files: fileAttachments,
          localEndpoint,
          localApps,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        mode: 'ai',
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Kira</span>
        </div>

        <Button
          onClick={handleNewChat}
          className="w-full mb-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>

        <div className="flex-1 overflow-y-auto space-y-2">
          <div className="text-sm text-muted-foreground p-4 text-center">
            No chat history yet
          </div>
        </div>

        <div className="border-t border-border pt-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-border bg-background overflow-hidden">
              <Button
                type="button"
                size="sm"
                variant={interactionMode === 'ai' ? 'default' : 'ghost'}
                className="rounded-none"
                onClick={() => setInteractionMode('ai')}
              >
                Chat
              </Button>
              <Button
                type="button"
                size="sm"
                variant={interactionMode === 'terminal' ? 'default' : 'ghost'}
                className="rounded-none border-l border-border"
                onClick={() => setInteractionMode('terminal')}
              >
                <Terminal className="w-4 h-4 mr-1" />
                Terminal
              </Button>
            </div>
            {interactionMode === 'ai' && (
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                {interactionMode === 'terminal' ? (
                  <Terminal className="w-8 h-8 text-primary" />
                ) : (
                  <MessageCircle className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {interactionMode === 'terminal'
                    ? 'Terminal workspace'
                    : 'Start a conversation'}
                </h2>
                <p className="text-muted-foreground">
                  {interactionMode === 'terminal'
                    ? 'Enter a shell command to execute locally.'
                    : `Type a message to begin chatting with ${selectedModel}`}
                </p>
              </div>
              {interactionMode === 'terminal' && terminalHelperCard}
            </div>
          ) : (
            <>
              {interactionMode === 'terminal' && terminalHelperCard}
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.content}
                  role={message.role}
                  files={message.files}
                  mode={message.mode}
                />
              ))}
              {isLoading && (
                <ChatMessage
                  message={
                    interactionMode === 'terminal'
                      ? 'Running command...'
                      : 'Thinking...'
                  }
                  role="assistant"
                  isLoading
                  mode={interactionMode}
                />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-6">
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder={
              interactionMode === 'terminal'
                ? 'Enter a terminal command...'
                : `Message ${selectedModel}...`
            }
          />
        </div>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
