export type ApiStatus = 'loading' | 'up' | 'down'

/** Interroge GET /api/health pour savoir si l'API et sa base répondent. */
export async function fetchApiStatus(signal?: AbortSignal): Promise<ApiStatus> {
  try {
    const response = await fetch('/api/health', { signal })
    return response.ok ? 'up' : 'down'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return 'down'
  }
}
