# 💧 RainWise — Rainwater Harvesting Monitor

> A free, open-source web app that uses live weather data to help you design and optimise a rainwater harvesting system for your home.

**Live Demo:** _[Add GitHub Pages URL here once deployed]_

---

## 🌍 The Problem

India receives over **4,000 billion m³** of rainfall annually — yet 600 million people face water stress, and 21 major cities are projected to run out of groundwater by 2030. Most monsoon rain runs off rooftops and roads into stormwater drains, wasted. Rainwater harvesting (RWH) captures this free resource at the source, reducing household water bills, recharging depleting aquifers, and preventing urban flooding.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📍 **City Search** | Geocoding via Open-Meteo — search any city worldwide, pick from dropdown |
| 🌧️ **Live Rainfall** | Fetches past 30 days + 7-day forecast from Open-Meteo (no API key needed) |
| 🧮 **Calculator** | Day-by-day tank simulation with overflow tracking |
| 📊 **37-Day Dashboard** | 6 summary cards, rainfall bar chart, tank level line chart |
| 💡 **Recommendations** | Auto-detects overflow, dry tank, and suggests improvements |
| 📅 **Annual Estimate** | 365-day archive data → yearly harvest, monthly bar chart, optimal tank size |
| 🪣 **Tank Optimiser** | Shows the "elbow" where adding more capacity stops being worthwhile |
| 🌙 **Dark Mode** | Follows system preference; manual override saved to localStorage |
| ⬇️ **CSV Export** | Download full daily simulation as a spreadsheet |
| 💾 **Auto-Save** | Inputs and location persist across browser sessions |
| 📱 **Responsive** | Works at 375 px width; tested on mobile Chrome and Safari |

---

## 🧮 How the Calculator Works

### Core Formula

```
Harvest (L) = max(0, Rainfall_mm − First_Flush_mm)
              × Roof_Area_m²
              × Runoff_Coefficient
```

**Why this works:**  
1 mm of rain falling on 1 m² of surface = exactly **1 litre** (0.001 m depth × 1 m² = 0.001 m³ = 1 L).

| Parameter | Meaning | Typical value |
|-----------|---------|---------------|
| **Rainfall (mm)** | Daily precipitation from Open-Meteo | varies |
| **First Flush (mm)** | Dirty initial rain diverted away | 1–2 mm |
| **Roof Area (m²)** | Catchment surface | 50–300 m² |
| **Runoff Coefficient** | Fraction that reaches the tank | 0.80–0.90 |

### Runoff Coefficients

| Roof Type | Coefficient |
|-----------|-------------|
| Concrete / RCC | 0.85 |
| Clay Tiles | 0.80 |
| Metal / GI Sheet | 0.90 |
| Asbestos Sheet | 0.80 |

### Tank Simulation (day-by-day)

```
pre_fill  = tank + harvest
overflow  = max(0, pre_fill − tank_capacity)   # water lost when full
tank      = min(tank_capacity, pre_fill)
tank      = max(0, tank − daily_use)            # can't go negative
```

The simulation runs over all 37 days (or 365 for annual), tracking harvest, tank level, and overflow every day.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    A([User Inputs\nCity · Roof · Tank · Usage]) --> B
    B[Open-Meteo\nGeocoding API] --> C
    C[Open-Meteo\nForecast / Archive API] --> D
    D[js/calculator.js\nPure Functions] --> E
    E[Dashboard\nCharts · Cards · Table]

    style A fill:#e0f2fe,stroke:#0ea5e9
    style B fill:#dcfce7,stroke:#22c55e
    style C fill:#dcfce7,stroke:#22c55e
    style D fill:#fef9c3,stroke:#ca8a04
    style E fill:#ede9fe,stroke:#7c3aed
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic structure, ARIA accessibility |
| **CSS3** | Custom properties, responsive grid, light/dark themes |
| **Vanilla JavaScript (ES2020)** | All app logic, no frameworks |
| **[Open-Meteo API](https://open-meteo.com)** | Free weather data — no API key, no sign-up |
| **[Chart.js 4](https://www.chartjs.org)** | Interactive bar & line charts (CDN) |
| **localStorage** | Persists user inputs and location between sessions |

---

## 📁 File Structure

```
Rainwater Harvesting/
├── index.html          # Full page structure with tabs, form, results
├── style.css           # Design system: tokens, components, responsive
├── app.js              # App logic: API calls, charts, rendering, CSV
├── js/
│   └── calculator.js   # Pure functions: dailyHarvest, simulateTank,
│                       #   monthlyHarvestTotals, findOptimalTankSize
├── hero-bg.jpg         # Original landing page hero image
└── README.md           # This file
```

---

## 🚀 Running Locally

No build step required — just open the file in a browser.

```bash
# Clone the repository
git clone https://github.com/abhijeetpatel6203-web/Rainwater-Harvesting.git
cd Rainwater-Harvesting

# Option 1: Open directly
open index.html

# Option 2: Serve locally (recommended — avoids CORS on some browsers)
python3 -m http.server 8000
# then visit http://localhost:8000
```

> **Note:** The Open-Meteo APIs are called directly from the browser. No backend server or API keys are needed.

---

## 🌐 Deploying to GitHub Pages

1. Push the repo to GitHub (the `main` branch)
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch → main → / (root)**
4. GitHub Pages will publish the site at  
   `https://abhijeetpatel6203-web.github.io/Rainwater-Harvesting/`

Update the **Live Demo** link at the top of this README once deployed.

---

## 📡 API Reference

| API | Endpoint | Used for |
|-----|----------|----------|
| Geocoding | `https://geocoding-api.open-meteo.com/v1/search?name=CITY` | City → lat/lon |
| Forecast | `https://api.open-meteo.com/v1/forecast?...&past_days=30&forecast_days=7` | 37-day simulation |
| Archive | `https://archive-api.open-meteo.com/v1/archive?...&start_date=&end_date=` | Annual estimate |

All APIs are **free**, require **no API key**, and have generous rate limits for personal use.

---

## 📜 Licence

MIT — free to use, modify, and distribute.

---

*Built for a water-secure India 🇮🇳 · Data from [Open-Meteo](https://open-meteo.com)*
