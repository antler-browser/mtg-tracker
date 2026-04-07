const MANA_COLORS: Record<string, { accent: string; glow: string; symbol: string }> = {
  W: { accent: '#F9FAF4', glow: 'rgba(240,230,140,0.4)', symbol: '☀' },
  U: { accent: '#4FC3F7', glow: 'rgba(79,195,247,0.4)', symbol: '💧' },
  B: { accent: '#9C27B0', glow: 'rgba(156,39,176,0.4)', symbol: '💀' },
  R: { accent: '#FF6B35', glow: 'rgba(255,107,53,0.4)', symbol: '🔥' },
  G: { accent: '#66BB6A', glow: 'rgba(102,187,106,0.4)', symbol: '🌿' },
}

interface ManaPipsProps {
  colors: string[]
  size?: number
}

export function ManaPips({ colors, size = 16 }: ManaPipsProps) {
  return (
    <div className="flex gap-1">
      {colors.map((color, i) => {
        const c = MANA_COLORS[color]
        if (!c) return null
        return (
          <span
            key={i}
            className="inline-flex items-center justify-center rounded-full"
            style={{
              width: size,
              height: size,
              background: c.accent,
              fontSize: size * 0.55,
              lineHeight: 1,
              boxShadow: `0 0 ${size / 3}px ${c.glow}`,
            }}
          >
            {c.symbol}
          </span>
        )
      })}
    </div>
  )
}

export { MANA_COLORS }
