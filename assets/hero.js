/**
 * Hero Section – Vanilla JavaScript (No jQuery)
 * ───────────────────────────────────────────────
 * Handles interactive enhancements for the custom
 * Line-Art Hero section rendered by hero.liquid.
 */

(function () {
  'use strict';

  // ============================================
  // BUTTON RIPPLE EFFECT
  // ============================================

  /**
   * Attach a click-ripple animation to a button element.
   * @param {HTMLElement} button
   */
  function addRippleEffect(button) {
    if (!button) return;

    button.addEventListener('click', function (e) {
      // Remove any previous ripple before creating a new one
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

      // Auto-remove ripple span once animation finishes
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  /**
   * Inject the ripple keyframe animation once into the document <head>.
   */
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

  // Initialise ripple on all hero buttons
  injectRippleKeyframes();
  document.querySelectorAll('.custom-hero-button').forEach(addRippleEffect);

  // ============================================
  // SCROLL ANIMATIONS (Fade-in on intersection)
  // ============================================

  /**
   * Fade-in the hero text elements as they enter the viewport.
   * Only activated on desktop (> 768 px) to avoid layout shifts on mobile.
   */
  function setupScrollAnimations() {
    const title = document.querySelector('.custom-hero-heading');
    const descWrapper = document.querySelector('.custom-hero-body-wrapper');
    const actionBtn = document.querySelector('.custom-hero-button');

    const elements = [title, descWrapper, actionBtn].filter(Boolean);

    // Set initial hidden state
    elements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(15px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });

    // Reveal each element when it enters the viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.05 }
    );

    elements.forEach((el) => observer.observe(el));
  }

  if (window.innerWidth > 768) {
    setupScrollAnimations();
  }

  // ============================================
  // LOGGING
  // ============================================

  console.log('[Hero Section] Initialized successfully');
  console.log('[Hero Section] Using vanilla JavaScript (no jQuery)');
})();
