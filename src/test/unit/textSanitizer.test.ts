import { describe, expect, it } from 'vitest'
import { stripWrappingQuotes } from '../../utils/textSanitizer'

describe('stripWrappingQuotes', () => {
  it('removes wrapping double quotes', () => {
    expect(stripWrappingQuotes('"garlic"')).toBe('garlic')
  })

  it('trims and removes wrapping double quotes', () => {
    expect(stripWrappingQuotes('  "chicken breast"  ')).toBe('chicken breast')
  })

  it('keeps string unchanged when only one side has quote', () => {
    expect(stripWrappingQuotes('"onion')).toBe('"onion')
    expect(stripWrappingQuotes('onion"')).toBe('onion"')
  })

  it('keeps empty quoted string as empty', () => {
    expect(stripWrappingQuotes('""')).toBe('')
  })
})
