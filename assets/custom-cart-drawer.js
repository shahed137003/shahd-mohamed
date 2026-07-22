/**
 * ─────────────────────────────────────────────────────────────────────────────
 * custom-cart-drawer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Modern Vanilla JavaScript controller for the Custom Slide-Out Cart Drawer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

class CustomCartDrawerManager {
  constructor() {
    this.drawer = document.getElementById('custom-cart-drawer');
    this.shippingThresholdCents = 10000; // $100.00 Free Shipping threshold
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Listen for custom cart refresh events dispatched by Add to Cart triggers
    document.addEventListener('cart:refresh', () => {
      this.refreshCartAndOpen();
    });

    document.addEventListener('cart:updated', () => {
      this.refreshCart();
    });

    // Global Click Delegation for Drawer Actions
    document.addEventListener('click', (e) => {
      // 1. Open Drawer Triggers (e.g. cart icons in header)
      const openBtn = e.target.closest('.js-open-cart-drawer, [href="/cart"]');
      if (openBtn && !e.ctrlKey && !e.metaKey) {
        // Prevent default navigation if cart drawer exists
        if (this.drawer) {
          e.preventDefault();
          this.openDrawer();
          this.refreshCart();
          return;
        }
      }

      // 2. Close Drawer Triggers
      const closeBtn = e.target.closest('.js-close-cart-drawer');
      if (closeBtn) {
        e.preventDefault();
        this.closeDrawer();
        return;
      }

      // 3. Item Quantity Plus (+)
      const qtyPlus = e.target.closest('.js-cart-item-qty-plus');
      if (qtyPlus) {
        e.preventDefault();
        const key = qtyPlus.dataset.itemKey;
        const currentQty = parseInt(qtyPlus.dataset.qty, 10) || 1;
        this.updateItemQuantity(key, currentQty + 1);
        return;
      }

      // 4. Item Quantity Minus (-)
      const qtyMinus = e.target.closest('.js-cart-item-qty-minus');
      if (qtyMinus) {
        e.preventDefault();
        const key = qtyMinus.dataset.itemKey;
        const currentQty = parseInt(qtyMinus.dataset.qty, 10) || 1;
        this.updateItemQuantity(key, Math.max(0, currentQty - 1));
        return;
      }

      // 5. Remove Item Button (Trash icon)
      const removeBtn = e.target.closest('.js-cart-item-remove');
      if (removeBtn) {
        e.preventDefault();
        const key = removeBtn.dataset.itemKey;
        this.updateItemQuantity(key, 0);
        return;
      }
    });

    // ESC key listener to close drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDrawerOpen()) {
        this.closeDrawer();
      }
    });
  }

  isDrawerOpen() {
    return this.drawer && this.drawer.getAttribute('aria-hidden') === 'false';
  }

  openDrawer() {
    if (!this.drawer) return;
    this.drawer.style.display = 'flex';
    this.drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  closeDrawer() {
    if (!this.drawer) return;
    this.drawer.style.display = 'none';
    this.drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  async refreshCartAndOpen() {
    this.openDrawer();
    await this.refreshCart();
  }

  async refreshCart() {
    if (!this.drawer) return;

    const itemsContainer = this.drawer.querySelector('.js-cart-drawer-items');
    const footer = this.drawer.querySelector('.js-cart-drawer-footer');

    try {
      const res = await fetch('/cart.js');
      if (!res.ok) throw new Error('Failed to fetch cart data');

      const cart = await res.json();
      this.renderCart(cart);
    } catch (err) {
      console.error('[CustomCartDrawer]', err);
      if (itemsContainer) {
        itemsContainer.innerHTML = `<div class="custom-cart-drawer__empty"><p>Error loading cart. Please refresh.</p></div>`;
      }
    }
  }

  formatMoney(cents) {
    if (typeof cents !== 'number') return '$0.00';
    return '$' + (cents / 100).toFixed(2);
  }

  renderCart(cart) {
    if (!this.drawer) return;

    const badge = this.drawer.querySelector('.js-cart-count-badge');
    const itemsContainer = this.drawer.querySelector('.js-cart-drawer-items');
    const subtotal = this.drawer.querySelector('.js-cart-subtotal');
    const shippingBar = this.drawer.querySelector('.js-shipping-bar');
    const footer = this.drawer.querySelector('.js-cart-drawer-footer');

    // Update item count badges across theme
    if (badge) badge.textContent = cart.item_count || '0';
    document.querySelectorAll('.cart-count-bubble, .js-cart-count').forEach((el) => {
      el.textContent = cart.item_count || '0';
    });

    // Update Free Shipping Progress Bar
    this.renderShippingBar(cart.total_price);

    // If Cart is Empty
    if (!cart.items || cart.items.length === 0) {
      if (itemsContainer) {
        itemsContainer.innerHTML = `
          <div class="custom-cart-drawer__empty">
            <svg class="custom-cart-drawer__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <h3 class="custom-cart-drawer__empty-title">Your cart is empty</h3>
            <p class="custom-cart-drawer__empty-subtitle">Looks like you haven't added anything to your cart yet.</p>
            <a href="/collections/all" class="custom-cart-drawer__continue-btn js-close-cart-drawer">
              Start Shopping
            </a>
          </div>
        `;
      }
      if (footer) footer.style.display = 'none';
      if (subtotal) subtotal.textContent = '$0.00';
      return;
    }

    // Show footer when items exist
    if (footer) footer.style.display = 'flex';
    if (subtotal) subtotal.textContent = this.formatMoney(cart.total_price);

    // Build Cart Items HTML
    let itemsHTML = '';
    cart.items.forEach((item) => {
      const isSoftJacket = (item.product_title || '').toLowerCase().includes('soft winter jacket');
      const imgUrl = item.image || item.featured_image?.url || '';

      itemsHTML += `
        <div class="custom-cart-item" data-key="${item.key}">
          <div class="custom-cart-item__media">
            ${imgUrl ? `<img src="${imgUrl}" alt="${this.escapeHtml(item.title)}" class="custom-cart-item__image" loading="lazy">` : ''}
          </div>

          <div class="custom-cart-item__details">
            <h4 class="custom-cart-item__title">${this.escapeHtml(item.product_title || item.title)}</h4>
            ${item.variant_title ? `<span class="custom-cart-item__variant">${this.escapeHtml(item.variant_title)}</span>` : ''}
            <span class="custom-cart-item__price">${this.formatMoney(item.final_line_price)}</span>

            ${isSoftJacket ? `<span class="custom-cart-item__bonus-badge">🎁 Auto-Added Special</span>` : ''}

            <div class="custom-cart-item__bottom-row">
              <div class="custom-cart-item__qty-control">
                <button type="button" class="custom-cart-item__qty-btn js-cart-item-qty-minus" data-item-key="${item.key}" data-qty="${item.quantity}">-</button>
                <span class="custom-cart-item__qty-num">${item.quantity}</span>
                <button type="button" class="custom-cart-item__qty-btn js-cart-item-qty-plus" data-item-key="${item.key}" data-qty="${item.quantity}">+</button>
              </div>

              <button type="button" class="custom-cart-item__remove-btn js-cart-item-remove" data-item-key="${item.key}" aria-label="Remove ${this.escapeHtml(item.title)}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    if (itemsContainer) itemsContainer.innerHTML = itemsHTML;
  }

  renderShippingBar(totalCents) {
    if (!this.drawer) return;
    const msgEl = this.drawer.querySelector('.js-shipping-msg');
    const fillEl = this.drawer.querySelector('.js-shipping-progress');
    if (!msgEl || !fillEl) return;

    const remaining = this.shippingThresholdCents - totalCents;

    if (remaining <= 0) {
      msgEl.innerHTML = `<span>Congratulations!</span> You unlocked <strong>FREE Shipping!</strong> 🚀`;
      fillEl.style.width = '100%';
    } else {
      const pct = Math.min(100, Math.max(0, (totalCents / this.shippingThresholdCents) * 100));
      fillEl.style.width = `${pct}%`;
      const remFormatted = this.formatMoney(remaining);
      msgEl.innerHTML = `Add <strong>${remFormatted}</strong> more to get <span>FREE Shipping!</span>`;
    }
  }

  async updateItemQuantity(key, quantity) {
    if (!key) return;

    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity }),
      });

      if (!res.ok) throw new Error('Update quantity failed');

      const cart = await res.json();
      this.renderCart(cart);
      document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
    } catch (err) {
      console.error('[CustomCartDrawer] Update quantity error:', err);
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Immediate & safe initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.customCartDrawer = new CustomCartDrawerManager();
  });
} else {
  window.customCartDrawer = new CustomCartDrawerManager();
}
