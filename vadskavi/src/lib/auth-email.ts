import type { EmailProviderSendVerificationRequestParams } from '@auth/core/providers/email'
import { createTransport } from 'nodemailer'

/** Publik bas-URL (faller tillbaka på vadskavi.nu om AUTH_URL saknas). */
export const PUBLIC_BASE_URL = process.env.AUTH_URL || 'https://vadskavi.nu'

/** Skriv om en URL så att protokoll+värd blir den publika adressen. */
export function canonicalUrl(input: string): string {
  try {
    const u = new URL(input)
    const base = new URL(PUBLIC_BASE_URL)
    u.protocol = base.protocol
    u.host = base.host
    return u.toString()
  } catch {
    return input
  }
}

/**
 * Svensk magic-link-mejl. Skickas av Auth.js Nodemailer-providern när en
 * användare begär inloggningslänk.
 */
export async function sendVerificationRequest(
  params: EmailProviderSendVerificationRequestParams,
) {
  const { identifier: email, provider } = params
  // Auth.js kan gissa fel värd bakom proxy (t.ex. 0.0.0.0:3000). Tvinga den
  // publika adressen så länken i mejlet alltid pekar på rätt domän.
  const url = canonicalUrl(params.url)
  const { host } = new URL(url)

  const transport = createTransport(provider.server)
  const result = await transport.sendMail({
    to: email,
    from: provider.from,
    subject: `Logga in på VadSkaVi`,
    text: `Logga in på VadSkaVi\n\nKlicka på länken för att logga in:\n${url}\n\nLänken gäller i 24 timmar. Om du inte begärt den kan du ignorera mejlet.\n`,
    html: htmlBody({ url, host }),
  })

  const rejected = (result.rejected ?? []).filter(Boolean)
  if (rejected.length) {
    throw new Error(`E-post till ${rejected.join(', ')} kunde inte skickas`)
  }
}

function htmlBody({ url, host }: { url: string; host: string }) {
  const header = '#1C3A2B'
  const accent = '#4CAF7D'
  return `
  <body style="background:#f4f8f5;font-family:Georgia,serif;margin:0;padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e0e8e3;">
      <tr>
        <td style="background:${header};padding:20px 24px;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;">VadSkaVi</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 24px;color:#1f2a24;">
          <h1 style="font-size:20px;margin:0 0 12px;">Logga in</h1>
          <p style="font-size:15px;line-height:1.5;margin:0 0 24px;color:#5b6b62;">
            Klicka på knappen nedan för att logga in på familjens receptbok.
          </p>
          <a href="${url}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:bold;">
            Logga in
          </a>
          <p style="font-size:13px;line-height:1.5;margin:24px 0 0;color:#8a978f;">
            Länken gäller i 24 timmar. Om du inte begärt den här inloggningen kan du
            ignorera mejlet.
          </p>
        </td>
      </tr>
    </table>
  </body>`
}
