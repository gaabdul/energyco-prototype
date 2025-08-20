# EnergyCo Prototype

A Next.js app that explains electricity bill changes and helps users take action. It focuses on three core capabilities:

- Bill Explainer: breaks down why a bill changed, showing previous vs current totals, and visual deltas for usage, rate, and seasonal effects; highlights the primary driver.
- Savings Coach: compares current plan vs recommended plan, explains projected next month cost, and offers a toggle to lock in a steadier, lower-cost option.
- Offer Matchmaker: analyzes EV charging windows and surfaces EV-friendly plans; shows a 24‑hour rate heatmap, horizontal plan comparisons, and projected savings.
- Budget Buddy: tracks monthly spend vs an allowance, shows progress/overspend alerts, and suggests student‑friendly plans that cap spend.

## Run locally

```bash
cd energyco-prototype
npm install
npm run dev
```

- The server starts on an available port (e.g., http://localhost:3000 or http://localhost:3002).
- All UI is in `src/app/page.tsx`. Global styles in `src/app/globals.css`.

## Data & logic

- Sample inputs: `data/bill_sample.json`
- Rules/Concepts/Offers: `data/rules.json`, `data/concepts.json`, `data/offers.json`
- Types: `data/types.ts`

Bill analysis computes:
- previous bill = `prev_kwh * prev_rate`
- current bill = `curr_kwh * curr_rate`
- delta = `current - previous`
- usage, rate, seasonal effects; these power the visual bar and summaries.

## Key UI conventions

- Neutral (gray) for baselines and info; green for recommended/success; red for true negatives (spikes, over‑budget, peak windows).
- Visuals vary per module (stacked deltas, before/after smoothing, EV heatmap, budget progress bars).

## Project structure

```
energyco-prototype/
  data/                # sample data and config
  public/              # static assets
  src/app/             # Next.js app (routing, pages, styles)
    globals.css
    layout.tsx
    page.tsx           # main prototype UI
```
