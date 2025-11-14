interface AppRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  data?: Record<string, unknown>
}

interface AppResponse {
  success: boolean
  data?: unknown
  error?: string
}

export async function connectToApp(
  appEndpoint: string,
  request: AppRequest
): Promise<AppResponse> {
  try {
    const url = new URL(request.endpoint, appEndpoint).toString()
    
    const options: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (request.data && (request.method === 'POST' || request.method === 'PUT')) {
      options.body = JSON.stringify(request.data)
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Parse commands from message like "@appname method endpoint data"
export function parseAppCommand(message: string): {
  appName?: string
  method: string
  endpoint: string
  data?: Record<string, unknown>
} | null {
  const match = message.match(/@(\w+)\s+(\w+)\s+(\S+)(?:\s+(.+))?/i)
  
  if (!match) return null

  const [, appName, method, endpoint, dataStr] = match
  
  try {
    const data = dataStr ? JSON.parse(dataStr) : undefined
    return {
      appName,
      method: method.toUpperCase(),
      endpoint,
      data,
    }
  } catch {
    return {
      appName,
      method: method.toUpperCase(),
      endpoint,
    }
  }
}
