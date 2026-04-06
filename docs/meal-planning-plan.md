# Måltidsplanering — Implementationsplan

## Context
Reza är en receptsamlings-app för 2 användare. Vi lägger till en helt ny sektion för måltidsplanering med tre delar: planera måltider från receptlistan, se/hantera planerade måltider, och generera inköpslista. Appen är mobilfokuserad (PWA), svenskspråkig, och använder amber-färgschemat.

**Användarens val:**
- Tidsperiod: 7 dagar framåt (rullande, inte veckobaserat)
- Måltider per dag: Flera (frukost, lunch, middag)
- Ingredienskategorisering: AI via Claude Haiku

---

## 1. Databasschema (Prisma)

### Nya modeller i `prisma/schema.prisma`

```prisma
model MealPlan {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  mealType  String   // "breakfast" | "lunch" | "dinner"
  entryId   String
  entry     Entry    @relation(fields: [entryId], references: [id], onDelete: Cascade)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  @@unique([date, mealType, entryId])
  @@index([date])
  @@index([entryId])
}

model ShoppingList {
  id        String         @id @default(cuid())
  name      String         @default("Inköpslista")
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  items     ShoppingItem[]
}

model ShoppingItem {
  id             String       @id @default(cuid())
  shoppingListId String
  shoppingList   ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)
  text           String       // "500g kycklingfilé"
  category       String       // "Kött & fisk", "Mejeri", etc.
  checked        Boolean      @default(false)
  sortOrder      Int          @default(0)
  sourceEntryId  String?      // Vilket recept ingrediensen kom från

  @@index([shoppingListId])
}
```

Entry-modellen behöver en relation tillbaka:
```prisma
model Entry {
  // ... befintliga fält
  mealPlans MealPlan[]
}
```

### Migration
- `npx prisma migrate dev --name add-meal-planning`

---

## 2. API-routes

### `src/app/api/meal-plans/route.ts`
- **GET** `?from=2026-04-05&to=2026-04-12` — Hämta planerade måltider med inkluderad Entry-data
- **POST** `{ date, mealType, entryId }` — Lägg till måltid i plan

### `src/app/api/meal-plans/[id]/route.ts`
- **PUT** `{ date, mealType }` — Flytta måltid (drag-and-drop)
- **DELETE** — Ta bort måltid från plan

### `src/app/api/meal-plans/reorder/route.ts`
- **PUT** `{ items: [{ id, date, mealType, sortOrder }] }` — Batch-uppdatering vid drag-and-drop

### `src/app/api/shopping-list/route.ts`
- **GET** — Hämta aktiv inköpslista med items
- **POST** `{ entryIds: string[] }` — Generera ny lista från valda recept (konsolidera + AI-kategorisera)

### `src/app/api/shopping-list/items/route.ts`
- **POST** `{ text, category }` — Lägg till manuell vara
- **PUT** `{ id, checked?, text?, category? }` — Uppdatera vara (bocka av, ändra text)
- **DELETE** `{ id }` — Ta bort vara

### `src/app/api/shopping-list/categorize/route.ts`
- **POST** `{ ingredients: string[] }` — AI-kategorisera ingredienser via Claude Haiku

---

## 3. AI-kategorisering av ingredienser

### Fil: `src/lib/ingredients.ts`

Använder Claude Haiku (redan uppsatt i `src/lib/claude.ts`) för att kategorisera ingredienser i butiksavdelningar:

**Kategorier:**
- Frukt & grönt
- Mejeri
- Kött & fisk
- Bröd
- Torrvaror & skafferi
- Kryddor & oljor
- Frys
- Konserver
- Dryck
- Övrigt

**Prompt till Haiku:** Skicka hela ingredienslistan i ett anrop, få tillbaka JSON med `{ ingredient, category }[]`. Batcha för effektivitet.

---

## 4. Sidstruktur

### Ny navigation i NavBar
Lägg till "Planera" som tredje länk i botten-navbar (`src/components/NavBar.tsx`):
- Hem | Planera | Lägg till
- Ikon: kalender-ikon (SVG)

### Nya sidor

#### `src/app/meal-plan/page.tsx` — Huvudsida med tabs
Server component som hämtar initial data. Tre flikar/tabs:
1. **Välj recept** — Bläddra och lägg till i plan
2. **Veckoplan** — Se och hantera planerade måltider
3. **Inköpslista** — Generera och hantera inköpslista

---

## 5. Komponentarkitektur

### Tab-container
**`src/components/meal-plan/MealPlanTabs.tsx`** (client component)
- Hanterar aktiv tab med URL-parameter (`?tab=plan|recipes|shopping`)
- Renderar rätt innehåll baserat på tab

### Tab 1: Välj recept
**`src/components/meal-plan/RecipePicker.tsx`**
- Återanvänd sök/filter-logik från `EntryList.tsx` (samma API `/api/entries?type=recipe`)
- Varje receptkort visar en "Planera"-knapp
- Klick på "Planera" öppnar en dag/måltids-väljare (inline dropdown):
  - 7 dagar framåt med veckodagsnamn + datum
  - Måltidstyp: Frukost / Lunch / Middag
- Bekräftelse-toast vid tillägg

### Tab 2: Veckoplan
**`src/components/meal-plan/WeekPlan.tsx`**
- Visar 7 dagar som vertikala kort (mobilanpassat)
- Varje dag visar: Veckodagsnamn (t.ex. "Söndag 6 apr"), sedan sektioner för Frukost/Lunch/Middag
- Varje måltid visar recepttitel + liten bild + ta-bort-knapp (X)

