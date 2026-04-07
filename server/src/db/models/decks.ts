import { eq, and, desc, sql } from 'drizzle-orm'
import type { Database } from '../client.js'
import { decks, type Deck } from '../schema.js'

export type { Deck }

export async function getDecksByUser(db: Database, userDid: string): Promise<Deck[]> {
  return await db
    .select()
    .from(decks)
    .where(eq(decks.userDid, userDid))
    .orderBy(desc(decks.createdAt))
}

export async function getDeckById(db: Database, id: string): Promise<Deck | undefined> {
  const [deck] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, id))
    .limit(1)
  return deck
}

export async function getOrCreateDeck(
  db: Database,
  userDid: string,
  data: { name: string; commanderName?: string; manaColors?: string; imageUrl?: string; typeLine?: string }
): Promise<Deck> {
  // Check if deck with same name already exists for this user
  const [existing] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.userDid, userDid), eq(decks.name, data.name)))
    .limit(1)

  if (existing) {
    // Update with any new Scryfall data if provided
    if (data.commanderName || data.manaColors || data.imageUrl || data.typeLine) {
      const [updated] = await db
        .update(decks)
        .set({
          ...(data.commanderName && { commanderName: data.commanderName }),
          ...(data.manaColors && { manaColors: data.manaColors }),
          ...(data.imageUrl && { imageUrl: data.imageUrl }),
          ...(data.typeLine && { typeLine: data.typeLine }),
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(decks.id, existing.id))
        .returning()
      return updated
    }
    return existing
  }

  const id = crypto.randomUUID()
  const [deck] = await db
    .insert(decks)
    .values({
      id,
      userDid,
      name: data.name,
      commanderName: data.commanderName ?? null,
      manaColors: data.manaColors ?? null,
      imageUrl: data.imageUrl ?? null,
      typeLine: data.typeLine ?? null,
    })
    .returning()

  return deck
}

export async function updateDeck(
  db: Database,
  id: string,
  data: { name?: string; commanderName?: string; manaColors?: string; imageUrl?: string; typeLine?: string }
): Promise<Deck> {
  const [deck] = await db
    .update(decks)
    .set({
      ...data,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(decks.id, id))
    .returning()
  return deck
}

export async function deleteDeck(db: Database, id: string): Promise<void> {
  await db.delete(decks).where(eq(decks.id, id))
}
