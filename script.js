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

const ctaSelector = '.pill, .project-carousel-control, .menu-toggle, .menu-close';
const hoverSweepSelector = '.pill';
const ctaSvgNamespace = 'http://www.w3.org/2000/svg';

function createCtaFramePath(width, height) {
  const referenceSize = 40;
  const referenceInset = .5;
  const scale = (height - 1) / (referenceSize - 1);
  const fromStart = value => referenceInset + (value - referenceInset) * scale;
  const fromEnd = value => width - fromStart(referenceSize - value);
  const vertical = value => referenceInset + (value - referenceInset) * scale;
  const format = value => Number(value.toFixed(3));
  const left = value => format(fromStart(value));
  const right = value => format(fromEnd(value));
  const y = value => format(vertical(value));

  return [
    `M${left(9.65723)} ${y(.5)}`,
    `H${right(36)}`,
    `C${right(37.933)} ${y(.5)} ${right(39.5)} ${y(2.067)} ${right(39.5)} ${y(4)}`,
    `V${y(30.3428)}`,
    `C${right(39.5)} ${y(31.213)} ${right(39.1761)} ${y(32.0503)} ${right(38.5947)} ${y(32.6924)}`,
    `L${right(38.4746)} ${y(32.8184)}`,
    `L${right(32.8184)} ${y(38.4746)}`,
    `C${right(32.162)} ${y(39.131)} ${right(31.271)} ${y(39.5)} ${right(30.3428)} ${y(39.5)}`,
    `H${left(4)}`,
    `C${left(2.067)} ${y(39.5)} ${left(.5)} ${y(37.933)} ${left(.5)} ${y(36)}`,
    `V${y(9.65723)}`,
    `C${left(.5)} ${y(8.78699)} ${left(.823932)} ${y(7.94966)} ${left(1.40527)} ${y(7.30762)}`,
    `L${left(1.52539)} ${y(7.18164)}`,
    `L${left(7.18164)} ${y(1.52539)}`,
    `C${left(7.79702)} ${y(.910009)} ${left(8.61829)} ${y(.546795)} ${left(9.4834)} ${y(.503906)}`,
    `L${left(9.65723)} ${y(.5)}Z`
  ].join('');
}

function updateCtaFrame(element) {
  const frame = element.querySelector(':scope > .cta-frame');
  const path = frame?.querySelector('.cta-base-shape');
  const sweep = frame?.querySelector('.cta-sweep');
  const bounds = element.getBoundingClientRect();
  if (!frame || !path || !sweep || !bounds.width || !bounds.height) return;

  const shapePath = createCtaFramePath(bounds.width, bounds.height);
  frame.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  path.setAttribute('d', shapePath);
  sweep.setAttribute('d', shapePath);
}

const ctaFrameObserver = 'ResizeObserver' in window
  ? new ResizeObserver(entries => entries.forEach(entry => updateCtaFrame(entry.target)))
  : null;

document.querySelectorAll(ctaSelector).forEach(element => {
  const frame = document.createElementNS(ctaSvgNamespace, 'svg');
  const path = document.createElementNS(ctaSvgNamespace, 'path');
  const sweep = document.createElementNS(ctaSvgNamespace, 'path');

  frame.classList.add('cta-frame');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('focusable', 'false');
  frame.setAttribute('preserveAspectRatio', 'none');
  path.classList.add('cta-base-shape');
  sweep.classList.add('cta-sweep');
  frame.append(path, sweep);
  element.prepend(frame);
  element.classList.add('cta-framed');
  updateCtaFrame(element);
  ctaFrameObserver?.observe(element);
});

if (!ctaFrameObserver) {
  window.addEventListener('resize', () => document.querySelectorAll(ctaSelector).forEach(updateCtaFrame));
}

document.querySelectorAll(hoverSweepSelector).forEach(element => {
  const sweep = element.querySelector('.cta-sweep');
  if (!sweep) return;

  element.addEventListener('mouseenter', () => {
    if (element.classList.contains('cta-sweep-leaving')) {
      element.dataset.ctaSweepRestart = 'true';
      return;
    }
    element.classList.add('cta-sweep-active');
  });

  element.addEventListener('mouseleave', () => {
    element.dataset.ctaSweepRestart = 'false';
    element.classList.remove('cta-sweep-active');
    element.classList.add('cta-sweep-leaving');
  });

  sweep.addEventListener('transitionend', event => {
    if (!['clip-path', '-webkit-clip-path'].includes(event.propertyName) || !element.classList.contains('cta-sweep-leaving')) return;

    element.classList.remove('cta-sweep-leaving');
    element.classList.add('cta-sweep-resetting');
    requestAnimationFrame(() => {
      element.classList.remove('cta-sweep-resetting');
      if (element.dataset.ctaSweepRestart === 'true' && element.matches(':hover')) {
        element.dataset.ctaSweepRestart = 'false';
        element.classList.add('cta-sweep-active');
      }
    });
  });
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

const backToTop = document.querySelector('.back-to-top');
let pageScrollFrame;

function syncBackToTop() {
  const distanceToPageEnd = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
  backToTop?.classList.toggle('is-visible', distanceToPageEnd <= 80);
}

syncBackToTop();
window.addEventListener('scroll', () => {
  cancelAnimationFrame(pageScrollFrame);
  pageScrollFrame = requestAnimationFrame(syncBackToTop);
}, { passive: true });
window.addEventListener('resize', syncBackToTop);
backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
});

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

function createCarousel({ container, controls, cardSelector, directionAttribute, indicatorSelector, isEnabled, pageSize, isAnimated = () => true }) {
  if (!container || !controls) return;

  const cards = [...container.querySelectorAll(cardSelector)];
  const previous = controls.querySelector(`[${directionAttribute}="previous"]`);
  const next = controls.querySelector(`[${directionAttribute}="next"]`);
  const indicator = controls.querySelector(indicatorSelector);
  let leadingClones = [];
  let trailingClones = [];
  let clonesInstalled = false;
  let installedPageSize = 0;
  let installedPageWidth = 0;
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
    installedPageWidth = 0;
    container.scrollLeft = 0;
  };

  const installClones = (startIndex = 0) => {
    const size = visiblePageSize();
    leadingClones = cards.slice(-size).map(prepareClone);
    trailingClones = cards.slice(0, size).map(prepareClone);
    container.prepend(...leadingClones);
    container.append(...trailingClones);
    clonesInstalled = true;
    installedPageSize = size;
    installedPageWidth = pageWidth();
    requestAnimationFrame(() => {
      jumpTo((Math.floor(startIndex / size) + 1) * pageWidth());
      updateControls();
      window.setTimeout(() => {
        if (!clonesInstalled || !isEnabled()) return;
        jumpTo((Math.floor(startIndex / size) + 1) * pageWidth());
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
    if (clonesInstalled && installedPageSize === visiblePageSize() && installedPageWidth === pageWidth()) {
      updateControls();
      return;
    }
    const startIndex = clonesInstalled ? activeIndex() : 0;
    removeClones();
    installClones(startIndex);
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
    const target = (rawPage() + direction) * pageWidth();
    if (reducedMotion.matches || !isAnimated()) {
      jumpTo(target);
      normalizeLoop();
      return;
    }
    container.scrollTo({
      left: target,
      behavior: 'smooth'
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
  pageSize: () => 1,
  isAnimated: () => mobileViewport.matches
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
