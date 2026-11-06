document.addEventListener('DOMContentLoaded', () => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero__inner');
  const ribbon = hero.querySelector('.hero-ribbon');
  const heroButton = hero.querySelector('.hero__actions > .btn');
  const route = ribbon.querySelector('#ribbonRoute');
  let ribbonFrame = 0, responseAnimation;
  // Geometry changes only on resize/font load, never in the animation loop.
  function positionRibbon() {
    const box = hero.getBoundingClientRect();
    const relative = element => {
      const r = element.getBoundingClientRect();
      return { x: r.left - box.left, y: r.top - box.top, right: r.right - box.left,
        bottom: r.bottom - box.top, width: r.width, height: r.height };
    };
    const room = relative(hero.querySelector('.air-scene__portal'));
    const scene = relative(hero.querySelector('.hero__visual'));
    const button = relative(heroButton);
    const stacked = window.matchMedia('(max-width: 600px)').matches;
    const startX = scene.right - 10, startY = room.y + room.height * .55;
    const endX = button.right + 9, endY = stacked ? button.bottom + 9 : button.y + button.height * .65;
    const left = Math.max(scene.x + 10, room.x - 28), top = room.y - 12;
    const middle = room.x + room.width / 2;
    let d = `M${startX} ${startY} C${room.right + 30} ${startY} ${room.right + 25} ${top} ${middle} ${top}`;
    d += ` C${left} ${top} ${left + 20} ${room.bottom} ${left} ${room.bottom - 15}`;
    if (stacked) {
      d += ` C12 ${room.bottom + 15} 10 ${button.bottom + 65} 28 ${button.bottom + 40}`;
      d += ` S${endX - 25} ${button.bottom + 50} ${endX} ${endY}`;
    } else {
      const gap = scene.x - 26;
      d += ` C${left - 65} ${room.bottom} ${gap + 45} ${endY - 85} ${gap} ${endY - 55}`;
      d += ` S${gap - 65} ${endY + 65} ${endX} ${endY}`;
    }
    ribbon.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    route.setAttribute('d', d);
    const ink = ribbon.querySelector('#ribbonInk');
    Object.entries({ x1: startX, y1: startY, x2: endX, y2: endY }).forEach(([key, value]) => ink.setAttribute(key, value));
    const mask = ribbon.querySelector('#ribbonSafeArea');
    const area = ribbon.querySelector('.hero-ribbon__area');
    [mask, area].forEach(element => { element.setAttribute('width', box.width); element.setAttribute('height', box.height); });
    const shields = [...hero.querySelectorAll('.hero__copy > :not(.hero__actions), .hero__actions > *, .air-scene__caption, .air-scene__label')].map(element => {
      const r = relative(element);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      Object.entries({ x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12, rx: 6 })
        .forEach(([key, value]) => rect.setAttribute(key, value));
      return rect;
    });
    ribbon.querySelector('.hero-ribbon__shields').replaceChildren(...shields);
  }
  function queueRibbon() {
    cancelAnimationFrame(ribbonFrame);
    ribbonFrame = requestAnimationFrame(positionRibbon);
  }
  if ('ResizeObserver' in window) new ResizeObserver(queueRibbon).observe(hero);
  window.addEventListener('resize', queueRibbon, { passive: true });
  document.fonts.ready.then(queueRibbon);
  hero.addEventListener('animationend', event => { if (event.animationName === 'quiet-entry') queueRibbon(); });
  positionRibbon();
  function inhale() {
    if (motion.matches || !ribbon.querySelector('.hero-ribbon__response').animate) return;
    responseAnimation?.cancel();
    responseAnimation = ribbon.querySelector('.hero-ribbon__response').animate([
      { strokeDashoffset: 20, opacity: 0 },
      { strokeDashoffset: 0, opacity: .65, offset: .2 },
      { strokeDashoffset: -100, opacity: 0 },
    ], { duration: 1800, easing: 'ease-out' });
  }
  heroButton.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') inhale(); });
  heroButton.addEventListener('focus', () => { if (heroButton.matches(':focus-visible')) inhale(); });
  motion.addEventListener('change', () => responseAnimation?.cancel());
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobileMenu');
  const backdrop = document.getElementById('mobileBackdrop');
  const close = document.getElementById('menuClose');
  const background = [nav, document.getElementById('main'), document.querySelector('.footer')];

  function closeMenu(restoreFocus = true) {
    const wasOpen = menu.classList.contains('is-open');
    background.forEach(element => { element.inert = false; });
    menu.inert = true;
    menu.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Otvoriť menu');
    document.body.classList.remove('has-modal');
    if (wasOpen && restoreFocus) burger.focus();
  }
  function openMenu() {
    menu.inert = false;
    menu.classList.add('is-open');
    backdrop.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Zavrieť menu');
    document.body.classList.add('has-modal');
    close.focus();
    background.forEach(element => { element.inert = true; });
  }
  burger.addEventListener('click', openMenu);
  close.addEventListener('click', () => closeMenu());
  backdrop.addEventListener('click', () => closeMenu());
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    closeMenu(false);
    const target = document.querySelector(link.getAttribute('href'));
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }));
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeMenu(); return; }
    if (event.key !== 'Tab') return;
    const items = [...menu.querySelectorAll('a, button')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
    if (event.matches) closeMenu(false);
  });

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  let scrollQueued = false;
  function updateNavigation() {
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
    let current = 'home';
    const offset = nav.offsetHeight + 40;
    sections.forEach(section => { if (section.getBoundingClientRect().top <= offset) current = section.id; });
    navLinks.forEach(link => {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollQueued = false;
  }
  document.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  updateNavigation();

  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('is-pending');
        observer.observe(element);
      }
    });
    motion.addEventListener('change', event => {
      if (event.matches) {
        document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending'));
        observer.disconnect();
      }
    });
  }

  const lightbox = document.getElementById('lightbox');
  const frame = document.getElementById('lightboxFrame');
  document.querySelectorAll('.gallery__open').forEach(button => button.addEventListener('click', () => {
    const image = new Image();
    image.src = button.dataset.image;
    image.alt = button.querySelector('img').alt;
    frame.replaceChildren(image);
    document.getElementById('lightboxCaption').textContent = button.dataset.caption;
    lightbox.showModal();
    document.body.classList.add('has-modal');
  }));
  document.getElementById('lightboxClose').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('close', () => document.body.classList.remove('has-modal'));
  lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const rect = lightbox.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
  });

  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  function report(message, state = 'error') {
    status.textContent = message;
    status.dataset.state = state;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.ready !== 'true') { report('Formulár zatiaľ neprijíma správy. Odosielanie pripravujeme.'); return; }
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled || !form.reportValidity()) return;
    form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const label = button.querySelector('.btn-label');
    label.textContent = 'Odosielanie…';
    report('Správa sa odosiela…', 'pending');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: new FormData(form), credentials: 'same-origin',
        headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        const errors = Object.entries(result.errors || {});
        errors.forEach(([name]) => form.elements.namedItem(name)?.setAttribute('aria-invalid', 'true'));
        report(errors.flatMap(([, values]) => values.map(error => error.message)).join(' ') || result.message || 'Správu sa nepodarilo odoslať. Skúste to neskôr.');
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      report(result.message, 'success');
      form.reset();
    } catch {
      report('Odoslanie sa nepodarilo potvrdiť. Skontrolujte pripojenie a skúste to neskôr.');
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      label.textContent = 'Odoslať požiadavku';
      form.removeAttribute('aria-busy');
    }
  });
});
