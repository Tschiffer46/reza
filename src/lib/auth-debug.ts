// TILLFÄLLIG diagnostik: fångar de senaste Auth.js-felen i minnet så de kan
// läsas via /api/debug/auth-errors (skyddad av en nyckel). Tas bort när
// OAuth-felsökningen är klar.

type AuthErrorRecord = {
  at: string
  message: string
  name?: string
  stack?: string
}

const store = globalThis as unknown as { __authErrors?: AuthErrorRecord[] }
store.__authErrors ||= []

export function recordAuthError(err: unknown): void {
  const e = err as { message?: string; name?: string; stack?: string; cause?: unknown }
  const cause = e?.cause as { message?: string } | undefined
  store.__authErrors!.unshift({
    at: new Date().toISOString(),
    name: e?.name,
    message: cause?.message ? `${e?.message} | cause: ${cause.message}` : e?.message ?? String(err),
    stack: typeof e?.stack === 'string' ? e.stack.split('\n').slice(0, 6).join('\n') : undefined,
  })
  store.__authErrors = store.__authErrors!.slice(0, 10)
}

export function getAuthErrors(): AuthErrorRecord[] {
  return store.__authErrors ?? []
}
