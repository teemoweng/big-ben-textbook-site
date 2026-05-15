import { describe, it, expect } from 'vitest'
import { generateShortCode } from '@/lib/shortcode'

describe('generateShortCode', () => {
  it('returns exactly 5 characters', () => {
    expect(generateShortCode()).toHaveLength(5)
  })

  it('only contains allowed characters', () => {
    const ALLOWED = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/
    for (let i = 0; i < 100; i++) {
      expect(generateShortCode()).toMatch(ALLOWED)
    }
  })

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, generateShortCode))
    expect(codes.size).toBeGreaterThan(90)
  })
})
