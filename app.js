/**
 * app.js — RainWise main application logic
 *
 * Depends on:
 *   • Chart.js (window.Chart) — loaded from CDN before this file
 *   • js/calculator.js        — simulateTank, monthlyHarvestTotals, findOptimalTankSize
 */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
const state = {
  location: {
    lat:  12.9716,
    lon:  77.5946,
    name: 'Bengaluru, Karnataka, India',
  },
  forecastData: null,   // { dates[], rainfall[], timezone }
  annualData:   null,   // { dates[], rainfall[] }
  simResult:    null,   // result of last simulation run
  annualLoaded: false,
  charts: {
    rainfall:   null,
    tank:       null,
    monthly:    null,
    efficiency: null,
  },
};

/* ============================================================
   DOM HELPERS
   ============================================================ */
const $  = id => document.getElementById(id);
const show = id => { $(id).hidden = false; };
const hide = id => { $(id).hidden = true;  };

/* ============================================================
   THEME
   ============================================================ */
function initTheme() {
  const stored = localStorage.getItem('rw-theme');
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  }
  updateThemeIcon();
}

function toggleTheme() {
  const root    = document.documentElement;
  const current = root.getAttribute('data-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark  = current === 'dark' || (current !== 'light' && sysDark);
  const next    = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('rw-theme', next);
  updateThemeIcon();
  // Redraw charts so axis/grid colours update
  requestAnimationFrame(redrawAllCharts);
}

function updateThemeIcon() {
  const root    = document.documentElement;
  const current = root.getAttribute('data-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark  = current === 'dark' || (current !== 'light' && sysDark);
  $('theme-toggle').querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
}

/* ============================================================
   CITY SEARCH  (Prompt 2)
   ============================================================ */
async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (HTTP ${res.status})`);
  const data = await res.json();
  return data.results || [];
}

function renderDropdown(results) {
  const dd = $('city-dropdown');
  dd.innerHTML = '';

  if (!results.length) {
    const li = document.createElement('li');
    li.className = 'dropdown-item no-results';
    li.textContent = 'No results found.';
    dd.appendChild(li);
  } else {
    results.forEach(r => {
      const li = document.createElement('li');
      li.className = 'dropdown-item';
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', '0');
      li.textContent = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
      li.addEventListener('click',   () => selectCity(r));
      li.addEventListener('keydown', e => { if (e.key === 'Enter') selectCity(r); });
      dd.appendChild(li);
    });
  }

  dd.hidden = false;
  $('city-input').setAttribute('aria-expanded', 'true');
}

function hideDropdown() {
  $('city-dropdown').hidden = true;
  $('city-input').setAttribute('aria-expanded', 'false');
}

function selectCity(r) {
  state.location = {
    lat:  r.latitude,
    lon:  r.longitude,
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  };
  $('city-input').value = state.location.name;
  $('location-display').textContent =
    `📌 ${state.location.name} (${r.latitude.toFixed(4)}°N, ${r.longitude.toFixed(4)}°E)`;
  hideDropdown();
  // Reset annual when city changes so stale data isn't shown
  state.annualLoaded = false;
  state.annualData   = null;
}

/* ============================================================
   RAINFALL APIs  (Prompt 2 & 5)
   ============================================================ */

/** Fetch past 30 days + 7-day forecast (37 days total) */
async function fetchForecast(lat, lon) {
  const url = [
    'https://api.open-meteo.com/v1/forecast',
    `?latitude=${lat}&longitude=${lon}`,
    '&daily=precipitation_sum',
    '&past_days=30',
    '&forecast_days=7',
    '&timezone=auto',
  ].join('');

  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Forecast API error (HTTP ${res.status})`);
  const data = await res.json();

  return {
    dates:    data.daily.time,
    rainfall: data.daily.precipitation_sum.map(v => v ?? 0),
    timezone: data.timezone,
  };
}

