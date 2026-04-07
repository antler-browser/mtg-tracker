import { useState, useEffect, useCallback } from 'react'
import { useApi } from './useApi'

export interface DeckWithStats {
  id: string
  name: string
  commanderName: string | null
  manaColors: string | null
  imageUrl: string | null
  typeLine: string | null
  stats: {
    wins: number
    losses: number
    totalGames: number
    streak: number
    streakType: 'W' | 'L' | ''
    recentResults: ('W' | 'L')[]
  }
}

export function useDecks() {
  const { apiFetch } = useApi()
  const [decks, setDecks] = useState<DeckWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/decks')
      if (!res.ok) throw new Error('Failed to fetch decks')
      const data = await res.json()
      setDecks(data.decks)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  return { decks, loading, error, refetch: fetchDecks }
}
