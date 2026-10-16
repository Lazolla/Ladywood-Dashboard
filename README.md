# Geo Dashboard

**Live Site:** https://geo-insight-garden-2qzi.vercel.app/

Ladywood rehabilitation screening workspace for Mining Engineering (WITS · FEBE1004A).

The app ranks illustrative brownfield sites using a transparent weighted model:

`R = 0.40L + 0.40F + 0.20G`

where **L** is land condition, **F** is flood risk and **G** is ground condition.

## Features

- Interactive Ladywood map with brownfield, flood and ground layers
- Priority ranking and site-by-site drill-down
- Intervention comparison
- Sensitivity analysis across weighting scenarios
- Assumptions, source register and evidence coverage

All site scores and overlay geometries are **screening illustrations**, not measured or authoritative environmental data.

## Development

Requires Node.js 22+ (or Bun).

```sh
npm install
npm run dev
```

| Script            | Purpose                      |
| ----------------- | ---------------------------- |
| `npm run dev`     | Local development server     |
| `npm run build`   | Production build             |
| `npm run preview` | Preview the production build |
| `npm run lint`    | ESLint                       |
| `npm run format`  | Prettier                     |