**`src/components/meal-plan/DayCard.tsx`**
- Ett dagskort med tre meal-slots
- Drop-zone för drag-and-drop

**`src/components/meal-plan/MealItem.tsx`**
- Enskild planerad måltid, draggable
- Visar titel, kategori-badge, eventuell thumbnail
- Swipe-to-delete eller X-knapp

**Drag-and-drop:**
- Bibliotek: **@dnd-kit/core** + **@dnd-kit/sortable**
  - Bäst stöd för touch/mobil
  - Lättviktigt (~12kb gzipped)
  - React 19-kompatibelt
  - Tillgängligt (keyboard + screen reader)
- Alternativ touch-hantering: Long-press för att aktivera drag på mobil
- Vid drop: PATCH-anrop till `/api/meal-plans/[id]` med ny date + mealType

### Tab 3: Inköpslista
**`src/components/meal-plan/ShoppingList.tsx`**
- Steg 1: Visa planerade recept med checkboxar — välj vilka att inkludera
- Steg 2: "Skapa inköpslista"-knapp → API-anrop som konsoliderar + kategoriserar
- Steg 3: Visa kategoriserad lista

**`src/components/meal-plan/ShoppingCategory.tsx`**
- Expanderbar sektion per butiksavdelning (Mejeri, Kött & fisk, etc.)
- Varje vara: checkbox + text + redigera/ta-bort

**`src/components/meal-plan/ShoppingItemRow.tsx`**
- Checkbox (avbockningsbar)
- Text (redigerbar inline vid klick)
- Ta-bort-knapp
- Avbockade varor: genomstruken text, grå, sorteras sist

**Manuella tillägg:**
- Input-fält längst ner: "Lägg till vara..." med kategori-dropdown
- Möjlighet att justera mängder genom att redigera texten

---

## 6. Ingrediens-konsolidering

### Fil: `src/lib/ingredients.ts`

Funktion `consolidateIngredients(entries: Entry[]): string[]`
- Samla alla `ingredients[]` från valda recept
- Skicka till Claude Haiku med prompt:
  - "Konsolidera denna ingredienslista. Slå ihop dubbletter och summera mängder där möjligt. Kategorisera varje ingrediens efter butiksavdelning. Returnera JSON."
- Haiku returnerar: `{ text: string, category: string }[]`

Detta görs i ett enda API-anrop för att minimera latens.

---

## 7. Nya filer att skapa

```
src/app/meal-plan/
  └── page.tsx                          # Server component, hämtar initial data
src/components/meal-plan/
  ├── MealPlanTabs.tsx                  # Tab-navigation
  ├── RecipePicker.tsx                  # Sök & välj recept att planera
  ├── MealSlotPicker.tsx                # Dag + måltidstyp-väljare (dropdown)
  ├── WeekPlan.tsx                      # 7-dagars översikt med drag-and-drop
  ├── DayCard.tsx                       # Enskild dagsvy
  ├── MealItem.tsx                      # Draggable måltidskort
  ├── ShoppingList.tsx                  # Inköpslista med receptval
  ├── ShoppingCategory.tsx              # Kategorigrupp i listan
  └── ShoppingItemRow.tsx              # Enskild vara med checkbox
src/lib/
  └── ingredients.ts                    # Konsolidering + AI-kategorisering
src/app/api/meal-plans/
  ├── route.ts                          # GET + POST
  ├── [id]/route.ts                     # PUT + DELETE
  └── reorder/route.ts                  # PUT batch-reorder
src/app/api/shopping-list/
  ├── route.ts                          # GET + POST (generera)
  ├── items/route.ts                    # POST + PUT + DELETE
  └── categorize/route.ts              # POST AI-kategorisering
```

## 8. Befintliga filer att ändra

| Fil | Ändring |
|-----|---------|
| `prisma/schema.prisma` | Lägg till MealPlan, ShoppingList, ShoppingItem + relation på Entry |
| `src/components/NavBar.tsx` | Lägg till "Planera"-länk med kalenderikon |
| `src/lib/claude.ts` | Eventuellt lägga till categorize-funktion (eller i ny fil) |
| `package.json` | Lägg till `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

---

## 9. Nytt beroende

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 10. Implementationsordning

1. **Databas**: Schema + migration
2. **API**: meal-plans CRUD + shopping-list CRUD
3. **Lib**: ingredients.ts (konsolidering + AI-kategorisering)
4. **NavBar**: Lägg till "Planera"-länk
5. **Sida**: meal-plan/page.tsx + MealPlanTabs
6. **Tab Recept**: RecipePicker + MealSlotPicker
7. **Tab Veckoplan**: WeekPlan + DayCard + MealItem + drag-and-drop
8. **Tab Inköpslista**: ShoppingList + ShoppingCategory + ShoppingItemRow

---

## 11. Verifiering

1. **Databas**: Kör `npx prisma migrate dev` och verifiera nya tabeller
2. **API-tester manuellt**:
   - Skapa en måltidsplan via POST
   - Hämta planer via GET med datumintervall
   - Flytta måltid via PUT
   - Ta bort via DELETE
3. **UI-test**:
   - Navigera till /meal-plan
   - Sök och lägg till recept i plan
   - Dra måltider mellan dagar
   - Generera inköpslista från planerade recept
   - Bocka av varor
   - Lägg till/ta bort manuella varor
4. **Bygg**: `npm run build` ska lyckas utan fel
