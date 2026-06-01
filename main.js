/* ============================================
   GJ 06 — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Custom Cursor (mouse/trackpad only) ----
  const cursor = document.querySelector('.cursor');
  if (cursor) {
    if (window.matchMedia('(pointer: fine)').matches) {
      document.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top  = e.clientY + 'px';
      });
      document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
      document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));
    }
    // On touch devices the cursor div is hidden via CSS (display:none at @media pointer:coarse)
    // No JS manipulation needed — CSS handles it cleanly
  }

  // ---- Chai Loader (index.html only) ----
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('loading');
    }, 3400);
  }

  // ---- Hamburger Nav ----
  const hamburger  = document.getElementById('hamburger');
  const navOverlay = document.getElementById('navOverlay');
  const navClose   = document.getElementById('navClose');

  if (hamburger && navOverlay) {
    const openNav = () => {
      navOverlay.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const closeNav = () => {
      navOverlay.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', openNav);
    if (navClose) navClose.addEventListener('click', closeNav);
    navOverlay.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  }

  // ---- Sticky Navbar shadow ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Scroll Reveal ----
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
    revealEls.forEach(el => observer.observe(el));
  }

  // ---- Page Transitions (internal links only) ----
  // FIX: Don't run transition on index.html while loader is active
  const pageTransition = document.querySelector('.page-transition');
  if (pageTransition) {
    // Slide out on page load
    pageTransition.classList.add('exit');
    setTimeout(() => pageTransition.classList.remove('exit'), 450);

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (
        href &&
        !href.startsWith('#') &&
        !href.startsWith('http') &&
        !href.startsWith('mailto') &&
        !href.startsWith('tel')
      ) {
        link.addEventListener('click', e => {
          // Don't intercept if loader is still visible
          if (document.getElementById('loader') && !document.getElementById('loader').classList.contains('hidden')) return;
          e.preventDefault();
          pageTransition.classList.add('enter');
          setTimeout(() => { window.location.href = href; }, 430);
        });
      }
    });
  }

  // ---- Marquee — FIX: only duplicate once, guard against double-run ----
  const marqueeInner = document.querySelector('.marquee-inner');
  if (marqueeInner && !marqueeInner.dataset.cloned) {
    marqueeInner.dataset.cloned = 'true';
    const clone = marqueeInner.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marqueeInner.parentElement.appendChild(clone);
  }

  // ---- Smooth anchor scroll ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const navH = navbar ? navbar.offsetHeight : 64;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});