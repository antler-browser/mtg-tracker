import { useLocation, useNavigate } from 'react-router-dom'

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 flex justify-around items-end"
      style={{
        padding: '8px 24px env(safe-area-inset-bottom, 12px)',
        background: 'linear-gradient(180deg, transparent, rgba(10,10,15,0.97) 25%)',
      }}
    >
      {/* Decks tab */}
      <button
        onClick={() => navigate('/')}
        className="flex flex-col items-center gap-0.5 px-3 py-2 bg-transparent border-none cursor-pointer transition-opacity"
        style={{ opacity: path === '/' || path.startsWith('/decks') ? 1 : 0.35 }}
      >
        <span className="text-[22px]">⚔</span>
        <span
          className="text-[9px] font-bold tracking-[1px] uppercase font-mono"
          style={{ color: path === '/' || path.startsWith('/decks') ? '#4FC3F7' : '#fff' }}
        >
          Decks
        </span>
      </button>

      {/* Log Game (prominent) */}
      <button
        onClick={() => navigate('/log')}
        className="flex flex-col items-center gap-0.5 px-6 py-2.5 border-none cursor-pointer rounded-2xl mb-0.5 transition-all"
        style={{
          background: 'linear-gradient(135deg, #4FC3F7, #9C27B0)',
          boxShadow: path === '/log'
            ? '0 4px 24px rgba(79,195,247,0.5), 0 0 40px rgba(156,39,176,0.25)'
            : '0 2px 12px rgba(79,195,247,0.25)',
          transform: path === '/log' ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <span className="text-[20px] text-white font-extrabold leading-none">＋</span>
        <span className="text-[9px] font-bold tracking-[1px] uppercase font-mono text-white">
          Log Game
        </span>
      </button>

      {/* History tab */}
      <button
        onClick={() => navigate('/history')}
        className="flex flex-col items-center gap-0.5 px-3 py-2 bg-transparent border-none cursor-pointer transition-opacity"
        style={{ opacity: path === '/history' ? 1 : 0.35 }}
      >
        <span className="text-[22px]">📜</span>
        <span
          className="text-[9px] font-bold tracking-[1px] uppercase font-mono"
          style={{ color: path === '/history' ? '#4FC3F7' : '#fff' }}
        >
          History
        </span>
      </button>
    </div>
  )
}
