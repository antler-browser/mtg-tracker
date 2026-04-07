import { useNavigate } from 'react-router-dom'
import { WinRateRing } from './WinRateRing'
import { ManaPips } from './ManaPips'
import { StreakBadge } from './StreakBadge'
import { ResultDots } from './ResultDots'

interface DeckCardProps {
  deck: {
    id: string
    name: string
    commanderName?: string | null
    manaColors?: string | null
    imageUrl?: string | null
    stats: {
      wins: number
      losses: number
      totalGames: number
      streak: number
      streakType: 'W' | 'L' | ''
      recentResults: ('W' | 'L')[]
    }
  }
}

export function DeckCard({ deck }: DeckCardProps) {
  const navigate = useNavigate()
  const { stats } = deck
  const colors = deck.manaColors?.split(',').filter(Boolean) ?? []

  return (
    <div
      className="card-surface p-4 cursor-pointer transition-all hover:border-border-light"
      onClick={() => navigate(`/decks/${deck.id}`)}
    >
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[17px] font-extrabold text-white truncate">
              {deck.name}
            </span>
            <StreakBadge count={stats.streak} type={stats.streakType} />
          </div>
          {deck.commanderName && deck.commanderName !== deck.name && (
            <div className="text-[11px] text-text-muted mb-1.5">{deck.commanderName}</div>
          )}
          {colors.length > 0 && <ManaPips colors={colors} />}
        </div>
        <WinRateRing wins={stats.wins} losses={stats.losses} size={52} />
      </div>
      <div className="flex justify-between items-center">
        <ResultDots results={stats.recentResults} />
        <div className="text-[11px] text-text-muted font-mono">
          {stats.wins}W {stats.losses}L · {stats.totalGames}g
        </div>
      </div>
    </div>
  )
}
