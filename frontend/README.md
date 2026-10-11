# SRANS Frontend

React 19 + TypeScript + Vite web app for the Smart Regional Alert & Navigation System.

## Getting started

```bash
npm install
cp .env.sample .env      # set VITE_API_URL
npm run dev              # http://localhost:5173
```

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Backend API base URL. Local: `http://localhost:5000/api`. Deployed: `https://srans-backend.onrender.com/api` (uses the live database). |

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Structure

```text
src/
├── App.tsx                    # Routes: public site, signed-in app shell, auth screens
├── api/                       # Axios client + typed API functions (incl. AI endpoints)
├── components/
│   ├── layout/                # AppShell (sidebar), public Navbar/Footer, AuthLayout
│   ├── ai/                    # AlertExplainer, RouteRiskCard, RichText
│   ├── ui/                    # Kpi, TypeIcon, RiskGauge, EmptyState, OptionalImg, …
│   ├── AlertForm.tsx          # Publish / edit alert form with the AI drafter
│   └── Seo.tsx                # Per-page title, description, canonical, robots
├── lib/
│   ├── mapConfig.ts           # Leaflet map, OSM tiles + fallback, OSRM router + fallback
│   ├── geocode.ts             # Photon geocoding with Nominatim fallback
│   ├── alertMeta.ts           # Colours/icons per alert type, time helpers
│   └── aiCache.ts             # sessionStorage cache for AI responses
├── pages/                     # One file per route
└── styles/                    # app.css (app shell + shared UI), auth.css, pages/*.css
```

## Layouts

- **Public site** (`/`, `/features`, `/about`, `/contact`): marketing navbar that turns into a floating pill on scroll, plus the dark footer.
- **App shell** (signed in): deep-green sidebar with Commute, Agency and Admin sections, and a topbar with "Ask SRANS AI".
- **Shared** (`/map`, `/alerts`): rendered in the app shell for members and in the public layout for guests.
- Signed-in users who open `/` go to their workspace: Today, the Command Center or the Admin panel.

## Maps (no API keys)

Leaflet, Leaflet Routing Machine and leaflet.heat load from unpkg (pinned versions, deferred) in `index.html`. Tiles come from OpenStreetMap, routing from the FOSSGIS OSRM server and place search from Photon. Each has an automatic fallback (`src/lib/mapConfig.ts`, `src/lib/geocode.ts`).

## Images

Every image slot and its generation prompt is listed in [`IMAGE_PROMPTS.md`](IMAGE_PROMPTS.md). Optional images use `OptionalImg`, which hides itself when the file is missing.

## Contact form

The contact page posts directly to Formspree (`https://formspree.io/f/mrbyjvyj`), so it needs no backend.

## SEO

`index.html` carries Open Graph, Twitter and JSON-LD metadata. Each page sets its own title, description and canonical URL through `<Seo />`; signed-in pages are `noindex`. `public/robots.txt` and `public/sitemap.xml` cover the public routes.
