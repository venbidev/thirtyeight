# JSON-driven content overrides

This snapshot lets you replace every visible text node and every visible hyperlink using a single `content.json` file.

## Files
- `content-apply.js` — applies `content.json` to the page; can also export a ready-to-edit JSON.
- `content.json` — edit this to change content.
- `index.html` — includes the script.

## Quick start

1. Serve the folder (required for fetch):

```bash
python3 -m http.server 8080
```

2. Export a prefilled JSON of current content:

- Open: `http://localhost:8080/index.html?exportContent=1`
- A file named `content.json` downloads. Replace the existing one in the folder.

3. Edit `content.json` and reload the page:

- Open: `http://localhost:8080/index.html`
- Optional live editing: `http://localhost:8080/index.html?watch=1` (add `&interval=1000` to set custom ms)

## content.json schema (relevant parts)

- `textNodes`: array of precise text-node entries
  - `selector` (string): unique CSS selector to the parent element
  - `fullSelector` (string): absolute CSS path from `<html>`
  - `path` (array): ancestry path with `{ tag, nth, classes }`
  - `parentTag` (string), `parentClasses` (array)
  - `textIndex` (number): which text node within parent to change
  - `original` (string): original captured value
  - `value` (string): the value to render

- `linksDetailed`: array of precise link entries
  - `selector`, `fullSelector`, `path`, `tag`, `classes`
  - `originalText`, `originalHref`, `originalTarget`, `originalTitle`
  - `text`, `href`, `target`, `title`

- `textBySelector`, `htmlBySelector`, `linksBySelector` — optional selector-based overrides
- `texts`, `links` — optional index-based fallbacks (not recommended for long-term reliability)

### Colors (theming)

Add a `colors` object to `content.json` to tweak the main palette at runtime. All values can be any valid CSS color (hex, rgb, hsl, etc.).

Example:

```
{
  "colors": {
    "brand": "#FF7900",
    "primary": "#1C7BBD",
    "buttonBg": "#1C7BBD",
    "buttonHoverBg": "#196EAA",
    "link": "#1D1D1B",
    "footerBg": "#1D1D1B",
    "footerText": "#FFFFFF",
    "progress": "#FF7900",
    "progressTrack": "#FFCC9E"
  }
}
```

These map to CSS variables and drive key UI areas:
- Buttons: `--color-button-bg`, `--color-button-hover-bg`
- Links and hovers: `--color-link`, `--color-brand`
- Progress bar: `--color-progress`, `--color-progress-track`
- Footer: `--color-footer-bg`, `--color-footer-text`

You can also set any custom CSS variable by name: `{ "colors": { "--my-var": "#123456" } }`.

### Footer offset (desktop)

The footer is “magneted” to the left on desktop with a logical offset. Change the inline-start offset by editing the variable in `index.html` (or override via your own CSS):

```
:root { --footer-offset-inline-start: 3rem; }
```

## Tips for reliability

- Prefer the exported `textNodes` and `linksDetailed` entries; they survive layout changes better than raw index lists.
- If your layout changes and some selectors stop matching, re-export (`?exportContent=1`) to refresh the mapping.
- Use `?watch=1` while editing `content.json` to see instant updates.

## Localization by IP (ro, es, it, cs, en)

This project supports language selection based on the visitor's IP geolocation. All texts remain editable in `content.json`.

### How it works

1. On load, the page fetches `content.json`.
2. If `content.json.localization` and `content.json.locales` are present, it will:
   - Check URL override: `?lang=ro` (or `?locale=ro`).
   - Otherwise, call the IP info endpoint (defaults to `https://ipapi.co/json/`) to get the visitor's country code.
   - Map country → locale using `localization.localeByCountry`.
   - Merge the base config with `locales[<locale>]` and apply.

If the lookup fails or a mapping isn’t found, it falls back to `localization.defaultLocale` (default: `en`).

### Edit in content.json

Minimal example structure (already added):

```
{
  "localization": {
    "defaultLocale": "en",
    "urlParam": "lang",
    "ipLookupUrl": "https://ipapi.co/json/",
    "localeByCountry": {
      "RO": "ro",
      "MD": "ro",
      "ES": "es",
      "IT": "it",
      "CZ": "cs"
    }
  },
  "locales": {
    "en": {},
    "ro": { "textBySelector": {} },
    "es": { "textBySelector": {} },
    "it": { "textBySelector": {} },
    "cs": { "textBySelector": {} }
  }
}
```

Put your translations in the locale you’re targeting using any of the same keys supported at the root: `textNodes`, `textBySelector`, `htmlBySelector`, `linksBySelector`, `linksDetailed`, `texts`, `links`, `colors`, `signer`. Arrays fully replace the base; objects are shallow-merged over the base.

### Testing locally

- Force a language without relying on IP by opening:
  - `http://localhost:8080/index.html?lang=ro`
  - `http://localhost:8080/index.html?lang=es`
  - `http://localhost:8080/index.html?lang=it`
  - `http://localhost:8080/index.html?lang=cs`

Note: The IP service must allow CORS; `ipapi.co` does. You can point `localization.ipLookupUrl` to another compatible service if needed.

### Inline per-field localization

Кроме структуры `locales`, можно задавать локализованные значения прямо в полях:

```
{
  "textNodes": [
    {
      "selector": "p.MuiTypography-root.MuiTypography-body1.css-9wysp4",
      "textIndex": 0,
      "value": {
        "en": "38 Degrees ",
        "cs": "38 Degrees (CZ)",
        "cz": "38 Degrees (CZ alias)",
        "ro": "38 Degrees (RO)"
      }
    }
  ]
}
```

Такая же схема работает для:
- `textBySelector[selector]` (строка или объект с локалями)
- `htmlBySelector[selector]`
- `linksBySelector[selector]` (внутри поддерживаются локализованные `text`, `href`, `target`, `title`; либо можно сразу задать строку/объект как текст)
- элементы в массивах `linksDetailed`, `texts`, `links`

Правила выбора:
- Берётся значение для текущей локали; затем — для `defaultLocale`; затем — `en`; затем первое доступное.
- Для чешского поддерживаются синонимы `cs` и `cz` (оба распознаются).
# thirtyeight
