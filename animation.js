/*!
 * SRUB RUSSIA - Advanced Animations
 * Version: 1.0.0
 * Parallax, scroll animations, and interactive effects
 */

(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const ANIMATION_CONFIG = {
    parallaxSpeed: 0.5,
    cursorFollowSpeed: 0.15,
    magneticStrength: 0.3,
    rippleSize: 300,
    particleCount: 50
  };

  // ===== STATE =====
  const ANIMATION_STATE = {
    mouseX: 0,
    mouseY: 0,
    cursorX: 0,
    cursorY: 0,
    isTouch: false
  };

  // ===== INITIALIZATION =====
  function init() {
    console.log('🎨 Initializing advanced animations...');
    
    detectTouchDevice();
    setupParallax();
    setupCustomCursor();
    setupMagneticElements();
    setupRippleEffect();
    setupHoverAnimations();
    setupTextAnimations();
    setupImageReveal();
    
    console.log('✓ Advanced animations initialized');
  }

  // ===== TOUCH DETECTION =====
  function detectTouchDevice() {
    ANIMATION_STATE.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (ANIMATION_STATE.isTouch) {
      document.body.classList.add('touch-device');
    }
  }

  // ===== PARALLAX EFFECT =====
  function setupParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length === 0) return;

    window.addEventListener('scroll', SrubUtils.throttle(() => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(element => {
        const speed = parseFloat(element.getAttribute('data-parallax')) || ANIMATION_CONFIG.parallaxSpeed;
        const yPos = -(scrolled * speed);
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    }, 10));
  }

  // ===== CUSTOM CURSOR =====
  function setupCustomCursor() {
    if (ANIMATION_STATE.isTouch) return;

    // Create cursor elements
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    
    const cursorFollower = document.createElement('div');
    cursorFollower.className = 'custom-cursor-follower';
    
    document.body.appendChild(cursor);
    document.body.appendChild(cursorFollower);

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      ANIMATION_STATE.mouseX = e.clientX;
      ANIMATION_STATE.mouseY = e.clientY;
      
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    // Smooth follower animation
    function animateCursor() {
      const dx = ANIMATION_STATE.mouseX - ANIMATION_STATE.cursorX;
      const dy = ANIMATION_STATE.mouseY - ANIMATION_STATE.cursorY;
      
      ANIMATION_STATE.cursorX += dx * ANIMATION_CONFIG.cursorFollowSpeed;
      ANIMATION_STATE.cursorY += dy * ANIMATION_CONFIG.cursorFollowSpeed;
      
      cursorFollower.style.left = ANIMATION_STATE.cursorX + 'px';
      cursorFollower.style.top = ANIMATION_STATE.cursorY + 'px';
      
      requestAnimationFrame(animateCursor);
    }
    
    animateCursor();

    // Cursor interactions
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, .project-card, .service-card, .faq-toggle');
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        cursor.classList.add('active');
        cursorFollower.classList.add('active');
      });
      
      element.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
        cursorFollower.classList.remove('active');
      });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
      cursorFollower.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
      cursorFollower.style.opacity = '1';
    });

    // Add cursor styles
    addCursorStyles();
  }

  function addCursorStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .custom-cursor,
      .custom-cursor-follower {
        position: fixed;
        pointer-events: none;
        z-index: 10001;
        mix-blend-mode: difference;
        transition: opacity 0.3s ease;
      }
      
      .custom-cursor {
        width: 8px;
        height: 8px;
        background: var(--color-gold);
        border-radius: 50%;
        transform: translate(-50%, -50%);
      }
      
      .custom-cursor-follower {
        width: 40px;
        height: 40px;
        border: 2px solid var(--color-gold);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.3s ease, height 0.3s ease;
      }
      
      .custom-cursor.active {
        transform: translate(-50%, -50%) scale(1.5);
      }
      
      .custom-cursor-follower.active {
        width: 60px;
        height: 60px;
      }
      
      .touch-device .custom-cursor,
      .touch-device .custom-cursor-follower {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  // ===== MAGNETIC ELEMENTS =====
  function setupMagneticElements() {
    if (ANIMATION_STATE.isTouch) return;

    const magneticElements = document.querySelectorAll('[data-magnetic]');
    
    magneticElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const moveX = x * ANIMATION_CONFIG.magneticStrength;
        const moveY = y * ANIMATION_CONFIG.magneticStrength;
        
        element.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translate(0, 0)';
      });
    });
  }

  // ===== RIPPLE EFFECT =====
  function setupRippleEffect() {
    const rippleElements = document.querySelectorAll('[data-ripple]');
    
    rippleElements.forEach(element => {
      element.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });

    // Add ripple styles
    addRippleStyles();
  }

  function addRippleStyles() {
    const style = document.createElement('style');
    style.textContent = `
      [data-ripple] {
        position: relative;
        overflow: hidden;
      }
      
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
      }
      
      @keyframes ripple-animation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== HOVER ANIMATIONS =====
  function setupHoverAnimations() {
    // Image zoom on hover
    const zoomImages = document.querySelectorAll('[data-zoom]');
    
    zoomImages.forEach(container => {
      const image = container.querySelector('img');
      if (!image) return;

      container.addEventListener('mouseenter', () => {
        image.style.transform = 'scale(1.1)';
      });

      container.addEventListener('mouseleave', () => {
        image.style.transform = 'scale(1)';
      });
    });

    // Tilt effect
    const tiltElements = document.querySelectorAll('[data-tilt]');
    
    tiltElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // ===== TEXT ANIMATIONS =====
  function setupTextAnimations() {
    // Split text into words/letters for animation
    const animatedTexts = document.querySelectorAll('[data-text-animate]');
    
    animatedTexts.forEach(element => {
      const text = element.textContent;
      const animationType = element.getAttribute('data-text-animate');
      
      if (animationType === 'words') {
        const words = text.split(' ');
        element.innerHTML = words.map((word, index) => 
          `<span class="word" style="animation-delay: ${index * 0.1}s">${word}</span>`
        ).join(' ');
      } else if (animationType === 'letters') {
        const letters = text.split('');
        element.innerHTML = letters.map((letter, index) => 
          `<span class="letter" style="animation-delay: ${index * 0.05}s">${letter === ' ' ? '&nbsp;' : letter}</span>`
        ).join('');
      }
    });

    // Typewriter effect
    const typewriterElements = document.querySelectorAll('[data-typewriter]');
    
    typewriterElements.forEach(element => {
      const text = element.textContent;
      const speed = parseInt(element.getAttribute('data-typewriter')) || 50;
      element.textContent = '';
      
      let index = 0;
      const typeWriter = () => {
        if (index < text.length) {
          element.textContent += text.charAt(index);
          index++;
          setTimeout(typeWriter, speed);
        }
      };

      // Start when in viewport
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            typeWriter();
            observer.unobserve(element);
          }
        });
      });

      observer.observe(element);
    });

    // Add text animation styles
    addTextAnimationStyles();
  }

  function addTextAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .word {
        display: inline-block;
        opacity: 0;
        animation: fadeInUp 0.6s ease forwards;
      }
      
      .letter {
        display: inline-block;
        opacity: 0;
        animation: fadeInUp 0.4s ease forwards;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== IMAGE REVEAL =====
  function setupImageReveal() {
    const revealImages = document.querySelectorAll('[data-reveal]');
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const direction = element.getAttribute('data-reveal') || 'bottom';
          
          element.classList.add('reveal-active');
          element.style.animationName = `reveal-${direction}`;
          
          observer.unobserve(element);
        }
      });
    }, observerOptions);

    revealImages.forEach(image => {
      observer.observe(image);
    });

    // Add reveal styles
    addRevealStyles();
  }

  function addRevealStyles() {
    const style = document.createElement('style');
    style.textContent = `
      [data-reveal] {
        opacity: 0;
        position: relative;
        overflow: hidden;
      }
      
      [data-reveal]::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--color-bg);
        z-index: 1;
        transform-origin: left;
      }
      
      .reveal-active {
        animation-duration: 1s;
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        animation-fill-mode: forwards;
      }
      
      .reveal-active::before {
        animation: reveal-overlay 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      @keyframes reveal-bottom {
        from {
          opacity: 0;
          transform: translateY(50px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes reveal-top {
        from {
          opacity: 0;
          transform: translateY(-50px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes reveal-left {
        from {
          opacity: 0;
          transform: translateX(-50px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes reveal-right {
        from {
          opacity: 0;
          transform: translateX(50px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes reveal-overlay {
        0% {
          transform: scaleX(0);
        }
        50% {
          transform: scaleX(1);
          transform-origin: left;
        }
        51% {
          transform-origin: right;
        }
        100% {
          transform: scaleX(0);
          transform-origin: right;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== SCROLL PROGRESS INDICATOR =====
  function setupScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', SrubUtils.throttle(() => {
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (window.pageYOffset / windowHeight) * 100;
      progressBar.style.width = scrolled + '%';
    }, 10));

    // Add progress bar styles
    const style = document.createElement('style');
    style.textContent = `
      .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--color-gold) 0%, var(--color-gold-light) 100%);
        z-index: 10000;
        transition: width 0.1s ease;
        box-shadow: 0 0 10px rgba(193, 171, 97, 0.5);
      }
    `;
    document.head.appendChild(style);
  }

  // ===== PARTICLE BACKGROUND =====
  function createParticleBackground(container) {
    const canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    function Particle() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
    }

    Particle.prototype.draw = function() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(193, 171, 97, 0.5)';
      ctx.fill();
    };

    Particle.prototype.update = function() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    };

    function init() {
      particles = [];
      for (let i = 0; i < ANIMATION_CONFIG.particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(193, 171, 97, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    }

    resize();
    init();
    animate();

    window.addEventListener('resize', SrubUtils.debounce(() => {
      resize();
      init();
    }, 250));

    // Add canvas styles
    const style = document.createElement('style');
    style.textContent = `
      .particle-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0.3;
      }
    `;
    document.head.appendChild(style);

    return {
      destroy: () => {
        cancelAnimationFrame(animationId);
        canvas.remove();
      }
    };
  }

  // ===== SMOOTH SCROLL ANCHOR =====
  function setupSmoothScrollAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        e.preventDefault();

        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  // ===== LAZY LOADING IMAGES =====
  function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // ===== PERFORMANCE MONITORING =====
  function monitorPerformance() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`⏱️ ${entry.name}: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
    }
  }

  // ===== INITIALIZE ON DOM READY =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== EXPORT API =====
  window.SrubAnimations = {
    createParticleBackground,
    setupScrollProgress,
    setupLazyLoading
  };

})();

console.log('✓ Animation scripts loaded');