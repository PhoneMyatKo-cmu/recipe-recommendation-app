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
