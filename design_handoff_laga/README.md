# Handoff: Laga — familjens receptbok (vadskavi.nu/laga)

## Overview
**Laga** is a recipe-sharing app for groups such as families. A group ("familj") keeps a shared
recipe book where members add recipes and tips, see **who cooked what**, leave **family notes**
(small tweaks to a recipe), and react/comment. It is one of several apps living under the
`vadskavi.nu` umbrella — the path `vadskavi.nu/laga` reads as the Swedish question *"Vad ska vi
laga?"* ("What shall we cook?"), which is the product's hook. UI copy is **Swedish** (other
languages planned later, so keep strings externalized/translatable).

Visual direction: **"Skandinaviskt kök"** — modern, minimal, airy, off-white surfaces, a single
warm accent, one Nordic grotesk typeface throughout. Logo direction chosen: a pot mark + "Laga"
wordmark (a more distinctive mark is being explored separately — see Assets).

## About the Design Files
The files in this bundle are **design references created in HTML/React-via-Babel** — prototypes
that show the intended look, layout, and behavior. They are **not** production code to copy
verbatim. The task is to **recreate these designs in the target codebase's environment** (e.g.
React + your component library, Vue, SwiftUI, etc.) using its established patterns, routing, data
layer, and styling system. If no environment exists yet, pick an appropriate stack (a React +
TypeScript SPA or Next.js app maps cleanly to this design) and implement there.

The prototype fakes its data and persistence (mock objects, `localStorage`, React state). In
production these become real API calls, a database, auth, and file/image storage.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and interactions are intentional and final
for this direction. Recreate the UI closely, substituting your codebase's primitives where
sensible. Exact tokens are listed under **Design Tokens**.

## Screens / Views

### 1. Home feed (`feed` view)
- **Purpose:** browse/search the family's recipes & tips; jump into a recipe or the family view.
- **Layout:** Greeting header row (kicker = family name in accent; large time-aware greeting such
  as "Vad ska vi laga?") with a right-aligned "Familjen" pill showing an avatar stack. Below: a
  full-width search field; a row with a segmented control (**Alla / Recept / Tips**) and a sort
  `select` (Senaste / Populärast / Mest lagad); a horizontally-scrolling row of category chips
  (Alla, Bakning, Dryck, Efterrätt, Frukost, Förrätt, Förvaring); then a responsive card grid
  (`grid-template-columns: repeat(auto-fill, minmax(248px, 1fr))`, gap 16px).
- **Recipe card (photo style):** rounded card (radius 15) on white, 1px border. Top: 16:10 media
  area (recipe photo, or a colored gradient placeholder, or an empty state with a chef-hat icon).
  Overlaid top-left: white category tag pill; top-right (tips only): accent "Tips" pill. Body:
  recipe title (Schibsted Grotesk 600, ~17.5px, -0.01em), then a footer row with the **cooked-by**
  summary (avatar stack + "Mormor 3×") on the left and heart/comment counts on the right.
  Hover: lift `translateY(-3px)` + soft shadow.
- **Recipe card (minimal style):** no image; tag pills on top, larger title, same cooked-by/counts
  footer. Hover: accent border. (Toggled by the "Kortstil" theme setting — see State.)
- **Empty search state:** centered search icon + "Inga träffar. Prova ett annat ord."

### 2. Recipe detail (`recipe` view)
- **Purpose:** read a recipe, mark it cooked, scale portions, read/add family notes & comments.
- **Layout:** Hero media (height 300px desktop / 230px mobile; editable photo zone). Circular
  back button overlaid top-left (white 92% bg, blur, shadow). Body below: meta row (accent
  category tag + type + clock/time), large title (clamp 28–40px, 700, -0.025em), blurb (muted,
  max 52ch). Then an **actions bar** (top+bottom hairline borders): primary "Jag lagade den"
  button (accent; turns sage green + "Lagad! 🎉" for ~2.2s on click), a heart toggle button with
  count, and a share button; below them a cooked-summary line with avatar stack ("Lagad 4× i
  familjen — Mormor 3×, Pappa 1×"). Then a two-column grid (`1.5fr 1fr`, gap 48px; single column
  on mobile): **left** = Ingredients (with a portions stepper that rescales the leading quantity
  of each ingredient line) + numbered Steps; **right** = "Familjens noteringar" (note cards on
  accent-soft bg + add-note input) and "Kommentarer" (comment list + add-comment input).
- **Tips** records have no ingredients/portions; steps render under "Så gör du".

### 3. Family / group (`family` view)
- **Purpose:** see members & contributions, invite people, choose the book's background, view
  recent activity.
