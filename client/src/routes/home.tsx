import { useNavigate } from 'react-router-dom'
import { useDecks } from '../hooks/useDecks'
import { useApi } from '../hooks/useApi'
import { useState, useEffect, useCallback } from 'react'
import { StatsStrip } from '../components/StatsStrip'
import { DeckCard } from '../components/DeckCard'

interface OverallStats {
  totalGames: number
  totalWins: number
  winRate: number
  deckCount: number
}

export function Home() {
  const navigate = useNavigate()
  const { decks, loading: decksLoading } = useDecks()
  const { apiFetch } = useApi()
  const [stats, setStats] = useState<OverallStats>({ totalGames: 0, totalWins: 0, winRate: 0, deckCount: 0 })

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch('/api/stats')
      if (res.ok) {
        setStats(await res.json())
      }
    } catch {}
  }, [apiFetch])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (decksLoading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="text-text-secondary text-sm font-mono">Loading...</div>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="text-[13px] text-text-muted font-mono tracking-[2px] uppercase">
          Commander
        </div>
        <div className="text-[26px] font-extrabold text-white font-display tracking-tight">
          Battle Log
        </div>
      </div>

      {/* Stats strip */}
      {stats.totalGames > 0 && (
        <StatsStrip
          totalGames={stats.totalGames}
          winRate={stats.winRate}
          totalWins={stats.totalWins}
          deckCount={stats.deckCount}
        />
      )}

      {/* Deck list */}
      <div className="px-4">
        {decks.length > 0 && (
          <div className="text-[15px] font-bold text-text-secondary tracking-wide mb-3">
            Your Decks
          </div>
        )}

        {decks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⚔️</div>
            <div className="text-lg font-bold text-white mb-2">No decks yet</div>
            <div className="text-sm text-text-secondary mb-6 max-w-[240px] mx-auto">
              Log your first Commander game to start tracking your decks
            </div>
            <button
              onClick={() => navigate('/log')}
              className="btn-gradient px-6 py-3 text-[15px]"
            >
              Log First Game
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {decks.map(deck => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
