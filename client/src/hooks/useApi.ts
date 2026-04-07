import { useCallback } from 'react'
import { useLocalFirstAuth } from './useLocalFirstAuth'

export function useApi() {
  const { getProfileJwt } = useLocalFirstAuth()

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const jwt = await getProfileJwt()
    if (!jwt) throw new Error('Not authenticated')

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
        ...options.headers,
      },
    })
  }, [getProfileJwt])

  const apiPost = useCallback(async (url: string, body: Record<string, unknown>) => {
    const jwt = await getProfileJwt()
    if (!jwt) throw new Error('Not authenticated')

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, profileJwt: jwt }),
    })
  }, [getProfileJwt])

  const apiDelete = useCallback(async (url: string) => {
    const jwt = await getProfileJwt()
    if (!jwt) throw new Error('Not authenticated')

    return fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileJwt: jwt }),
    })
  }, [getProfileJwt])

  const apiPut = useCallback(async (url: string, body: Record<string, unknown>) => {
    const jwt = await getProfileJwt()
    if (!jwt) throw new Error('Not authenticated')

    return fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, profileJwt: jwt }),
    })
  }, [getProfileJwt])

  return { apiFetch, apiPost, apiDelete, apiPut }
}
