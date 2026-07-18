/**
 * Custom Hero Section
 * Vanilla JavaScript - No jQuery
 */

(function() {
  'use strict';

  // ============================================
  // BUTTON RIPPLE EFFECT
  // ============================================

  const shopButton = document.querySelector('.custom-hero-button');

  function addRippleEffect(button) {
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

      const size = Math.max(rect.width, rect.height) * 0.8;
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.3)';
      ripple.style.transform = 'translate(-50%, -50%) scale(0)';
      ripple.style.animation = 'rippleAnim 0.6s ease-out forwards';
      ripple.style.pointerEvents = 'none';

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  // Inject keyframe animation
  function injectRippleKeyframes() {
    if (document.getElementById('ripple-style-element')) return;
    const style = document.createElement('style');
    style.id = 'ripple-style-element';
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

  injectRippleKeyframes();
  if (shopButton) {
    addRippleEffect(shopButton);
  }

  // ============================================
  // SCROLL ANIMATIONS (Fade-in)
  // ============================================

  function setupScrollAnimations() {
    const title = document.querySelector('.custom-hero-heading');
    const descWrapper = document.querySelector('.custom-hero-body-wrapper');
    const actionBtn = document.querySelector('.custom-hero-button');

    const elements = [title, descWrapper, actionBtn].filter(Boolean);

    elements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(15px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.05 });

    elements.forEach(el => observer.observe(el));
  }

  if (window.innerWidth > 768) {
    setupScrollAnimations();
  }

  // ============================================
  // LOGGING
  // ============================================

  console.log('[Custom Hero] Initialized successfully');
  console.log('[Custom Hero] Using vanilla JavaScript (no jQuery)');

})();