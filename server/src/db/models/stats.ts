import { eq, sql, desc, and, inArray, count } from 'drizzle-orm'
import type { Database } from '../client.js'
import { decks, matches, matchPlacements } from '../schema.js'

export interface DeckStats {
  wins: number
  losses: number
  totalGames: number
  streak: number
  streakType: 'W' | 'L' | ''
  recentResults: ('W' | 'L')[]
}

export interface OverallStats {
  totalGames: number
  totalWins: number
  winRate: number
  deckCount: number
}

export async function getDeckStats(db: Database, deckId: string): Promise<DeckStats> {
  // Get aggregate wins/total
  const [agg] = await db
    .select({
      totalGames: count(),
      wins: sql<number>`SUM(CASE WHEN ${matchPlacements.placement} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(matchPlacements)
    .where(eq(matchPlacements.deckId, deckId))

  const totalGames = agg?.totalGames ?? 0
  const wins = agg?.wins ?? 0
  const losses = totalGames - wins

  // Get recent 10 results ordered by match playedAt
  const recent = await db
    .select({
      placement: matchPlacements.placement,
    })
    .from(matchPlacements)
    .innerJoin(matches, eq(matches.id, matchPlacements.matchId))
    .where(eq(matchPlacements.deckId, deckId))
    .orderBy(desc(matches.playedAt))
    .limit(10)

  const recentResults: ('W' | 'L')[] = recent.map(r => r.placement === 1 ? 'W' : 'L')

  // Compute streak from recent results
  let streak = 0
  let streakType: 'W' | 'L' | '' = ''
  if (recentResults.length > 0) {
    streakType = recentResults[0]
    for (const r of recentResults) {
      if (r === streakType) streak++
      else break
    }
  }

  return { wins, losses, totalGames, streak, streakType, recentResults }
}

export async function getOverallStats(db: Database, userDid: string): Promise<OverallStats> {
  // Get user's deck IDs
  const userDecks = await db
    .select({ id: decks.id })
    .from(decks)
    .where(eq(decks.userDid, userDid))

  const deckIds = userDecks.map(d => d.id)
  const deckCount = deckIds.length

  if (deckIds.length === 0) {
    return { totalGames: 0, totalWins: 0, winRate: 0, deckCount: 0 }
  }

  const [agg] = await db
    .select({
      totalGames: count(),
      totalWins: sql<number>`SUM(CASE WHEN ${matchPlacements.placement} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(matchPlacements)
    .where(inArray(matchPlacements.deckId, deckIds))

  const totalGames = agg?.totalGames ?? 0
  const totalWins = agg?.totalWins ?? 0
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  return { totalGames, totalWins, winRate, deckCount }
}
