/* ===================================
   SPLENDID MOVING - i18n (Internationalization)
   Lightweight client-side translation engine.
   Supports EN (default in HTML) and KO (loaded from JSON).
   Language preference is stored in localStorage.
   =================================== */

(function () {
    'use strict';

    const STORAGE_KEY = 'splendid_lang';
    const DEFAULT_LANG = 'en';
    let translationsCache = {}; // cached translations by language code

    /**
     * Get the user's preferred language from localStorage.
     */
    function getLang() {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    }

    /**
     * Determine the correct path prefix based on page location.
     * Pages in the root get 'assets/...', pages in subfolders would get '../assets/...'
     */
    function getBasePath() {
        // All pages are in root, so this is straightforward
        const scripts = document.querySelectorAll('script[src*="i18n.js"]');
        if (scripts.length > 0) {
            const src = scripts[0].getAttribute('src');
            return src.replace('js/i18n.js', '');
        }
        return 'assets/';
    }

    /**
     * Fetch translations JSON for a given language.
     */
    async function loadTranslations(lang) {
        if (translationsCache[lang]) return translationsCache[lang];
        try {
            const basePath = getBasePath();
            const response = await fetch(basePath + `translations/${lang}.json`);
            const data = await response.json();
            translationsCache[lang] = data;
            return data;
        } catch (err) {
            console.warn(`[i18n] Could not load translations for ${lang}:`, err);
            return {};
        }
    }

    /**
     * Apply translations to all elements with [data-i18n].
     * For 'en', we restore the original English text (stored in data-i18n-original).
     * For 'ko', we swap in the Korean translation.
     */
    async function applyLanguage(lang) {
        const elements = document.querySelectorAll('[data-i18n]');

        if (lang === 'en') {
            // Restore original English content
            elements.forEach(el => {
                const original = el.getAttribute('data-i18n-original');
                if (original !== null) {
                    if (el.hasAttribute('data-i18n-html')) {
                        el.innerHTML = original;
                    } else if (el.hasAttribute('placeholder')) {
                        el.setAttribute('placeholder', original);
                    } else {
                        el.textContent = original;
                    }
                }
            });
        } else {
            const dict = await loadTranslations(lang);
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                const value = dict[key];
                if (!value) return;

                // Store original content on first translation
                if (!el.hasAttribute('data-i18n-original')) {
                    if (el.hasAttribute('placeholder')) {
                        el.setAttribute('data-i18n-original', el.getAttribute('placeholder'));
                    } else if (el.hasAttribute('data-i18n-html')) {
                        el.setAttribute('data-i18n-original', el.innerHTML);
                    } else {
                        el.setAttribute('data-i18n-original', el.textContent);
                    }
                }

                // Apply translation
                if (el.hasAttribute('data-i18n-html')) {
                    el.innerHTML = value;
                } else if (el.hasAttribute('placeholder')) {
                    el.setAttribute('placeholder', value);
                } else {
                    el.textContent = value;
                }
            });
        }

        // Update the <html> lang attribute
        document.documentElement.lang = lang;

        // Update toggle button state
        updateToggleUI(lang);

        // Show/hide Korean language disclaimer banner
        toggleDisclaimer(lang);
    }

    /**
         * Set language, store preference, and apply translations.
         */
    async function setLanguage(lang) {
        localStorage.setItem(STORAGE_KEY, lang);
        await applyLanguage(lang);

        // Subtle page fade animation
        document.body.style.opacity = '0.92';
        setTimeout(() => { document.body.style.opacity = '1'; }, 150);
    }

    /**
     * Update toggle button visual state.
     */
    function updateToggleUI(lang) {
        document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
            btn.classList.toggle('lang-toggle__btn--active', btn.dataset.lang === lang);
        });
    }

    /**
     * Inject disclaimer banner CSS once.
     */
    function injectDisclaimerStyles() {
        if (document.getElementById('i18n-disclaimer-styles')) return;
        const style = document.createElement('style');
        style.id = 'i18n-disclaimer-styles';
        style.textContent = `
            .lang-disclaimer {
                display: none;
                background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
                color: #4e342e;
                text-align: center;
                padding: 10px 20px;
                font-size: 0.88rem;
                font-weight: 500;
                line-height: 1.5;
                border-bottom: 2px solid #ffcc80;
                position: relative;
                z-index: 999;
            }
            .lang-disclaimer.active {
                display: block;
            }
            .lang-disclaimer strong {
                color: #bf360c;
            }
            @media (max-width: 768px) {
                .lang-disclaimer {
                    font-size: 0.8rem;
                    padding: 8px 15px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show or hide the language disclaimer banner with language-specific text.
     */
    function toggleDisclaimer(lang) {
        const DISCLAIMERS = {
            'ko': '<strong>⚠️ 안내:</strong> 저희 사무실 직원은 한국어 통화가 불가합니다. 문의는 <strong>영어</strong>로 부탁드립니다. 감사합니다.',
            'es': '<strong>⚠️ Aviso:</strong> Nuestro personal de oficina habla inglés. Por favor, realice sus consultas en inglés si es posible. Gracias.'
        };

        const text = DISCLAIMERS[lang];
        let banner = document.getElementById('lang-disclaimer-banner');

        if (!text) {
            if (banner) banner.classList.remove('active');
            return;
        }

        if (!banner) {
            injectDisclaimerStyles();
            banner = document.createElement('div');
            banner.id = 'lang-disclaimer-banner';
            banner.className = 'lang-disclaimer';
            // Insert right after the header
            const header = document.querySelector('header') || document.querySelector('.header');
            if (header && header.nextSibling) {
                header.parentNode.insertBefore(banner, header.nextSibling);
            } else {
                document.body.insertBefore(banner, document.body.firstChild);
            }
        }

        banner.innerHTML = text;
        banner.classList.add('active');
    }

    /**
     * Create and inject the language toggle button into the header.
     */
    function createToggle() {
        const toggle = document.createElement('div');
        toggle.className = 'lang-toggle';
        toggle.setAttribute('role', 'group');
        toggle.setAttribute('aria-label', 'Language selector');

        const currentLang = getLang();

        toggle.innerHTML = `
            <button class="lang-toggle__btn ${currentLang === 'en' ? 'lang-toggle__btn--active' : ''}" data-lang="en" aria-label="English">EN</button>
            <button class="lang-toggle__btn ${currentLang === 'es' ? 'lang-toggle__btn--active' : ''}" data-lang="es" aria-label="Español">ES</button>
            <button class="lang-toggle__btn ${currentLang === 'ko' ? 'lang-toggle__btn--active' : ''}" data-lang="ko" aria-label="한국어">한</button>
        `;

        toggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.lang-toggle__btn');
            if (!btn) return;
            const lang = btn.dataset.lang;
            if (lang !== getLang()) {
                setLanguage(lang);
            }
        });

        return toggle;
    }

    /**
     * Initialize the i18n system.
     * - Injects the toggle into the nav
     * - Applies stored language on page load
     */
    function initI18n() {
        // Insert toggle into header nav__actions (before the phone link)
        const navActions = document.querySelector('.nav__actions');
        if (navActions) {
            const toggle = createToggle();
            navActions.insertBefore(toggle, navActions.firstChild);
        }

        // Also add a toggle inside the mobile menu
        const navMenu = document.querySelector('.nav__menu');
        if (navMenu) {
            const mobileToggle = createToggle();
            mobileToggle.classList.add('lang-toggle--mobile');
            const li = document.createElement('li');
            li.className = 'nav__item nav__item--lang';
            li.appendChild(mobileToggle);
            navMenu.appendChild(li);
        }

        // Apply saved language
        const savedLang = getLang();
        if (savedLang !== DEFAULT_LANG) {
            applyLanguage(savedLang);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initI18n);
    } else {
        initI18n();
    }

    // Expose for external use
    window.splendidI18n = { setLanguage, getLang };
})();
