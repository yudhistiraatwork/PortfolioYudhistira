const root = document.body;
const themeToggles = [...document.querySelectorAll('.theme-toggle')];

function setTheme(theme) {
  const isDark = theme === 'dark';
  root.dataset.theme = theme;
  themeToggles.forEach(toggle => {
    toggle.setAttribute('aria-pressed', String(!isDark));
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.querySelector('img').src = isDark ? 'Assets/Icons/sun-dim.svg' : 'Assets/Icons/moon.svg';
  });
  document.querySelectorAll('.theme-asset').forEach(asset => {
    asset.src = isDark ? asset.dataset.dark : asset.dataset.light;
  });
  localStorage.setItem('portfolio-theme', theme);
}

setTheme(localStorage.getItem('portfolio-theme') || 'dark');
themeToggles.forEach(toggle => {
  toggle.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
});

const time = document.querySelector('#jakarta-time');
function updateTime() {
  time.textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(new Date()).toLowerCase();
}
updateTime();
setInterval(updateTime, 1000);

const mobileViewport = window.matchMedia('(max-width: 640px)');
const tabletViewport = window.matchMedia('(max-width: 900px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const header = document.querySelector('.header');
const hero = document.querySelector('.hero');
let headerScrollFrame;

function syncHeaderScrollState() {
  header?.classList.toggle('is-scrolled', window.scrollY > 0);
  header?.classList.toggle('is-past-hero', Boolean(hero && hero.getBoundingClientRect().bottom <= 0));
}

syncHeaderScrollState();
window.addEventListener('scroll', () => {
  cancelAnimationFrame(headerScrollFrame);
  headerScrollFrame = requestAnimationFrame(syncHeaderScrollState);
}, { passive: true });

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-sidebar');
const menuClose = document.querySelector('.menu-close');

function setMobileMenu(isOpen, { restoreFocus = false } = {}) {
  if (!menuToggle || !mobileMenu) return;
  mobileMenu.classList.toggle('is-open', isOpen);
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  mobileMenu.inert = !isOpen;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  root.classList.toggle('menu-open', isOpen);

  if (isOpen) menuClose?.focus();
  else if (restoreFocus) menuToggle.focus();
}

menuToggle?.addEventListener('click', () => setMobileMenu(!mobileMenu?.classList.contains('is-open')));
menuClose?.addEventListener('click', () => setMobileMenu(false, { restoreFocus: true }));
mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMobileMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileMenu?.classList.contains('is-open')) setMobileMenu(false, { restoreFocus: true });
});
mobileViewport.addEventListener('change', event => {
  if (!event.matches) setMobileMenu(false);
});

function createCarousel({ container, controls, cardSelector, directionAttribute, indicatorSelector, isEnabled, pageSize }) {
  if (!container || !controls) return;

  const cards = [...container.querySelectorAll(cardSelector)];
  const previous = controls.querySelector(`[${directionAttribute}="previous"]`);
  const next = controls.querySelector(`[${directionAttribute}="next"]`);
  const indicator = controls.querySelector(indicatorSelector);
  let leadingClones = [];
  let trailingClones = [];
  let clonesInstalled = false;
  let installedPageSize = 0;
  let scrollFrame;
  let loopTimer;

  const visiblePageSize = () => pageSize();
  const pageCount = () => Math.ceil(cards.length / visiblePageSize());
  const pageWidth = () => container.clientWidth;
  const rawPage = () => Math.round(container.scrollLeft / Math.max(1, pageWidth()));

  const activeIndex = () => {
    const size = visiblePageSize();
    const raw = rawPage();
    if (!clonesInstalled) return Math.max(0, Math.min(cards.length - 1, raw * size));
    if (raw === 0) return cards.length - size;
    if (raw >= pageCount() + 1) return 0;
    return Math.max(0, Math.min(cards.length - 1, (raw - 1) * size));
  };

  const jumpTo = position => {
    container.style.scrollBehavior = 'auto';
    container.scrollLeft = position;
    requestAnimationFrame(() => { container.style.scrollBehavior = ''; });
  };

  const prepareClone = card => {
    const clone = card.cloneNode(true);
    clone.classList.add('carousel-card--clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a, button').forEach(element => { element.tabIndex = -1; });
    return clone;
  };

  const updateControls = () => {
    const index = activeIndex();
    if (indicator) indicator.textContent = `${index + 1} of ${cards.length}`;
    if (mobileViewport.matches && isEnabled()) container.style.height = `${cards[index].offsetHeight}px`;
    else container.style.height = '';
  };

  const removeClones = () => {
    if (!clonesInstalled) return;
    [...leadingClones, ...trailingClones].forEach(clone => clone.remove());
    leadingClones = [];
    trailingClones = [];
    clonesInstalled = false;
    installedPageSize = 0;
    container.scrollLeft = 0;
  };

  const installClones = () => {
    const size = visiblePageSize();
    leadingClones = cards.slice(-size).map(prepareClone);
    trailingClones = cards.slice(0, size).map(prepareClone);
    container.prepend(...leadingClones);
    container.append(...trailingClones);
    clonesInstalled = true;
    installedPageSize = size;
    requestAnimationFrame(() => {
      jumpTo(pageWidth());
      updateControls();
      window.setTimeout(() => {
        if (!clonesInstalled || !isEnabled()) return;
        jumpTo(pageWidth());
        updateControls();
      }, 250);
    });
  };

  const syncCarousel = () => {
    if (!isEnabled()) {
      removeClones();
      updateControls();
      return;
    }
    if (clonesInstalled && installedPageSize === visiblePageSize()) {
      updateControls();
      return;
    }
    removeClones();
    installClones();
  };

  const normalizeLoop = () => {
    if (!clonesInstalled || !isEnabled()) return;
    const raw = rawPage();
    if (raw === 0) jumpTo(pageCount() * pageWidth());
    if (raw >= pageCount() + 1) jumpTo(pageWidth());
    updateControls();
  };

  const move = direction => {
    if (!isEnabled()) return;
    container.scrollTo({
      left: (rawPage() + direction) * pageWidth(),
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
  };

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  container.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updateControls);
    clearTimeout(loopTimer);
    loopTimer = setTimeout(normalizeLoop, 180);
  }, { passive: true });
  container.addEventListener('scrollend', normalizeLoop);
  window.addEventListener('resize', syncCarousel);
  mobileViewport.addEventListener('change', syncCarousel);
  tabletViewport.addEventListener('change', syncCarousel);
  syncCarousel();
}

createCarousel({
  container: document.querySelector('#project-carousel'),
  controls: document.querySelector('.projects-carousel-shell > .project-carousel-controls'),
  cardSelector: '.project-card',
  directionAttribute: 'data-project-direction',
  indicatorSelector: '.project-carousel-indicator',
  isEnabled: () => true,
  pageSize: () => mobileViewport.matches ? 1 : tabletViewport.matches ? 2 : 3
});

createCarousel({
  container: document.querySelector('.value-grid'),
  controls: document.querySelector('.value-carousel-controls'),
  cardSelector: '.value-card',
  directionAttribute: 'data-value-direction',
  indicatorSelector: '.value-carousel-indicator',
  isEnabled: () => mobileViewport.matches,
  pageSize: () => 1
});

createCarousel({
  container: document.querySelector('#about-experience-carousel'),
  controls: document.querySelector('.about-experience-carousel-controls'),
  cardSelector: '.about-experience-card',
  directionAttribute: 'data-about-direction',
  indicatorSelector: '.about-experience-carousel-indicator',
  isEnabled: () => mobileViewport.matches,
  pageSize: () => 1
});
