/*!
 * SRUB RUSSIA - Main JavaScript
 * Version: 1.0.0
 * Author: Your Name
 */

(function() {
  'use strict';

  // ===== TELEGRAM BOT CONFIGURATION =====
  const TELEGRAM_CONFIG = {
    botToken: '7232379773:AAGmI9XTdSWBvAKCsVL4sla92eim2dodxPA', // ВАШ ТОКЕН
    chatId: '7232379773' // ВАШ CHAT ID (ЗАМЕНИТЕ НА ПРАВИЛЬНЫЙ!)
  };

  // ===== CONFIGURATION =====
  const CONFIG = {
    headerScrollThreshold: 100,
    animationOffset: 100,
    sliderAutoplayDelay: 5000,
    formSubmitDelay: 1500,
    scrollToTopThreshold: 300,
    debounceDelay: 150,
    throttleDelay: 100
  };

  // ===== STATE =====
  const STATE = {
    isMenuOpen: false,
    isModalOpen: false,
    currentSlide: 0,
    isScrolling: false,
    hasAnimated: new Set()
  };

  // ===== DOM ELEMENTS =====
  const DOM = {
    header: document.getElementById('header'),
    nav: document.getElementById('nav'),
    navToggle: document.querySelector('.nav-toggle'),
    navLinks: document.querySelectorAll('.nav-link'),
    modal: document.getElementById('modal-callback'),
    modalTriggers: document.querySelectorAll('[data-modal]'),
    modalCloseTriggers: document.querySelectorAll('[data-close-modal]'),
    forms: document.querySelectorAll('form'),
    projectsSlider: document.getElementById('projects-slider'),
    projectPrev: document.querySelector('.project-prev'),
    projectNext: document.querySelector('.project-next'),
    projectsProgress: document.querySelector('.projects-progress'),
    faqToggles: document.querySelectorAll('.faq-toggle'),
    animatedElements: document.querySelectorAll('.stat-item, .service-card, .feature-item, .project-card, .faq-item, .testimonial-card, .step-item')
  };

  // ===== INITIALIZATION =====
  function init() {
    console.log('🏠 Initializing Srub Russia website...');
    
    setupEventListeners();
    setupIntersectionObserver();
    setupScrollEffects();
    setupForms();
    setupSlider();
    setupFAQ();
    setupPhoneMask();
    createScrollToTopButton();
    setupStepsProgress();
    setupPlannerForm();
    
    // Initial checks
    checkHeaderScroll();
    animateStats();
    
    console.log('✓ Website initialized successfully');
  }

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // Navigation toggle
    if (DOM.navToggle) {
      DOM.navToggle.addEventListener('click', toggleMenu);
    }

    // Navigation links
    DOM.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          closeMenu();
          smoothScrollTo(targetElement);
          updateActiveNavLink(link);
        }
      });
    });

    // Modal triggers
    DOM.modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const modalId = trigger.getAttribute('data-modal');
        openModal(modalId);
      });
    });

    // Modal close triggers
    DOM.modalCloseTriggers.forEach(trigger => {
      trigger.addEventListener('click', closeModal);
    });

    // Close modal on overlay click
    if (DOM.modal) {
      DOM.modal.addEventListener('click', (e) => {
        if (e.target === DOM.modal || e.target.classList.contains('modal-overlay')) {
          closeModal();
        }
      });
    }

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && STATE.isModalOpen) {
        closeModal();
      }
      if (e.key === 'Escape' && STATE.isMenuOpen) {
        closeMenu();
      }
    });

    // Scroll events
    window.addEventListener('scroll', SrubUtils.throttle(handleScroll, CONFIG.throttleDelay));
    
    // Resize events
    window.addEventListener('resize', SrubUtils.debounce(handleResize, CONFIG.debounceDelay));

    // Slider controls
    if (DOM.projectPrev) {
      DOM.projectPrev.addEventListener('click', () => navigateSlider('prev'));
    }
    if (DOM.projectNext) {
      DOM.projectNext.addEventListener('click', () => navigateSlider('next'));
    }

    // Prevent form submission on Enter in text inputs
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') {
        e.preventDefault();
      }
    });
  }

  // ===== NAVIGATION =====
  function toggleMenu() {
    STATE.isMenuOpen = !STATE.isMenuOpen;
    
    if (STATE.isMenuOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  function openMenu() {
    DOM.nav.classList.add('active');
    DOM.navToggle.classList.add('active');
    DOM.navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    SrubUtils.lockScroll();
    STATE.isMenuOpen = true;
  }

  function closeMenu() {
    DOM.nav.classList.remove('active');
    DOM.navToggle.classList.remove('active');
    DOM.navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    SrubUtils.unlockScroll();
    STATE.isMenuOpen = false;
  }

  function updateActiveNavLink(activeLink) {
    DOM.navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
  }

  // ===== SCROLL EFFECTS =====
  function setupScrollEffects() {
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', SrubUtils.throttle(() => {
      const scrollPosition = window.pageYOffset + 200;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          DOM.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, 100));
  }

  function handleScroll() {
    checkHeaderScroll();
    checkScrollToTop();
  }

  function checkHeaderScroll() {
    const scrollPosition = SrubUtils.getScrollPosition();
    
    if (scrollPosition > CONFIG.headerScrollThreshold) {
      DOM.header.classList.add('scrolled');
    } else {
      DOM.header.classList.remove('scrolled');
    }
  }

  function smoothScrollTo(element, offset = 80) {
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  // ===== INTERSECTION OBSERVER =====
  function setupIntersectionObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !STATE.hasAnimated.has(entry.target)) {
          entry.target.classList.add('animate-in');
          STATE.hasAnimated.add(entry.target);
        }
      });
    }, observerOptions);

    DOM.animatedElements.forEach(element => {
      observer.observe(element);
    });
  }

  // ===== STATS ANIMATION =====
  function animateStats() {
    const statValues = document.querySelectorAll('.stat-value');
    let animated = false;

    const animateOnScroll = () => {
      if (animated) return;
      
      const statsSection = document.getElementById('stats');
      if (!statsSection) return;

      if (SrubUtils.isInViewport(statsSection, 200)) {
        statValues.forEach(stat => {
          const finalValue = parseInt(stat.textContent);
          stat.textContent = '0';
          SrubUtils.animateNumber(stat, 0, finalValue, 2000);
        });
        animated = true;
        window.removeEventListener('scroll', animateOnScroll);
      }
    };

    window.addEventListener('scroll', SrubUtils.throttle(animateOnScroll, 100));
    animateOnScroll();
  }

  // ===== MODAL =====
  function openModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (!modal) return;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    SrubUtils.lockScroll();
    STATE.isModalOpen = true;

    const firstInput = modal.querySelector('input:not([type="checkbox"])');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    trackEvent('Modal', 'Open', modalId);
  }

  function closeModal() {
    if (DOM.modal) {
      DOM.modal.classList.remove('active');
      DOM.modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      SrubUtils.unlockScroll();
      STATE.isModalOpen = false;

      const form = DOM.modal.querySelector('form');
      if (form) {
        resetForm(form);
      }
    }
  }

  // ===== TELEGRAM SEND FUNCTION =====
  function sendToTelegram(formData, formId) {
    return new Promise((resolve, reject) => {
      // Формируем сообщение
      let message = '🏠 <b>Новая заявка с сайта Сруб России</b>\n\n';
      
      if (formData.name) {
        message += `👤 <b>Имя:</b> ${formData.name}\n`;
      }
      
      if (formData.phone) {
        message += `📞 <b>Телефон:</b> ${formData.phone}\n`;
      }
      
      if (formData.email) {
        message += `📧 <b>Email:</b> ${formData.email}\n`;
      }

      // Данные из планировщика
      if (formData.houseType) {
        message += `\n🏡 <b>Тип дома:</b> ${getHouseTypeLabel(formData.houseType)}\n`;
      }
      
      if (formData.floors) {
        message += `📊 <b>Этажность:</b> ${formData.floors}\n`;
      }
      
      if (formData.area) {
        message += `📐 <b>Площадь:</b> ${formData.area} м²\n`;
      }
      
      if (formData.budget) {
        message += `💰 <b>Бюджет:</b> ${getBudgetLabel(formData.budget)}\n`;
      }
      
      if (formData.timeline) {
        message += `⏱️ <b>Сроки:</b> ${getTimelineLabel(formData.timeline)}\n`;
      }
      
      if (formData.features && formData.features.length > 0) {
        message += `\n✨ <b>Дополнительно:</b>\n`;
        formData.features.forEach(feature => {
          message += `  • ${getFeatureLabel(feature)}\n`;
        });
      }

      message += `\n📝 <b>Форма:</b> ${formId}`;
      message += `\n🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU', { 
        timeZone: 'Europe/Moscow',
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      // Отправляем в Telegram
      fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          resolve(data);
        } else {
          reject(new Error(data.description || 'Ошибка отправки в Telegram'));
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  }

  // Вспомогательные функции для форматирования данных
  function getHouseTypeLabel(value) {
    const labels = {
      'log': 'Бревно',
      'timber': 'Брус',
      'frame': 'Каркасный'
    };
    return labels[value] || value;
  }

  function getBudgetLabel(value) {
    const labels = {
      'up-to-2m': 'До 2 млн ₽',
      '2m-4m': '2-4 млн ₽',
      '4m-6m': '4-6 млн ₽',
      'over-6m': 'Более 6 млн ₽'
    };
    return labels[value] || value;
  }

  function getTimelineLabel(value) {
    const labels = {
      'urgent': 'Срочно (1-2 месяца)',
      'normal': 'Стандартно (3-6 месяцев)',
      'flexible': 'Гибкие сроки'
    };
    return labels[value] || value;
  }

  function getFeatureLabel(value) {
    const labels = {
      'terrace': 'Терраса',
      'garage': 'Гараж',
      'sauna': 'Баня/сауна',
      'fireplace': 'Камин',
      'balcony': 'Балкон',
      'basement': 'Подвал'
    };
    return labels[value] || value;
  }

  // ===== FORMS =====
  function setupForms() {
    DOM.forms.forEach(form => {
      // Пропускаем форму планировщика (у неё своя обработка)
      if (form.id === 'planner-form') return;
      
      form.addEventListener('submit', handleFormSubmit);
      
      const inputs = form.querySelectorAll('input:not([type="checkbox"]):not([type="radio"])');
      inputs.forEach(input => {
        input.addEventListener('blur', () => validateInput(input));
        input.addEventListener('input', () => {
          if (input.classList.contains('error')) {
            validateInput(input);
          }
        });
      });
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('[type="submit"]');
    
    // Validate form
    if (!validateForm(form)) {
      showFormError(form, 'Пожалуйста, заполните все обязательные поля корректно');
      return;
    }

    // Show loading state
    submitButton.classList.add('loading');
    submitButton.disabled = true;

    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Send to Telegram
    sendToTelegram(data, form.id || 'contact-form')
      .then(() => {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
        
        showFormSuccess(form, 'Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
        
        trackEvent('Form', 'Submit', form.id);
        
        setTimeout(() => {
          resetForm(form);
          if (STATE.isModalOpen) {
            closeModal();
          }
        }, 3000);
      })
      .catch(error => {
        console.error('Error:', error);
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
        showFormError(form, 'Произошла ошибка при отправке. Пожалуйста, попробуйте позже или позвоните нам.');
      });
  }

  function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), textarea, select');
    
    inputs.forEach(input => {
      if (!validateInput(input)) {
        isValid = false;
      }
    });

    const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
    requiredCheckboxes.forEach(checkbox => {
      const checkboxGroup = checkbox.closest('.form-checkbox');
      if (!checkbox.checked) {
        checkboxGroup.classList.add('error');
        isValid = false;
      } else {
        checkboxGroup.classList.remove('error');
      }
    });

    const radioGroups = form.querySelectorAll('fieldset');
    radioGroups.forEach(fieldset => {
      const radios = fieldset.querySelectorAll('input[type="radio"]');
      if (radios.length > 0 && radios[0].hasAttribute('required')) {
        const isChecked = Array.from(radios).some(radio => radio.checked);
        if (!isChecked) {
          fieldset.classList.add('error');
          isValid = false;
        } else {
          fieldset.classList.remove('error');
        }
      }
    });

    return isValid;
  }

  function validateInput(input) {
    const value = input.value.trim();
    const type = input.type;
    const required = input.hasAttribute('required');

    input.classList.remove('error');

    if (required && !value) {
      input.classList.add('error');
      return false;
    }

    if (!required && !value) {
      return true;
    }

    switch(type) {
      case 'email':
        if (!SrubUtils.validateEmail(value)) {
          input.classList.add('error');
          return false;
        }
        break;
      
      case 'tel':
        if (!SrubUtils.validatePhone(value)) {
          input.classList.add('error');
          return false;
        }
        break;
      
      case 'text':
        if (input.name === 'name' && value.length < 2) {
          input.classList.add('error');
          return false;
        }
        break;
    }

    return true;
  }

  function showFormSuccess(form, message) {
    removeFormMessages(form);
    
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.textContent = message;
    successDiv.setAttribute('role', 'alert');
    
    form.appendChild(successDiv);
  }

  function showFormError(form, message) {
    removeFormMessages(form);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    
    form.appendChild(errorDiv);
  }

  function removeFormMessages(form) {
    const messages = form.querySelectorAll('.form-success, .form-error');
    messages.forEach(msg => msg.remove());
  }

  function resetForm(form) {
    form.reset();
    
    const inputs = form.querySelectorAll('.error');
    inputs.forEach(input => input.classList.remove('error'));
    
    removeFormMessages(form);
    
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
  }

  // ===== PHONE MASK =====
  function setupPhoneMask() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
          if (value[0] !== '7') {
            value = '7' + value;
          }
          
          let formatted = '+7';
          
          if (value.length > 1) {
            formatted += ' (' + value.substring(1, 4);
          }
          if (value.length >= 5) {
            formatted += ') ' + value.substring(4, 7);
          }
          if (value.length >= 8) {
            formatted += '-' + value.substring(7, 9);
          }
          if (value.length >= 10) {
            formatted += '-' + value.substring(9, 11);
          }
          
          e.target.value = formatted;
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '+7') {
          e.preventDefault();
          e.target.value = '';
        }
      });

      input.addEventListener('focus', (e) => {
        if (!e.target.value) {
          e.target.value = '+7 ';
        }
      });
    });
  }

  // ===== SLIDER =====
  function setupSlider() {
    if (!DOM.projectsSlider) return;

    const slides = DOM.projectsSlider.querySelectorAll('.project-card');
    const totalSlides = slides.length;
    const slidesPerView = getSlidesPerView();
    const maxSlide = Math.max(0, totalSlides - slidesPerView);

    updateSlider();

    window.addEventListener('resize', SrubUtils.debounce(() => {
      updateSlider();
    }, CONFIG.debounceDelay));
  }

  function getSlidesPerView() {
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1200) return 2;
    return 3;
  }

  function navigateSlider(direction) {
    const slides = DOM.projectsSlider.querySelectorAll('.project-card');
    const totalSlides = slides.length;
    const slidesPerView = getSlidesPerView();
    const maxSlide = Math.max(0, totalSlides - slidesPerView);

    if (direction === 'next') {
      STATE.currentSlide = Math.min(STATE.currentSlide + 1, maxSlide);
    } else {
      STATE.currentSlide = Math.max(STATE.currentSlide - 1, 0);
    }

    updateSlider();
    trackEvent('Slider', 'Navigate', direction);
  }

  function updateSlider() {
    if (!DOM.projectsSlider) return;

    const slides = DOM.projectsSlider.querySelectorAll('.project-card');
    const totalSlides = slides.length;
    const slidesPerView = getSlidesPerView();
    const slideWidth = slides[0]?.offsetWidth || 0;
    const gap = 60;
    const offset = STATE.currentSlide * (slideWidth + gap);

    DOM.projectsSlider.style.transform = `translateX(-${offset}px)`;

    if (DOM.projectsProgress) {
      const maxSlide = Math.max(0, totalSlides - slidesPerView);
      const progress = maxSlide > 0 ? (STATE.currentSlide / maxSlide) * 100 : 100;
      DOM.projectsProgress.style.setProperty('--progress', `${progress}%`);
      DOM.projectsProgress.setAttribute('aria-valuenow', Math.round(progress));
    }

    if (DOM.projectPrev) {
      DOM.projectPrev.disabled = STATE.currentSlide === 0;
    }
    if (DOM.projectNext) {
      const maxSlide = Math.max(0, totalSlides - slidesPerView);
      DOM.projectNext.disabled = STATE.currentSlide >= maxSlide;
    }
  }

  // ===== FAQ =====
  function setupFAQ() {
    DOM.faqToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        const answer = toggle.nextElementSibling;
        
        DOM.faqToggles.forEach(otherToggle => {
          if (otherToggle !== toggle) {
            otherToggle.setAttribute('aria-expanded', 'false');
            const otherAnswer = otherToggle.nextElementSibling;
            otherAnswer.style.maxHeight = '0';
          }
        });

        if (isExpanded) {
          toggle.setAttribute('aria-expanded', 'false');
          answer.style.maxHeight = '0';
        } else {
          toggle.setAttribute('aria-expanded', 'true');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          
          trackEvent('FAQ', 'Open', toggle.textContent.trim());
        }
      });
    });
  }

  // ===== SCROLL TO TOP =====
  function createScrollToTopButton() {
    const button = document.createElement('button');
    button.className = 'scroll-to-top';
    button.innerHTML = '↑';
    button.setAttribute('aria-label', 'Прокрутить наверх');
    
    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      trackEvent('Button', 'Click', 'Scroll to Top');
    });

    document.body.appendChild(button);
    DOM.scrollToTop = button;
  }

  function checkScrollToTop() {
    if (!DOM.scrollToTop) return;
    
    const scrollPosition = SrubUtils.getScrollPosition();
    
    if (scrollPosition > CONFIG.scrollToTopThreshold) {
      DOM.scrollToTop.classList.add('visible');
    } else {
      DOM.scrollToTop.classList.remove('visible');
    }
  }

  // ===== STEPS PROGRESS =====
  function setupStepsProgress() {
    const progressFill = document.getElementById('stepsProgressFill');
    if (!progressFill) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepItems = document.querySelectorAll('.step-item');
          let visibleSteps = 0;

          stepItems.forEach(item => {
            if (SrubUtils.isInViewport(item)) {
              visibleSteps++;
            }
          });

          const progress = (visibleSteps / stepItems.length) * 100;
          progressFill.style.width = `${progress}%`;
        }
      });
    }, { threshold: 0.1 });

    const stepsSection = document.querySelector('.steps');
    if (stepsSection) {
      observer.observe(stepsSection);
    }

    window.addEventListener('scroll', SrubUtils.throttle(() => {
      const stepItems = document.querySelectorAll('.step-item');
      let visibleSteps = 0;

      stepItems.forEach(item => {
        if (SrubUtils.isInViewport(item, 200)) {
          visibleSteps++;
        }
      });

      const progress = (visibleSteps / stepItems.length) * 100;
      progressFill.style.width = `${progress}%`;
    }, 100));
  }

  // ===== PLANNER FORM =====
  function setupPlannerForm() {
    const plannerForm = document.getElementById('planner-form');
    if (!plannerForm) return;

    const steps = plannerForm.querySelectorAll('.planner-step');
    const nextBtn = document.getElementById('planner-next');
    const backBtn = document.getElementById('planner-back');
    const submitBtn = document.getElementById('planner-submit');
    const progressFill = document.querySelector('.planner-progress-fill');
    const progressText = document.querySelector('.planner-progress-text');
    
    let currentStep = 1;
    const totalSteps = steps.length;

    function updateProgress() {
      const progress = (currentStep / totalSteps) * 100;
      progressFill.style.width = progress + '%';
      progressText.textContent = `${currentStep} из ${totalSteps}`;
    }

    function showStep(stepNumber) {
      steps.forEach((step, index) => {
        step.classList.toggle('active', index + 1 === stepNumber);
      });

      backBtn.style.display = stepNumber > 1 ? 'inline-flex' : 'none';
      nextBtn.style.display = stepNumber < totalSteps ? 'inline-flex' : 'none';
      submitBtn.style.display = stepNumber === totalSteps ? 'inline-flex' : 'none';

      updateProgress();
    }

    function validateStep(stepNumber) {
      const currentStepElement = steps[stepNumber - 1];
      const requiredInputs = currentStepElement.querySelectorAll('[required]');
      
      for (let input of requiredInputs) {
        if (input.type === 'radio') {
          const radioGroup = currentStepElement.querySelectorAll(`[name="${input.name}"]`);
          const isChecked = Array.from(radioGroup).some(radio => radio.checked);
          if (!isChecked) return false;
        } else if (input.type === 'checkbox') {
          if (!input.checked) return false;
        } else {
          if (!input.value.trim()) return false;
        }
      }
      return true;
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        if (validateStep(currentStep)) {
          if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
          }
        } else {
          alert('Пожалуйста, заполните все обязательные поля');
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', function() {
        if (currentStep > 1) {
          currentStep--;
          showStep(currentStep);
        }
      });
    }

    plannerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!validateStep(currentStep)) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
      }

      // Собираем данные формы
      const formData = new FormData(plannerForm);
      const data = {};
      
      // Обрабатываем checkbox'ы отдельно
      const features = [];
      formData.forEach((value, key) => {
        if (key === 'features') {
          features.push(value);
        } else {
          data[key] = value;
        }
      });
      
      if (features.length > 0) {
        data.features = features;
      }

      // Блокируем кнопку
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      // Отправляем в Telegram
      sendToTelegram(data, 'planner-form')
        .then(() => {
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
          
          alert('Спасибо! Мы получили вашу заявку и свяжемся с вами в ближайшее время.');
          
          plannerForm.reset();
          currentStep = 1;
          showStep(currentStep);
          
          trackEvent('Form', 'Submit', 'planner-form');
        })
        .catch(error => {
          console.error('Error:', error);
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
          alert('Произошла ошибка при отправке. Пожалуйста, попробуйте позже или позвоните нам.');
        });
    });

    // Инициализация
    showStep(currentStep);
  }

  // ===== RESIZE HANDLER =====
  function handleResize() {
    if (window.innerWidth > 992 && STATE.isMenuOpen) {
      closeMenu();
    }
    updateSlider();
  }

  // ===== ANALYTICS =====
  function trackEvent(category, action, label) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        'event_category': category,
        'event_label': label
      });
    }

    // Yandex Metrika
    if (typeof ym !== 'undefined') {
      ym(XXXXXXXX, 'reachGoal', `${category}_${action}`);
    }

    console.log('📊 Event tracked:', category, action, label);
  }

  // ===== ERROR HANDLING =====
  window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.message, e.filename, e.lineno);
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
  });

  // ===== PAGE VISIBILITY =====
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('Page hidden');
    } else {
      console.log('Page visible');
    }
  });

  // ===== INITIALIZE ON DOM READY =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== EXPORT API =====
  window.SrubRussia = {
    openModal,
    closeModal,
    trackEvent,
    validateEmail: SrubUtils.validateEmail,
    validatePhone: SrubUtils.validatePhone
  };

})();

console.log('✓ Main scripts loaded');