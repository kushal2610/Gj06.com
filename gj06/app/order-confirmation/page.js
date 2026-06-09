'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import styles from './confirmation.module.css'

function ConfirmationContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) { setLoading(false); return }
    fetch(`/api/orders/confirm/${sessionId}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false) })
      .catch(() => setLoading(false))
    // Clear cart after successful order
    localStorage.removeItem('gj06_cart')
  }, [sessionId])

  if (loading) return (
    <div className={styles.loading}>One moment... 🫖</div>
  )

  return (
    <div className={styles.content}>
      <div style={{fontSize:64,marginBottom:16}}>✦</div>
      <h1 className="display-md" style={{marginBottom:12}}>
        {order ? `See you soon, ${order.customer_name}!` : 'Order Confirmed!'}
      </h1>
      <p style={{fontFamily:'var(--font-h)',fontSize:18,opacity:.7,lineHeight:1.6,marginBottom:28}}>
        Your order is confirmed and we&apos;re getting it ready.
        {order?.customer_email && ` A confirmation has been sent to ${order.customer_email}.`}
      </p>

      {order && (
        <div className={`sk ${styles.orderCard}`}>
          <div className={styles.orderRow}>
            <span>Order ID</span>
            <strong>{order.id.slice(0,8).toUpperCase()}</strong>
          </div>
          <div className={styles.orderRow}>
            <span>Pickup Time</span>
            <strong>{order.pickup_time}</strong>
          </div>
          <div className={styles.orderRow}>
            <span>Total Paid</span>
            <strong>${Number(order.total).toFixed(2)} AUD</strong>
          </div>
          <div className={styles.orderRow}>
            <span>Status</span>
            <strong style={{textTransform:'capitalize'}}>{order.status}</strong>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Link href="/menu" className="btn wg">Order Again</Link>
        <Link href="/" className="btn btn-outline">Back Home</Link>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
          <ConfirmationContent />
        </Suspense>
      </main>
    </>
  )
}