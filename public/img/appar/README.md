# Skärmbilder till appsidorna

Sidorna `/appar/laga` och `/appar/gymma` visar tre telefonramar var. Saknas en bildfil
ritas en platshållare i stället — sidorna går alltså att bygga och granska utan bilderna,
och byts ut av sig själva så fort filen finns här.

**Filnamnen är inte fria.** De läses ur `src/lib/apps.ts` (`screenshots[].file`). Lägg
filen här med exakt det namnet, så plockas den upp vid nästa bygge.

| Fil | App | Skärm att fånga |
|---|---|---|
| `laga-hem.png` | Laga | Hemflödet med receptkorten — helst med några riktiga recept och bilder |
| `laga-recept.png` | Laga | En receptdetalj: hero-bild, laga-logg, betyg |
| `laga-koklage.png` | Laga | Lägescookning, steg för steg |
| `gymma-start.png` | Gymma | Startvyn med veckoringen och snabbstart-chipsen |
| `gymma-logg.png` | Gymma | Loggvyn — den stora vikten, setpipsen, +/– |
| `gymma-folj-upp.png` | Gymma | Följ upp med de fyra månadsbrickorna |

## Så tar du dem

I iOS-simulatorn på Macen (`npx expo start` i respektive repo, tryck `i`):
`Cmd + S` sparar en skärmbild till skrivbordet. På telefonen fungerar en vanlig
skärmdump lika bra.

Välj gärna en modell utan dynamic island-krångel — ramen i `PhoneFrame` har
förhållandet 9:19,5, vilket motsvarar iPhone 14/15/16 Pro. Andra format funkar också,
de beskärs bara något på höjden.

## Format

`.png` rakt från simulatorn duger. Vill du hålla nere storleken kan du konvertera till
`.webp` — byt då även filnamnet i `src/lib/apps.ts`.

Undvik personuppgifter i bilderna: byt namn på gemenskapen och medlemmarna till något
neutralt innan du fotar, eftersom bilderna blir publika.
