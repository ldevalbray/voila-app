import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import './globals.css'

const commitMono = localFont({
  src: [
    {
      path: '../fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-commit-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Voila.app',
  description: 'Voila.app – Step 0 setup',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get messages for the current locale (determined by middleware/i18n.ts)
  const messages = await getMessages()

  return (
    <html className="w-full">
      <body
        className={`${commitMono.variable} antialiased w-full font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
