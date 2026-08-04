import Image from 'next/image'
import fs from 'node:fs'
import path from 'node:path'
import type { AppScreenshot } from '@/lib/apps'

/** Finns skärmbilden på disk? Körs vid bygget (sidorna är statiska). */
function screenshotExists(file: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', 'img', 'appar', file))
  } catch {
    return false
  }
}

/**
 * Telefonram runt en skärmbild.
 *
 * Saknas bildfilen ritas en varumärkt platshållare i stället för att sidan går
 * sönder eller visar en trasig bild-ikon. Sidorna kan därmed byggas och
 * granskas innan skärmbilderna är tagna — släpp bara in filerna i
 * `public/img/appar/` (namnen står i `src/lib/apps.ts`) så byts de ut.
 */
export function PhoneFrame({ shot }: { shot: AppScreenshot }) {
  const has = screenshotExists(shot.file)

  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="relative aspect-[9/19.5] w-full max-w-[240px] overflow-hidden rounded-[2rem] border-[6px] border-app-ink/85 bg-app-surface shadow-xl shadow-black/10">
        {has ? (
          <Image
            src={`/img/appar/${shot.file}`}
            alt={shot.alt}
            fill
            sizes="240px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="h-1.5 w-10 rounded-full bg-app-accent" aria-hidden />
            <span className="text-sm font-semibold text-app-ink/70">{shot.caption}</span>
            <span className="text-xs text-app-ink/45">Skärmbild kommer</span>
          </div>
        )}
      </div>
      <figcaption className="text-sm text-brand-muted">{shot.caption}</figcaption>
    </figure>
  )
}
