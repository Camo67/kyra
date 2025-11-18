'use client'

import { X, Moon, Sun, Plus, Trash2, Image as ImageIcon, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_OLLAMA_ENDPOINT } from '@/lib/ollama'
import { useTheme } from 'next-themes'
import CredentialsForm from '@/components/credentials-form'

interface LocalApp {
  id: string
  name: string
  endpoint: string
  description: string
}

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsDrawer({
  isOpen,
  onClose,
}: SettingsDrawerProps) {
  const DEFAULT_BACKGROUND_IMAGE = '/generated-image.png'
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [localEndpoint, setLocalEndpoint] = useState(DEFAULT_OLLAMA_ENDPOINT)
  const [temperature, setTemperature] = useState(0.7)
  const [localApps, setLocalApps] = useState<LocalApp[]>([])
  const [newAppName, setNewAppName] = useState('')
  const [newAppEndpoint, setNewAppEndpoint] = useState('')
  const [newAppDescription, setNewAppDescription] = useState('')
  const [backgroundImage, setBackgroundImage] = useState(DEFAULT_BACKGROUND_IMAGE)
  const [backgroundInput, setBackgroundInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const isDark = mounted ? currentTheme === 'dark' : false
  const formatBackgroundValue = useCallback((value: string) => {
    const trimmed = value?.trim()
    if (!trimmed) {
      return `url("${DEFAULT_BACKGROUND_IMAGE}")`
    }
    if (trimmed.startsWith('url(')) {
      return trimmed
    }
    return `url("${trimmed}")`
  }, [DEFAULT_BACKGROUND_IMAGE])

  const updateDocumentBackground = useCallback((value: string) => {
    if (typeof document === 'undefined') return
    document.documentElement.style.setProperty(
      '--app-background-image',
      formatBackgroundValue(value),
    )
  }, [formatBackgroundValue])

  const updateBackgroundImage = useCallback((value: string) => {
    const normalized = value?.trim() || DEFAULT_BACKGROUND_IMAGE
    setBackgroundImage(normalized)
    if (typeof window !== 'undefined') {
      if (normalized === DEFAULT_BACKGROUND_IMAGE) {
        localStorage.removeItem('backgroundImage')
      } else {
        localStorage.setItem('backgroundImage', normalized)
      }
    }
    updateDocumentBackground(normalized)
  }, [DEFAULT_BACKGROUND_IMAGE, updateDocumentBackground])

  useEffect(() => {
    const savedEndpoint = localStorage.getItem('localEndpoint')
    const savedTemp = localStorage.getItem('temperature')
    const savedApps = localStorage.getItem('localApps')
    const savedBackground = localStorage.getItem('backgroundImage')
    if (savedEndpoint) setLocalEndpoint(savedEndpoint)
    if (savedTemp) setTemperature(parseFloat(savedTemp))
    if (savedApps) setLocalApps(JSON.parse(savedApps))
    const initialBackground = savedBackground || DEFAULT_BACKGROUND_IMAGE
    setBackgroundImage(initialBackground)
    if (savedBackground) setBackgroundInput(savedBackground)
    updateDocumentBackground(initialBackground)
  }, [DEFAULT_BACKGROUND_IMAGE, updateDocumentBackground])

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndpoint = e.target.value
    setLocalEndpoint(newEndpoint)
    localStorage.setItem('localEndpoint', newEndpoint)
    window.dispatchEvent(new Event('local-endpoint-changed'))
  }

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTemp = parseFloat(e.target.value)
    setTemperature(newTemp)
    localStorage.setItem('temperature', newTemp.toString())
  }

  const handleBackgroundInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundInput(e.target.value)
  }

  const handleApplyBackground = () => {
    updateBackgroundImage(backgroundInput || DEFAULT_BACKGROUND_IMAGE)
  }

  const handleResetBackground = () => {
    setBackgroundInput('')
    updateBackgroundImage(DEFAULT_BACKGROUND_IMAGE)
  }

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBackgroundInput('')
        updateBackgroundImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
    if (event.target) {
      event.target.value = ''
    }
  }

  const addLocalApp = () => {
    if (!newAppName.trim() || !newAppEndpoint.trim()) return
    
    const newApp: LocalApp = {
      id: Date.now().toString(),
      name: newAppName,
      endpoint: newAppEndpoint,
      description: newAppDescription,
    }
    
    const updatedApps = [...localApps, newApp]
    setLocalApps(updatedApps)
    localStorage.setItem('localApps', JSON.stringify(updatedApps))
    
    setNewAppName('')
    setNewAppEndpoint('')
    setNewAppDescription('')
  }

  const backgroundPreviewStyle = {
    backgroundImage: formatBackgroundValue(backgroundImage),
  }

  const removeLocalApp = (id: string) => {
    const updatedApps = localApps.filter((app) => app.id !== id)
    setLocalApps(updatedApps)
    localStorage.setItem('localApps', JSON.stringify(updatedApps))
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-lg transform transition-transform duration-300 z-50 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-card">
            <h2 className="text-lg font-semibold text-foreground">Settings</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Settings Options */}
          <div className="space-y-6 flex-1">
            {/* Theme Toggle */}
            <Card className="p-4 bg-card/50 border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Moon className="w-5 h-5 text-primary" />
                  ) : (
                    <Sun className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      {isDark ? 'Dark mode' : 'Light mode'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleThemeToggle}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-primary/10"
                >
                  Toggle
                </Button>
              </div>
            </Card>

            {/* Background Picker */}
            <Card className="p-4 bg-card/50 border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Workspace backdrop</p>
                    <p className="text-sm text-muted-foreground">
                      Use any image or URL to personalize the canvas.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetBackground}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              </div>
              <div
                className="h-24 rounded-lg border border-border/80 bg-cover bg-center overflow-hidden"
                style={backgroundPreviewStyle}
              >
                <div className="w-full h-full bg-black/40 flex items-center justify-center text-[11px] tracking-widest uppercase text-primary-foreground">
                  Preview
                </div>
              </div>
              <input
                type="text"
                value={backgroundInput}
                onChange={handleBackgroundInputChange}
                placeholder="https://example.com/wallpaper.png"
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleApplyBackground}
                  className="border-border text-foreground hover:bg-primary/10"
                >
                  Apply URL
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-border text-foreground hover:bg-primary/10"
                >
                  <ImageIcon className="w-4 h-4" />
                  Upload
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => updateBackgroundImage(DEFAULT_BACKGROUND_IMAGE)}
                  className="text-muted-foreground hover:text-foreground hover:bg-primary/5"
                >
                  <RefreshCcw className="w-4 h-4 mr-1" />
                  Default
                </Button>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleBackgroundUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Uploaded images never leave your device; the data URI is stored in localStorage.
              </p>
            </Card>

            <Card className="p-4 bg-card/50 border-border">
              <label className="block mb-3">
                <span className="text-sm font-medium text-foreground mb-2 block">
                  Local Ollama Endpoint
                </span>
                <input
                  type="text"
                  placeholder="http://localhost:11434/api/generate"
                  value={localEndpoint}
                  onChange={handleEndpointChange}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Default: http://localhost:11434/api/generate
                </p>
              </label>
            </Card>

            {/* Temperature Setting */}
            <Card className="p-4 bg-card/50 border-border">
              <label className="block">
                <span className="text-sm font-medium text-foreground mb-3 block">
                  Temperature: {temperature.toFixed(1)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={handleTemperatureChange}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Controls randomness: 0 = deterministic, 2 = creative
                </p>
              </label>
            </Card>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-foreground">Connected Apps</h3>
              </div>
              
              {localApps.length > 0 && (
                <div className="space-y-2 mb-4">
                  {localApps.map((app) => (
                    <Card key={app.id} className="p-3 bg-card/50 border-border flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.endpoint}</p>
                        {app.description && (
                          <p className="text-xs text-muted-foreground mt-1">{app.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLocalApp(app.id)}
                        className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add New App */}
              <Card className="p-3 bg-primary/5 border border-primary/20">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="App name"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="http://localhost:PORT"
                    value={newAppEndpoint}
                    onChange={(e) => setNewAppEndpoint(e.target.value)}
                    className="w-full px-2 py-1.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newAppDescription}
                    onChange={(e) => setNewAppDescription(e.target.value)}
                    className="w-full px-2 py-1.5 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={addLocalApp}
                    disabled={!newAppName.trim() || !newAppEndpoint.trim()}
                    className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm py-1.5"
                  >
                    <Plus className="w-3 h-3" />
                    Add App
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-card/50 border-border">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    API key vault
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stored per Google account and encrypted with your ENCRYPTION_SECRET.
                  </p>
                </div>
                <CredentialsForm />
              </Card>
            </div>

            <Card className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                Getting Started with Ollama:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Download Ollama from ollama.ai</li>
                <li>Run: <code className="bg-input px-1 rounded">ollama run llama2</code></li>
                <li>Kira will connect automatically</li>
              </ol>
            </Card>

            <Card className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                App Integration:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Add local apps with their API endpoints</li>
                <li>Kira can send/receive data from them</li>
                <li>Use commands like: @appname action data</li>
              </ol>
            </Card>

            <Card className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                Termux + Termux:API setup:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Install Termux (from F-Droid/GitHub) and open it once</li>
                <li>Run <code className="bg-input px-1 rounded">pkg update && pkg upgrade</code></li>
                <li>Install APIs: <code className="bg-input px-1 rounded">pkg install termux-api</code> and install the Termux:API add-on app</li>
                <li>Expose your script via HTTP or webhook, then register the endpoint above so Kira can call it</li>
              </ol>
            </Card>
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-4 text-xs text-muted-foreground sticky bottom-0 bg-card">
            <p>Kira v1.0 - Local AI Edition</p>
            <p className="mt-1">Powered by Ollama + Next.js</p>
          </div>
        </div>
      </div>
    </>
  )
}
