interface StatsStripProps {
  totalGames: number
  winRate: number
  totalWins: number
  deckCount: number
}

export function StatsStrip({ totalGames, winRate, totalWins, deckCount }: StatsStripProps) {
  const stats = [
    { label: 'Games', value: totalGames },
    { label: 'Win Rate', value: `${winRate}%` },
    { label: 'Wins', value: totalWins },
    { label: 'Decks', value: deckCount },
  ]

  return (
    <div
      className="mx-4 mb-5 px-[18px] py-[14px] rounded-2xl flex justify-between items-center"
      style={{
        background: 'linear-gradient(135deg, rgba(79,195,247,0.08), rgba(156,39,176,0.08))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {stats.map((s, i) => (
        <div key={i} className="text-center">
          <div className="text-xl font-extrabold text-white">{s.value}</div>
          <div className="text-[10px] text-text-muted font-mono tracking-[1px] uppercase">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}
