import { useMatches } from '../hooks/useMatches'
import { MatchRow } from '../components/MatchRow'

export function History() {
  const { matches, loading } = useMatches()

  return (
    <div className="px-4 pt-5 pb-4">
      <div className="text-[22px] font-extrabold text-white mb-4 font-display">
        Match History
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="text-text-secondary text-sm font-mono">Loading...</div>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📜</div>
          <div className="text-lg font-bold text-white mb-2">No matches yet</div>
          <div className="text-sm text-text-secondary">
            Log your first game to see it here
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {matches.map(match => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  )
}
