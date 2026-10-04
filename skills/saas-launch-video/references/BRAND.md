# Brand: brand.json → variables

`brand.json` (project root) is the single source of brand truth. `scripts/from-link.mjs` writes it from a URL; you can also write it by hand. `scripts/brand.mjs <project>` installs the fonts and injects variables into `index.html` between `<!-- brand:start -->` and `<!-- brand:end -->`. Re-run it after every change to `brand.json`.

```json
{
  "name": "Lumen",
  "url": "lumen.app",
  "tagline": "Invoices that get paid.",
  "logo": { "mark": "assets/brand/mark.svg", "onDark": "assets/brand/logo-on-dark.svg", "onLight": "assets/brand/logo-on-light.svg" },
  "fonts": { "display": "Inter", "text": "Inter", "mono": "JetBrains Mono" },
  "colors": { "primary": "#3b5bfd", "secondary": "#ff7a59", "ink": "#0b0c14", "paper": "#ffffff" },
  "extraColors": { "tint": "#eef1ff" }
}
```

- **Fonts:** Google Fonts names are installed from @fontsource automatically. For custom fonts, add `assets/fonts/<slug>-latin-<weight>-normal.woff2` files (slug = lower-case, spaces → `-`).
- **Logos:** `onDark` must read on a dark background (light artwork), `onLight` on a light one. From a link, open the candidates and pick.

## Variables (use these in every scene)

| Variable | Meaning |
| --- | --- |
| `--brand-primary`, `--brand-secondary` | brand colours |
| `--brand-ink`, `--brand-paper` | darkest / lightest surfaces |
| `--brand-muted`, `--brand-line` | secondary text, hairlines (derived) |
| `--brand-primary-soft`, `--brand-primary-deep` | primary mixed toward paper / toward ink |
| `--brand-on-primary` | readable text colour on a primary background |
| `--brand-<name>` | each `extraColors` entry |
| `--font-display`, `--font-text`, `--font-mono` | font stacks |

Never hard-code a font family or brand hex inside a scene. The same scene must work for any brand. (Lint also requires an in-file `@font-face` for any named family, and the variables avoid that.)

A look may change *treatment* (for example Magazine with a serif display): change `fonts.display` in `brand.json` only after the user agrees in the pitch.
