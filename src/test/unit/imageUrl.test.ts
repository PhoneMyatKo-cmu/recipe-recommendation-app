import { describe, expect, it } from 'vitest'
import { normalizeImageUrl, toProxyImageUrl } from '../../utils/imageUrl'

describe('normalizeImageUrl', () => {
  it('returns null for null input', () => {
    expect(normalizeImageUrl(null)).toBeNull()
  })

  it('returns null when no http is present', () => {
    expect(normalizeImageUrl('not-a-url')).toBeNull()
  })

  it('keeps URL starting from first http and trims wrappers', () => {
    const raw = 'prefix "https://example.com/pic.jpg\\'
    expect(normalizeImageUrl(raw)).toBe('https://example.com/pic.jpg')
  })

  it('normalizes upload modifiers between upload and v1', () => {
    const raw =
      'https://img.sndimg.com/food/image/upload/w_555,h_416,c_fit,fl_progressive,q_95/v1/img/recipes/21/88/45/pic.jpg'
    expect(normalizeImageUrl(raw)).toBe(
      'https://img.sndimg.com/food/image/upload/v1/img/recipes/21/88/45/pic.jpg',
    )
  })

  it('removes trailing query/hash after image extension', () => {
    const raw = 'https://example.com/photo.jpeg?x=1#hash'
    expect(normalizeImageUrl(raw)).toBe('https://example.com/photo.jpeg')
  })

  it('handles uppercase extension', () => {
    const raw = 'https://example.com/photo.PNG?x=1'
    expect(normalizeImageUrl(raw)).toBe('https://example.com/photo.PNG')
  })

  it('keeps full path if no extension is found', () => {
    const raw = 'https://example.com/image-service/noext/path'
    expect(normalizeImageUrl(raw)).toBe('https://example.com/image-service/noext/path')
  })
})

describe('toProxyImageUrl', () => {
  it('returns encoded proxy URL for valid image URL', () => {
    expect(toProxyImageUrl('https://example.com/x.jpg')).toBe(
      'http://127.0.0.1:8000/image-proxy/image-proxy?url=https%3A%2F%2Fexample.com%2Fx.jpg',
    )
  })

  it('falls back to fallback URL when primary is invalid', () => {
    expect(toProxyImageUrl('invalid', 'https://example.com/fallback.webp')).toBe(
      'http://127.0.0.1:8000/image-proxy/image-proxy?url=https%3A%2F%2Fexample.com%2Ffallback.webp',
    )
  })

  it('returns null when both primary and fallback are invalid', () => {
    expect(toProxyImageUrl('invalid', 'also-invalid')).toBeNull()
  })
})
