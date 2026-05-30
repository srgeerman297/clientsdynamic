# Client Portfolio Dashboard

A lightweight, editable HTML dashboard for visualizing clients by industry, location, and services. The layout is inspired by the provided HR dashboard mockup: left navigation, filter controls, KPI cards, horizontal bars, a donut chart, and client cards.

## Run locally

Because this is a static site, you can serve it with any local web server:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Edit clients

Client information lives in [`data/clients.json`](data/clients.json). Add, remove, or update client objects there. The dashboard automatically recalculates:

- Total active clients
- Industries served
- Countries represented
- Services offered
- Industry, location, and service charts
- Client cards and filter options

Each client supports this shape:

```json
{
  "name": "Client name",
  "industry": "Healthcare",
  "location": {
    "city": "Austin",
    "state": "TX",
    "country": "United States",
    "region": "North America"
  },
  "services": ["Web Design", "Automation"],
  "status": "Active",
  "since": "2023-04-01"
}
```

## Files

- `index.html` — dashboard markup and templates
- `styles.css` — responsive visual system
- `src/app.js` — data loading, filtering, and SVG chart rendering
- `data/clients.json` — editable client dataset
