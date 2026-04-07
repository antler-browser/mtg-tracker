import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { WinRateRing } from '../components/WinRateRing'
import { ManaPips } from '../components/ManaPips'
import { MatchRow } from '../components/MatchRow'
import type { DeckWithStats } from '../hooks/useDecks'
import type { MatchData } from '../hooks/useMatches'

export function DeckDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { apiFetch } = useApi()
  const [deck, setDeck] = useState<DeckWithStats | null>(null)
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeck = useCallback(async () => {
    if (!id) return
    try {
      const res = await apiFetch(`/api/decks/${id}`)
      if (!res.ok) { navigate('/'); return }
      const data = await res.json()
      setDeck(data.deck)
      setMatches(data.matches)
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [id, apiFetch, navigate])

  useEffect(() => {
    fetchDeck()
  }, [fetchDeck])

  if (loading || !deck) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="text-text-secondary text-sm font-mono">Loading...</div>
      </div>
    )
  }

  const { stats } = deck
  const colors = deck.manaColors?.split(',').filter(Boolean) ?? []

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg text-white cursor-pointer border-none mb-5"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        ←
      </button>

      {/* Deck header */}
      <div className="text-center mb-7">
        {colors.length > 0 && (
          <div className="flex justify-center mb-2">
            <ManaPips colors={colors} />
          </div>
        )}
        <div className="text-[28px] font-extrabold text-white font-display my-2">
          {deck.name}
        </div>
        {deck.commanderName && deck.commanderName !== deck.name && (
          <div className="text-xs text-text-muted">{deck.commanderName}</div>
        )}
        {deck.typeLine && (
          <div className="text-[11px] text-text-muted mt-1">{deck.typeLine}</div>
        )}
        <div className="mt-4 inline-block">
          <WinRateRing wins={stats.wins} losses={stats.losses} size={80} />
        </div>
      </div>

      {/* Commander art */}
      {deck.imageUrl && (
        <div
          className="rounded-xl overflow-hidden h-28 mb-6"
          style={{
            backgroundImage: `url(${deck.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.5,
          }}
        />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {[
          { label: 'WINS', value: stats.wins, color: '#66BB6A' },
          { label: 'LOSSES', value: stats.losses, color: '#EF5350' },
          { label: 'GAMES', value: stats.totalGames, color: '#4FC3F7' },
        ].map((s, i) => (
          <div
            key={i}
            className="card-surface py-3.5 text-center"
          >
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[10px] text-text-muted font-mono tracking-[1px]">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Last 10 games */}
      {stats.recentResults.length > 0 && (
        <div className="mb-5">
          <div className="text-[13px] font-bold text-text-secondary mb-2.5">
            Last {stats.recentResults.length} Games
          </div>
          <div className="flex gap-1.5">
            {stats.recentResults.map((r, i) => (
              <div
                key={i}
                className="flex-1 h-8 rounded-md flex items-center justify-center text-[11px] font-extrabold"
                style={{
                  background: r === 'W' ? 'rgba(102,187,106,0.15)' : 'rgba(239,83,80,0.15)',
                  color: r === 'W' ? '#66BB6A' : '#EF5350',
                }}
              >
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match history */}
      {matches.length > 0 && (
        <div>
          <div className="text-[13px] font-bold text-text-secondary mb-2.5">
            Recent Matches
          </div>
          <div className="flex flex-col gap-2">
            {matches.map(m => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
