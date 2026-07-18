/**
 * Custom Product Grid
 * Vanilla JavaScript - No jQuery
 * Fetches product data using Shopify's AJAX API
 */

(function() {
  'use strict';

  // ============================================
  // PRODUCT GRID COMPONENT
  // ============================================

  class CustomProductGrid {
    constructor(element) {
      this.element = element;
      this.sectionId = element.dataset.sectionId;
      this.productHandles = element.dataset.productHandles || '';
      this.grid = element.querySelector('.custom-product-grid__grid');
      this.loading = element.querySelector('.custom-product-grid__loading');
      this.products = [];
      this.cart = null;

      // Bind methods
      this.init = this.init.bind(this);
      this.fetchProducts = this.fetchProducts.bind(this);
      this.renderProducts = this.renderProducts.bind(this);
      this.handleAddToCart = this.handleAddToCart.bind(this);
      this.updateCartCount = this.updateCartCount.bind(this);
      this.showToast = this.showToast.bind(this);

      // Initialize
      this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
      if (!this.productHandles || this.productHandles.trim() === '') {
        this.showPlaceholders();
        return;
      }

      this.fetchProducts();
    }

    // ============================================
    // FETCH PRODUCTS FROM SHOPIFY API
    // ============================================

    async fetchProducts() {
      try {
        // Show loading state
        if (this.loading) {
          this.loading.style.display = 'block';
        }

        const handles = this.productHandles.split(',').map(h => h.trim()).filter(Boolean);
        const fetchPromises = handles.map(handle => this.fetchProduct(handle));
        
        const results = await Promise.allSettled(fetchPromises);
        
        // Filter successful results
        this.products = results
          .filter(result => result.status === 'fulfilled' && result.value)
          .map(result => result.value)
          .slice(0, 6); // Max 6 products

        // Hide loading state
        if (this.loading) {
          this.loading.style.display = 'none';
        }

        // Render products
        if (this.products.length > 0) {
          this.renderProducts();
        } else {
          this.showPlaceholders('No products found. Please check your product handles.');
        }

      } catch (error) {
        console.error('[Custom Product Grid] Error fetching products:', error);
        if (this.loading) {
          this.loading.style.display = 'none';
        }
        this.showPlaceholders('Error loading products. Please try again.');
      }
    }

    /**
     * Fetches a single product by handle using Shopify's AJAX API
     * @param {string} handle - Product handle
     * @returns {Promise<Object>} Product data
     */
    async fetchProduct(handle) {
      // Use Shopify's product API endpoint (locale-aware)
      const rootUrl = window.Shopify?.routes?.root || Theme?.routes?.root_url || '/';
      const cleanRootUrl = rootUrl.endsWith('/') ? rootUrl : `${rootUrl}/`;
      const url = `${cleanRootUrl}products/${handle}.js`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Product "${handle}" not found (${response.status})`);
      }

      const product = await response.json();
      return product;
    }

    // ============================================
    // RENDER PRODUCTS
    // ============================================

    renderProducts() {
      if (!this.grid) return;

      let html = '';

      this.products.forEach((product, index) => {
        const variant = product.variants && product.variants.length > 0 
          ? product.variants[0] 
          : null;
        
        let imageUrl = product.featured_image || null;
        if (!imageUrl && product.images && product.images.length > 0) {
          imageUrl = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].src;
        }
        
        const compareAtPrice = variant ? variant.compare_at_price : null;
        const price = variant ? variant.price : 0;
        const available = variant ? variant.available : false;
        const variantId = variant ? variant.id : null;

        html += `
          <div class="product-grid-item" data-product-id="${product.id}" data-product-handle="${product.handle}" data-index="${index}">
            <div class="product-grid-item__image-wrapper">
              ${imageUrl ? `
                <img 
                  src="${imageUrl}" 
                  alt="${product.title}"
                  class="product-grid-item__image"
                  loading="lazy"
                  width="400"
                  height="400"
                >
              ` : `
                <div class="product-grid-item__image-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="2.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              `}
            </div>
            
            <h3 class="product-grid-item__title">${this.escapeHtml(product.title)}</h3>
            
            <div class="product-grid-item__price">
              ${compareAtPrice && compareAtPrice > price ? `
                <span class="product-grid-item__price--compare">${this.formatMoney(compareAtPrice)}</span>
                <span class="product-grid-item__price--sale">${this.formatMoney(price)}</span>
              ` : `
                <span class="product-grid-item__price--regular">${this.formatMoney(price)}</span>
              `}
            </div>
            
            ${available && variantId ? `
              <button 
                class="product-grid-item__button" 
                data-product-id="${product.id}"
                data-variant-id="${variantId}"
                data-product-title="${this.escapeHtml(product.title)}"
                data-add-to-cart
              >
                <span class="button-text">Add to Cart</span>
                <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            ` : `
              <button class="product-grid-item__button product-grid-item__button--sold-out" disabled>
                Sold Out
              </button>
            `}
          </div>
        `;
      });

      this.grid.innerHTML = html;

      // Set up event listeners
      this.setupEventListeners();

      // Trigger scroll animation
      this.setupScrollAnimation();
    }

    // ============================================
    // PLACEHOLDER PRODUCTS
    // ============================================

    showPlaceholders(message) {
      if (!this.grid) return;

      if (this.loading) {
        this.loading.style.display = 'none';
      }

      let html = '';

      // Show message if provided
      if (message) {
        html += `
          <div class="product-grid-item product-grid-item--message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <p style="color: #666; font-size: 1.1rem;">${message}</p>
          </div>
        `;
      }

      // Show 6 placeholder items
      for (let i = 0; i < 6; i++) {
        html += `
          <div class="product-grid-item product-grid-item--placeholder">
            <div class="product-grid-item__image-wrapper">
              <div class="product-grid-item__image-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="2.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            </div>
            <h3 class="product-grid-item__title">${message ? '—' : 'Add Products'}</h3>
            <div class="product-grid-item__price">
              <span class="product-grid-item__price--regular">${message ? '—' : '$0.00'}</span>
            </div>
            <button class="product-grid-item__button product-grid-item__button--disabled" disabled>
              Add to Cart
            </button>
          </div>
        `;
      }

      this.grid.innerHTML = html;
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
      const buttons = this.grid.querySelectorAll('[data-add-to-cart]');

      buttons.forEach(button => {
        // Add ripple effect
        this.addRippleEffect(button);

        // Add click handler
        button.addEventListener('click', this.handleAddToCart);
      });
    }

    // ============================================
    // ADD TO CART FUNCTIONALITY
    // ============================================

    async handleAddToCart(event) {
      const button = event.currentTarget;
      const variantId = button.dataset.variantId;
      const productTitle = button.dataset.productTitle || 'Product';

      if (!variantId) {
        this.showToast('Product variant not found', 'error');
        return;
      }

      // Disable button
      button.disabled = true;
      const originalHTML = button.innerHTML;
      button.innerHTML = '<span>Adding...</span>';

      try {
        // Add to cart using Shopify's cart API
        const response = await this.addToCart(variantId, 1);

        // Success
        button.innerHTML = '<span>✓ Added</span>';
        button.classList.add('product-grid-item__button--added');

        this.showToast(`${productTitle} added to cart!`, 'success');

        // Update cart count
        await this.updateCartCount();

        // Reset button after delay
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.classList.remove('product-grid-item__button--added');
          button.disabled = false;
        }, 1500);

      } catch (error) {
        console.error('[Custom Product Grid] Add to cart error:', error);
        this.showToast(error.message || 'Failed to add to cart', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
      }
    }

    /**
     * Adds item to cart using Shopify's cart API
     * @param {string} variantId - The variant ID
     * @param {number} quantity - Quantity to add
     * @returns {Promise<Object>} Cart response
     */
    async addToCart(variantId, quantity = 1) {
      const payload = {
        items: [{
          id: parseInt(variantId, 10),
          quantity: quantity,
        }],
      };

      // Get cart section IDs for update
      const cartItems = document.querySelectorAll('cart-items-component');
      const sectionIds = [];
      cartItems.forEach((item) => {
        if (item instanceof HTMLElement && item.dataset.sectionId) {
          sectionIds.push(item.dataset.sectionId);
        }
      });

      if (sectionIds.length > 0) {
        payload.sections = sectionIds.join(',');
      }
      const cartAddUrl = Theme?.routes?.cart_add_url || (window.Shopify?.routes?.root ? `${window.Shopify.routes.root}cart/add.js`.replace(/\/+/g, '/') : '/cart/add.js');
      const response = await fetch(cartAddUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
      }

      // Dispatch cart update event (like Shopify components do)
      const cartData = await response.json();
      
      // Dispatch custom event for other components to react
      const cartUpdateEvent = new CustomEvent('cart-lines-update', {
        detail: {
          items: cartData.items || [],
          source: 'product-grid',
          sourceId: this.sectionId,
        },
        bubbles: true,
      });
      document.dispatchEvent(cartUpdateEvent);

      return cartData;
    }

    // ============================================
    // UPDATE CART COUNT
    // ============================================

    async updateCartCount() {
      try {
        const cartUrl = Theme?.routes?.cart_url ? `${Theme.routes.cart_url}.js` : (window.Shopify?.routes?.root ? `${window.Shopify.routes.root}cart.js`.replace(/\/+/g, '/') : '/cart.js');
        const response = await fetch(cartUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'same-origin',
        });

        if (!response.ok) return;

        const cart = await response.json();
        const totalItems = cart.item_count || 0;

        // Update all cart count elements
        const selectors = [
          '.header-actions__cart-count',
          '.cart-count-bubble',
          '.cart-count',
          '[data-cart-count]',
        ];

        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el.dataset?.cartCount !== undefined) {
              el.dataset.cartCount = totalItems;
            }
            el.textContent = totalItems;
          });
        });

        // Update cart components
        const cartComponents = document.querySelectorAll('cart-items-component');
        cartComponents.forEach(component => {
          if (component.fetchCartData) {
            component.fetchCartData();
          }
        });

        return cart;
      } catch (error) {
        console.warn('[Custom Product Grid] Could not update cart count:', error);
        return null;
      }
    }

    // ============================================
    // TOAST NOTIFICATION
    // ============================================

    showToast(message, type = 'success') {
      // Remove existing toast
      const existingToast = document.querySelector('.product-grid-item__toast');
      if (existingToast) {
        existingToast.remove();
      }

      const toast = document.createElement('div');
      toast.className = 'product-grid-item__toast';
      toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-message">${message}</span>
      `;

      document.body.appendChild(toast);

      // Trigger animation
      requestAnimationFrame(() => {
        toast.classList.add('product-grid-item__toast--visible');
      });

      // Auto hide
      setTimeout(() => {
        toast.classList.remove('product-grid-item__toast--visible');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 400);
      }, 3000);
    }

    // ============================================
    // RIPPLE EFFECT
    // ============================================

    addRippleEffect(button) {
      if (!button) return;

      button.addEventListener('click', function(e) {
        const existingRipple = this.querySelector('.ripple');
        if (existingRipple) existingRipple.remove();

        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.25)';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.animation = 'rippleAnim 0.6s ease-out forwards';
        ripple.style.pointerEvents = 'none';

        const size = Math.max(rect.width, rect.height) * 0.6;
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    }

    // ============================================
    // SCROLL ANIMATION
    // ============================================

    setupScrollAnimation() {
      const items = this.grid.querySelectorAll('.product-grid-item:not(.product-grid-item--placeholder):not(.product-grid-item--message)');

      if (!('IntersectionObserver' in window) || items.length === 0) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, index * 80);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      });

      items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
      });
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Formats money using Shopify's money format
     * @param {number} amount - Amount in cents
     * @returns {string} Formatted money string
     */
    formatMoney(amount) {
      if (amount === undefined || amount === null) return '$0.00';
      
      // Get currency from Shopify's theme settings
      const currency = window.Shopify?.currency?.active || 'USD';
      const price = amount / 100;
      
      // Format based on currency
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      return formatter.format(price);
    }

    /**
     * Escapes HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    /**
     * Debounce function
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in ms
     * @returns {Function} Debounced function
     */
    debounce(fn, delay) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    }
  }

  // ============================================
  // INJECT RIPPLE KEYFRAMES
  // ============================================

  function injectRippleKeyframes() {
    if (document.getElementById('grid-ripple-style')) return;

    const style = document.createElement('style');
    style.id = 'grid-ripple-style';
    style.textContent = `
      @keyframes rippleAnim {
        to {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // INITIALIZE ALL PRODUCT GRIDS
  // ============================================

  function initProductGrids() {
    injectRippleKeyframes();

    const grids = document.querySelectorAll('.custom-product-grid');
    
    grids.forEach(grid => {
      // Check if already initialized
      if (grid._initialized) return;
      
      const productGrid = new CustomProductGrid(grid);
      grid._initialized = true;
    });

    console.log('[Custom Product Grid] Initialized', grids.length, 'grids');
  }

  // ============================================
  // DOM READY
  // ============================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductGrids);
  } else {
    // Wait a tick for the DOM to be fully ready
    setTimeout(initProductGrids, 50);
  }

  // ============================================
  // HANDLE THEME EDITOR CHANGES
  // ============================================

  // Re-initialize when Shopify's theme editor updates sections
  document.addEventListener('shopify:section:load', function(event) {
    const grid = event.target.classList.contains('custom-product-grid')
      ? event.target
      : event.target.querySelector('.custom-product-grid');
    if (grid && !grid._initialized) {
      const productGrid = new CustomProductGrid(grid);
      grid._initialized = true;
    }
  });

  // Re-initialize when Shopify's theme editor re-renders
  document.addEventListener('shopify:section:reorder', function(event) {
    const grid = event.target.classList.contains('custom-product-grid')
      ? event.target
      : event.target.querySelector('.custom-product-grid');
    if (grid && !grid._initialized) {
      const productGrid = new CustomProductGrid(grid);
      grid._initialized = true;
    }
  });

})();