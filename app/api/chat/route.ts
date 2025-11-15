import { connectToApp, parseAppCommand } from '@/lib/app-connector'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

type RemoteModelConfig = {
  provider: 'gemini' | 'huggingface' | 'groq'
  credentialField: keyof DecryptedCreds
  envVar: string
  modelId?: string
}

const remoteModels: Record<string, RemoteModelConfig> = {
  'gemini-pro': {
    provider: 'gemini',
    credentialField: 'geminiApiKey',
    envVar: 'GOOGLE_API_KEY',
  },
  'hf-meta-llama-3.1-8b': {
    provider: 'huggingface',
    credentialField: 'huggingfaceApiKey',
    envVar: 'HUGGINGFACE_API_KEY',
    modelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
  },
  'groq-llama3-8b': {
    provider: 'groq',
    credentialField: 'groqApiKey',
    envVar: 'GROQ_API_KEY',
    modelId: 'llama3-8b-8192',
  },
}

type DecryptedCreds = {
  geminiApiKey?: string | null
  huggingfaceApiKey?: string | null
  groqApiKey?: string | null
}

type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

function buildPrompt(
  conversationHistory: ConversationMessage[],
  message: string,
  appContext: string,
) {
  const history = conversationHistory.map((msg) =>
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`,
  )
  const context = appContext ? [`Context: ${appContext}`] : []
  return [...history, `User: ${message}`, ...context, 'Assistant:'].join('\n')
}

function buildChatHistory(conversationHistory: ConversationMessage[], message: string) {
  return [
    ...conversationHistory,
    { role: 'user' as const, content: message },
  ]
}

async function callGemini(apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Gemini error: ${await response.text()}`)
  }
  const data = await response.json()
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('\n') || ''
  return text.trim() || 'Gemini returned an empty response.'
}

async function callHuggingFace(apiKey: string, modelId: string, prompt: string) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    },
  )

  if (!response.ok) {
    throw new Error(`Hugging Face error: ${await response.text()}`)
  }
  const data = await response.json()
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text as string
  }
  return JSON.stringify(data)
}

async function callGroq(
  apiKey: string,
  modelId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq error: ${await response.text()}`)
  }
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  return text || 'Groq returned an empty response.'
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { credentials: true },
    })

    if (!user) {
      return Response.json({ error: 'User profile missing' }, { status: 404 })
    }

    const decryptedCreds: DecryptedCreds = {
      geminiApiKey: decrypt(user.credentials?.geminiApiKey),
      huggingfaceApiKey: decrypt(user.credentials?.huggingfaceApiKey),
      groqApiKey: decrypt(user.credentials?.groqApiKey),
    }

    const {
      message,
      model,
      conversationHistory = [],
      localEndpoint,
      localApps,
    } = await request.json()

    const normalizedHistory: ConversationMessage[] = Array.isArray(conversationHistory)
      ? conversationHistory.map((msg: { role?: string; content?: string }) => ({
          role: msg?.role === 'assistant' ? 'assistant' : 'user',
          content: msg?.content ?? '',
        }))
      : []
    
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

    const remoteConfig = model ? remoteModels[model as string] : undefined

    const prompt = buildPrompt(normalizedHistory, message, appResponse)

    if (remoteConfig) {
      const credentialValue = decryptedCreds[remoteConfig.credentialField]
      const envFallback = process.env[remoteConfig.envVar]
      const apiKey = credentialValue || envFallback
      if (!apiKey) {
        return Response.json(
          {
            error: `Missing ${remoteConfig.provider} API key. Add one in Settings → API Vault.`,
          },
          { status: 400 },
        )
      }

      let text = ''
      if (remoteConfig.provider === 'gemini') {
        text = await callGemini(apiKey, prompt)
      } else if (remoteConfig.provider === 'huggingface' && remoteConfig.modelId) {
        text = await callHuggingFace(apiKey, remoteConfig.modelId, prompt)
      } else if (remoteConfig.provider === 'groq' && remoteConfig.modelId) {
        const chatMessages = buildChatHistory(normalizedHistory, message)
        text = await callGroq(apiKey, remoteConfig.modelId, chatMessages)
      }

      return Response.json({ response: text })
    }

    const endpoint = localEndpoint || 'http://localhost:11434/api/generate'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama2',
        prompt,
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
