'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/reserve', label: 'Reserve' },
  // { href: '/admin', label: 'Admin' }, // hidden from nav
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeMenu]);

  const toggleMenu = useCallback(() => {
    if (menuOpen) closeMenu();
    else openMenu();
  }, [menuOpen, openMenu, closeMenu]);

  return (
    <>
      <header
        id="navbar"
        className={`${styles.navbar}${scrolled ? ` ${styles.scrolled}` : ''}`}
        role="banner"
      >
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="GJ 06 — Home">
          <Image
            src="/logo.png"
            alt="GJ 06 logo"
            width={40}
            height={40}
            className={styles.logoImg}
            priority
          />
          <div>
            <span className={styles.logoText}>GJ 06</span>
            <span className={styles.logoSub}>A Magical 2D Cafe</span>
          </div>
        </Link>

        {/* Right side */}
        <div className={styles.navRight}>
          <Link href="/menu" className={styles.orderBtn} aria-label="Order Now">
            Order Now
          </Link>
          <button
            className={`${styles.hamburger}${menuOpen ? ` ${styles.open}` : ''}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-overlay"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Full-screen overlay */}
      <div
        id="nav-overlay"
        className={`${styles.overlay}${menuOpen ? ` ${styles.open}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <nav className={styles.overlayNav} role="navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={styles.overlayLink}
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/menu"
          className={styles.overlayOrderBtn}
          onClick={closeMenu}
        >
          Order Now →
        </Link>

        <div className={styles.overlaySocial}>
          <a href="https://www.instagram.com/gj06cafe" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://www.facebook.com/gj06cafe" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        </div>
      </div>
    </>
  );
}