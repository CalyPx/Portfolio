# Rohit Poudel, portfolio

A single-page portfolio built with Vite, GSAP, Lenis and three.js. No framework.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # production files in dist/
pnpm preview    # serve dist/ locally
```

`dist/` is a static site. It can go on Vercel, Netlify, GitHub Pages or any static host as is.

## Where things live

| File | What it holds |
| --- | --- |
| `index.html` | All page text and structure: intro, hero, results, about, contact |
| `src/projects.js` | Every project: name, problem, approach, flow, outcome, stack, links, and your role, challenges and limits |
| `vite.config.js` | Writes a page per case study at build time, each with its own title and preview image |
| `src/main.js` | Wiring: work strips, case-study sheets, ticker, bar, contact, entrances |
| `src/gallery.js` | The 3D ring of covers in the hero |
| `src/intro.js` | The opening sequence (at most once a week) |
| `src/sound.js` | Optional sound, synthesised in the browser; off until the visitor turns it on |
| `scripts/snap.mjs`, `scripts/sheet.mjs` | Headless screenshots for checking layouts (see the comments at the top) |
| `src/survive.js`, `public/quake-table.json` | The "Will it survive?" game and the model predictions it reads |
| `src/bomb.js` | Bomb Dodger, rebuilt from the original Pygame version |
| `scripts/quake_table.py` | Regenerates the predictions from the trained QuakeSafe model |
| `src/cursor.js` | The small label that appears over the gallery and work strips |
| `src/style.css` | Design tokens at the top, then one block per section |

## Common edits

**Add limits or where a project was made.** In `src/projects.js`, `limits` becomes a row in the case study and `origin` a tag. Personal roles are deliberately not shown on the site.

**Add a link to a project.** Add `['Label', 'https://…']` to that project's `links` array.

**Add LinkedIn or another contact link.** In `index.html`, copy the GitHub button inside `.contact__acts` and change the label and address.

**Change a cover image.** Save the new image as `incoming/<id>.png` (ids: `mul`, `quake`, `sunuwa`, `crash`, `prep`, `learn`, `sajha`), keep `pnpm dev` running, then run `pnpm covers`. Prompts for generating covers are in `IMAGE-PROMPTS.md`.

**Link straight to a case study.** Every project has its own address, for example `/work/quakesafe/` or `/work/mul/`, with its own title and preview image when shared. Opening one skips the intro. Older `/#case-quake` links still work. On a host, make sure unknown paths fall back to `index.html` only if a `work/<slug>/index.html` file is missing.

**See the intro again.** It plays at most once a week. Open the site in a private window, or run `localStorage.removeItem('rp-intro')` in the browser console and reload.

**Jump anywhere.** Ctrl K (or ⌘ K) opens a palette for every case study, section and a few actions.

**Regenerate the "Will it survive?" predictions** (after retraining QuakeSafe). The game never runs the model in the browser; it reads `public/quake-table.json`, which holds the real model's output for every combination of options. In a Python environment with `xgboost`, `scikit-learn`, `pandas` and `joblib`, point the script at the folder holding `final_xgboost_model_70.joblib` and `model_columns.joblib`:

```bash
python scripts/quake_table.py path/to/notebooks
```

It builds each input exactly as `webapp/main.py` in the QuakeSafe repo does.

**Throw a card.** In the hero, a sideways drag spins the ring; dragging a card up or down pulls it out to throw it. It floats back on its own.

## Accessibility notes

- With reduced motion turned on in the system settings, the intro, smooth scroll, 3D ring and entrance animations are all skipped; the hero falls back to a flat row of covers.
- Every project can be opened from the keyboard. The case-study sheet traps focus, closes on Escape, and the arrow keys move between projects.
- Sound never plays until the visitor switches it on, and stops when the tab is hidden.
