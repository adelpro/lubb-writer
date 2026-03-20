(function () {
  const LOCALE_KEY = 'writer-docs-locale';
  const RTL_LANGUAGES = ['ar'];

  let currentLocale = 'en';
  let translations = {};

  async function loadLocale(locale) {
    try {
      const response = await fetch(`locales/${locale}.json`);
      if (!response.ok) throw new Error(`Failed to load ${locale}`);
      translations = await response.json();
      currentLocale = locale;
      localStorage.setItem(LOCALE_KEY, locale);
      return true;
    } catch (error) {
      console.error('Error loading locale:', error);
      return false;
    }
  }

  function isRTL(locale) {
    return RTL_LANGUAGES.includes(locale);
  }

  function setDirection(locale) {
    document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }

  function t(key) {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return value;
  }

  function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = t(key);
      if (translation !== key) {
        el.innerHTML = translation;
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const attrData = el.getAttribute('data-i18n-attr');
      const [attr, key] = attrData.split(':');
      const translation = t(key);
      if (translation !== key) {
        el.setAttribute(attr, translation);
      }
    });
  }

  function updateNavLinks() {
    const langToggle = document.querySelector('.lang-toggle');
    if (langToggle) {
      langToggle.textContent = t('nav.switchToArabic');
    }
  }

  function updateMeta() {
    document.title = t('meta.title');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = t('meta.description');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = t('meta.title');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = t('meta.description');
  }

  function updateFeatureCards() {
    const featuresGrid = document.querySelector('.features-grid');
    if (!featuresGrid) return;
    featuresGrid.innerHTML = translations.features.items.map(item => `
      <div class="feature-card">
        <div class="feature-icon">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    `).join('');
  }

  function updateModesList() {
    const modesList = document.querySelector('.modes-list');
    if (!modesList) return;
    modesList.innerHTML = translations.modes.items.map(item => `
      <div class="mode-item">
        <h3>${item.icon} ${item.title}</h3>
        <p>${item.description}</p>
      </div>
    `).join('');
  }

  function updateProviderLists() {
    const officialList = document.querySelector('.provider-group:first-child .provider-list');
    if (officialList && translations.selfHosting.providers.official.items) {
      officialList.innerHTML = translations.selfHosting.providers.official.items.map(item => `<li>${item}</li>`).join('');
    }
    const customList = document.querySelector('.provider-group:last-child .provider-list');
    if (customList && translations.selfHosting.providers.custom.items) {
      customList.innerHTML = translations.selfHosting.providers.custom.items.map(item => `<li>${item}</li>`).join('');
    }
  }

  function updateSecurityList() {
    const securityList = document.querySelector('.security-note ul');
    if (securityList && translations.selfHosting.security.items) {
      securityList.innerHTML = translations.selfHosting.security.items.map(item => `<li>${item}</li>`).join('');
    }
  }

  function updateUsageCards() {
    const usageGrid = document.querySelector('.usage-grid');
    if (!usageGrid) return;
    usageGrid.innerHTML = translations.usage.steps.map(item => `
      <div class="usage-card">
        <div class="usage-icon">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    `).join('');
  }

  function updateHostingFeatures() {
    const hostingFeatures = document.querySelector('.hosting-features');
    if (!hostingFeatures) return;
    hostingFeatures.innerHTML = translations.selfHosting.features.map(item => `
      <div class="hosting-feature">
        <div class="hosting-icon">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    `).join('');
  }

  function updatePrivacyPage() {
    const privacyContainer = document.querySelector('.privacy-content');
    if (!privacyContainer || !translations.privacy) return;

    const s = translations.privacy.sections;
    privacyContainer.innerHTML = `
      <p style="margin-bottom: 1.5rem">
        <strong>${translations.privacy.lastUpdated}</strong> ${translations.privacy.date}
      </p>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.infoCollect.title}</h2>
        <p style="margin-bottom: 1rem">${s.infoCollect.intro}</p>
        <ul style="margin-left: 1.5rem; margin-bottom: 1rem">
          ${s.infoCollect.items.map(item => `<li style="margin-bottom: 0.5rem">${item}</li>`).join('')}
        </ul>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.howUse.title}</h2>
        <p style="margin-bottom: 1rem">${s.howUse.intro}</p>
        <ul style="margin-left: 1.5rem; margin-bottom: 1rem">
          ${s.howUse.items.map(item => `<li style="margin-bottom: 0.5rem">${item}</li>`).join('')}
        </ul>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.dataRetention.title}</h2>
        <p style="margin-bottom: 1rem">${s.dataRetention.content}</p>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.thirdParty.title}</h2>
        <p style="margin-bottom: 1rem">${s.thirdParty.content}</p>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.cookies.title}</h2>
        <p style="margin-bottom: 1rem">${s.cookies.content}</p>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.security.title}</h2>
        <p style="margin-bottom: 1rem">${s.security.intro}</p>
        <ul style="margin-left: 1.5rem; margin-bottom: 1rem">
          ${s.security.items.map(item => `<li style="margin-bottom: 0.5rem">${item}</li>`).join('')}
        </ul>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.yourRights.title}</h2>
        <p style="margin-bottom: 1rem">${s.yourRights.intro}</p>
        <ul style="margin-left: 1.5rem; margin-bottom: 1rem">
          ${s.yourRights.items.map(item => `<li style="margin-bottom: 0.5rem">${item}</li>`).join('')}
        </ul>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.childrenPrivacy.title}</h2>
        <p style="margin-bottom: 1rem">${s.childrenPrivacy.content}</p>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.changes.title}</h2>
        <p style="margin-bottom: 1rem">${s.changes.content}</p>
      </section>

      <section style="margin-bottom: 2.5rem">
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--text)">${s.contact.title}</h2>
        <p style="margin-bottom: 1rem">${s.contact.intro}</p>
        <ul style="margin-left: 1.5rem; margin-bottom: 1rem">
          ${s.contact.items.map(item => `<li style="margin-bottom: 0.5rem">${item}</li>`).join('')}
        </ul>
      </section>
    `;
  }

  function applyTranslations() {
    translatePage();
    updateMeta();
    updateNavLinks();
    updateFeatureCards();
    updateModesList();
    updateProviderLists();
    updateSecurityList();
    updateUsageCards();
    updateHostingFeatures();
    updatePrivacyPage();
  }

  async function init(locale = null) {
    const savedLocale = localStorage.getItem(LOCALE_KEY);
    const browserLocale = navigator.language.startsWith('ar') ? 'ar' : 'en';
    const targetLocale = locale || savedLocale || browserLocale;

    const loaded = await loadLocale(targetLocale);
    if (!loaded && locale !== 'en') {
      await loadLocale('en');
    }

    setDirection(currentLocale);
    applyTranslations();

    const langToggle = document.querySelector('.lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', async (e) => {
        e.preventDefault();
        const newLocale = currentLocale === 'en' ? 'ar' : 'en';
        await loadLocale(newLocale);
        setDirection(newLocale);
        applyTranslations();
      });
    }
  }

  window.i18n = {
    init,
    t,
    getLocale: () => currentLocale,
    setLocale: async (locale) => {
      await loadLocale(locale);
      setDirection(locale);
      applyTranslations();
    }
  };
})();
