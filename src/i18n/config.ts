import { notFound } from 'next/navigation'

// Supported locales
export const locales = ['en', 'fr'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Check if a locale is valid
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

