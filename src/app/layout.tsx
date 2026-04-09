import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Music PDF Page Turner',
  description: 'Hands-free PDF page turner for musicians — nod to turn the page',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        {children}
      </body>
    </html>
  )
}