- **Layout:** Back link. **Header card** (overflow hidden): editable cover photo (height 150,
  gradient fallback) then padded content: kicker "Receptbok", family name, three stats (recept /
  tillagningar / kockar), and an avatar stack. **Invite card** (accent-soft bg): heading "Bjud in
  fler", explanatory text, a read-only link field (`vadskavi.nu/laga/andersson`) + "Kopiera länk"
  button (turns sage + "Kopierad!" for ~1.8s). **Background chooser card:** heading "Familjens
  bakgrund", and pill buttons for each preset (Linne, Varm, Dimma, Salvia, Sand) each with a color
  dot; active pill uses accent border + accent-soft fill. Then a two-column grid: **Medlemmar**
  (rows: avatar, full name, role badge for Ägare / "Väntar på svar" for Inbjuden, and a
  "{n} recept · lagat {m}×" line) and **Senaste i köket** (activity rows: avatar, "{name} {verb}
  {recipe}", timestamp, thumbnail; clicking opens the recipe).

### 4. Add recipe (`add` view) — believable mock
- Segmented Recept/Tips, an editable photo drop zone, Titel input, Kategori chip selector,
  Ingredienser textarea, Gör så här textarea (recept only), Spara/Avbryt buttons. Not wired to
  persistence in the prototype.

## App shell & responsive behavior
- **Desktop (≥ 881px):** fixed left **sidebar** (248px) with logo, nav (Hem / Familjen / Lägg
  till), and a family widget pinned to the bottom. Main content scrolls in the remaining column,
  centered, max-width 1080px, padding 34/36px.
- **Mobile (≤ 880px):** sidebar hidden; a sticky **top bar** (logo + avatar stack) and a fixed
  **bottom nav** (3 items, icon + label, `env(safe-area-inset-bottom)` aware) appear. Content is
  full-width with bottom padding for the nav; recipe hero goes edge-to-edge.
- Active nav item: accent text; sidebar active item also gets accent-soft background.

## Interactions & Behavior
- **Navigation** is single-page view state (`{name, id}`), not URL routing in the prototype — map
  to real routes (`/`, `/recept/:id`, `/familj`, `/lagg-till`). Each navigation scrolls to top.
- **Mark cooked:** increments the current user's count in the recipe's `cookedBy`, shows a 2.2s
  success state.
- **Heart toggle / add note / add comment:** optimistic local updates; Enter submits the inputs.
- **Portions stepper:** multiplies the leading numeric token of each ingredient string by
  `servings / baseServings`, rounded to 0.1 (comma decimal for sv-SE).
- **Photos:** click or drag-drop an image onto any editable photo zone (recipe hero, family cover,
  add-recipe dropzone). Images are downscaled to max 1280px / JPEG 0.82 via canvas, then stored.
  A recipe's photo set on its hero also renders on its feed card (shared store keyed by recipe id).
- **Family background:** picking a preset updates CSS custom properties `--bg` and `--thumb-empty`
  for the whole app and persists; it is a **group-level** setting (every member sees the same).
- **Copy invite link:** shows a 1.8s "Kopierad!" confirmation.
- **Transitions:** card hover lift 0.18s ease; button active scale 0.97; nav color 0.15s.

## State Management
Prototype state (lift into real stores/queries in production):
- `view: {name: 'feed'|'recipe'|'family'|'add', id}` — routing.
- `photos: {[recipeId|'family-cover'|'draft-photo']: dataURL}` — persisted to `localStorage`
  (`laga_photos`). Production: upload to object storage, store URLs on the entity.
- `familyBg: 'Linne'|'Varm'|'Dimma'|'Salvia'|'Sand'` — persisted (`laga_bg`). Production: a field
  on the family/group record.
- Per-recipe local state on the detail screen: `cookedBy`, `hearts`, `notes`, `comments`,
  `servings`. Production: server-backed, per-user attribution, real timestamps.
- **Theme/dev settings** (`accent`, `wordmark` case, `cards` style) are driven by a Tweaks panel
  used only for design exploration — not a product feature. `accent` and the family background map
  to CSS custom properties on `:root`.

## Design Tokens
**Colors**
- Page bg `--bg`: `#f6f5f1` (Linne, default). Other family presets: Varm `#faf3e8`, Dimma
  `#eef0f2`, Salvia `#eef2ec`, Sand `#f3ecdf`. Each preset also sets `--thumb-empty` (empty media
  tint): `#eceae4 / #efe6d6 / #e2e6e9 / #dfe7df / #e7ddca` respectively.
- Surface `--card`: `#ffffff`. Card border `--card-bd`: `rgba(20,18,14,.08)`. Field border
  `--field-bd`: `rgba(20,18,14,.12)`.
- Text `--ink`: `#1a1a18`. Muted `--muted`: `#8a857c`.
- Chip `--chip`: `#edeae3`, chip text `--chip-fg`: `#5f5a51`.
- Accent `--accent` (default "Lera"): `#c75b39`; soft `--accent-soft`: `#f6e7e1`; shadow
  `rgba(199,91,57,.4)`. Alternate accents: Salvia `#3f7d63` (soft `#e5efe9`), Hav `#3f6ea5` (soft
  `#e5edf6`), Saffran `#c2872a` (soft `#f6edda`).
- Success/confirm `--sage`: `#3f7d63`.
- Recipe placeholder gradients (per recipe, illustrative): e.g. ragù
  `linear-gradient(135deg,#d98a6a,#c75b39)`, pavlova `…(#efe7d6,#d8cdb4)`, kanelbullar
  `…(#e8c79a,#cf9a5c)`, kladdkaka `…(#7a5440,#4a3024)`, etc.

**Typography**
- Single family: **Schibsted Grotesk** (Google Fonts), weights 400–800. Wordmark/headings 700,
  body 400–600. Negative letter-spacing on large headings (-0.02 to -0.03em). Body line-height
  ~1.5; long text uses `text-wrap: balance/pretty`.

**Radii:** cards/fields `--radius` 15px; smaller chips/buttons 10–12px; pills/avatars 999px/50%;
category tag pills 7px.

**Spacing:** main padding 34–36px desktop / 18–20px mobile; card grid gap 16px; detail columns
gap 48px; common vertical rhythm 14/22/28/34px.

**Shadows:** card hover `0 16px 34px -22px rgba(20,30,24,.5)`; back button
`0 4px 12px -4px rgba(0,0,0,.3)`; logo glyph `0 2px 6px -2px var(--accent-shadow)`.

**Iconography:** custom inline stroke icons (1.7 default weight, round caps/joins), 24×24 viewBox.
See `app/ui.jsx` `PATHS` for the set (home, users, plus, search, heart, chat, back, edit, trash,
clock, share, check, pot, chefhat, sliders, sort, bookmark, link, etc.).

## Assets
- **Fonts:** Schibsted Grotesk via Google Fonts.
- **Logo:** prototype uses a pot-glyph + "Laga" wordmark with a "vadskavi.nu" kicker (drawn in
  `app/ui.jsx` `Logo`). A more distinctive mark is under exploration — see
  `VadSkaVi Laga — Logo Explorations.html` (four concepts; the recommended one is steam from a pot
  curling into a question mark). Export final favicon/app-icon/wordmark before production.
- **Photos:** none shipped — users supply their own via the photo zones. Replace the local
  downscale-to-`localStorage` mechanism with real upload + CDN URLs.
- **Icons:** all custom inline SVG (no icon-font dependency).

## Files
- `Laga.html` — entry point; loads fonts, React 18 + Babel standalone, the tweaks panel, and the
  `app/*.jsx` modules; contains all global CSS (shell layout, responsive rules, card/nav styles).
- `app/data.jsx` — mock data: `FAMILY` (members), `RECIPES`, `ACTIVITY`, `CATEGORIES`.
- `app/ui.jsx` — shared primitives: `Icon`, `Logo`, `Avatar`, `AvatarStack`, `Tag`, `CookedBy`,
  the photo store (`PhotosCtx`, `usePhotos`, `PhotoZone`, image downscaler).
- `app/feed.jsx` — `FeedScreen` + `RecipeCard` (photo & minimal variants).
- `app/recipe.jsx` — `RecipeScreen` (cooked/heart/notes/comments/portions) + helpers.
- `app/family.jsx` — `FamilyScreen` (cover, invite, background chooser, members, activity).
- `app/add.jsx` — `AddScreen` (mock add form).
- `app/app.jsx` — `App` shell: nav, theme/accent + family-background CSS wiring, photo provider,
  Tweaks panel.
- `tweaks-panel.jsx` — design-only theme controls (not a product feature).
- Reference (not app code): `VadSkaVi Laga — Design Directions.html`,
  `VadSkaVi Laga — Logo Explorations.html`.

## Notes for implementation
- Externalize all Swedish copy for future localization (sv default).
- "Who cooked what", notes, reactions, and comments are **per-user**, server-backed in production.
- The Tweaks panel and the `localStorage` photo/background persistence are prototype scaffolding —
  replace with real settings, auth, and storage.
