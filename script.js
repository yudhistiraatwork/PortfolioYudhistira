const root = document.body;
const toggle = document.querySelector('.theme-toggle');
const toggleIcon = toggle.querySelector('img');
const themeAssets = document.querySelectorAll('.theme-asset');

function setTheme(theme) {
  const isDark = theme === 'dark';
  root.dataset.theme = theme;
  toggle.setAttribute('aria-pressed', String(!isDark));
  toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  toggleIcon.src = isDark ? 'Assets/Icons/moon-fill.svg' : 'Assets/Icons/sun-fill.svg';
  themeAssets.forEach(asset => { asset.src = isDark ? asset.dataset.light : asset.dataset.dark; });
  localStorage.setItem('portfolio-theme', theme);
}

setTheme(localStorage.getItem('portfolio-theme') || 'dark');
toggle.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

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
