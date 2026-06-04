import sharp from 'sharp'

/**
 * Förbered en uppladdad bild för Claude — nedskalad till 800px JPEG (q60) för att
 * spara tokens. Returnerar base64 + media type. (Bilden sparas inte; den är endast
 * input till AI-extraktionen.)
 */
export async function prepareForClaude(
  buffer: Buffer,
): Promise<{ base64: string; mediaType: string }> {
  const resized = await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 60 })
    .toBuffer()

  return {
    base64: resized.toString('base64'),
    mediaType: 'image/jpeg',
  }
}
