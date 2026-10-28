document.addEventListener('DOMContentLoaded', () => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