/** Fetch last 365 days from archive */
async function fetchArchive(lat, lon) {
  const end   = new Date();
  end.setDate(end.getDate() - 1);          // yesterday (today may not be ready)
  const start = new Date(end);
  start.setDate(start.getDate() - 364);    // 365 days inclusive

  const fmt = d => d.toISOString().slice(0, 10);
  const url = [
    'https://archive-api.open-meteo.com/v1/archive',
    `?latitude=${lat}&longitude=${lon}`,
    `&start_date=${fmt(start)}&end_date=${fmt(end)}`,
    '&daily=precipitation_sum',
    '&timezone=auto',
  ].join('');

  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Archive API error (HTTP ${res.status})`);
  const data = await res.json();

  return {
    dates:    data.daily.time,
    rainfall: data.daily.precipitation_sum.map(v => v ?? 0),
  };
}

/* ============================================================
   FORM INPUTS & VALIDATION  (Prompt 6)
   ============================================================ */
function getInputs() {
  return {
    roofArea:    parseFloat($('roof-area').value),
    runoffCoeff: parseFloat($('roof-type').value),
    tankCapacity:parseFloat($('tank-capacity').value),
    dailyUse:    parseFloat($('daily-use').value),
    firstFlush:  parseFloat($('first-flush').value),
    tariff:      parseFloat($('tariff').value),
  };
}

function validateInputs(inputs) {
  const errors = [];
  const chk = (cond, msg) => { if (cond) errors.push(msg); };

  chk(!Number.isFinite(inputs.roofArea)     || inputs.roofArea < 1,
      'Roof area must be at least 1 m².');
  chk(!Number.isFinite(inputs.roofArea)     || inputs.roofArea > 10000,
      'Roof area cannot exceed 10,000 m².');
  chk(!Number.isFinite(inputs.tankCapacity) || inputs.tankCapacity < 100,
      'Tank capacity must be at least 100 L.');
  chk(!Number.isFinite(inputs.tankCapacity) || inputs.tankCapacity > 1000000,
      'Tank capacity cannot exceed 1,000,000 L.');
  chk(!Number.isFinite(inputs.dailyUse)     || inputs.dailyUse < 1,
      'Daily household use must be at least 1 L/day.');
  chk(!Number.isFinite(inputs.firstFlush)   || inputs.firstFlush < 0,
      'First-flush loss cannot be negative.');
  chk(!Number.isFinite(inputs.tariff)       || inputs.tariff < 0,
      'Water tariff cannot be negative.');

  return errors;
}

function saveToStorage(inputs) {
  try {
    localStorage.setItem('rw-inputs',   JSON.stringify(inputs));
    localStorage.setItem('rw-location', JSON.stringify(state.location));
  } catch (_) { /* quota exceeded — silently skip */ }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('rw-inputs');
    if (raw) {
      const inp = JSON.parse(raw);
      if (inp.roofArea    > 0) $('roof-area').value    = inp.roofArea;
      if (inp.tankCapacity> 0) $('tank-capacity').value = inp.tankCapacity;
      if (inp.dailyUse    > 0) $('daily-use').value     = inp.dailyUse;
      if (inp.firstFlush !== undefined) $('first-flush').value = inp.firstFlush;
      if (inp.tariff      >= 0) $('tariff').value       = inp.tariff;
      if (inp.runoffCoeff) $('roof-type').value         = String(inp.runoffCoeff);
    }

    const locRaw = localStorage.getItem('rw-location');
    if (locRaw) {
      const loc = JSON.parse(locRaw);
      if (loc && loc.lat && loc.lon) {
        state.location = loc;
        $('city-input').value        = loc.name;
        $('location-display').textContent =
          `📌 ${loc.name} (${loc.lat.toFixed(4)}°N, ${loc.lon.toFixed(4)}°E)`;
      }
    }
  } catch (_) { /* bad JSON — ignore */ }
}

/* ============================================================
   CHART HELPERS  (Prompt 4)
   ============================================================ */

/** Read current CSS variables so charts match the active theme */
function chartColors() {
  const s = getComputedStyle(document.documentElement);
  const g = v => s.getPropertyValue(v).trim();
  return {
    past:     g('--chart-past'),
    forecast: g('--chart-forecast'),
    tank:     g('--chart-tank'),
    primary:  g('--primary'),
    grid:     g('--chart-grid'),
    text:     g('--chart-text'),
    border:   g('--border'),
  };
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600 },
};

function axisDefaults(c) {
  return {
    x: {
      ticks:  { color: c.text, maxRotation: 45, maxTicksLimit: 10, font: { size: 11 } },
      grid:   { color: c.grid },
    },
    y: {
      ticks:  { color: c.text, font: { size: 11 },
                callback: v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
      grid:   { color: c.grid },
    },
  };
}

/* ── Rainfall bar chart ── */
function buildRainfallChart(dates, rainfall) {
  const c      = chartColors();
  const today  = new Date().toISOString().slice(0, 10);
  const colors = dates.map(d => d >= today ? c.forecast : c.past);

  if (state.charts.rainfall) state.charts.rainfall.destroy();
  state.charts.rainfall = new Chart(
    $('rainfall-chart').getContext('2d'),
    {
      type: 'bar',
      data: {
        labels:   dates,
        datasets: [{
          label:           'Rainfall (mm)',
          data:            rainfall,
          backgroundColor: colors,
          borderRadius:    4,
          borderSkipped:   false,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: ([i]) => i.label,
              label: i    => ` ${i.raw.toFixed(1)} mm`,
            },
          },
        },
        scales: {
          ...axisDefaults(c),
          y: { ...axisDefaults(c).y, title: { display: true, text: 'mm', color: c.text } },
        },
      },
    }
  );
}

/* ── Tank level line chart ── */
function buildTankChart(dates, tankLevels, capacity) {
  const c = chartColors();
  if (state.charts.tank) state.charts.tank.destroy();

  state.charts.tank = new Chart(
    $('tank-chart').getContext('2d'),
    {
      type: 'line',
      data: {
        labels:   dates,
        datasets: [
          {
            label:           'Tank Level (L)',
            data:            tankLevels,
            borderColor:     c.tank,
            backgroundColor: c.tank + '28',
            fill:            true,
            tension:         0.35,
            pointRadius:     2,
            pointHoverRadius:6,
          },
          {
            label:       'Tank Capacity',
            data:        Array(dates.length).fill(capacity),
            borderColor: c.primary,
            borderDash:  [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill:        false,
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          legend: {
            labels: { color: c.text, font: { size: 11 }, boxWidth: 14 },
          },
          tooltip: {
            callbacks: {
              label: i => ` ${Math.round(i.raw).toLocaleString('en-IN')} L`,
            },
          },
        },
        scales: {
          ...axisDefaults(c),
          y: {
            ...axisDefaults(c).y,
            title: { display: true, text: 'Litres', color: c.text },
            min:   0,
            max:   capacity * 1.05,
          },
        },
      },
    }
  );
}

/* ── Monthly harvest bar chart ── */
function buildMonthlyChart(monthlyData) {
  const c = chartColors();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (state.charts.monthly) state.charts.monthly.destroy();

  state.charts.monthly = new Chart(
    $('monthly-chart').getContext('2d'),
    {
      type: 'bar',
      data: {
        labels:   MONTHS,
        datasets: [{
          label:           'Monthly Harvest (L)',
          data:            monthlyData,
          backgroundColor: c.tank,
          borderRadius:    5,
          borderSkipped:   false,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: i => ` ${Math.round(i.raw).toLocaleString('en-IN')} L`,
            },
          },
        },
        scales: {
          ...axisDefaults(c),
          y: { ...axisDefaults(c).y, title: { display: true, text: 'Litres', color: c.text } },
        },
      },
    }
  );
}

/* ── Tank efficiency line chart ── */
function buildEfficiencyChart(sizes, captured) {
  const c = chartColors();
  if (state.charts.efficiency) state.charts.efficiency.destroy();

  state.charts.efficiency = new Chart(
    $('efficiency-chart').getContext('2d'),
    {
      type: 'line',
      data: {
        labels:   sizes.map(s => s >= 1000 ? `${s/1000}kL` : `${s}L`),
        datasets: [{
          label:           'Useful Capture (L/yr)',
          data:            captured,
          borderColor:     c.primary,
          backgroundColor: c.primary + '1a',
          fill:            true,
          tension:         0.4,
          pointRadius:     0,
          pointHoverRadius:5,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: i => ` ${Math.round(i.raw).toLocaleString('en-IN')} L/yr`,
            },
          },
        },
        scales: {
          ...axisDefaults(c),
          x: { ...axisDefaults(c).x, title: { display: true, text: 'Tank size', color: c.text } },
          y: { ...axisDefaults(c).y, title: { display: true, text: 'L/yr', color: c.text } },
        },
      },
    }
  );
}

/** Destroy and recreate all currently-rendered charts with the new theme colours */
function redrawAllCharts() {
  if (!state.simResult) return;
  const { dates, rainfall, tankLevels, inputs } = state.simResult;
  buildRainfallChart(dates, rainfall);
  buildTankChart(dates, tankLevels, inputs.tankCapacity);

  if (state.annualData) {
    const monthly = monthlyHarvestTotals(
      state.annualData.dates, state.annualData.rainfall,
      inputs.roofArea, inputs.runoffCoeff, inputs.firstFlush
    );
    const { sizes, captured } = findOptimalTankSize(
      state.annualData.rainfall, inputs.roofArea,
      inputs.runoffCoeff, inputs.dailyUse, inputs.firstFlush
    );
    buildMonthlyChart(monthly);
    buildEfficiencyChart(sizes, captured);
  }
}

/* ============================================================
   FORMAT HELPERS
   ============================================================ */
const fmt = {
  litres: l => {
    if (l >= 1e6) return `${(l / 1e6).toFixed(2)} ML`;
    if (l >= 1000) return `${(l / 1000).toFixed(1)} kL`;
    return `${Math.round(l).toLocaleString('en-IN')} L`;
  },
  inr: n => `₹${Math.round(n).toLocaleString('en-IN')}`,
};

/* ============================================================
   RENDER SIMULATION RESULTS  (Prompts 3, 4, 6)
   ============================================================ */
function renderSimulation(forecastData, inputs) {
  const { dates, rainfall } = forecastData;
  const today = new Date().toISOString().slice(0, 10);

  // Run simulator (js/calculator.js)
  const result = simulateTank(
    rainfall, inputs.roofArea, inputs.runoffCoeff,
    inputs.tankCapacity, inputs.dailyUse, inputs.firstFlush
  );

  // Persist to state for CSV and theme redraw
  state.simResult = { dates, rainfall, ...result, inputs };

  // ── Date range label ──
  $('date-range').textContent = `${dates[0]} → ${dates[dates.length - 1]}`;

  // ── Compute summary metrics ──
  const totalHarvested = result.harvested.reduce((a, b) => a + b, 0);
  const currentTank    = result.tankLevels[result.tankLevels.length - 1];
  const tankPct        = inputs.tankCapacity > 0
    ? Math.round(currentTank / inputs.tankCapacity * 100) : 0;
  const daysLeft       = inputs.dailyUse > 0
    ? Math.floor(currentTank / inputs.dailyUse) : 0;
  const totalOverflow  = result.overflow.reduce((a, b) => a + b, 0);
  const totalDemand    = inputs.dailyUse * dates.length;
  const coverage       = totalDemand > 0
    ? Math.min(100, (totalHarvested / totalDemand) * 100) : 0;
  const savings        = (totalHarvested / 1000) * inputs.tariff;

  // ── Fill summary cards ──
  $('val-harvested').textContent = fmt.litres(totalHarvested);
  $('val-tank').textContent      = `${fmt.litres(currentTank)} (${tankPct}%)`;
  $('val-days').textContent      = `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
  $('val-overflow').textContent  = fmt.litres(totalOverflow);
  $('val-savings').textContent   = fmt.inr(savings);
  $('val-coverage').textContent  = `${coverage.toFixed(1)}%`;

  // ── Colour tank card based on level ──
  const tankCard = $('card-tank');
  tankCard.classList.remove('card-low', 'card-high');
  if (tankPct < 20) tankCard.classList.add('card-low');
  else if (tankPct > 75) tankCard.classList.add('card-high');

  // ── Recommendation message ──
  renderRecommendation(totalOverflow, inputs.tankCapacity, totalHarvested, daysLeft, inputs);

  // ── Charts ──
  buildRainfallChart(dates, rainfall);
  buildTankChart(dates, result.tankLevels, inputs.tankCapacity);

  // ── Raw table ──
  buildRawTable(dates, rainfall, result, today);

  show('sim-results');
}

