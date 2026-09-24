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
   HSCROLL carousels — manually scrollable
   (drag / swipe / arrow buttons) marquee-style
   strips that gently auto-advance, but pause as
   soon as the user hovers, touches, or scrolls,
   and resume a little while after they stop.
   Used by: home (community photos), how (points
   examples), about (values).
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = reduceMotionMQ.matches;
  const onReduceMotionChange = (e) => { reduceMotion = e.matches; };
  if (reduceMotionMQ.addEventListener) {
    reduceMotionMQ.addEventListener('change', onReduceMotionChange);
  } else if (reduceMotionMQ.addListener) {
    reduceMotionMQ.addListener(onReduceMotionChange);
  }

  document.querySelectorAll('.hscroll').forEach(track => {
    const speed = parseFloat(track.dataset.speed) || 34; // px / second
    let paused = false;
    let resumeTimer = null;
    let lastTs = null;
    let rafId = null;
    let userInteracting = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let suppressClick = false;

    // Looping distance: if the content was built as two duplicate sets
    // (for a seamless loop), reset once we've scrolled past the first set.
    const sets = track.querySelectorAll(':scope > .hscroll-set');
    const canLoop = sets.length >= 2;
    // Measure the actual gap between the start of set 1 and the start of
    // set 2, rather than assuming scrollWidth splits evenly in half. The
    // two sets can be separated by a margin (see .hscroll-set + .hscroll-set),
    // so scrollWidth / 2 drifted a few pixels further out of sync on every
    // loop, causing a small visible jump over time.
    const getLoopWidth = () => (canLoop ? sets[1].offsetLeft - sets[0].offsetLeft : track.scrollWidth);

    function normalizeLoopPosition() {
      if (!canLoop) return;
      const loopWidth = getLoopWidth();
      if (!loopWidth) return;
      if (track.scrollLeft >= loopWidth) {
        track.scrollLeft -= loopWidth;
      }
    }

    function step(ts) {
      if (!paused && !userInteracting && !reduceMotion) {
        if (lastTs === null) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        track.scrollLeft += speed * dt;
        normalizeLoopPosition();
      } else {
        lastTs = ts;
      }
      rafId = requestAnimationFrame(step);
    }

    function pauseThenResume() {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 2500);
    }

    function endInteraction() {
      if (!userInteracting) return;
      userInteracting = false;
      track.classList.remove('is-dragging');
      normalizeLoopPosition();
      pauseThenResume();
    }

    track.addEventListener('mouseenter', () => { paused = true; });
    track.addEventListener('mouseleave', () => { clearTimeout(resumeTimer); paused = false; });

    track.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      userInteracting = true;
      paused = true;
      dragStartX = event.clientX;
      dragStartScrollLeft = track.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture?.(event.pointerId);
    });

    track.addEventListener('pointermove', (event) => {
      if (!userInteracting) return;
      const deltaX = event.clientX - dragStartX;
      if (Math.abs(deltaX) > 4) {
        suppressClick = true;
      }
      track.scrollLeft = dragStartScrollLeft - deltaX;
    });

    track.addEventListener('pointerup', (event) => {
      track.releasePointerCapture?.(event.pointerId);
      endInteraction();
    });

    track.addEventListener('pointercancel', endInteraction);
    track.addEventListener('lostpointercapture', endInteraction);
    // Safety net: if a pointerup/cancel is ever missed (e.g. the pointer is
    // released outside the element without capture), don't let the track
    // stay paused forever.
    window.addEventListener('pointerup', endInteraction);
    window.addEventListener('blur', endInteraction);

    track.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);

    track.addEventListener('wheel', pauseThenResume, { passive: true });

    // Always run the loop; the reduced-motion check inside step() is what
    // actually gates movement, so a live preference change is honored too.
    rafId = requestAnimationFrame(step);

    // Prev / next arrow buttons, if present alongside this track.
    const wrap = track.closest('.hscroll-wrap');
    if (wrap) {
      const prevBtn = wrap.querySelector('.hscroll-btn.prev');
      const nextBtn = wrap.querySelector('.hscroll-btn.next');
      const scrollByCard = (dir) => {
        const card = track.querySelector(':scope > .hscroll-set > *') || track.firstElementChild;
        const amount = (card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8) * dir;
        pauseThenResume();
        track.scrollBy({ left: amount, behavior: 'smooth' });
      };
      if (prevBtn) prevBtn.addEventListener('click', () => scrollByCard(-1));
      if (nextBtn) nextBtn.addEventListener('click', () => scrollByCard(1));
    }
  });
});

/* ─────────────────────────────────────────────
   Impact stats count-up animation
   ───────────────────────────────────────────── */
const counters = document.querySelectorAll('.counter');
if (counters.length) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finalText = (counter) => counter.getAttribute('data-final') || counter.getAttribute('data-target');

  const runCounter = (counter) => {
    if (prefersReducedMotion) {
      counter.innerText = finalText(counter);
      return;
    }
    const target = +counter.getAttribute('data-target');
    const current = +counter.innerText.replace(/\D/g, '') || 0;
    const increment = target / 100;

    if (current < target) {
      counter.innerText = `${Math.ceil(current + increment)}`;
      setTimeout(() => runCounter(counter), 20);
    } else {
      counter.innerText = finalText(counter);
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(counter => observer.observe(counter));
  } else {
    counters.forEach(runCounter);
  }
}