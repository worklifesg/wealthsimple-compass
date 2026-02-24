import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Compass — AI Financial Planner',
  description: 'AI-native financial planning that gives everyone access to advisor-quality guidance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
