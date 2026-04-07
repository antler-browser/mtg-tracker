import { useState, useEffect, useCallback } from 'react'
import { useApi } from './useApi'

export interface MatchData {
  id: string
  playerCount: number
  playedAt: string
  placements: {
    id: string
    deckName: string
    placement: number
    isOwner: boolean
    deckId: string | null
  }[]
}

export function useMatches(deckId?: string) {
  const { apiFetch } = useApi()
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true)
      const url = deckId ? `/api/matches?deckId=${deckId}` : '/api/matches'
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Failed to fetch matches')
      const data = await res.json()
      setMatches(data.matches)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [apiFetch, deckId])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  return { matches, loading, error, refetch: fetchMatches }
}
