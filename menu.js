/* ============================================
   GJ 06 — Menu Page JavaScript
   ============================================ */

const EMOJI_MAP = {
  'hot-drinks': '☕',
  'cold-drinks': '🧋',
  'breads': '🍞',
  'bites': '✨'
};

const TAG_STYLES = {
  'bestseller': { bg: '#0a0a0a', color: '#fff', label: '★ Bestseller' },
  'new': { bg: '#fff', color: '#0a0a0a', label: '✦ New', border: '2px solid #0a0a0a' },
  'spicy': { bg: '#0a0a0a', color: '#fff', label: '🌶 Spicy' }
};

let menuData = null;
let activeCategory = 'all';

async function loadMenu() {
  try {
    const res = await fetch('data/menu.json');
    menuData = await res.json();
    renderMenu('all');
  } catch (e) {
    document.getElementById('menuLoading').textContent = 'Could not load menu. Please try again.';
  }
}

function renderMenu(catId) {
  const container = document.getElementById('menuContent');
  container.innerHTML = '';

  const categories = catId === 'all'
    ? menuData.categories
    : menuData.categories.filter(c => c.id === catId);

  categories.forEach((cat, ci) => {
    // Category header
    const header = document.createElement('div');
    header.style.cssText = `margin-bottom:28px;margin-top:${ci > 0 ? '56px' : '0'};`;
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
        <span style="font-size:32px;">${cat.icon || EMOJI_MAP[cat.id] || '☕'}</span>
        <h2 style="font-family:var(--font-display);font-size:clamp(28px,7vw,48px);letter-spacing:0.03em;">${cat.name}</h2>
        <div style="flex:1;height:3px;background:var(--black);border-radius:2px;opacity:0.15;"></div>
      </div>
    `;
    container.appendChild(header);

    // Items grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr;gap:12px;';
    // 2-col on wider screens
    grid.style.gridTemplateColumns = window.innerWidth >= 600 ? 'repeat(2,1fr)' : '1fr';

    cat.items.forEach((item, i) => {
      const card = document.createElement('div');
      const isAlt = i % 4 >= 2; // alternating black/white cards
      const isFull = i % 4 === 0; // every 4th is black

      card.className = 'sketch-box menu-card reveal';
      card.style.cssText = `
        padding: 20px;
        background: ${isFull ? 'var(--black)' : 'var(--white)'};
        color: ${isFull ? 'var(--white)' : 'var(--black)'};
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition-delay: ${i * 0.05}s;
        cursor: pointer;
      `;

      const tagHtml = item.tag && TAG_STYLES[item.tag] ? `
        <span style="
          display:inline-block;
          padding:3px 10px;
          font-family:var(--font-hand);
          font-size:12px;
          font-weight:700;
          background:${isFull ? 'white' : TAG_STYLES[item.tag].bg};
          color:${isFull ? 'black' : TAG_STYLES[item.tag].color};
          border-radius:20px;
          ${TAG_STYLES[item.tag].border && !isFull ? `border:${TAG_STYLES[item.tag].border}` : ''};
          letter-spacing:0.05em;
        ">${TAG_STYLES[item.tag].label}</span>
      ` : '';

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div style="flex:1;">
            ${tagHtml ? `<div style="margin-bottom:6px;">${tagHtml}</div>` : ''}
            <h3 style="font-family:var(--font-display);font-size:clamp(20px,4.5vw,26px);letter-spacing:0.02em;margin-bottom:6px;">${item.name}</h3>
            <p style="font-family:var(--font-body);font-size:14px;line-height:1.65;opacity:0.75;">${item.desc}</p>
          </div>
          <div style="
            font-family:var(--font-hand);
            font-size:22px;
            font-weight:700;
            flex-shrink:0;
            margin-top:4px;
            min-width:60px;
            text-align:right;
          ">₹${item.price}</div>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:flex-end;">
          <button onclick="addToOrder('${item.id}','${item.name}',${item.price})" style="
            font-family:var(--font-hand);
            font-size:15px;
            font-weight:700;
            padding:8px 20px;
            border:2.5px solid ${isFull ? 'white' : 'var(--black)'};
            border-radius:var(--radius-sketch);
            background:${isFull ? 'white' : 'var(--black)'};
            color:${isFull ? 'black' : 'white'};
            cursor:pointer;
            transition:transform 0.15s;
          " onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform='scale(1)'">
            + Add
          </button>
        </div>
      `;

      grid.appendChild(card);
    });

    container.appendChild(grid);
  });

  // Trigger reveal on new elements
  setTimeout(() => {
    container.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('visible');
    });
  }, 50);
}

// ---- Category Tab Switching ----
document.querySelectorAll('.cat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.cat;
    if (menuData) renderMenu(activeCategory);

    // Scroll to menu content
    const menuTop = document.getElementById('menuContent').getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: menuTop, behavior: 'smooth' });
  });
});

// ---- Mini Order Basket ----
let order = [];

function addToOrder(id, name, price) {
  const existing = order.find(o => o.id === id);
  if (existing) {
    existing.qty++;
  } else {
    order.push({ id, name, price, qty: 1 });
  }
  updateOrderBadge();
  showToast(`Added ${name}!`);
}

function updateOrderBadge() {
  const total = order.reduce((sum, o) => sum + o.qty, 0);
  let badge = document.getElementById('orderBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'orderBadge';
    badge.style.cssText = `
      position:fixed;
      bottom:88px;
      right:20px;
      z-index:200;
      background:var(--black);
      color:white;
      border:3px solid var(--black);
      border-radius:var(--radius-sketch);
      padding:12px 16px;
      font-family:var(--font-hand);
      font-size:16px;
      cursor:pointer;
      box-shadow:4px 4px 0 rgba(0,0,0,0.2);
      display:flex;
      align-items:center;
      gap:10px;
    `;
    badge.onclick = showOrderSummary;
    document.body.appendChild(badge);
  }
  badge.innerHTML = `🧺 ${total} item${total !== 1 ? 's' : ''} · ₹${order.reduce((s,o)=>s+o.price*o.qty,0)}`;
  if (total === 0) badge.style.display = 'none';
  else badge.style.display = 'flex';
}

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;top:80px;left:50%;transform:translateX(-50%);
    background:var(--black);color:white;
    font-family:var(--font-hand);font-size:15px;
    padding:10px 20px;border-radius:var(--radius-sketch);
    z-index:9999;pointer-events:none;
    transition:opacity 0.4s;
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; }, 1500);
  setTimeout(() => t.remove(), 2000);
}

function showOrderSummary() {
  if (!order.length) return;
  const total = order.reduce((s, o) => s + o.price * o.qty, 0);
  const lines = order.map(o => `${o.qty}× ${o.name} — ₹${o.price * o.qty}`).join('\n');
  const msg = `Your order:\n\n${lines}\n\nTotal: ₹${total}\n\nProceed to checkout?`;
  if (confirm(msg)) {
    window.location.href = 'reserve.html';
  }
}

// ---- Responsive grid on resize ----
window.addEventListener('resize', () => {
  if (menuData) renderMenu(activeCategory);
}, { passive: true });

// ---- Init ----
loadMenu();
