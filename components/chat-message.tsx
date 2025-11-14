import { Card } from '@/components/ui/card'
import { MessageCircle, FileText, ImageIcon, Download } from 'lucide-react'

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
}

export default function ChatMessage({
  message,
  role,
  isLoading,
  files,
}: ChatMessageProps) {
  const isUser = role === 'user'

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

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
      )}

      <Card
        className={`max-w-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
            : 'bg-card border border-border rounded-2xl rounded-tl-sm'
        } ${isLoading ? 'animate-pulse' : ''}`}
      >
        <p className={`${isUser ? 'text-primary-foreground' : 'text-foreground'} mb-2`}>
          {message}
        </p>

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
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground">
          U
        </div>
      )}
    </div>
  )
}
