'use client'

import { useRef, useState } from 'react'
import { Camera, ImageIcon, X } from 'lucide-react'

/**
 * Laddar upp receptfoton till /api/upload och håller en lista med sparade
 * filnamn. Anropar onChange med aktuell filnamnslista.
 */
export function PhotoUploader({
  value,
  onChange,
}: {
  value: string[]
  onChange: (filenames: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    setUploading(true)
    const fd = new FormData()
    Array.from(list).forEach((f) => fd.append('files', f))
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const data = await res.json()
      onChange([...value, ...(data.filenames || [])])
    }
    setUploading(false)
  }

  function remove(filename: string) {
    onChange(value.filter((f) => f !== filename))
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {value.map((f) => (
            <div key={f} className="relative h-20 w-20 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/images/${f}`} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => remove(f)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-header text-white"
                aria-label="Ta bort bild"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          disabled={uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-accent/10 py-2.5 text-sm text-brand-accent-dark hover:bg-brand-accent/20 disabled:opacity-50"
        >
          <Camera className="h-4 w-4" /> Ta foto
        </button>
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          disabled={uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-accent/10 py-2.5 text-sm text-brand-accent-dark hover:bg-brand-accent/20 disabled:opacity-50"
        >
          <ImageIcon className="h-4 w-4" /> {uploading ? 'Laddar upp…' : 'Välj bild'}
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
