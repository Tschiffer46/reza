'use client'

import { EntryForm } from './EntryForm'

interface ExtractedData {
  type: string
  title: string
  category: string
  ingredients: string[]
  instructions: string | null
  content: string | null
  source: string | null
}

interface ExtractPreviewProps {
  data: ExtractedData
  imageFilenames?: string[]
  onCancel: () => void
}

export function ExtractPreview({ data, imageFilenames, onCancel }: ExtractPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-green-700 text-sm font-medium">
          AI har extraherat data — granska och redigera innan du sparar.
        </p>
      </div>

      <EntryForm
        initialData={{
          type: data.type,
          title: data.title,
          category: data.category,
          ingredients: data.ingredients || [],
          instructions: data.instructions,
          content: data.content,
          source: data.source,
          url: null,
          notes: null,
        }}
        imageFilenames={imageFilenames}
      />

      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 text-amber-600 hover:text-amber-800 text-sm"
      >
        Avbryt och börja om
      </button>
    </div>
  )
}
