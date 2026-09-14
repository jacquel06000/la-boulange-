// La Boulange de Beaulieu — script principal

const LANG_KEY = 'boulangerie_lang';
const LANG_FLAGS = { fr: '🇫🇷', en: '🇬🇧', ru: '🇷🇺', it: '🇮🇹' };

function getLang() {
  const saved = localStorage.getItem(LANG_KEY);
  return (saved && window.I18N && window.I18N[saved]) ? saved : 'fr';
}

function applyLang(lang) {
  if (!window.I18N || !window.I18N[lang]) return;
  const dict = window.I18N[lang];
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key] !== undefined) el.innerHTML = dict[key];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
  });

  const codeEl = document.getElementById('lang-current-code');
  const flagEl = document.getElementById('lang-current-flag');
  if (codeEl) codeEl.textContent = lang.toUpperCase();
  if (flagEl) flagEl.textContent = LANG_FLAGS[lang] || LANG_FLAGS.fr;
  document.querySelectorAll('.lang-option').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });

  if (typeof window.__updateHoursStatus === 'function') window.__updateHoursStatus();
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyLang(lang);
}

document.addEventListener('DOMContentLoaded', () => {
  // Menu mobile
  const toggle = document.getElementById('nav-toggle');
  const navMobile = document.getElementById('nav-mobile');
  if (toggle && navMobile) {
    toggle.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    navMobile.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Sélecteur de langue
  const switcher = document.getElementById('lang-switcher');
  const langToggle = document.getElementById('lang-toggle');
  if (switcher && langToggle) {
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = switcher.classList.toggle('is-open');
      langToggle.setAttribute('aria-expanded', String(isOpen));
    });
    switcher.querySelectorAll('.lang-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        setLang(btn.dataset.lang);
        switcher.classList.remove('is-open');
        langToggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        switcher.classList.remove('is-open');
        langToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        switcher.classList.remove('is-open');
        langToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Année dynamique dans le pied de page
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Horaires : jour du jour en surbrillance + badge ouvert/fermé,
  // calculés sur l'heure de Paris (indépendamment du fuseau du visiteur),
  // texte affiché dans la langue courante.
  const hoursList = document.getElementById('hours-list');
  const statusEl = document.getElementById('hours-status');
  if (hoursList && statusEl) {
    window.__updateHoursStatus = () => {
      const dict = (window.I18N && window.I18N[getLang()]) || {};
      const parts = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());

      const weekdayMap = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
      let day = null, hour = null, minute = null;
      parts.forEach((p) => {
        if (p.type === 'weekday') day = weekdayMap[p.value.toLowerCase().slice(0, 3)];
        if (p.type === 'hour') hour = parseInt(p.value, 10);
        if (p.type === 'minute') minute = parseInt(p.value, 10);
      });

      if (day === null || hour === null) return;
      const minutesNow = hour * 60 + minute;
      hoursList.querySelectorAll('li').forEach((li) => li.classList.remove('is-today'));
      const todayLi = hoursList.querySelector(`li[data-day="${day}"]`);
      if (todayLi) todayLi.classList.add('is-today');

      // Créneaux : 7h-13h et 16h-19h tous les jours, sauf dimanche (7h-13h seulement)
      const morning = minutesNow >= 7 * 60 && minutesNow < 13 * 60;
      const evening = day !== 0 && minutesNow >= 16 * 60 && minutesNow < 19 * 60;
      const isOpen = morning || evening;

      statusEl.textContent = isOpen ? (dict.status_open || 'Ouvert maintenant') : (dict.status_closed || 'Fermé actuellement');
      statusEl.classList.remove('is-open', 'is-closed');
      statusEl.classList.add(isOpen ? 'is-open' : 'is-closed');
    };
    window.__updateHoursStatus();
  }

  // Galerie « Notre histoire » : défilement horizontal + puces synchronisées
  const galleryScroll = document.getElementById('history-gallery-scroll');
  const galleryDots = document.getElementById('history-gallery-dots');
  if (galleryScroll && galleryDots) {
    const items = Array.from(galleryScroll.children);
    const dots = Array.from(galleryDots.children);

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const i = Number(dot.dataset.index);
        items[i]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = items.indexOf(entry.target);
            dots.forEach((d, di) => d.classList.toggle('is-active', di === i));
          }
        });
      },
      { root: galleryScroll, threshold: 0.6 }
    );
    items.forEach((item) => observer.observe(item));
  }

  // Applique la langue mémorisée (ou le français par défaut) au chargement
  applyLang(getLang());
});
