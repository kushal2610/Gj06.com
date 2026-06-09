import './globals.css'

export const metadata = {
  title: 'GJ 06 — A Magical 2D Cafe & Bakehouse',
  description: "Sydney's best chai, Indian street food, pizza and sweet goodies.",
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}