function renderRecommendation(overflow, capacity, harvested, daysLeft, inputs) {
  const parts = [];

  if (overflow > 0 && harvested > 0 && overflow / harvested > 0.15) {
    const pct    = Math.round(overflow / harvested * 100);
    const larger = Math.round(capacity * 1.5 / 1000) * 1000;
    parts.push(
      `⚠️ <strong>${fmt.litres(overflow)}</strong> (${pct}% of harvest) was lost to overflow. ` +
      `Consider a larger tank (~${larger.toLocaleString('en-IN')} L) or a groundwater recharge pit.`
    );
  }

  if (daysLeft === 0) {
    parts.push(
      `🔴 Your tank is currently empty. To improve supply security, ` +
      `increase your catchment area or reduce daily use below ` +
      `${Math.round(inputs.dailyUse * 0.8).toLocaleString('en-IN')} L/day.`
    );
  } else if (daysLeft < 5) {
    parts.push(
      `🟡 Only <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> of supply left. ` +
      `Consider conserving water or expanding your roof area.`
    );
  } else if (daysLeft > 14) {
    parts.push(
      `🟢 <strong>${daysLeft} days</strong> of supply remaining — good water security.`
    );
  }

  if (overflow === 0 && harvested > 0) {
    parts.push(`✅ No overflow — your tank size is well matched to your harvest rate.`);
  }

  const recEl = $('recommendation');
  if (parts.length) {
    recEl.innerHTML = `<div class="rec-content">${parts.map(p => `<p>${p}</p>`).join('')}</div>`;
    show('recommendation');
  } else {
    hide('recommendation');
  }
}

