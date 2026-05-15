'use client'
import { useState, useEffect } from 'react'
import { getOrCreateIdentity } from '@/lib/identity'

export function useIdentity() {
  const [identity, setIdentity] = useState<{ deviceId: string; nickname: string } | null>(null)

  useEffect(() => {
    setIdentity(getOrCreateIdentity())
  }, [])

  return identity
}
