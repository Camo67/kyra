import { Card } from '@/components/ui/card'
import { MessageCircle, FileText, ImageIcon, Download, Terminal } from 'lucide-react'

interface FileAttachment {
  name: string
  type: string
  size: number
  data?: string
}

interface ChatMessageProps {
  message: string
  role: 'user' | 'assistant'
  isLoading?: boolean
  files?: FileAttachment[]
  mode?: 'ai' | 'terminal'
}

export default function ChatMessage({
  message,
  role,
  isLoading,
  files,
  mode = 'ai',
}: ChatMessageProps) {
  const isUser = role === 'user'
  const isTerminal = mode === 'terminal'

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const getPreviewUrl = (file: FileAttachment) => {
    if (file.type.startsWith('image/') && file.data) {
      return file.data
    }
    return null
  }

  const assistantAvatar = isTerminal ? (
    <Terminal className="w-5 h-5 text-primary" />
  ) : (
    <MessageCircle className="w-5 h-5 text-primary" />
  )

  const baseCardClasses = isTerminal
    ? 'bg-black text-green-400 border border-primary/30 rounded-2xl rounded-tl-sm font-mono text-sm shadow-inner'
    : 'bg-card border border-border rounded-2xl rounded-tl-sm'

  const userCardClasses = isTerminal
    ? 'bg-black text-green-400 border border-primary/30 rounded-2xl rounded-tr-sm font-mono text-sm'
    : 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'

  const textClasses = isTerminal
    ? 'whitespace-pre-wrap break-words text-green-400'
    : isUser
    ? 'text-primary-foreground'
    : 'text-foreground'

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isTerminal ? 'bg-black/40 border border-primary/30' : 'bg-primary/10'
          }`}
        >
          {assistantAvatar}
        </div>
      )}

      <Card
        className={`max-w-2xl px-4 py-3 ${
          isUser ? userCardClasses : baseCardClasses
        } ${isLoading ? 'animate-pulse' : ''}`}
      >
        <p className={`${textClasses} mb-2`}>{message}</p>

        {files && files.length > 0 && (
          <div className="flex flex-col gap-2 mt-3 border-t border-current/20 pt-3">
            {files.map((file, index) => (
              <div key={index}>
                {getPreviewUrl(file) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getPreviewUrl(file)! || "/placeholder.svg"}
                    alt={file.name}
                    className="max-w-xs rounded-lg mb-2"
                  />
                ) : null}
                <div
                  className={`flex items-center gap-2 text-xs rounded px-2 py-1 ${
                    isUser
                      ? 'bg-primary-foreground/20'
                      : 'bg-muted'
                  }`}
                >
                  {getFileIcon(file.type)}
                  <span className="truncate">{file.name}</span>
                  {file.size && (
                    <span className="text-xs opacity-70">
                      ({(file.size / 1024).toFixed(1)}KB)
                    </span>
                  )}
                  <Download className="w-3 h-3 ml-auto cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isUser && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isTerminal
              ? 'bg-black text-green-400 border border-primary/30'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {isTerminal ? '>' : 'U'}
        </div>
      )}
    </div>
  )
}
