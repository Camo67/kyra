import { connectToApp, parseAppCommand } from '@/lib/app-connector'

export async function POST(request: Request) {
  try {
    const { message, model, conversationHistory, localEndpoint, localApps } = await request.json()
    
    const appCommand = parseAppCommand(message)
    let appResponse = ''

    if (appCommand && localApps) {
      const app = localApps.find(
        (a: { name: string }) => a.name.toLowerCase() === appCommand.appName?.toLowerCase()
      )
      
      if (app) {
        const result = await connectToApp(app.endpoint, {
          method: appCommand.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
          endpoint: appCommand.endpoint,
          data: appCommand.data,
        })

        if (result.success) {
          appResponse = `App "${app.name}" response: ${JSON.stringify(result.data)}\n`
        } else {
          appResponse = `App "${app.name}" error: ${result.error}\n`
        }
      }
    }

    const endpoint = localEndpoint || 'http://localhost:11434/api/generate'

    // Convert conversation history to Ollama format
    const messages = conversationHistory.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })
    )

    messages.push({
      role: 'user',
      content: message,
    })

    // Build prompt from conversation history
    let prompt = ''
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`
      } else {
        prompt += `Assistant: ${msg.content}\n`
      }
    }
    
    if (appResponse) {
      prompt += `Context: ${appResponse}\n`
    }
    
    prompt += 'Assistant: '

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama2',
        prompt: prompt,
        stream: false,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Local AI server error: ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.response || ''

    return Response.json({ response: text })
  } catch (error) {
    console.error('API error:', error)
    return Response.json(
      { error: 'Failed to generate response. Make sure Ollama is running at the configured endpoint.' },
      { status: 500 }
    )
  }
}
