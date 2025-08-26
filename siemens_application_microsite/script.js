document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');
  const navLinks = document.querySelectorAll('.side-nav a');
  const openPortalBtn = document.getElementById('open-portal');
  const closePortalBtn = document.getElementById('close-portal');
  const portalSidebar = document.getElementById('portal-sidebar');
  const themeToggle = document.getElementById('theme-toggle');
  const themeLink = document.getElementById('theme-link');
  const dotNav = document.querySelector('.dot-nav');

  let touchStartY = null;
  let touchEndY = null;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {}, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    const now = Date.now();
    const minSwipe = window.innerHeight / 2;

    if (isTransitioning || now - lastScrollTime < scrollCooldown) return;
    if (Math.abs(deltaY) < minSwipe) return;

    if (deltaY > 0) showCard(currentIndex + 1, 'down');
    else showCard(currentIndex - 1, 'up');

    lastScrollTime = now;
    touchStartY = null;
    touchEndY = null;
  });

  function getCurrentLang() {
    const url = location.pathname.toLowerCase();
    if (url.includes('_de') || document.documentElement.lang === 'de') return 'de';
    return 'en';
  }

  function getCurrentTheme() {
    return themeLink && themeLink.getAttribute('href') === 'styles_dark.css' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    themeLink.setAttribute('href', theme === 'dark' ? 'styles_dark.css' : 'styles.css');
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const isDark = getCurrentTheme() === 'dark';
    if (themeToggle) themeToggle.textContent = isDark ? '☀️' : '🌙';
  }

  function savePrefs() {
    localStorage.setItem('prefLang', getCurrentLang());
    localStorage.setItem('prefTheme', getCurrentTheme());
  }

  (function applySavedThemeOnLoad() {
    const params = new URLSearchParams(location.search);
    const savedTheme = localStorage.getItem('prefTheme');
    if (params.has('restore') && savedTheme) setTheme(savedTheme);
    else { if (savedTheme) setTheme(savedTheme); else updateThemeIcon(); }
  })();

  const dotNavBox = document.createElement('div');
  dotNavBox.classList.add('dot-nav-box');
  dotNav.appendChild(dotNavBox);

  cards.forEach((card, idx) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (idx === 0) dot.classList.add('active');
    dot.addEventListener('click', () => showCard(idx, idx > currentIndex ? 'down' : 'up'));
    dotNavBox.appendChild(dot);
  });

  let currentIndex = 0;
  const totalCards = cards.length;
  let isTransitioning = false;

  function showCard(index, direction = 'down') {
    if (isTransitioning) return;
    isTransitioning = true;
    const newIndex = Math.max(0, Math.min(index, totalCards - 1));
    if (newIndex === currentIndex) { isTransitioning = false; return; }

    const oldCard = cards[currentIndex];
    const newCard = cards[newIndex];
    
    oldCard.classList.remove('active');
    newCard.classList.remove('slide-up', 'slide-down');

    if (direction === 'down') newCard.classList.add('slide-up');
    else newCard.classList.add('slide-down');
    
    currentIndex = newIndex;
    newCard.classList.add('active');
    setTimeout(() => { isTransitioning = false; }, 700);
    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.side-nav a[href="#${cards[currentIndex].id}"]`);
    if (activeLink) activeLink.classList.add('active');
    updateDots(currentIndex);
  }

  function updateDots(index) {
    const dots = dotNav.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('active'));
    if (dots[index]) dots[index].classList.add('active');
  }

  let lastScrollTime = 0;
  const scrollCooldown = 500;
  const deltaThreshold = 40;

  window.addEventListener('wheel', (event) => {
    const now = Date.now();
    if (isTransitioning || now - lastScrollTime < scrollCooldown) return;
    if (event.deltaY > deltaThreshold) { showCard(currentIndex + 1, 'down'); lastScrollTime = now; }
    else if (event.deltaY < -deltaThreshold) { showCard(currentIndex - 1, 'up'); lastScrollTime = now; }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') showCard(currentIndex + 1, 'down');
    else if (event.key === 'ArrowUp' || event.key === 'PageUp') showCard(currentIndex - 1, 'up');
    else if (event.key === 'Escape' && portalSidebar.classList.contains('active')) closePortal();
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetCard = document.getElementById(targetId);
      if (targetCard) {
        const targetIndex = parseInt(targetCard.getAttribute('data-index'), 10);
        showCard(targetIndex, targetIndex > currentIndex ? 'down' : 'up');
        closePortal();
      }
    });
  });

  function openPortal() {
    portalSidebar.classList.add('active');
    document.body.classList.add('portal-open');
  }

  function closePortal() {
    portalSidebar.classList.remove('active');
    document.body.classList.remove('portal-open');
  }

  openPortalBtn.addEventListener('click', (e) => { e.stopPropagation(); openPortal(); });
  closePortalBtn.addEventListener('click', () => closePortal());

  document.addEventListener('click', (e) => {
    const clickedOutside = !portalSidebar.contains(e.target) && e.target !== openPortalBtn;
    if (portalSidebar.classList.contains('active') && clickedOutside) closePortal();
  });

  portalSidebar.addEventListener('click', (e) => e.stopPropagation());

  if (window.location.hash) {
    const targetCard = document.getElementById(window.location.hash.substring(1));
    if (targetCard) {
      const targetIndex = parseInt(targetCard.getAttribute('data-index'), 10);
      showCard(targetIndex);
    }
  }

  themeToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isDark = getCurrentTheme() === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('prefTheme', nextTheme);
    closePortal();
  });

  document.querySelectorAll('.language a, .language a2').forEach(a => {
    a.addEventListener('click', () => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      const lang = href.includes('_de') ? 'de' : 'en';
      localStorage.setItem('prefLang', lang);
      localStorage.setItem('prefTheme', getCurrentTheme());
    });
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) savePrefs(); });
  window.addEventListener('beforeunload', savePrefs);

  document.querySelectorAll('a.back-to-start').forEach(back => {
    back.addEventListener('click', () => {
      localStorage.setItem('prefLang', getCurrentLang());
      localStorage.setItem('prefTheme', getCurrentTheme());
      const lang = localStorage.getItem('prefLang') || 'en';
      const target = (lang === 'de') ? 'index_de.html?restore=1' : 'index.html?restore=1';
      back.setAttribute('href', target);
    });
  });
});
