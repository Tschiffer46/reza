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
  lastCooked: string | null
  createdAt: string
  family?: { id: string; name: string }
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
