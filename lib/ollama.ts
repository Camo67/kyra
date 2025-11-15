export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate'

export function buildTagsUrl(endpoint: string) {
  try {
    const url = new URL(endpoint)
    if (url.pathname.endsWith('/api/generate')) {
      url.pathname = url.pathname.replace(/\/api\/generate$/, '/api/tags')
    } else if (!url.pathname.endsWith('/api/tags')) {
      url.pathname = '/api/tags'
    }
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return 'http://localhost:11434/api/tags'
  }
}

export function buildGenerateUrl(endpoint: string) {
  try {
    const url = new URL(endpoint)
    if (!url.pathname || url.pathname === '/' || url.pathname === '') {
      url.pathname = '/api/generate'
    } else if (!url.pathname.endsWith('/api/generate')) {
      url.pathname = '/api/generate'
    }
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return DEFAULT_OLLAMA_ENDPOINT
  }
}
