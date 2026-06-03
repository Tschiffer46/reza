import { signIn } from '@/auth'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ skickat?: string }>
}) {
  const { skickat } = await searchParams

  async function sendMagicLink(formData: FormData) {
    'use server'
    const email = String(formData.get('email') ?? '').trim()
    if (!email) return
    await signIn('nodemailer', { email, redirectTo: '/dashboard' })
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-md mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Logga in</CardTitle>
          </CardHeader>
          <CardContent>
            {skickat ? (
              <div className="space-y-3 text-brand-muted">
                <p className="text-brand-ink font-semibold">Kolla din mejl 📧</p>
                <p>
                  Vi har skickat en inloggningslänk. Klicka på länken i mejlet för att
                  logga in. Länken gäller i 24 timmar.
                </p>
              </div>
            ) : (
              <form action={sendMagicLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-brand-header">
                    E-postadress
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="du@exempel.se"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Skicka inloggningslänk
                </Button>
                <p className="text-xs text-brand-muted">
                  Vi skickar en magisk länk till din e-post — inget lösenord behövs.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
