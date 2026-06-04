'use client'

import { useRef, useState } from 'react'
import { Camera, ImageIcon } from 'lucide-react'

/**
 * Väljer bild(er) för AI-extraktion. Lämnar File-objekten till föräldern (laddas
 * inte upp till servern — de skickas direkt till /api/extract).
 */
export function ImageUploader({ onSelected }: { onSelected: (files: File[]) => void }) {
  const [previews, setPreviews] = useState<string[]>([])
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    const files = Array.from(list).slice(0, 3)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
    onSelected(files)
  }

  return (
    <div className="space-y-3">
      {previews.length > 0 && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-20 w-20 flex-shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-accent/10 py-3 text-brand-accent-dark hover:bg-brand-accent/20"
        >
          <Camera className="h-5 w-5" /> Ta foto
        </button>
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-accent/10 py-3 text-brand-accent-dark hover:bg-brand-accent/20"
        >
          <ImageIcon className="h-5 w-5" /> Välj bild
        </button>
      </div>

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  )
}
