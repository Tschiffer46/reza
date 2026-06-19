import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads'

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

/** Spara uppladdad bild som WebP, max 1200px. Returnerar filnamn (UUID.webp). */
export async function saveImage(buffer: Buffer): Promise<string> {
  await ensureDir()
  const filename = `${randomUUID()}.webp`
  await sharp(buffer)
    // .rotate() utan argument läser EXIF-orienteringen och roterar bilden rätt
    // (annars hamnar telefonfoton på sidan/upp-och-ner). Måste ske före resize.
    .rotate()
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(UPLOAD_DIR, filename))
  return filename
}

/** Läs en bildfil från uploads-katalogen (path-traversal-skyddad). */
export async function readImage(filename: string): Promise<Buffer | null> {
  const safe = path.basename(filename)
  try {
    return await fs.readFile(path.join(UPLOAD_DIR, safe))
  } catch {
    return null
  }
}

/** Radera en bildfil från uploads-katalogen. */
export async function deleteImage(filename: string): Promise<void> {
  const safe = path.basename(filename)
  try {
    await fs.unlink(path.join(UPLOAD_DIR, safe))
  } catch {
    // redan borta — ignorera
  }
}

/**
 * Förbered en bild för Claude — nedskalad till 800px JPEG (q60) för att spara
 * tokens. Returnerar base64 + media type. (Används för AI-extraktion.)
 */
export async function prepareForClaude(
  buffer: Buffer,
): Promise<{ base64: string; mediaType: string }> {
  const resized = await sharp(buffer)
    .rotate()
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 60 })
    .toBuffer()
  return { base64: resized.toString('base64'), mediaType: 'image/jpeg' }
}
