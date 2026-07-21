/**
 * ─────────────────────────────────────────────────────────────────────────────
 * quick-product-details.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Controller for the Quick Product Details modal matching the reference image layout.
 *  - Color Segmented Control
 *  - Size Select Dropdown with right divider
 *  - Full-width Black ADD TO CART button with right arrow
 *  - Black + Medium auto-add rule for Soft Winter Jacket
 * ─────────────────────────────────────────────────────────────────────────────
 */

class QuickProductDetailsManager {
  constructor() {
    this.softJacketVariantId = null;
    this.init();
  }

  init() {
    this.bindDelegatedEvents();
    this.prefetchSoftJacketVariant();
  }

  bindDelegatedEvents() {
    // Global Click Delegation
    document.addEventListener('click', (e) => {
      // 1. Open Trigger
      const openBtn = e.target.closest('.js-open-quick-details');
      if (openBtn) {
        e.preventDefault();
        const productId = openBtn.dataset.productId;
        if (productId) this.openModal(productId);
        return;
      }

      // 2. Close Trigger
      const closeBtn = e.target.closest('.js-close-quick-details');
      if (closeBtn) {
        const modal = closeBtn.closest('.js-quick-product-details');
        if (modal) this.closeModal(modal);
        return;
      }

      // 3. Add to Cart Trigger
      const addToCartBtn = e.target.closest('.js-add-to-cart-trigger');
      if (addToCartBtn) {
        e.preventDefault();
        const modal = addToCartBtn.closest('.js-quick-product-details');
        if (modal) this.handleAddToCart(modal, addToCartBtn);
        return;
      }
    });

    // Color Radio & Size Select Change Delegation
    document.addEventListener('change', (e) => {
      const isOption = e.target.closest('.js-option-radio, .js-option-select');
      if (isOption) {
        const modal = isOption.closest('.js-quick-product-details');
        if (modal) this.syncVariantSelection(modal);
      }
    });

    // ESC Key Listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const visibleModal = document.querySelector('.js-quick-product-details[aria-hidden="false"]');
        if (visibleModal) this.closeModal(visibleModal);
      }
    });
  }

  openModal(productId) {
    const modal = document.getElementById(`quick-product-details-${productId}`);
    if (!modal) return;

    // Move modal to <body> to break out of any CSS parent stacking contexts
    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Sync initial selection
    this.syncVariantSelection(modal);

    const closeBtn = modal.querySelector('.js-close-quick-details');
    if (closeBtn) closeBtn.focus();
  }

  closeModal(modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /**
   * Syncs Color radio & Size dropdown selections with variant dataset
   */
  syncVariantSelection(modal) {
    const colorRadio = modal.querySelector('.js-color-radio:checked');
    const sizeSelect = modal.querySelector('.js-size-select');
    const sizeRadio = modal.querySelector('.js-size-radio:checked');

    const selColor = colorRadio ? colorRadio.value.toLowerCase() : '';
    const selSize = sizeSelect ? sizeSelect.value.toLowerCase() : (sizeRadio ? sizeRadio.value.toLowerCase() : '');

    // Update visible selected text label for Size
    if (sizeSelect && sizeSelect.selectedIndex >= 0) {
      const selectedOptionText = sizeSelect.options[sizeSelect.selectedIndex].text;
      const displayText = modal.querySelector('.js-size-selected-text');
      if (displayText && selectedOptionText) {
        displayText.textContent = selectedOptionText;
      }
    }

    const lookups = modal.querySelectorAll('.js-variant-lookup');
    let matchedLookup = null;

    lookups.forEach((input) => {
      const opt1 = (input.dataset.option1 || '').toLowerCase();
      const opt2 = (input.dataset.option2 || '').toLowerCase();
      const opt3 = (input.dataset.option3 || '').toLowerCase();
      const opts = [opt1, opt2, opt3];

      const matchColor = !selColor || opts.includes(selColor);
      const matchSize = !selSize || opts.includes(selSize);

      if (matchColor && matchSize) {
        matchedLookup = input;
      }
    });

    if (!matchedLookup && lookups.length > 0) {
      matchedLookup = lookups[0];
    }

    const priceDisplay = modal.querySelector('.js-product-price');
    const submitBtn = modal.querySelector('.js-add-to-cart-trigger');

    if (matchedLookup) {
      if (priceDisplay && matchedLookup.dataset.price) {
        priceDisplay.textContent = matchedLookup.dataset.price;
      }
      if (submitBtn) {
        submitBtn.dataset.activeVariantId = matchedLookup.dataset.variantId;
        const isAvailable = matchedLookup.dataset.available === 'true';
        submitBtn.disabled = !isAvailable;
        const btnText = submitBtn.querySelector('.btn-text');
        if (btnText) {
          btnText.textContent = isAvailable ? 'ADD TO CART' : 'SOLD OUT';
        }
      }
    }
  }

  async prefetchSoftJacketVariant() {
    if (this.softJacketVariantId) return this.softJacketVariantId;
    try {
      const res = await fetch('/products/soft-winter-jacket.js');
      if (!res.ok) return null;
      const productData = await res.json();
      const available = productData.variants.find((v) => v.available) || productData.variants[0];
      this.softJacketVariantId = available ? String(available.id) : null;
    } catch (_) {
      this.softJacketVariantId = null;
    }
    return this.softJacketVariantId;
  }

  /**
   * Checks if selected Color & Size form a Black + Medium combination
   */
  isBlackMediumSelected(modal) {
    const colorRadio = modal.querySelector('.js-color-radio:checked');
    const sizeSelect = modal.querySelector('.js-size-select');
    const sizeRadio = modal.querySelector('.js-size-radio:checked');

    const selColor = colorRadio ? colorRadio.value.toLowerCase() : '';
    const selSize = sizeSelect ? sizeSelect.value.toLowerCase() : (sizeRadio ? sizeRadio.value.toLowerCase() : '');

    return selColor.includes('black') && selSize.includes('medium');
  }

  async handleAddToCart(modal, button) {
    const variantId = button.dataset.activeVariantId || button.dataset.defaultVariantId;

    if (!variantId) {
      alert('Please select a valid size and color.');
      return;
    }

    const items = [{ id: Number(variantId), quantity: 1 }];

    // Auto-add Soft Winter Jacket rule
    if (this.isBlackMediumSelected(modal)) {
      const jacketId = await this.prefetchSoftJacketVariant();
      if (jacketId) {
        items.push({ id: Number(jacketId), quantity: 1 });
      }
    }

    button.disabled = true;
    const btnText = button.querySelector('.btn-text');
    const originalText = btnText ? btnText.textContent : 'ADD TO CART';
    if (btnText) btnText.textContent = 'ADDING...';

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('Cart add failed');

      if (btnText) btnText.textContent = 'ADDED ✓';
      document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
      document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));

      setTimeout(() => {
        button.disabled = false;
        if (btnText) btnText.textContent = originalText;
        this.closeModal(modal);
      }, 1200);
    } catch (err) {
      console.error('[QuickProductDetails]', err);
      alert('Could not add product to cart. Please try again.');
      button.disabled = false;
      if (btnText) btnText.textContent = originalText;
    }
  }
}

// Immediate & safe initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.quickProductDetails = new QuickProductDetailsManager();
  });
} else {
  window.quickProductDetails = new QuickProductDetailsManager();
}