function buildRawTable(dates, rainfall, result, today) {
  const tbody = $('raw-table-body');
  tbody.innerHTML = '';
  dates.forEach((date, i) => {
    const isForecast = date >= today;
    const tr = document.createElement('tr');
    if (isForecast) tr.classList.add('forecast-row');
    tr.innerHTML = `
      <td>${date}</td>
      <td><span class="type-badge ${isForecast ? 'forecast' : 'past'}">${isForecast ? 'Forecast' : 'Past'}</span></td>
      <td>${rainfall[i].toFixed(1)}</td>
      <td>${Math.round(result.harvested[i]).toLocaleString('en-IN')}</td>
      <td>${Math.round(result.tankLevels[i]).toLocaleString('en-IN')}</td>
      <td>${Math.round(result.overflow[i]).toLocaleString('en-IN')}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ============================================================
   RENDER ANNUAL RESULTS  (Prompt 5)
   ============================================================ */
function renderAnnual(archiveData, inputs) {
  const { dates, rainfall } = archiveData;

  // Monthly aggregation
  const monthly = monthlyHarvestTotals(
    dates, rainfall, inputs.roofArea, inputs.runoffCoeff, inputs.firstFlush
  );
  const totalHarvest = monthly.reduce((a, b) => a + b, 0);
  const daysSupply   = inputs.dailyUse > 0
    ? Math.round(totalHarvest / inputs.dailyUse) : 0;
  const annSavings   = (totalHarvest / 1000) * inputs.tariff;

  // Tank size optimisation
  const { sizes, captured, optimalSize } = findOptimalTankSize(
    rainfall, inputs.roofArea, inputs.runoffCoeff, inputs.dailyUse, inputs.firstFlush
  );

  // ── Hero card ──
  $('annual-headline').textContent =
    `You could collect about ${fmt.litres(totalHarvest)} per year`;
  $('annual-sub').textContent =
    `Enough for ${daysSupply.toLocaleString('en-IN')} days of your household's water needs`;

  // ── Metric cards ──
  $('ann-total-harvest').textContent = fmt.litres(totalHarvest);
  $('ann-days-supply').textContent   = `${daysSupply.toLocaleString('en-IN')} days`;
  $('ann-savings').textContent       = fmt.inr(annSavings);
  $('ann-optimal-tank').textContent  = `${optimalSize.toLocaleString('en-IN')} L`;

  // ── Charts ──
  buildMonthlyChart(monthly);
  buildEfficiencyChart(sizes, captured);

  // ── Efficiency note ──
  $('efficiency-note').textContent =
    `The capture curve flattens after ~${optimalSize.toLocaleString('en-IN')} L — ` +
    `adding more tank capacity beyond this point gives diminishing returns for your setup.`;

  hide('annual-idle');
  hide('annual-error');
  show('annual-results');
  state.annualLoaded = true;
}

/* ============================================================
   CSV DOWNLOAD  (Prompt 6)
   ============================================================ */
function downloadCSV() {
  if (!state.simResult) return;
  const { dates, rainfall, harvested, tankLevels, overflow } = state.simResult;
  const today = new Date().toISOString().slice(0, 10);

  const headers = ['Date', 'Type', 'Rainfall_mm', 'Harvest_L', 'Tank_Level_L', 'Overflow_L'];
  const rows    = dates.map((d, i) => [
    d,
    d >= today ? 'Forecast' : 'Past',
    rainfall[i].toFixed(2),
    Math.round(harvested[i]),
    Math.round(tankLevels[i]),
    Math.round(overflow[i]),
  ]);

  const csv  = [headers, ...rows].map(r => r.join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `rainwise_${state.location.name.replace(/[,\s]+/g, '_')}_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================================================
   PANEL SWITCHING (tabs)
   ============================================================ */
function showPanel(which) {
  const isSim = which === 'sim';

  $('tab-sim').classList.toggle('active', isSim);
  $('tab-annual').classList.toggle('active', !isSim);
  $('tab-sim').setAttribute('aria-selected', String(isSim));
  $('tab-annual').setAttribute('aria-selected', String(!isSim));

  $('panel-sim').hidden    = !isSim;
  $('panel-annual').hidden = isSim;
}

/* ============================================================
   BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = $('back-to-top');
  window.addEventListener('scroll', () => {
    btn.hidden = window.scrollY < 400;
  }, { passive: true });
}

/* ============================================================
   EVENT WIRING
   ============================================================ */
function setupEvents() {

  // Theme toggle
  $('theme-toggle').addEventListener('click', toggleTheme);

  // Tab buttons
  $('tab-sim').addEventListener('click', () => showPanel('sim'));
  $('tab-annual').addEventListener('click', () => showPanel('annual'));

  // ── City Search ──
  $('search-btn').addEventListener('click', doSearch);
  $('city-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  });
  // Close dropdown when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) hideDropdown();
  });

  async function doSearch() {
    const name = $('city-input').value.trim();
    if (!name) return;

    const btn     = $('search-btn');
    btn.disabled  = true;
    btn.textContent = '…';

    try {
      const results = await geocodeCity(name);
      if (results.length === 1) {
        selectCity(results[0]);
      } else {
        renderDropdown(results);
      }
    } catch (err) {
      console.error('Geocode error:', err);
      alert(`Could not search for "${name}". Check your internet connection.`);
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Search';
    }
  }

  // ── Calculate form ──
  $('input-form').addEventListener('submit', async e => {
    e.preventDefault();

    const inputs = getInputs();
    const errors = validateInputs(inputs);

    const errEl = $('form-error');
    if (errors.length) {
      errEl.textContent = errors.join(' ');
      errEl.hidden      = false;
      errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    errEl.hidden = true;

    saveToStorage(inputs);

    // Ensure simulation panel is visible
    showPanel('sim');

    // ── Loading state ──
    hide('sim-results');
    hide('sim-error');
    show('sim-loading');

    const btn   = $('calculate-btn');
    const label = btn.querySelector('.btn-label');
    const spin  = btn.querySelector('.btn-spinner');
    btn.disabled = true;
    label.textContent = 'Fetching…';
    spin.classList.remove('hidden');

    try {
      const data  = await fetchForecast(state.location.lat, state.location.lon);
      state.forecastData = data;
      hide('sim-loading');
      renderSimulation(data, inputs);
    } catch (err) {
      console.error('Forecast error:', err);
      hide('sim-loading');
      $('sim-error-msg').textContent = `${err.message}. Check your internet connection and try again.`;
      show('sim-error');
    } finally {
      btn.disabled      = false;
      label.textContent = '💧 Calculate & Fetch Data';
      spin.classList.add('hidden');
    }
  });

  // ── Annual load button ──
  $('load-annual-btn').addEventListener('click', async () => {
    const inputs = getInputs();
    const errors = validateInputs(inputs);

    if (errors.length) {
      alert('Please fix the form errors first:\n' + errors.join('\n'));
      return;
    }

    hide('annual-idle');
    hide('annual-error');
    hide('annual-results');
    show('annual-loading');

    try {
      const data          = await fetchArchive(state.location.lat, state.location.lon);
      state.annualData    = data;
      hide('annual-loading');
      renderAnnual(data, inputs);
    } catch (err) {
      console.error('Archive error:', err);
      hide('annual-loading');
      $('annual-error-msg').textContent =
        `${err.message}. Check your internet connection and try again.`;
      show('annual-error');
      show('annual-idle');
    }
  });

  // ── CSV download ──
  $('csv-btn').addEventListener('click', downloadCSV);

  // ── Back to top ──
  initBackToTop();
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadFromStorage();
  setupEvents();
});
