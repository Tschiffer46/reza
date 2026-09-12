export interface EntryDTO {
  id: string
  type: string
  title: string
  category: string
  blurb?: string | null
  time?: string | null
  servings?: number | null
  ingredients: string[]
  instructions: string | null
  content: string | null
  drinks: string | null
  source: string | null
  url: string | null
  imageUrls: string[]
  timesCooked: number
  ratingAvg?: number | null
  ratingCount?: number
  lastCooked: string | null
  createdAt: string
  /** "family" = syns i gemenskaperna nedan, "private" = bara för skaparen. */
  visibility?: 'family' | 'private'
  /** Primär-/ursprungsgemenskap. */
  family?: { id: string; name: string }
  /** Alla gemenskaper receptet syns i (tom lista = privat). */
  families?: { id: string; name: string }[]
  cookedBy?: { name: string; n: number }[]
  heartCount?: number
  commentCount?: number
}

export interface CommentDTO {
  id: string
  text: string
  createdAt: string
  author: { name: string | null; email: string | null }
}

export interface CategoryDTO {
  id: string
  name: string
  type: string
}
