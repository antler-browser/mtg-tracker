import { createBrowserRouter } from 'react-router-dom'
import { App } from '../app'
import { Home } from './home'
import { LogGame } from './log-game'
import { History } from './history'
import { DeckDetail } from './deck-detail'
import { NotFound } from './not-found'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'log', element: <LogGame /> },
      { path: 'history', element: <History /> },
      { path: 'decks/:id', element: <DeckDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
