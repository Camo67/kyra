import {
  DEFAULT_OLLAMA_ENDPOINT,
  buildGenerateUrl,
} from '@/lib/ollama'

type ControlAction = 'start' | 'stop'

export async function POST(request: Request) {
  try {
    const { action, model, endpoint } = await request.json()

    if (!action || !model) {
      return Response.json(
        { success: false, error: 'Action and model are required.' },
        { status: 400 },
      )
    }

    if (action !== 'start' && action !== 'stop') {
      return Response.json(
        { success: false, error: 'Unsupported action.' },
        { status: 400 },
      )
    }

    const target = buildGenerateUrl(endpoint || DEFAULT_OLLAMA_ENDPOINT)
    const body = {
      model,
      prompt:
        action === 'start'
          ? 'System warmup. Respond READY.'
          : 'Release memory. Respond STOPPED.',
      stream: false,
      keep_alive: action === 'start' ? 600 : 0,
      options: {
        temperature: 0,
        num_predict: 5,
      },
    }

    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()
    const payload = (() => {
      try {
        return JSON.parse(text)
      } catch {
        return { raw: text }
      }
    })()

    if (!response.ok) {
      throw new Error(
        payload?.error || `Failed to ${action} model: ${response.statusText}`,
      )
    }

    return Response.json({
      success: true,
      action,
      model,
      data: payload,
    })
  } catch (error) {
    console.error('Model control error:', error)
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to control model.',
      },
      { status: 500 },
    )
  }
}
