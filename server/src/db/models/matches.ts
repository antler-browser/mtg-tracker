import { eq, desc, and, sql, inArray } from 'drizzle-orm'
import type { Database } from '../client.js'
import { matches, matchPlacements, decks } from '../schema.js'
import { getOrCreateDeck } from './decks.js'

export type MatchWithPlacements = typeof matches.$inferSelect & {
  placements: (typeof matchPlacements.$inferSelect)[]
}

interface PlacementInput {
  deckName: string
  placement: number
  isOwner: boolean
  // Only for owner's deck - Scryfall data for auto-creation
  commanderName?: string
  manaColors?: string
  imageUrl?: string
  typeLine?: string
}

export async function createMatchWithPlacements(
  db: Database,
  data: {
    createdByDid: string
    playerCount: number
    placements: PlacementInput[]
  }
): Promise<MatchWithPlacements> {
  const matchId = crypto.randomUUID()

  // Auto-create/get the owner's deck
  let ownerDeckId: string | null = null
  const ownerPlacement = data.placements.find(p => p.isOwner)
  if (ownerPlacement) {
    const deck = await getOrCreateDeck(db, data.createdByDid, {
      name: ownerPlacement.deckName,
      commanderName: ownerPlacement.commanderName,
      manaColors: ownerPlacement.manaColors,
      imageUrl: ownerPlacement.imageUrl,
      typeLine: ownerPlacement.typeLine,
    })
    ownerDeckId = deck.id
  }

  // Insert match
  const [match] = await db
    .insert(matches)
    .values({
      id: matchId,
      createdByDid: data.createdByDid,
      playerCount: data.playerCount,
    })
    .returning()

  // Insert placements
  const placementValues = data.placements.map(p => ({
    id: crypto.randomUUID(),
    matchId,
    deckId: p.isOwner ? ownerDeckId : null,
    deckName: p.deckName,
    placement: p.placement,
    isOwner: p.isOwner,
  }))

  await db.insert(matchPlacements).values(placementValues)

  const insertedPlacements = await db
    .select()
    .from(matchPlacements)
    .where(eq(matchPlacements.matchId, matchId))
    .orderBy(matchPlacements.placement)

  return { ...match, placements: insertedPlacements }
}

export async function getMatchesByUser(
  db: Database,
  userDid: string,
  opts: { deckId?: string; limit?: number; offset?: number } = {}
): Promise<MatchWithPlacements[]> {
  const limit = opts.limit ?? 50
  const offset = opts.offset ?? 0

  // Get the user's deck IDs
  const userDecks = await db
    .select({ id: decks.id })
    .from(decks)
    .where(eq(decks.userDid, userDid))

  const deckIds = userDecks.map(d => d.id)
  if (deckIds.length === 0) return []

  // Find match IDs where user participated
  let matchQuery = db
    .select({ matchId: matchPlacements.matchId })
    .from(matchPlacements)
    .where(
      opts.deckId
        ? eq(matchPlacements.deckId, opts.deckId)
        : inArray(matchPlacements.deckId, deckIds)
    )
    .groupBy(matchPlacements.matchId)

  // Get matches ordered by playedAt
  const matchRows = await db
    .select()
    .from(matches)
    .where(
      inArray(
        matches.id,
        matchQuery
      )
    )
    .orderBy(desc(matches.playedAt))
    .limit(limit)
    .offset(offset)

  if (matchRows.length === 0) return []

  // Get all placements for these matches
  const matchIds = matchRows.map(m => m.id)
  const allPlacements = await db
    .select()
    .from(matchPlacements)
    .where(inArray(matchPlacements.matchId, matchIds))
    .orderBy(matchPlacements.placement)

  // Group placements by match
  const placementsByMatch = new Map<string, (typeof matchPlacements.$inferSelect)[]>()
  for (const p of allPlacements) {
    const list = placementsByMatch.get(p.matchId) ?? []
    list.push(p)
    placementsByMatch.set(p.matchId, list)
  }

  return matchRows.map(m => ({
    ...m,
    placements: placementsByMatch.get(m.id) ?? [],
  }))
}

export async function deleteMatch(db: Database, matchId: string): Promise<void> {
  await db.delete(matchPlacements).where(eq(matchPlacements.matchId, matchId))
  await db.delete(matches).where(eq(matches.id, matchId))
}
