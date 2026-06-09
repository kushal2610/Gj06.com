'use client'

import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import styles from './menu.module.css'

const CAT_ICONS = {
  'Chai Ki Chuski':'🫖','Coffee':'☕','Cold Brew':'🧊','English Tea':'🍃',
  'Thickshakes':'🥤','Mocktails':'🍹','Juice & Cold Drinks':'🍊',
  'Indian Street Style':'🌶️','Snacks':'🥐','Pizza & Burger':'🍕',
  'Sweet Goodies':'🍰','Combo Deals':'🤝','For Little Ones':'🧒','Add-Ons':'➕',
}

const CAT_SUBTITLES = {
  'Chai Ki Chuski':'All our chais are freshly made and are simply the best!',
  'Coffee':'Extra shot, syrups, different milks $0.60 · Upsize $1',
  'Cold Brew':'Extra shot, syrups, different milks $0.60 · Upsize $1',
  'English Tea':'Upsize $1',
  'Juice & Cold Drinks':'Without ice $1 · Upsize $2',
  'Combo Deals':'Best value — best vibes',
}

function Toast({ msg }) {
  if (!msg) return null
  return <div role="status" aria-live="polite" className="toast">{msg}</div>
}

export default function MenuPage() {
  const [menuData,   setMenuData]   = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat,  setActiveCat]  = useState('')
  const [cart,       setCart]       = useState([])
  const [cartOpen,   setCartOpen]   = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [toast,      setToast]      = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('gj06_cart')
    if (saved) {
      try { setCart(JSON.parse(saved)) } catch (e) { console.warn('Invalid cart JSON:', e) }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('gj06_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/menu')
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        const { categories } = await res.json()
        const cats = categories.map(c => c.name)
        const allItems = categories.flatMap(c => c.items)
        setMenuData(allItems)
        setCategories(cats)
        setActiveCat(cats[0] || '')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadMenu()
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }]
    })
    showToast(`Added ${item.name}! 🫖`)
  }

  const changeQty = (id, delta) => {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
    )
  }

  const switchCat = (cat) => {
    setActiveCat(cat)
    const el = document.querySelector(`[data-cat="${cat}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    window.scrollTo({ top: 140, behavior: 'smooth' })
  }

  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const activeItems = menuData.filter(i => i.category === activeCat)

  return (
    <>
      <Navbar />
      <Toast msg={toast} />

      <div className={styles.heroStrip}>
        <img src="/food1.jpg" alt="GJ 06 food" className={styles.heroImg} />
        <img src="/food2.jpg" alt="GJ 06 food" className={styles.heroImg} />
      </div>

      <div className={styles.pageTitle}>
        <div className={styles.pageTitleDots} />
        <div className={styles.pageTitleInner}>
          <p className="hand-md" style={{ color: 'white', opacity: 0.5, marginBottom: 6 }}>
            — freshly made, simply the best —
          </p>
          <h1 className="display-xl" style={{ color: 'white', lineHeight: 0.9 }}>MENU</h1>
        </div>
      </div>

      <div style={{ background: '#0a0a0a', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 28" preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
          <path d="M0,14 Q180,0 360,14 Q540,28 720,14 Q900,0 1080,14 Q1260,28 1440,14 L1440,28 L0,28 Z" fill="white" />
        </svg>
      </div>

      <div className={styles.deliveryBanner}>
        <span style={{ fontFamily: 'var(--font-h)', fontSize: 16, fontWeight: 700 }}>Want delivery?</span>
        <a href={process.env.NEXT_PUBLIC_UBEREATS_URL || 'https://www.ubereats.com'} target="_blank" rel="noopener noreferrer" className={styles.deliveryBtn}>🛵 UberEats</a>
        <a href={process.env.NEXT_PUBLIC_DOORDASH_URL || 'https://www.doordash.com'} target="_blank" rel="noopener noreferrer" className={styles.deliveryBtn}>🚪 DoorDash</a>
      </div>

      <div className={styles.tabbar} id="tabbar">
        {loading ? (
          <div className={styles.tabLoading}>Loading menu...</div>
        ) : (
          categories.map(cat => (
            <button
              key={cat}
              data-cat={cat}
              className={`${styles.tab} ${activeCat === cat ? styles.tabActive : ''}`}
              onClick={() => switchCat(cat)}
            >
              {CAT_ICONS[cat] || '✦'} {cat}
            </button>
          ))
        )}
      </div>

      <main className={styles.main}>
        {loading && (
          <div className={styles.stateBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🫖</div>
            <div>Brewing the menu...</div>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div>Couldn't load menu.</div>
            <div style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>{error}</div>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className={styles.stateBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍰</div>
            <div>No items available yet.</div>
          </div>
        )}

        {!loading && !error && categories.length > 0 && (
          <>
            <div className={styles.catHeader}>
              <span className={styles.catIcon}>{CAT_ICONS[activeCat] || '✦'}</span>
              <div>
                <div className={styles.catTitle}>{activeCat}</div>
                {CAT_SUBTITLES[activeCat] && <div className={styles.catSub}>{CAT_SUBTITLES[activeCat]}</div>}
              </div>
            </div>

            <div className={styles.itemsWrap}>
              {activeItems.map(item => (
                <div key={item.id} className={`${styles.item} ${!item.available ? styles.itemUnavailable : ''}`}>
                  <div className={styles.itemLeft}>
                    {item.available && item.tag && (
                      <div style={{ marginBottom: 5 }}>
                        <span className={`tag tag-${item.tag}`}>
                          {item.tag === 'bestseller' ? '★ Bestseller' : item.tag === 'new' ? '✦ New' : item.tag === 'spicy' ? '🌶 Spicy' : item.tag}
                        </span>
                      </div>
                    )}
                    {!item.available && <div style={{ marginBottom: 5 }}><span className="tag tag-soldout">Sold Out</span></div>}
                    <div className={styles.itemName}>{item.name}</div>
                    {item.description && <div className={styles.itemDesc}>{item.description}</div>}
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.itemPrice}>${Number(item.price).toFixed(2).replace('.00', '')}</div>
                    {item.available && (
                      <button className={styles.addBtn} onClick={() => addToCart(item)} aria-label={`Add ${item.name}`}>+</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <div className={`${styles.cartDrawer} ${cartOpen ? styles.cartOpen : ''}`} aria-hidden={!cartOpen}>
        <div className={styles.cartHeader}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, letterSpacing: '.05em' }}>YOUR ORDER</div>
          <button className={styles.cartClose} onClick={() => setCartOpen(false)}>✕</button>
        </div>
        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-h)', opacity: 0.5, padding: '16px 0' }}>Nothing here yet — add some magic! ✦</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className={styles.cartRow}>
                <div className={styles.cartRowName}>{item.name}</div>
                <div className={styles.qtyCtrl}>
                  <button className={styles.qBtn} onClick={() => changeQty(item.id, -1)}>−</button>
                  <span style={{ minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                  <button className={styles.qBtn} onClick={() => changeQty(item.id, 1)}>+</button>
                </div>
                <span style={{ minWidth: 52, textAlign: 'right', fontFamily: 'var(--font-h)' }}>${(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
        <div className={styles.cartFooter}>
          <div>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 13, opacity: 0.6 }}>Total</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 28 }}>${cartTotal.toFixed(2)}</div>
          </div>
          <Link href="/checkout" className={styles.checkoutBtn} onClick={() => setCartOpen(false)}>Checkout →</Link>
        </div>
      </div>

      <div className="mob-bar">
        {cartCount > 0 ? (
          <button onClick={() => setCartOpen(true)} className="btn btn-white" style={{ flex: 1, fontSize: 15, padding: '11px 8px' }}>
            🧺 View Order ({cartCount})
          </button>
        ) : (
          <Link href="/" className="btn btn-white-outline" style={{ flex: 1, fontSize: 15, padding: '11px 8px', textAlign: 'center' }}>
            ← Back
          </Link>
        )}
        <Link href="/reserve" className="btn btn-white-outline" style={{ flex: 1, fontSize: 15, padding: '11px 8px', textAlign: 'center' }}>
          Reserve Table
        </Link>
      </div>

      {cartCount > 0 && (
        <button className={styles.floatingCart} onClick={() => setCartOpen(!cartOpen)}>
          🧺 {cartCount} item{cartCount !== 1 ? 's' : ''} · ${cartTotal.toFixed(2)}
        </button>
      )}
    </>
  )
}
