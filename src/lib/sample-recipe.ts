// Exempelreceptet bakom startdörren "Prova med ett exempel" i det tomma flödet.
// Speglar laga-app `lib/onboarding/sample.ts`. Förifyller bara formuläret — användaren
// granskar och trycker Spara själv, inget sparas i smyg.
import type { EntryFormData } from '@/components/EntryForm'

export const SAMPLE_RECIPE: Partial<EntryFormData> = {
  type: 'recipe',
  title: 'Ugnspannkaka med stekt fläsk',
  category: 'Husmanskost',
  blurb: 'Smeten står i ugnen medan du dukar. Lingonsylt är inte valfritt.',
  time: '45 min',
  servings: 4,
  ingredients: ['4 ägg', '6 dl mjölk', '3 dl vetemjöl', '1 tsk salt', '250 g rimmat sidfläsk', 'Lingonsylt till servering'],
  instructions: [
    'Sätt ugnen på 225°.',
    'Vispa ihop ägg, mjölk, mjöl och salt till en slät smet. Låt svälla 10 minuter.',
    'Skär fläsket i skivor och stek knaprigt i en het panna.',
    'Lägg fläsket i en smord långpanna och häll smeten över.',
    'Grädda mitt i ugnen 30–35 minuter tills pannkakan är gyllene och fast.',
    'Servera direkt med lingonsylt.',
  ].join('\n'),
  drinks: 'Kall mjölk, eller en lättöl om det är helg.',
  source: 'Exempelrecept från VadSkaVi',
  protein: 'pork',
}
