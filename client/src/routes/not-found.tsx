import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="text-center py-20 px-4">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-text-secondary text-sm mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="btn-gradient inline-block px-6 py-3 text-sm no-underline"
      >
        Go Home
      </Link>
    </div>
  )
}
