import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useDecks } from '../hooks/useDecks'
import { CommanderSearch } from '../components/CommanderSearch'
import { ManaPips } from '../components/ManaPips'

interface DeckSlot {
  id: number
  name: string
  isYou: boolean
  // Scryfall data (only for your deck)
  commanderName?: string
  manaColors?: string[]
  imageUrl?: string | null
  typeLine?: string | null
}

export function LogGame() {
  const navigate = useNavigate()
  const { apiPost } = useApi()
  const { decks } = useDecks()
  const [step, setStep] = useState(0)
  const [playerCount, setPlayerCount] = useState(4)
  const [slots, setSlots] = useState<DeckSlot[]>([])
  const [placements, setPlacements] = useState<DeckSlot[]>([])
  const [saving, setSaving] = useState(false)
  const [commanderQueries, setCommanderQueries] = useState<Record<number, string>>({})
  const [selectedExistingDeck, setSelectedExistingDeck] = useState<string | null>(null)

  useEffect(() => {
    if (step === 1) {
      const s = Array.from({ length: playerCount }, (_, i) => ({
        id: i,
        name: '',
        isYou: i === 0,
      }))
      setSlots(s)
      setCommanderQueries({})
      setSelectedExistingDeck(null)
    }
  }, [step, playerCount])

  const handleDeckChange = (idx: number, val: string) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, name: val } : s))
  }

  const handleCommanderSelect = (slotIndex: number, data: { name: string; colorIdentity: string[]; imageUrl: string | null; typeLine: string | null }) => {
    setSlots(prev => prev.map((s, i) =>
      i === slotIndex
        ? {
            ...s,
            name: data.name,
            commanderName: data.name,
            manaColors: data.colorIdentity,
            imageUrl: data.imageUrl,
            typeLine: data.typeLine,
          }
        : s
    ))
  }

  const handleExistingDeckSelect = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return

    setSelectedExistingDeck(deckId)
    setCommanderQueries(prev => ({ ...prev, 0: deck.commanderName ?? deck.name }))
    setSlots(prev => prev.map((s, i) =>
      i === 0
        ? {
            ...s,
            name: deck.name,
            commanderName: deck.commanderName ?? undefined,
            manaColors: deck.manaColors?.split(',').filter(Boolean) ?? [],
            imageUrl: deck.imageUrl,
            typeLine: deck.typeLine,
          }
        : s
    ))
  }

  const handlePlace = (slot: DeckSlot) => {
    if (placements.find(p => p.id === slot.id)) return
    setPlacements(prev => [...prev, slot])
  }

  const handleUnplace = (idx: number) => {
    setPlacements(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const placementData = placements.map((p, idx) => ({
        deckName: p.name || `Player ${p.id + 1}`,
        placement: idx + 1,
        isOwner: p.isYou,
        commanderName: p.commanderName,
        manaColors: p.manaColors?.join(','),
        imageUrl: p.imageUrl,
        typeLine: p.typeLine,
      }))

      const res = await apiPost('/api/matches', {
        playerCount,
        placements: placementData,
      })

      if (res.ok) {
        navigate('/')
      }
    } catch (err) {
      console.error('Failed to save match:', err)
    } finally {
      setSaving(false)
    }
  }

  const canContinueStep2 = slots[0]?.name?.length > 0
  const allPlaced = placements.length === playerCount

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step === 0 ? navigate('/') : setStep(step - 1)}
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg text-white cursor-pointer border-none"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          ←
        </button>
        <div>
          <div className="text-xl font-extrabold text-white font-display">Log Game</div>
          <div className="text-[11px] text-text-muted font-mono">Step {step + 1} of 3</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] rounded-sm mb-7" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-sm transition-[width] duration-400"
          style={{
            width: `${((step + 1) / 3) * 100}%`,
            background: 'linear-gradient(90deg, #4FC3F7, #9C27B0)',
          }}
        />
      </div>

      {/* Step 0: Player Count */}
      {step === 0 && (
        <div>
          <div className="text-[15px] text-text-secondary font-semibold mb-5">
            How many players?
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className="py-5 rounded-2xl border-none cursor-pointer text-white text-[28px] font-extrabold transition-all"
                style={{
                  background: playerCount === n
                    ? 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(156,39,176,0.15))'
                    : 'rgba(255,255,255,0.04)',
                  border: playerCount === n
                    ? '1px solid rgba(79,195,247,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {n}
                <div className="text-[10px] font-medium text-text-muted mt-1 font-mono">
                  players
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full mt-6 py-4 btn-gradient text-[15px]"
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 1: Deck Names */}
      {step === 1 && (
        <div>
          <div className="text-[15px] text-text-secondary font-semibold mb-5">
            Enter deck names
          </div>

          {/* Existing decks quick-select */}
          {decks.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] text-text-muted font-mono tracking-[1px] uppercase mb-2">
                Your decks
              </div>
              <div className="flex flex-wrap gap-2">
                {decks.map(d => (
                  <button
                    key={d.id}
                    onClick={() => handleExistingDeckSelect(d.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all"
                    style={{
                      background: selectedExistingDeck === d.id
                        ? 'rgba(79,195,247,0.15)'
                        : 'rgba(255,255,255,0.06)',
                      color: selectedExistingDeck === d.id ? '#4FC3F7' : 'rgba(255,255,255,0.5)',
                      border: selectedExistingDeck === d.id
                        ? '1px solid rgba(79,195,247,0.3)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {slots.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-[14px]"
                style={{
                  padding: '4px 4px 4px 14px',
                  background: s.isYou ? 'rgba(79,195,247,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.isYou ? 'rgba(79,195,247,0.15)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <span
                  className="text-[10px] font-bold font-mono min-w-[28px]"
                  style={{ color: s.isYou ? '#4FC3F7' : 'rgba(255,255,255,0.25)' }}
                >
                  {s.isYou ? 'YOU' : `P${i + 1}`}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <CommanderSearch
                      value={commanderQueries[i] ?? ''}
                      onChange={(val) => {
                        setCommanderQueries(prev => ({ ...prev, [i]: val }))
                        if (s.isYou) setSelectedExistingDeck(null)
                        handleDeckChange(i, val)
                      }}
                      onSelect={(data) => handleCommanderSelect(i, data)}
                      placeholder={s.isYou ? 'Search commander...' : `Player ${i + 1}'s commander...`}
                    />
                  </div>
                  {s.manaColors && s.manaColors.length > 0 && (
                    <ManaPips colors={s.manaColors} size={14} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Commander image preview */}
          {slots[0]?.imageUrl && (
            <div className="mt-4 rounded-xl overflow-hidden h-24"
              style={{
                backgroundImage: `url(${slots[0].imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.6,
              }}
            />
          )}

          <button
            onClick={() => { setStep(2); setPlacements([]) }}
            disabled={!canContinueStep2}
            className="w-full mt-6 py-4 btn-gradient text-[15px] disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Results */}
      {step === 2 && (
        <div>
          <div className="text-[15px] text-text-secondary font-semibold mb-1.5">
            Tap decks in finishing order
          </div>
          <div className="text-[11px] text-text-muted mb-5">
            1st place first, last place last
          </div>

          {/* Placement slots */}
          <div className="flex flex-col gap-1.5 mb-5">
            {Array.from({ length: playerCount }).map((_, i) => {
              const placed = placements[i]
              const ordinal = ['1st', '2nd', '3rd', '4th'][i]
              const isFirst = i === 0
              return (
                <div
                  key={i}
                  onClick={() => placed && handleUnplace(i)}
                  className="flex items-center gap-2.5 py-3.5 px-4 rounded-xl transition-all"
                  style={{
                    cursor: placed ? 'pointer' : 'default',
                    background: placed
                      ? isFirst ? 'rgba(102,187,106,0.08)' : 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px dashed ${placed
                      ? (isFirst ? 'rgba(102,187,106,0.3)' : 'rgba(255,255,255,0.1)')
                      : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span
                    className="text-xs font-extrabold font-mono min-w-[28px]"
                    style={{ color: isFirst && placed ? '#66BB6A' : 'rgba(255,255,255,0.3)' }}
                  >
                    {ordinal}
                  </span>
                  {placed ? (
                    <span className="text-[15px] font-bold text-white">
                      {placed.name || `Player ${placed.id + 1}`}
                      {placed.isYou && (
                        <span className="text-accent-blue text-[10px] ml-1.5">YOU</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Available to place */}
          {placements.length < playerCount && (
            <div className="flex flex-wrap gap-2">
              {slots
                .filter(s => !placements.find(p => p.id === s.id))
                .map(s => (
                  <button
                    key={s.id}
                    onClick={() => handlePlace(s)}
                    className="px-4 py-2.5 rounded-xl border-none cursor-pointer text-white text-[13px] font-semibold transition-all"
                    style={{
                      background: s.isYou ? 'rgba(79,195,247,0.1)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${s.isYou ? 'rgba(79,195,247,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {s.name || `Player ${s.id + 1}`} {s.isYou && '⭐'}
                  </button>
                ))}
            </div>
          )}

          {allPlaced && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-5 py-4 rounded-[14px] border-none text-white text-[15px] font-bold cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #66BB6A, #2E7D32)',
                boxShadow: '0 4px 20px rgba(102,187,106,0.3)',
              }}
            >
              {saving ? 'Saving...' : '✓ Save Game'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
