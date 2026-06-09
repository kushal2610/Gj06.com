'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import styles from './checkout.module.css'

const PICKUP_TIMES = [
  'ASAP — as soon as possible',
  '15 minutes',
  '30 minutes',
  '45 minutes',
  '1 hour',
]

export default function CheckoutPage() {
  const [cart,    setCart]    = useState([])
  const [form,    setForm]    = useState({ name: '', phone: '', email: '', pickupTime: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('gj06_cart')
    if (saved) {
      try { setCart(JSON.parse(saved)) } catch (e) {}
    }
  }, [])

  const total = cart.reduce((s, i) => s + i.qty * i.price, 0)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.email || !form.pickupTime) {
      setError('Please fill in all fields')
      return
    }
    if (!cart.length) { setError('Your cart is empty!'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            customer_name:  form.name,
            customer_phone: form.phone,
            customer_email: form.email,
            pickup_time:    form.pickupTime,
            items:          cart,
            total,
          }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div style={{ paddingTop: 'var(--nav-h)' }}>

          <div className={styles.header}>
            <p className="hand-md" style={{ opacity: 0.5, marginBottom: 6 }}>— almost there —</p>
            <h1 className="display-lg">CHECKOUT</h1>
          </div>

          {cart.length === 0 ? (
            <div className={styles.emptyCart}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🧺</div>
              <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, marginBottom: 20 }}>Your cart is empty!</div>
              <Link href="/menu" className="btn">Browse Menu →</Link>
            </div>
          ) : (
            <div className={styles.content}>

              {/* Order summary */}
              <div className={`sk ${styles.summary}`}>
                <div className={styles.summaryTitle}>Order Summary</div>
                {cart.map(item => (
                  <div key={item.id} className={styles.summaryRow}>
                    <span>{item.qty}× {item.name}</span>
                    <span>${(item.qty * item.price).toFixed(2)}</span>
                  </div>
                ))}
                <div className={styles.summaryTotal}>
                  <span>Total ({count} item{count !== 1 ? 's' : ''})</span>
                  <span>${total.toFixed(2)} AUD</span>
                </div>
              </div>

              {/* Customer details form */}
              <div className={styles.formSection}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="What do we call you?" autoComplete="name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+61 000 000 000" type="tel" autoComplete="tel" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" name="email" value={form.email} onChange={handleChange} placeholder="For your confirmation email" type="email" autoComplete="email" />
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Time</label>
                  <select className="form-input" name="pickupTime" value={form.pickupTime} onChange={handleChange}>
                    <option value="" disabled>When will you pick up?</option>
                    {PICKUP_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Payment note */}
              <div className={styles.paymentNote}>
                <span style={{ fontSize: 24 }}>🔒</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 700 }}>Secure payment via Stripe</div>
                  <div style={{ fontSize: 13, opacity: 0.6 }}>Card, Apple Pay, Google Pay accepted</div>
                </div>
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}

              <button className={`btn ${styles.payBtn}`} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Redirecting to payment...' : `Pay $${total.toFixed(2)} AUD →`}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link href="/menu" style={{ fontFamily: 'var(--font-h)', fontSize: 15, opacity: 0.6 }}>
                  ← Edit Order
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}