/* ─────────────────────────────────────────────
   Image slider (used on about.html)
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  const sliderEl = document.getElementById('image-slider');
  if (sliderEl) {
    new Splide('#image-slider', {
      type: 'loop',
      autoplay: true,
      interval: 4000,
      pauseOnHover: false,
      arrows: false,
      pagination: false,
      speed: 1200,
    }).mount();
  }
});

/* Scroll reveal effect (AOS) */
AOS.init();

/* ─────────────────────────────────────────────
   FAQ accordion
   ───────────────────────────────────────────── */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach(el => {
      el.classList.remove('open');
      const question = el.querySelector('.faq-question');
      const icon = el.querySelector('.faq-icon');
      if (question) question.setAttribute('aria-expanded', 'false');
      if (icon) icon.textContent = '+';
    });

    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      const icon = btn.querySelector('.faq-icon');
      if (icon) icon.textContent = '×';
    }
  });
});

/* ─────────────────────────────────────────────
   "How it works" steps
   Desktop (>900px): vertical scroll-snap, driven by the sidebar dots.
   Mobile (<=900px): horizontal swipe carousel — same markup/JS, just
   tracks scrollLeft instead of scrollTop and reacts to touch swipes
   natively via CSS scroll-snap-type: x.
   ───────────────────────────────────────────── */
const stepsScrollEls = document.querySelectorAll('.steps-scroll');
const isMobileSteps = () => window.matchMedia('(max-width: 900px)').matches;

stepsScrollEls.forEach(stepsScroll => {
  const outer = stepsScroll.closest('.steps-outer');
  if (!outer) return;

  const stepNavBtns = outer.querySelectorAll('.step-nav-btn');
  const stepSlides = outer.querySelectorAll('.step-slide');
  const stepsFill = outer.querySelector('.steps-progress-fill');
  const totalSteps = stepSlides.length || stepNavBtns.length || 4;

  function updateActiveStep(index) {
    index = Math.max(0, Math.min(index, totalSteps - 1));

    stepNavBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
    if (stepsFill) {
      const pct = (index / (totalSteps - 1)) * 100;
      stepsFill.style.height = pct + '%';
    }
    // Visual feedback for the active slide when swiping on mobile
    stepSlides.forEach((slide, i) => {
      slide.classList.toggle('step-slide-active', i === index);
    });
  }

  // Mark the first slide active by default (covers the mobile carousel,
  // where opacity feedback relies on this class).
  updateActiveStep(0);

  let scrollTicking = false;
  stepsScroll.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      let index;
      if (isMobileSteps()) {
        const slideW = stepsScroll.clientWidth;
        index = Math.round(stepsScroll.scrollLeft / slideW);
      } else {
        const slideH = stepsScroll.clientHeight;
        index = Math.round(stepsScroll.scrollTop / slideH);
      }
      updateActiveStep(index);
      scrollTicking = false;
    });
  });

  stepNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.step, 10);
      if (isMobileSteps()) {
        stepsScroll.scrollTo({ left: i * stepsScroll.clientWidth, behavior: 'smooth' });
      } else {
        stepsScroll.scrollTo({ top: i * stepsScroll.clientHeight, behavior: 'smooth' });
      }
    });
  });
});

/* ─────────────────────────────────────────────
   Nav — mobile toggle + active link highlighting
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('main-nav');

  if (toggle && nav) {
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a, .nav-cta').forEach(a => {
    if (a.getAttribute('href') === currentPath) {
      a.classList.add('active');
    }
  });
});

/* ─────────────────────────────────────────────
   Impact stats count-up animation
   ───────────────────────────────────────────── */
const counters = document.querySelectorAll('.counter');
counters.forEach(counter => {
  const updateCounter = () => {
    const target = +counter.getAttribute('data-target');
    const current = +counter.innerText;
    const increment = target / 100;

    if (current < target) {
      counter.innerText = `${Math.ceil(current + increment)}`;
      setTimeout(updateCounter, 20);
    } else {
      counter.innerText = target;
    }
  };

  updateCounter();
});


