import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui-konvention: slå ihop klassnamn med Tailwind-konfliktlösning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
