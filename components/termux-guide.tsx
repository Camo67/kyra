'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Copy, TerminalSquare, X } from 'lucide-react'

const termuxGuideSections = [
  {
    title: 'Update & base packages',
    description: 'Refresh Termux and install the core tooling required for Android-native dev work.',
    commands: [
      'pkg update && pkg upgrade -y',
      'pkg install python nodejs git cmake clang wget tmux -y',
      'termux-setup-storage',
    ],
  },
  {
    title: 'Python + dependencies',
    description: 'Prepare a virtualenv and install the packages used by the multi-agent UI.',
    commands: [
      'python -m venv .venv && source .venv/bin/activate',
      'pip install --upgrade pip',
      'pip install streamlit autogen litellm ollama notion-client google-generativeai streamlit-authenticator flask-socketio',
    ],
  },
  {
    title: 'Local models with Ollama',
    description: 'Build Ollama from source in Termux and pull the quantized models needed for offline work.',
    commands: [
      'git clone https://github.com/ollama/ollama && cd ollama && go build',
      './ollama serve &',
      'ollama pull deepseek-r1:1.5b',
      'ollama pull llama3.2:3b',
      'ollama pull mistral:7b',
    ],
  },
  {
    title: 'Ngrok + tmux sessions',
    description: 'Expose the Streamlit UI securely and keep it running in the background.',
    commands: [
      'wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz',
      'tar xvzf ngrok-v3-stable-linux-arm64.tgz && chmod +x ngrok',
      './ngrok authtoken <YOUR_TOKEN>',
      "tmux new -s multi-ai 'streamlit run app.py --server.port 8501'",
      './ngrok http 8501',
    ],
  },
  {
    title: 'Environment exports',
    description: 'Keep provider tokens in the shell session (or $PREFIX/etc/profile.d) instead of committing them.',
    commands: [
      'export NOTION_TOKEN=sk-...',
      'export GOOGLE_API_KEY=AIza...',
      'export PERPLEXITY_API_KEY=pplx-...',
      'export HUGGINGFACE_API_KEY=hf-...',
      'export GROK_API_KEY=gsk-...',
    ],
  },
]

export default function TermuxGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const handleCopy = async (command: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(command)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = command
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedCommand(command)
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch (error) {
      console.error('Failed to copy command:', error)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        <TerminalSquare className="w-4 h-4" />
        Termux Guide
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="max-h-full w-full max-w-3xl overflow-y-auto p-0">
            <div className="flex items-start justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Android / Termux quick prompts
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tap to copy and run on your Android device inside Termux.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close Termux guide"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6 px-6 py-6">
              {termuxGuideSections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {section.commands.map((command) => (
                      <div
                        key={command}
                        className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-left text-muted-foreground"
                      >
                        <code className="flex-1 overflow-x-auto whitespace-pre-wrap text-left text-foreground">
                          {command}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          aria-label={`Copy ${command}`}
                          onClick={() => handleCopy(command)}
                        >
                          {copiedCommand === command ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
