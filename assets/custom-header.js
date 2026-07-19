/**
 * Custom Header
 * Vanilla JavaScript - No jQuery
 */

(function() {
  'use strict';

  // ============================================
  // HAMBURGER MENU TOGGLE
  // ============================================

  const menuToggle = document.querySelector('.custom-header__menu-toggle');
  const mobileMenu = document.querySelector('.custom-header__mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function(e) {
      e.stopPropagation();

      // Toggle active state
      this.classList.toggle('active');
      mobileMenu.classList.toggle('open');

      // Update aria-expanded
      const isOpen = mobileMenu.classList.contains('open');
      this.setAttribute('aria-expanded', isOpen);

      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      const isClickInside = menuToggle.contains(e.target) || mobileMenu.contains(e.target);
      if (!isClickInside && mobileMenu.classList.contains('open')) {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });
  }

  // ============================================
  // CTA BUTTON RIPPLE EFFECT (Desktop)
  // ============================================

  const ctaButtons = document.querySelectorAll('.custom-header__cta-button, .custom-header__mobile-cta');

  ctaButtons.forEach(function(button) {
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

      setTimeout(function() {
        ripple.remove();
      }, 600);
    });
  });

  // ============================================
  // INJECT RIPPLE KEYFRAMES
  // ============================================

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

  // ============================================
  // LOGGING
  // ============================================

  console.log('[Custom Header] Initialized');

})();