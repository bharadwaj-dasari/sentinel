import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'SENTINEL',
  description: 'Habit density tracking system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistMono.className}>
      <body className="bg-[#09090b] text-[#fafafa] antialiased">
        {children}
      </body>
    </html>
  )
}
