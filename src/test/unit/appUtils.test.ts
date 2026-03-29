import { describe, expect, it } from 'vitest'
import { extractToken, getFolderIdFromPath } from '../../App'

describe('extractToken', () => {
  it('returns access_token first when present', () => {
    expect(
      extractToken({
        access_token: 'access-token',
        token: 'token-value',
        bearer_token: 'bearer-token',
      }),
    ).toBe('access-token')
  })

  it('falls back to token when access_token is missing', () => {
    expect(extractToken({ token: 'token-value', bearer_token: 'bearer-token' })).toBe('token-value')
  })

  it('falls back to bearer_token when others are missing', () => {
    expect(extractToken({ bearer_token: 'bearer-token' })).toBe('bearer-token')
  })

  it('returns null when no token field exists', () => {
    expect(extractToken({})).toBeNull()
  })
})

describe('getFolderIdFromPath', () => {
  it('extracts numeric folder id from valid path', () => {
    expect(getFolderIdFromPath('/folders/42')).toBe(42)
  })

  it('returns null for non-folder path', () => {
    expect(getFolderIdFromPath('/search')).toBeNull()
  })

  it('returns null for folder path with non-numeric id', () => {
    expect(getFolderIdFromPath('/folders/abc')).toBeNull()
  })

  it('returns null for folder path with trailing slash', () => {
    expect(getFolderIdFromPath('/folders/42/')).toBeNull()
  })

  it('returns null for nested folder path', () => {
    expect(getFolderIdFromPath('/folders/42/items')).toBeNull()
  })
})
