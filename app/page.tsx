'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Settings, Plus, Send, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ChatMessage from '@/components/chat-message'
import ChatInput from '@/components/chat-input'
import ModelSelector from '@/components/model-selector'
import SettingsDrawer from '@/components/settings-drawer'

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
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return

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
          conversationHistory: messages,
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
        <div className="border-b border-border bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Chat</span>
          </div>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Start a conversation
                </h2>
                <p className="text-muted-foreground">
                  Type a message to begin chatting with {selectedModel}
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.content}
                  role={message.role}
                  files={message.files}
                />
              ))}
              {isLoading && (
                <ChatMessage
                  message="Thinking..."
                  role="assistant"
                  isLoading
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
            placeholder={`Message ${selectedModel}...`}
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
