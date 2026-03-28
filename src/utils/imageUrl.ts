const API_BASE_URL = 'http://127.0.0.1:8000'

export function normalizeImageUrl(rawUrl: string | null): string | null {
  if (!rawUrl) {
    return null
  }

  const httpIndex = rawUrl.indexOf('http')
  if (httpIndex === -1) {
    return null
  }

  let cleaned = rawUrl.slice(httpIndex).trim()
  cleaned = cleaned.replace(/^["']+|["'\\\s]+$/g, '')
  cleaned = cleaned.replace(/\/upload\/.*?\/v1\//, '/upload/v1/')

  const extensionMatch = cleaned.match(/\.(jpg|jpeg|png|webp|gif)/i)
  if (extensionMatch) {
    const endIndex = extensionMatch.index! + extensionMatch[0].length
    cleaned = cleaned.slice(0, endIndex)
  }

  return cleaned
}

export function toProxyImageUrl(rawUrl: string | null, fallbackUrl?: string): string | null {
  const normalized = normalizeImageUrl(rawUrl) ?? (fallbackUrl ? normalizeImageUrl(fallbackUrl) : null)
  if (!normalized) {
    return null
  }

  return `${API_BASE_URL}/image-proxy/image-proxy?url=${encodeURIComponent(normalized)}`
}
