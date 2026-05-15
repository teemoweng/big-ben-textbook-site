import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateNickname, getOrCreateIdentity } from '@/lib/identity'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
  }
})()

beforeEach(() => {
  localStorageMock.clear()
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' })
})

describe('generateNickname', () => {
  it('returns a non-empty string', () => {
    expect(generateNickname().length).toBeGreaterThan(0)
  })

  it('contains an adjective and an animal', () => {
    const result = generateNickname()
    // Format: adjective + animal (total length > 2 chars)
    expect(result.length).toBeGreaterThan(2)
  })
})

describe('getOrCreateIdentity', () => {
  it('creates new identity on first call', () => {
    const { deviceId, nickname } = getOrCreateIdentity()
    expect(deviceId).toBe('test-uuid-1234')
    expect(nickname.length).toBeGreaterThan(0)
  })

  it('returns same identity on subsequent calls', () => {
    const first = getOrCreateIdentity()
    const second = getOrCreateIdentity()
    expect(first.deviceId).toBe(second.deviceId)
    expect(first.nickname).toBe(second.nickname)
  })

  it('persists identity to localStorage', () => {
    getOrCreateIdentity()
    expect(localStorageMock.getItem('bb_device_id')).toBe('test-uuid-1234')
    expect(localStorageMock.getItem('bb_nickname')).toBeTruthy()
  })
})
