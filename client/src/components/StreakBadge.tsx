interface StreakBadgeProps {
  count: number
  type: 'W' | 'L' | ''
}

export function StreakBadge({ count, type }: StreakBadgeProps) {
  if (!type || count === 0) return null

  const isWin = type === 'W'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 rounded-full text-[11px] font-bold"
      style={{
        padding: '2px 8px',
        background: isWin ? 'rgba(102,187,106,0.15)' : 'rgba(239,83,80,0.15)',
        color: isWin ? '#66BB6A' : '#EF5350',
        border: `1px solid ${isWin ? 'rgba(102,187,106,0.3)' : 'rgba(239,83,80,0.3)'}`,
      }}
    >
      {isWin ? '🔥' : '💀'} {count}{type}
    </span>
  )
}
