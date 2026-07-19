(function() {
  'use strict';

  const addToCart = async (variantId, quantity = 1) => {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity })
    });
    if (!response.ok) throw new Error('Add to cart failed');
    return response.json();
  };

  // Open popup
  document.querySelectorAll('.js-open-popup').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId;
      const overlay = document.querySelector(`.js-popup-${productId}`);
      if (overlay) overlay.style.display = 'flex';
    });
  });

  // Close popup
  document.querySelectorAll('.js-close-popup').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeBtn.closest('.popup-overlay').style.display = 'none';
    });
  });

  // Add to cart from popup
  document.querySelectorAll('.js-add-to-cart').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      const overlay = btn.closest('.popup-overlay');
      const selected = overlay.querySelector(`input[name="variant-${productId}"]:checked`);
      const variantId = selected ? selected.value : null;
      if (!variantId) { alert('Select a variant'); return; }

      try {
        await addToCart(variantId);
        // Auto-add Soft Winter Jacket if variant contains Black and Medium
        const info = selected.parentElement.textContent;
        if (/black/i.test(info) && /medium/i.test(info)) {
          const softJacketVariantId = 'REPLACE_WITH_SOFT_JACKET_VARIANT_ID';
          await addToCart(softJacketVariantId);
        }
        overlay.style.display = 'none';
        // Refresh cart UI (Shopify default toast)
        if (window.Shopify && Shopify?.ShopPay?.refresh) Shopify.ShopPay.refresh();
        document.dispatchEvent(new CustomEvent('cart:updated'));
      } catch (e) {
        console.error(e);
        alert('Could not add to cart');
      }
    });
  });
})();
