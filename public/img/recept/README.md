# Receptfoton

Lägg riktiga receptfoton här som `.webp` och referera dem från `src/lib/recipes.ts`
via fältet `image`, t.ex.:

```ts
{
  slug: 'farmors-kottbullar',
  // ...
  image: 'farmors-kottbullar.webp',
}
```

Filnamnet matchas mot `image`-fältet och serveras på `/img/recept/<filnamn>`.
Saknas `image` visas ett varumärkt receptkort automatiskt (ingen trasig bild).

Rekommendation: aptitliga foton (gärna ~1200px breda) höjer chansen för
annonsörsgodkännande markant. Lägg in dem innan ni ansöker som Adtraction-kanal.
