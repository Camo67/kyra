import { buildTagsUrl, DEFAULT_OLLAMA_ENDPOINT } from '@/lib/ollama'

export async function POST(request: Request) {
  try {
    const { endpoint, query } = await request.json().catch(() => ({}))
    const tagsUrl = buildTagsUrl(endpoint || DEFAULT_OLLAMA_ENDPOINT)

    const response = await fetch(tagsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Local model endpoint error: ${response.statusText}`)
    }

    const data = await response.json()
    const models = Array.isArray(data?.models) ? data.models : []
    const filtered = query
      ? models.filter((model: { name?: string }) =>
          model?.name?.toLowerCase().includes(query.toLowerCase()),
        )
      : models

    return Response.json({ models: filtered })
  } catch (error) {
    console.error('Model fetch error:', error)
    return Response.json(
      {
        models: [],
        error:
          error instanceof Error
            ? error.message
            : 'Unable to detect local models',
      },
      { status: 500 },
    )
  }
}
