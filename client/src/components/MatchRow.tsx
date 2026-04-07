interface Placement {
  deckName: string
  placement: number
  isOwner: boolean
}

interface MatchRowProps {
  match: {
    id: string
    playerCount: number
    playedAt: string | number | Date
    placements: Placement[]
  }
}

export function MatchRow({ match }: MatchRowProps) {
  const sorted = [...match.placements].sort((a, b) => a.placement - b.placement)
  const ownerPlacement = sorted.find(p => p.isOwner)
  const ownerResult = ownerPlacement?.placement === 1 ? '1st' :
    ownerPlacement?.placement === 2 ? '2nd' :
    ownerPlacement?.placement === 3 ? '3rd' :
    ownerPlacement?.placement === 4 ? '4th' : '—'
  const isWin = ownerPlacement?.placement === 1

  // playedAt comes as unix timestamp (seconds) from D1
  const timestamp = typeof match.playedAt === 'number' ? match.playedAt * 1000 : new Date(match.playedAt).getTime()
  const date = new Date(timestamp)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div
      className="rounded-[14px] px-4 py-3.5"
      style={{
        background: isWin ? 'rgba(102,187,106,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isWin ? 'rgba(102,187,106,0.15)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-extrabold px-2 py-0.5 rounded-md"
            style={{
              background: isWin ? 'rgba(102,187,106,0.2)' : 'rgba(255,255,255,0.08)',
              color: isWin ? '#66BB6A' : 'rgba(255,255,255,0.5)',
            }}
          >
            {ownerResult}
          </span>
          <span className="text-[15px] font-bold text-white">
            {ownerPlacement?.deckName ?? 'Unknown'}
          </span>
        </div>
        <span className="text-[11px] text-text-muted font-mono">{dateStr}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {sorted.map((p, i) => (
          <span
            key={i}
            className="text-[10px] px-2 py-0.5 rounded-[10px]"
            style={{
              background: p.isOwner ? 'rgba(79,195,247,0.12)' : 'rgba(255,255,255,0.04)',
              color: p.isOwner ? '#4FC3F7' : 'rgba(255,255,255,0.4)',
              border: `1px solid ${p.isOwner ? 'rgba(79,195,247,0.2)' : 'transparent'}`,
            }}
          >
            {i + 1}. {p.deckName}{p.isOwner ? ' (You)' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
