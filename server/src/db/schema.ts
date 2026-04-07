import { sql } from 'drizzle-orm'
import { text, index, sqliteTable, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  did: text('did').notNull().primaryKey(),
  name: text('name'),
  avatar: text('avatar'),
  socials: text('socials'), // JSON array of strings: ["platform:handle", "platform:handle"]
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt : integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('idx_users_created_at').on(table.createdAt),
])

export type User = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert

// ─── Decks ────────────────────────────────────────────
export const decks = sqliteTable('decks', {
  id: text('id').notNull().primaryKey(),
  userDid: text('user_did').notNull(),
  name: text('name').notNull(),
  commanderName: text('commander_name'),
  manaColors: text('mana_colors'), // comma-separated: "W,U,B"
  imageUrl: text('image_url'),
  typeLine: text('type_line'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('idx_decks_user_did').on(table.userDid),
])

export type Deck = typeof decks.$inferSelect
export type DeckInsert = typeof decks.$inferInsert

// ─── Matches ──────────────────────────────────────────
export const matches = sqliteTable('matches', {
  id: text('id').notNull().primaryKey(),
  createdByDid: text('created_by_did').notNull(),
  playerCount: integer('player_count').notNull(),
  playedAt: integer('played_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('idx_matches_created_by').on(table.createdByDid),
  index('idx_matches_played_at').on(table.playedAt),
])

export type Match = typeof matches.$inferSelect
export type MatchInsert = typeof matches.$inferInsert

// ─── Match Placements ─────────────────────────────────
export const matchPlacements = sqliteTable('match_placements', {
  id: text('id').notNull().primaryKey(),
  matchId: text('match_id').notNull(),
  deckId: text('deck_id'), // nullable for opponent decks
  deckName: text('deck_name').notNull(),
  placement: integer('placement').notNull(),
  isOwner: integer('is_owner', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('idx_placements_match_id').on(table.matchId),
  index('idx_placements_deck_id').on(table.deckId),
])
