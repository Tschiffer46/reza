export interface EntryDTO {
  id: string
  type: string
  title: string
  category: string
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
