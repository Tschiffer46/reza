# Plan: Extrahera recept från TikTok & Instagram

## Kontext
Användaren vill kunna klistra in en TikTok- eller Instagram-länk och automatiskt hämta receptet från videons caption/beskrivning. Amerikanska mått ska konverteras till svenska/metriska. Originalvideons URL ska sparas. Om receptet finns i kommentarerna (inte caption) kan användaren kopiera texten och använda det befintliga textläget som fallback.

## Tillvägagångssätt
Utöka den befintliga URL-extraktionen med smart detektering av sociala medier-URL:er. Ingen ny dependency behövs — `fetch` + regex för meta-taggar och inbäddad JSON räcker.

### Steg

#### 1. Ny fil: `src/lib/social.ts`
Social media-extraktionsmodul med:

- **`detectPlatform(url)`** — returnerar `'tiktok' | 'instagram' | null` baserat på hostname
- **`extractSocialMedia(url)`** — huvudfunktion som returnerar `{ platform, caption, author, title }` eller `null`
- **TikTok-strategi** (kör parallellt med `Promise.allSettled`):
  1. oEmbed API: `https://www.tiktok.com/oembed?url=...` → `title` (caption), `author_name`
  2. HTML-fetch → parse `og:description` meta-tagg + `__UNIVERSAL_DATA_FOR_REHYDRATION__` JSON-block
  3. Slå ihop: välj längsta caption-texten
- **Instagram-strategi**:
  1. HTML-fetch med browser-liknande User-Agent → parse `og:description` och `og:title`
  2. Vid misslyckande: kasta beskrivande felmeddelande som föreslår manuell textinmatning
- **Timeout**: `AbortController` med 10s timeout på alla fetch-anrop
- **Regex-helpers**: `extractMetaContent(html, property)` och `extractTikTokRehydration(html)`

#### 2. Modifiera: `src/lib/claude.ts`
Ny funktion `extractFromSocialMedia(captionText, platform, originalUrl, author)`:

- Använder Haiku 4.5 (samma som `extractFromText`)
- Utökat system-prompt med:
  - Konvertering av amerikanska mått → svenska (cups→dl, tbsp→msk, tsp→tsk, oz→g, lb→g, °F→°C)
  - Kontext att texten kommer från sociala medier och kan vara informell
  - Instruktion att sätta source till plattformsnamn
- Force-sätter `source` (t.ex. "TikTok — @chefmaria") och `url` (originallänken) på resultatet

#### 3. Modifiera: `src/app/api/extract/route.ts`
I URL-blocket (rad 38-60):

```typescript
if (url) {
  // 1. Försök social media-extraktion först
  const social = await extractSocialMedia(url)
  if (social) {
    const result = await extractFromSocialMedia(social.caption, social.platform, url, social.author)
    return NextResponse.json(result)
  }
  // 2. Fallback till befintlig generisk URL-hantering (oförändrad)
  ...
}
```

Om `extractSocialMedia` kastar fel → propagera till befintlig catch-block med svenskt felmeddelande.

#### 4. Modifiera: `src/app/entry/new/page.tsx`
Minimala UI-uppdateringar:
- URL-knappens beskrivning: "Hämta ett recept från en webbsida" → "Hämta recept från en webbsida, TikTok eller Instagram"
- URL-inputens placeholder: lägg till "eller TikTok/Instagram-länk"
- Valfritt: anpassa laddningstext vid sociala medier-URL:er

## Filer att ändra
| Fil | Åtgärd |
|-----|--------|
| `src/lib/social.ts` | **NY** — social media-extraktion |
| `src/lib/claude.ts` | Lägg till `extractFromSocialMedia()` |
| `src/app/api/extract/route.ts` | Importera och använd social-modulen |
| `src/app/entry/new/page.tsx` | Uppdatera UI-texter |

## Måttkonverteringstabell (i Claude-prompten)
- 1 cup = 2.5 dl
- 1 tablespoon (tbsp) = 1 msk
- 1 teaspoon (tsp) = 1 tsk
- 1 oz = 28 g
- 1 lb = 450 g
- 1 stick butter = 113 g smör
- °F → °C: (F-32)×5/9, avrunda till närmaste 5-tal
- 1 quart = ~1 liter, 1 pint = ~5 dl

## Verifiering
1. `npm run build` — kontrollera att allt kompilerar utan fel
2. Testa med en riktig TikTok-URL (t.ex. en populär matkreatör)
3. Testa med en Instagram-URL
4. Testa med en vanlig URL (ska fortfarande fungera som innan)
5. Testa fallback: om social-hämtning misslyckas, bör felmeddelande visas
