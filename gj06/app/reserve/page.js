'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function ReservePage() {
  return (
    <>
      <Navbar />
      <main style={{ padding: '40px 20px', maxWidth: 800, margin: '0 auto', minHeight: '80vh' }}>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 48, marginBottom: 20 }}>Reserve a Table</h1>
        <p style={{ opacity: 0.7, marginBottom: 20, lineHeight: 1.6 }}>
          Table reservations coming soon! For now, walk-ins are always welcome.
        </p>
        <Link href="/menu" className="btn btn-outline" style={{ display: 'inline-block' }}>
          ← Back to Menu
        </Link>
      </main>
    </>
  )
}
