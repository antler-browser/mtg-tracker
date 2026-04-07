interface WinRateRingProps {
  wins: number
  losses: number
  size?: number
}

export function WinRateRing({ wins, losses, size = 56 }: WinRateRingProps) {
  const total = wins + losses
  const pct = total ? Math.round((wins / total) * 100) : 0
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * pct) / 100
  const color = pct >= 60 ? '#66BB6A' : pct >= 45 ? '#FFA726' : '#EF5350'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={size * 0.28}
        fontWeight={700}
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {pct}%
      </text>
    </svg>
  )
}
