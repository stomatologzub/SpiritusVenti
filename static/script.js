document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     Footer year
     ========================================================= */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =========================================================
     Sticky nav background + active link on scroll
     ========================================================= */
  const nav = document.getElementById('nav');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('[data-nav]');

  function onScrollNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);

    let current = sections[0] ? sections[0].id : '';
    const offset = 140;
    sections.forEach(sec => {
      if (window.scrollY + offset >= sec.offsetTop) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`);
    });
  }
  document.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* =========================================================
     Mobile menu
     ========================================================= */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileBackdrop = document.getElementById('mobileBackdrop');
  const mobileLinks = document.querySelectorAll('[data-nav-mobile]');

  function closeMobileMenu() {
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    mobileBackdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function openMobileMenu() {
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('is-open');
    mobileBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  burger.addEventListener('click', () => {
    burger.classList.contains('is-open') ? closeMobileMenu() : openMobileMenu();
  });
  mobileBackdrop.addEventListener('click', closeMobileMenu);
  mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

  /* =========================================================
     Scroll reveal (IntersectionObserver)
     ========================================================= */
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-fade');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  // stagger index for service cards
  document.querySelectorAll('.service-card').forEach((card, i) => {
    card.style.setProperty('--i', i);
  });

  /* =========================================================
     Animated hero stat counters
     ========================================================= */
  const statNums = document.querySelectorAll('.hero__stat-num');
  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNums.forEach(animateCount);
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.4 });
  const statsRow = document.querySelector('.hero__stats');
  if (statsRow) statsObserver.observe(statsRow);

  /* =========================================================
     Gallery — placeholder tiles + lightbox
     ========================================================= */
  const galleryItems = [
    { title: 'Montáž hlavného vzduchovodu', tone: 0, h: 300 },
    { title: 'Inštalácia prívodnej jednotky', tone: 1, h: 380 },
    { title: 'Montáž rozvodov na streche', tone: 2, h: 260 },
    { title: 'Vyváženie systému', tone: 0, h: 340 },
    { title: 'Montáž priemyselného ventilátora', tone: 1, h: 300 },
    { title: 'Tepelná izolácia vzduchovodov', tone: 2, h: 380 },
    { title: 'Inštalácia rekuperačnej jednotky', tone: 0, h: 260 },
    { title: 'Servisná údržba', tone: 1, h: 320 },
    { title: 'Kontrola a spustenie systemu', tone: 0, h: 300 },
  ];

  const tones = [
    { a: '#004D36', b: '#D9EDFF' },
    { a: '#D9EDFF', b: '#004D36' },
    { a: '#004D36', b: '#D9EDFF' },
  ];

  const assetsUrl = document.querySelector('script[data-assets-url]').dataset.assetsUrl;
  const galleryImages = [
    'https://www.yushi.co.th/img_summernote_image/summernote-img-240603152516-921.webp',
    'https://cdn.prod.website-files.com/68924d30cc1669b12c630069/68b58b736ac21db37b51c9e1_68ad4b265308cc7b9c00c4e4_DuctworkInstallation_1.webp',
    `${assetsUrl}gallery/rooftop-hvac.png`,
    'https://assets.zyrosite.com/cdn-cgi/image/format%3Dauto%2Cw%3D768%2Ch%3D696%2Cfit%3Dcrop/pUmzx6QVgb4TTkrW/large-vecteezy_worker-installing-ventilation-ductwork-in-industrial-setting_66551866_large-TcTX5aqsKApgSRBY.jpg',
    `${assetsUrl}gallery/commercial-installation.jpg`,
    `${assetsUrl}gallery/commercial-installation.jpg`,
    'https://images.ctfassets.net/4y40wxcxzkmz/16n4b47k23W7XPpZ9RkAWw/4d1d732f130ebf0b743be6a7262bafdf/lueftungszentrale_gebaeudetechnik_shutterstock_1761954635_orig_RGB_komp._4-3.jpg?bg=rgb%3Ae8edf2&fl=progressive&fm=jpg&h=2108&q=50&w=1920',
    `${assetsUrl}gallery/service-maintenance.webp`,
    `${assetsUrl}gallery/system-commissioning.jpg`,
  ];

  function placeholderSVG(tone, seed) {
    const c = tones[tone];
    const lines = Array.from({ length: 6 }).map((_, i) =>
      `<line x1="${-20 + i * 40}" y1="0" x2="${-60 + i * 40}" y2="200" stroke="rgba(217,237,255,0.18)" stroke-width="10"/>`
    ).join('');
    return `
      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${c.a}"/>
            <stop offset="100%" stop-color="${c.b}"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#g${seed})"/>
        ${lines}
        <circle cx="230" cy="50" r="34" fill="none" stroke="rgba(217,237,255,0.55)" stroke-width="3"/>
        <circle cx="230" cy="50" r="16" fill="none" stroke="rgba(217,237,255,0.8)" stroke-width="3"/>
      </svg>`;
  }

  const galleryGrid = document.getElementById('galleryGrid');
  const frag = document.createDocumentFragment();

  galleryItems.forEach((item, i) => {
    const fig = document.createElement('figure');
    fig.className = 'gallery__item';
    fig.setAttribute('data-caption', item.title);
    fig.setAttribute('data-tone', item.tone);
    fig.innerHTML = `
      <div class="gallery__tile" style="height:${item.h}px">
        <img src="${galleryImages[i]}" alt="${item.title}" loading="lazy">
        <figcaption class="gallery__caption">${item.title}</figcaption>
      </div>`;
    frag.appendChild(fig);
  });
  galleryGrid.appendChild(frag);

  const lightbox = document.getElementById('lightbox');
  const lightboxFrame = document.getElementById('lightboxFrame');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(tone, caption, seed) {
    lightboxFrame.innerHTML = `<img src="${galleryImages[seed]}" alt="${caption}">`;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  galleryGrid.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery__item');
    if (!item) return;
    const tone = item.getAttribute('data-tone');
    const caption = item.getAttribute('data-caption');
    openLightbox(tone, caption, Array.from(galleryGrid.children).indexOf(item));
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLightbox(); closeMobileMenu(); }
  });

  /* =========================================================
     Contact form — frontend-only fake submit
     ========================================================= */
  const form = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.namedItem('name').value.trim();
    const phone = form.elements.namedItem('phone').value.trim();

    if (!name || !phone) {
      showToast('Vyplňte, prosím, meno a telefónne číslo.');
      return;
    }

    const submitBtn = form.querySelector('.field__submit .btn-label');
    const button = form.querySelector('.field__submit');
    if (button.disabled) return;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Odosielanie…';
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        const errors = Object.values(result.errors || {}).flat().map(error => error.message);
        showToast(errors.join(' ') || result.message || 'Správu sa nepodarilo odoslať.');
        return;
      }
      showToast(result.message);
      form.reset();
    } catch (error) {
      showToast('Chyba pripojenia. Skúste to znova alebo nám zavolajte.');
    } finally {
      submitBtn.textContent = originalLabel;
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });

  /* =========================================================
     Back to top
     ========================================================= */
  const toTop = document.getElementById('toTop');
  document.addEventListener('scroll', () => {
    toTop.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* =========================================================
     Smooth scroll for in-page anchor links (accounts for sticky nav)
     ========================================================= */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('nav').offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

});
