/**
 * Custom Header
 * Vanilla JavaScript - No jQuery
 */

(function() {
  'use strict';

  const ctaButton = document.querySelector('.custom-header__cta-button');

  if (ctaButton) {
    // Ripple effect on click
    ctaButton.addEventListener('click', function(e) {
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
      ripple.style.background = 'rgba(0, 0, 0, 0.08)';
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

  // Inject ripple keyframes if not already present
  if (!document.getElementById('header-ripple-style')) {
    const style = document.createElement('style');
    style.id = 'header-ripple-style';
    style.textContent = `
      @keyframes rippleAnim {
        to {
          transform: translate(-50%, -50%) scale(3);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  console.log('[Custom Header] Initialized');

})();