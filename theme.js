(function () {
  // Русские комментарии:
  // Этот скрипт загружает файл конфигурации content.json (цвета/тексты)
  // из нескольких возможных путей и применяет цветовую схему к странице.
  // Основная задача — выставить CSS‑переменные и сделать минимальные
  // переопределения для кнопок, ссылок, прогресса и футера.

  // Пробуем несколько относительных путей, чтобы работало как из корня,
  // так и из вложенных папок или при статическом хостинге.
  const candidatePaths = [
    'content.json',
    '../content.json',
    '../../content.json',
    '/content.json'
  ];

  /**
   * Пошагово пытается загрузить content.json по списку candidatePaths.
   * На каждом шаге делает fetch без кэширования. Если не удалось — рекурсивно
   * пробует следующий путь. Возвращает промис с объектом конфигурации.
   * @param {number} i индекс текущего проверяемого пути
   * @returns {Promise<any>} конфигурация из content.json
   */
  function fetchConfig(i = 0) {
    if (i >= candidatePaths.length) return Promise.reject(new Error('content.json not found'));
    const url = candidatePaths[i];
    return fetch(url, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .catch(() => fetchConfig(i + 1));
  }

  /**
   * Применяет цветовую схему из секции colors в content.json.
   * 1) Устанавливает CSS‑переменные в :root с фолбэками по умолчанию.
   * 2) Инжектит/обновляет единственный <style data-theme="content-json">,
   *    чтобы не плодить дубликаты при «мягких» перезагрузках.
   * 3) Делает точечные оверрайды для некоторых MUI‑классов.
   * Важно: классы вида .css-xxxxx генерируются и могут меняться между сборками,
   * лучше в будущем перейти на стабильные селекторы (data-* или свои классы).
   * @param {Record<string, string>} colors карта цветов из config.colors
   */
  function applyColors(colors) {
    if (!colors || typeof colors !== 'object') return;
    const css = `
:root{
  --color-brand: ${colors.brand || '#FF7900'};
  --color-primary: ${colors.primary || '#1C7BBD'};
  --color-button-bg: ${colors.buttonBg || colors.primary || '#1C7BBD'};
  --color-button-hover-bg: ${colors.buttonHoverBg || '#196EAA'};
  --color-link: ${colors.link || '#1D1D1B'};
  --color-footer-bg: ${colors.footerBg || '#1D1D1B'};
  --color-footer-text: ${colors.footerText || '#FFFFFF'};
  --color-progress: ${colors.progress || colors.brand || '#FF7900'};
  --color-progress-track: ${colors.progressTrack || '#FFCC9E'};
}

/* Buttons */
.css-xdxih8, .css-1xo98ss { background-color: var(--color-button-bg) !important; color: #fff !important; }
.css-xdxih8:hover, .css-1xo98ss:hover { background-color: var(--color-button-hover-bg) !important; color: #fff !important; }

/* Links */
.css-j81q34, .css-18rozpi, .css-1wwljfo, .css-fo6ecd { color: var(--color-link) !important; }
.css-j81q34:hover, .css-18rozpi:hover, .css-1wwljfo:hover, .css-fo6ecd:hover { color: var(--color-brand) !important; }

/* Brand accents */
.css-18rozpi, .css-11tvxbt { color: var(--color-brand) !important; }

/* Progress */
.css-1kk8uyv { background-color: var(--color-progress-track) !important; }
.css-1gheyb9 { background-color: var(--color-progress) !important; }

/* Footer */
footer.MuiBox-root.css-1lfq37a { background-color: var(--color-footer-bg) !important; color: var(--color-footer-text) !important; }
footer.MuiBox-root.css-1lfq37a .MuiTypography-root.css-9wysp4,
footer.MuiBox-root.css-1lfq37a a { color: var(--color-footer-text) !important; }
footer.MuiBox-root.css-1lfq37a svg * { fill: var(--color-footer-text) !important; stroke: var(--color-footer-text) !important; }
`;

    // Inject/update a single style tag so we don't duplicate on soft reloads
    let style = document.querySelector('style[data-theme="content-json"]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-theme', 'content-json');
      // Примечание для CSP: если на домене включён строгий CSP без unsafe-inline,
      // может понадобиться установить nonce на style-тег.
      document.head.appendChild(style);
    }
    style.textContent = css;
  }

  fetchConfig()
    .then((cfg) => {
      // Если конфигурация загружена и содержит блок colors — применяем тему.
      if (cfg && cfg.colors) applyColors(cfg.colors);
    })
    .catch((e) => {
      // Не фатально: страница продолжит работать с дефолтными стилями.
      console.warn('[theme] Failed to load content.json for colors:', e && e.message ? e.message : e);
    });
})();
