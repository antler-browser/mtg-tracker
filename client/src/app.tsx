import { Outlet } from 'react-router-dom'
import { Onboarding } from 'local-first-auth/react'
import { AuthProvider, useLocalFirstAuth } from './hooks/useLocalFirstAuth'
import { BottomNav } from './components/BottomNav'

function Layout() {
  const {
    user,
    loading,
    error,
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    handleOnboardingComplete,
  } = useLocalFirstAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary text-sm font-mono">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <div className="text-text-primary font-bold text-lg mb-2">Error</div>
          <div className="text-text-secondary text-sm">{error}</div>
        </div>
      </div>
    )
  }

  // Login required - show onboarding if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="fixed top-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(79,195,247,0.08) 0%, transparent 70%)' }} />
        <div className="fixed bottom-[-50px] left-[-50px] w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(156,39,176,0.06) 0%, transparent 70%)' }} />

        <div className="text-center z-10 px-6">
          <div className="text-xs text-text-muted font-mono tracking-[3px] uppercase mb-2">Commander</div>
          <h1 className="text-3xl font-display font-extrabold text-text-primary mb-3">Battle Log</h1>
          <p className="text-text-secondary text-sm mb-8 max-w-[260px] mx-auto">
            Track your Commander matches, decks, and win rates
          </p>
          <button
            onClick={() => setIsOnboardingModalOpen(true)}
            className="btn-gradient px-8 py-4 text-[15px]"
          >
            Get Started
          </button>
        </div>

        {isOnboardingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOnboardingModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-auto rounded-2xl shadow-2xl">
              <Onboarding
                skipSocialStep={true}
                onComplete={handleOnboardingComplete}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,195,247,0.06) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-50px] left-[-50px] w-[250px] h-[250px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(156,39,176,0.05) 0%, transparent 70%)' }} />

      <main className="relative z-10 max-w-[430px] mx-auto pb-24">
        <Outlet />
      </main>

      <BottomNav />

      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOnboardingModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-auto rounded-2xl shadow-2xl">
            <Onboarding
              skipSocialStep={true}
              onComplete={handleOnboardingComplete}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}
