// Ссылки на биржу назначаются централизованно — достаточно изменить config.js.
document.querySelectorAll('[data-ref]').forEach(link => {
  link.href = SITE.refLink;
  link.target = '_blank';
  link.rel = 'noopener sponsored';
});

// Декоративный график: случайная симуляция, не реальные котировки.
const chartCanvas = document.getElementById('chartCanvas');
const candleChart = chartCanvas && typeof createCandleChart === 'function'
  ? createCandleChart(chartCanvas)
  : null;

// Тап по свободному месту показывает именно ПАМП или ДАМП.
document.addEventListener('click', event => {
  const blockedTarget = event.target.closest(
    'a, button, input, textarea, select, summary, details, header, footer, .game-shell, .floating-links'
  );
  if (blockedTarget || !candleChart) return;

  const isPump = Math.random() > 0.5;
  candleChart.kick(isPump ? 1 : -1);
  showToast(event.clientX, event.clientY, isPump);
});

function showToast(x, y, isPump) {
  const color = isPump ? '#e5d4ff' : '#ff2e93';
  const label = document.createElement('div');
  label.className = `toast ${isPump ? 'toast--pump' : 'toast--dump'}`;
  label.textContent = isPump ? 'ПАМП ↑' : 'ДАМП ↓';
  label.style.left = `${x}px`;
  label.style.top = `${y}px`;
  label.style.setProperty('--toast-color', color);
  label.setAttribute('aria-hidden', 'true');
  document.body.append(label);
  window.setTimeout(() => label.remove(), 1200);

  const ripple = document.createElement('span');
  ripple.className = 'tap-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.setProperty('--toast-color', color);
  ripple.setAttribute('aria-hidden', 'true');
  document.body.append(ripple);
  window.setTimeout(() => ripple.remove(), 650);
}

// Плавное появление блоков при прокрутке.
const revealItems = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

  revealItems.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 70}ms`);
    item.classList.add('reveal-ready');
    observer.observe(item);
  });
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

// Мягкое свечение за курсором на устройствах с мышью.
const cursorGlow = document.querySelector('.cursor-glow');
if (cursorGlow && window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
  let pointerFrame = 0;
  window.addEventListener('pointermove', event => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      cursorGlow.style.setProperty('--pointer-x', `${event.clientX}px`);
      cursorGlow.style.setProperty('--pointer-y', `${event.clientY}px`);
      cursorGlow.classList.add('cursor-glow--visible');
    });
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursorGlow.classList.remove('cursor-glow--visible'));
}

// Шапка уплотняется, круглые быстрые ссылки плавно выдвигаются после прокрутки.
const header = document.getElementById('header');
const floatingLinks = document.getElementById('floatingLinks');
let scrollQueued = false;
function updateScrollUI() {
  const scrolled = window.scrollY > 18;
  if (header) header.classList.toggle('is-scrolled', scrolled);
  if (floatingLinks) floatingLinks.classList.toggle('is-visible', window.scrollY > 150);
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    window.requestAnimationFrame(updateScrollUI);
    scrollQueued = true;
  }
}, { passive: true });
updateScrollUI();

// Мини-игра со свечами.
if (typeof initCandleMemoryGame === 'function') initCandleMemoryGame();


// Кнопка «Листай»: всегда доступна и последовательно переводит к следующему экрану.
const scrollNext = document.getElementById('scrollNext');
const scrollNextLabel = scrollNext?.querySelector('.hero__scroll-label');
const scrollNextArrow = scrollNext?.querySelector('b');
const scrollFrames = [
  { element: document.querySelector('.hero'), id: 'top', label: 'ЛИСТАЙ', arrow: '↓' },
  { element: document.getElementById('about'), id: 'about', label: 'ЛИСТАЙ', arrow: '↓' },
  { element: document.getElementById('services'), id: 'services', label: 'ЛИСТАЙ', arrow: '↓' },
  { element: document.getElementById('mini-game'), id: 'mini-game', label: 'ЛИСТАЙ', arrow: '↓' },
  { element: document.getElementById('contact-panel'), id: 'contact-panel', label: 'В НАЧАЛО', arrow: '↑' }
].filter(frame => frame.element);

function getCurrentFrameIndex() {
  // Last section can be too short to align perfectly beneath the fixed header.
  // Treat reaching the page bottom as being on the contact screen.
  const pageBottom = window.scrollY + window.innerHeight;
  if (pageBottom >= document.documentElement.scrollHeight - 64) return scrollFrames.length - 1;

  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const activationLine = headerBottom + 60;
  let current = 0;
  scrollFrames.forEach((frame, index) => {
    if (frame.element.getBoundingClientRect().top <= activationLine) current = index;
  });
  return current;
}

function updateScrollNext() {
  if (!scrollNext || !scrollFrames.length) return;
  const currentIndex = getCurrentFrameIndex();
  const frame = scrollFrames[currentIndex];
  if (scrollNextLabel) scrollNextLabel.textContent = frame.label;
  if (scrollNextArrow) scrollNextArrow.textContent = frame.arrow;
  scrollNext.setAttribute('aria-label', currentIndex === scrollFrames.length - 1
    ? 'Вернуться в начало сайта'
    : `Перейти к следующему разделу: ${scrollFrames[currentIndex + 1]?.id || ''}`);
}

if (scrollNext) {
  scrollNext.addEventListener('click', () => {
    const currentIndex = getCurrentFrameIndex();
    const nextFrame = currentIndex === scrollFrames.length - 1 ? scrollFrames[0] : scrollFrames[currentIndex + 1];
    if (!nextFrame?.element) return;
    if (nextFrame.id === 'top') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      nextFrame.element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    // Update after the page begins moving, so the button is still ready for the following click.
    window.setTimeout(updateScrollNext, reduceMotion ? 0 : 420);
  });
  window.addEventListener('scroll', updateScrollNext, { passive: true });
  window.addEventListener('resize', updateScrollNext, { passive: true });
  updateScrollNext();
}
