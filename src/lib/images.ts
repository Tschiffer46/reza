import sharp from 'sharp'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads'

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

/** Save an uploaded image as WebP, max 1200px wide. Returns filename. */
export async function saveImage(buffer: Buffer): Promise<string> {
  await ensureDir()
  const filename = `${randomUUID()}.webp`
  const filepath = path.join(UPLOAD_DIR, filename)

  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath)

  return filename
}

/** Resize image for Claude API — smaller to save tokens. Returns base64 + media type. */
export async function prepareForClaude(buffer: Buffer): Promise<{ base64: string; mediaType: string }> {
  const resized = await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 60 })
    .toBuffer()

  return {
    base64: resized.toString('base64'),
    mediaType: 'image/jpeg',
  }
}

/** Read an image file from uploads directory. Returns buffer or null. */
export async function readImage(filename: string): Promise<Buffer | null> {
  // Prevent path traversal
  const safe = path.basename(filename)
  const filepath = path.join(UPLOAD_DIR, safe)

  try {
    return await fs.readFile(filepath)
  } catch {
    return null
  }
}

/** Delete an image from uploads directory. */
export async function deleteImage(filename: string): Promise<void> {
  const safe = path.basename(filename)
  const filepath = path.join(UPLOAD_DIR, safe)

  try {
    await fs.unlink(filepath)
  } catch {
    // Ignore if already deleted
  }
}
