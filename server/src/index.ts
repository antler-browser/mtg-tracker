/**
 * Cloudflare Worker with WebSocket for real-time user updates
 *
 * This is the main API entry point for the Local First Auth starter.
 * Endpoints handle user profile management via JWT-verified requests.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Context } from 'hono'
import type { Env } from './types'
import { Broadcaster } from './durable-object'
import { createDb } from './db/client'
import * as UserModel from './db/models/users'
import * as DeckModel from './db/models/decks'
import * as MatchModel from './db/models/matches'
import * as StatsModel from './db/models/stats'
import { decodeAndVerifyJWT } from '@starter/shared'

const app = new Hono<{ Bindings: Env }>()

// Enable CORS for all requests
app.use('/*', cors({
  origin: '*',
  credentials: true,
}))

/**
 * POST /api/add-user - Add or update user profile (without avatar)
 * Preserves existing avatar if user already exists
 */
app.post('/api/add-user', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt } = body

    if (!profileJwt) {
      return c.json({ error: 'Missing profileJwt' }, 400)
    }

    // Verify and decode the profile JWT
    const profilePayload = await decodeAndVerifyJWT(profileJwt)

    // Extract profile data
    const { did, name, socials } = profilePayload.data as {
      did: string
      name: string
      socials?: Array<{ platform: string; handle: string }>
    }

    // Create database instance and upsert user
    const db = createDb(c.env.DB)
    const user = await UserModel.addOrUpdateUser(
      db,
      did,
      name,
      socials ?? []
    )

    // Broadcast to all WebSocket clients via Durable Object
    await notifyDO(c, 'user-joined', user)

    return c.json(user)
  } catch (error) {
    console.error('Add user error:', error)
    return c.json(
      { error: 'Failed to add user', message: (error as Error).message },
      500
    )
  }
})

/**
 * POST /api/add-avatar - Add or update user avatar
 * Creates user with avatar only if doesn't exist yet
 */
app.post('/api/add-avatar', async (c) => {
  try {
    const body = await c.req.json()
    const { avatarJwt } = body

    if (!avatarJwt) {
      return c.json({ error: 'Missing avatarJwt' }, 400)
    }

    // Verify and decode the avatar JWT
    const avatarPayload = await decodeAndVerifyJWT(avatarJwt)

    // Extract DID from issuer and avatar from data
    const did = avatarPayload.iss
    const { avatar } = avatarPayload.data as { avatar: string }

    if (!avatar) {
      return c.json({ error: 'No avatar data in JWT' }, 400)
    }

    // Create database instance and upsert avatar
    const db = createDb(c.env.DB)
    const user = await UserModel.addOrUpdateUserAvatar(db, did, avatar)

    // Broadcast to all WebSocket clients via Durable Object
    await notifyDO(c, 'user-joined', user)

    return c.json(user)
  } catch (error) {
    console.error('Add avatar error:', error)
    return c.json(
      { error: 'Failed to add avatar', message: (error as Error).message },
      500
    )
  }
})

/**
 * DELETE /api/remove-user - Remove user
 * Requires JWT verification to ensure user is removing themselves
 */
app.delete('/api/remove-user', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt } = body

    if (!profileJwt) {
      return c.json({ error: 'Missing profileJwt' }, 400)
    }

    // Verify and decode the JWT to get the user's DID
    const payload = await decodeAndVerifyJWT(profileJwt)
    const did = payload.iss

    // Create database instance and delete user
    const db = createDb(c.env.DB)
    await UserModel.deleteUserByDID(db, did)

    // Broadcast to all WebSocket clients via Durable Object
    await notifyDO(c, 'user-left', { did })

    return c.json({ success: true, did })
  } catch (error) {
    console.error('Remove user error:', error)
    return c.json(
      { error: 'Failed to remove user', message: (error as Error).message },
      500
    )
  }
})

/**
 * GET /api/users - Get all users
 */
app.get('/api/users', async (c) => {
  try {
    const db = createDb(c.env.DB)
    const users = await UserModel.getAllUsers(db)
    return c.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json(
      { error: 'Failed to fetch users', message: (error as Error).message },
      500
    )
  }
})

/**
 * POST /api/reset - Reset event (admin only)
 * Broadcasts reset message and clears all non-admin users
 */
app.post('/api/reset', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt, message } = body

    if (!profileJwt) {
      return c.json({ error: 'Missing profileJwt' }, 400)
    }

    if (!message || typeof message !== 'string') {
      return c.json({ error: 'Missing or invalid message' }, 400)
    }

    // Verify and decode the JWT to get the user's DID
    const payload = await decodeAndVerifyJWT(profileJwt)
    const did = payload.iss

    // Check if user is admin
    const db = createDb(c.env.DB)
    const isAdmin = await UserModel.isUserAdmin(db, did)

    if (!isAdmin) {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403)
    }

    // Broadcast reset message to all connected clients
    await notifyDO(c, 'reset', { message })

    // Clear all non-admin users from database
    await UserModel.deleteNonAdminUsers(db)

    return c.json({ success: true })
  } catch (error) {
    console.error('Reset error:', error)
    return c.json(
      { error: 'Failed to reset', message: (error as Error).message },
      500
    )
  }
})

/**
 * Helper function to notify Durable Object about user changes
 */
async function notifyDO(c: Context<{ Bindings: Env }>, event: string, data: any): Promise<void> {
  try {
    const id = c.env.DURABLE_OBJECT.idFromName('default')
    const stub = c.env.DURABLE_OBJECT.get(id)
    await stub.fetch(new Request('http://do/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    }))
  } catch (err) {
    console.error('Error notifying Durable Object:', err)
  }
}

// ─── JWT from Authorization header (for GET endpoints) ─────────────

async function getDidFromHeader(c: Context<{ Bindings: Env }>): Promise<string> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing authorization')
  }
  const payload = await decodeAndVerifyJWT(authHeader.slice(7))
  return payload.iss
}

