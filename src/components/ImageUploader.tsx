'use client'

import { useState, useRef } from 'react'

interface ImageUploaderProps {
  onUploaded: (filenames: string[]) => void
}

export function ImageUploader({ onUploaded }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    const newPreviews: string[] = []

    for (const file of Array.from(files)) {
      formData.append('files', file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setPreviews((prev) => [...prev, ...newPreviews])

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const data = await res.json()
      onUploaded(data.filenames)
    }

    setUploading(false)
  }

  return (
    <div className="space-y-3">
      {/* Preview thumbnails */}
      {previews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {previews.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          disabled={uploading}
          className="flex-1 py-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-700 font-medium hover:bg-amber-50 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Laddar upp...' : '📷 Ta foto'}
        </button>
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          disabled={uploading}
          className="flex-1 py-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-700 font-medium hover:bg-amber-50 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Laddar upp...' : '🖼️ Välj bild'}
        </button>
      </div>

      {/* Camera input — opens camera on mobile */}
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Gallery input — opens photo library / file picker */}
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
