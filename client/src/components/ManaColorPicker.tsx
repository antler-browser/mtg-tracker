import { MANA_COLORS } from './ManaPips'

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'] as const

interface ManaColorPickerProps {
  selected: string[]
  onChange: (colors: string[]) => void
  size?: number
}

export function ManaColorPicker({ selected, onChange, size = 32 }: ManaColorPickerProps) {
  const toggle = (color: string) => {
    if (selected.includes(color)) {
      onChange(selected.filter(c => c !== color))
    } else {
      onChange([...selected, color])
    }
  }

  return (
    <div className="flex gap-2">
      {COLOR_ORDER.map(color => {
        const c = MANA_COLORS[color]
        const isActive = selected.includes(color)
        return (
          <button
            key={color}
            type="button"
            onClick={() => toggle(color)}
            className="rounded-full flex items-center justify-center transition-all border-none cursor-pointer"
            style={{
              width: size,
              height: size,
              background: isActive ? c.accent : 'rgba(255,255,255,0.06)',
              opacity: isActive ? 1 : 0.4,
              fontSize: size * 0.5,
              boxShadow: isActive ? `0 0 ${size / 2}px ${c.glow}` : 'none',
            }}
          >
            {c.symbol}
          </button>
        )
      })}
    </div>
  )
}