// ─── Deck Endpoints ────────────────────────────────────────────────

app.get('/api/decks', async (c) => {
  try {
    const userDid = await getDidFromHeader(c)
    const db = createDb(c.env.DB)
    const userDecks = await DeckModel.getDecksByUser(db, userDid)

    // Attach stats to each deck
    const decksWithStats = await Promise.all(
      userDecks.map(async (deck) => {
        const stats = await StatsModel.getDeckStats(db, deck.id)
        return { ...deck, stats }
      })
    )

    return c.json({ decks: decksWithStats })
  } catch (error) {
    return c.json({ error: 'Failed to fetch decks', message: (error as Error).message }, 500)
  }
})

app.get('/api/decks/:id', async (c) => {
  try {
    const userDid = await getDidFromHeader(c)
    const db = createDb(c.env.DB)
    const deck = await DeckModel.getDeckById(db, c.req.param('id'))

    if (!deck || deck.userDid !== userDid) {
      return c.json({ error: 'Deck not found' }, 404)
    }

    const stats = await StatsModel.getDeckStats(db, deck.id)
    const matchHistory = await MatchModel.getMatchesByUser(db, userDid, { deckId: deck.id, limit: 20 })

    return c.json({ deck: { ...deck, stats }, matches: matchHistory })
  } catch (error) {
    return c.json({ error: 'Failed to fetch deck', message: (error as Error).message }, 500)
  }
})

app.put('/api/decks/:id', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt, ...updates } = body

    if (!profileJwt) return c.json({ error: 'Missing profileJwt' }, 400)

    const payload = await decodeAndVerifyJWT(profileJwt)
    const db = createDb(c.env.DB)
    const deck = await DeckModel.getDeckById(db, c.req.param('id'))

    if (!deck || deck.userDid !== payload.iss) {
      return c.json({ error: 'Deck not found' }, 404)
    }

    const updated = await DeckModel.updateDeck(db, deck.id, updates)
    return c.json(updated)
  } catch (error) {
    return c.json({ error: 'Failed to update deck', message: (error as Error).message }, 500)
  }
})

app.delete('/api/decks/:id', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt } = body

    if (!profileJwt) return c.json({ error: 'Missing profileJwt' }, 400)

    const payload = await decodeAndVerifyJWT(profileJwt)
    const db = createDb(c.env.DB)
    const deck = await DeckModel.getDeckById(db, c.req.param('id'))

    if (!deck || deck.userDid !== payload.iss) {
      return c.json({ error: 'Deck not found' }, 404)
    }

    await DeckModel.deleteDeck(db, deck.id)
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete deck', message: (error as Error).message }, 500)
  }
})

// ─── Match Endpoints ───────────────────────────────────────────────

app.post('/api/matches', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt, playerCount, placements } = body

    if (!profileJwt) return c.json({ error: 'Missing profileJwt' }, 400)
    if (!playerCount || !placements || !Array.isArray(placements)) {
      return c.json({ error: 'Missing playerCount or placements' }, 400)
    }

    const payload = await decodeAndVerifyJWT(profileJwt)
    const db = createDb(c.env.DB)

    const match = await MatchModel.createMatchWithPlacements(db, {
      createdByDid: payload.iss,
      playerCount,
      placements,
    })

    await notifyDO(c, 'match-logged', match)

    return c.json(match)
  } catch (error) {
    console.error('Create match error:', error)
    return c.json({ error: 'Failed to create match', message: (error as Error).message }, 500)
  }
})

app.get('/api/matches', async (c) => {
  try {
    const userDid = await getDidFromHeader(c)
    const db = createDb(c.env.DB)
    const deckId = c.req.query('deckId')
    const limit = parseInt(c.req.query('limit') ?? '50')
    const offset = parseInt(c.req.query('offset') ?? '0')

    const matchHistory = await MatchModel.getMatchesByUser(db, userDid, { deckId, limit, offset })
    return c.json({ matches: matchHistory })
  } catch (error) {
    return c.json({ error: 'Failed to fetch matches', message: (error as Error).message }, 500)
  }
})

app.delete('/api/matches/:id', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt } = body

    if (!profileJwt) return c.json({ error: 'Missing profileJwt' }, 400)

    await decodeAndVerifyJWT(profileJwt)
    const db = createDb(c.env.DB)
    await MatchModel.deleteMatch(db, c.req.param('id'))

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete match', message: (error as Error).message }, 500)
  }
})

// ─── Stats Endpoint ────────────────────────────────────────────────

app.get('/api/stats', async (c) => {
  try {
    const userDid = await getDidFromHeader(c)
    const db = createDb(c.env.DB)
    const stats = await StatsModel.getOverallStats(db, userDid)
    return c.json(stats)
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats', message: (error as Error).message }, 500)
  }
})

/**
 * GET /api/ws - WebSocket endpoint for real-time updates
 * Forwards to Durable Object for connection management
 */
app.get('/api/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade')

  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket upgrade', 426)
  }

  // Forward WebSocket upgrade to Durable Object
  const id = c.env.DURABLE_OBJECT.idFromName('default')
  const stub = c.env.DURABLE_OBJECT.get(id)

  return stub.fetch(new Request('http://do/ws', {
    headers: c.req.raw.headers,
  }))
})
/**
 * GET /api - Root api endpoint - Used for health check
 */
app.get('/api', (c) => {
  return c.text('😁')
})

// Export Durable Object
export { Broadcaster }

// Export Worker fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },
}
