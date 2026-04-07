import { useState, useRef, useEffect, useCallback } from 'react'

interface CommanderData {
  name: string
  colorIdentity: string[]
  imageUrl: string | null
  typeLine: string | null
}

interface CommanderSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect: (data: CommanderData) => void
  placeholder?: string
}

export function CommanderSearch({ value, onChange, onSelect, placeholder = 'Search commander...' }: CommanderSearchProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const cache = useRef(new Map<string, string[]>())
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchAutocomplete = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const cached = cache.current.get(query)
    if (cached) {
      setSuggestions(cached)
      setIsOpen(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`
      )
      const data = await res.json()
      const names: string[] = data.data ?? []
      cache.current.set(query, names)
      setSuggestions(names)
      setIsOpen(names.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (val: string) => {
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchAutocomplete(val), 300)
  }

  const handleSelect = async (name: string) => {
    onChange(name)
    setIsOpen(false)
    setSuggestions([])

    // Fetch full card details
    try {
      const query = `!"${name}" is:commander`
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards`
      )
      const data = await res.json()

      if (data.data && data.data.length > 0) {
        const card = data.data[0]
        onSelect({
          name: card.name,
          colorIdentity: card.color_identity ?? [],
          imageUrl: card.image_uris?.art_crop ?? card.image_uris?.normal ?? null,
          typeLine: card.type_line ?? null,
        })
      } else {
        onSelect({ name, colorIdentity: [], imageUrl: null, typeLine: null })
      }
    } catch {
      onSelect({ name, colorIdentity: [], imageUrl: null, typeLine: null })
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={e => handleInputChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none text-white text-[15px] font-semibold py-3"
        style={{ caretColor: '#4FC3F7' }}
      />
      {loading && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted text-xs">
          ...
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto"
          style={{
            background: '#1A1A25',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {suggestions.slice(0, 8).map((name, i) => (
            <button
              key={i}
              onClick={() => handleSelect(name)}
              className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-white/5 border-none bg-transparent cursor-pointer transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
