/* =====================================================
   RainHarvest India — JavaScript
   Features: Rain animation, Calculator, Scroll effects,
   Count-up, FAQ, Tabs, Mobile nav
   ===================================================== */

// ===== RAIN ANIMATION =====
function createRain() {
  const rainCanvas = document.getElementById('rainCanvas');
  if (!rainCanvas) return;

  const dropCount = window.innerWidth < 768 ? 40 : 80;
  for (let i = 0; i < dropCount; i++) {
    const drop = document.createElement('div');
    drop.classList.add('rain-drop');
    const left = Math.random() * 100;
    const duration = 0.7 + Math.random() * 1.2;
    const delay = Math.random() * 3;
    const height = 12 + Math.random() * 20;
    const opacity = 0.2 + Math.random() * 0.4;

    drop.style.cssText = `
      left: ${left}%;
      height: ${height}px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      opacity: ${opacity};
    `;
    rainCanvas.appendChild(drop);
  }
}

// ===== NAVBAR SCROLL =====
function initNavbar() {
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });
}

// ===== MOBILE MENU =====
function toggleMenu() {
  const navLinks = document.getElementById('navLinks');
  const hamburger = document.getElementById('hamburger');
  navLinks.classList.toggle('mobile-open');
  hamburger.classList.toggle('active');

  // Close when a link is clicked
  if (navLinks.classList.contains('mobile-open')) {
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        hamburger.classList.remove('active');
      }, { once: true });
    });
  }
}

// ===== BACK TO TOP =====
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });
}

// ===== HERO STAT COUNT-UP =====
function animateHeroStats() {
  const stats = document.querySelectorAll('.stat-num[data-target]');
  stats.forEach(stat => {
    const target = parseInt(stat.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const update = () => {
      current = Math.min(current + step, target);
      stat.textContent = Math.floor(current).toLocaleString('en-IN');
      if (current < target) requestAnimationFrame(update);
    };
    setTimeout(update, 500);
  });
}

// ===== COUNT-UP (Stats Section) =====
function initCountUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseInt(entry.target.dataset.target);
        const duration = 1800;
        const step = target / (duration / 16);
        let current = 0;

        const update = () => {
          current = Math.min(current + step, target);
          entry.target.textContent = Math.floor(current).toLocaleString('en-IN');
          if (current < target) requestAnimationFrame(update);
        };
        update();
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.count-up').forEach(el => observer.observe(el));
}

// ===== SCROLL FADE-IN =====
function initScrollAnimations() {
  const targets = [
    '.step-card', '.benefit-card', '.stat-card', '.scheme-card',
    '.faq-item', '.system-info', '.system-visual', '.calc-form', '.calc-results'
  ];

  const elements = document.querySelectorAll(targets.join(', '));
  elements.forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

// ===== SYSTEMS TABS =====
function showSystem(type) {
  // Hide all panels
  document.querySelectorAll('.system-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  // Show selected
  document.getElementById(`panel-${type}`).classList.add('active');
  document.getElementById(`tab-${type}`).classList.add('active');
}

// ===== FAQ TOGGLE =====
function toggleFaq(item) {
  const wasOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  // Open clicked (if wasn't open)
  if (!wasOpen) item.classList.add('open');
}

// ===== RAINFALL DATA & REAL RAIN INTEGRATION =====
const cityRainfall = {
  bengaluru: 971,
  mumbai: 2167,
  chennai: 1400,
  delhi: 617,
  kolkata: 1582,
  hyderabad: 775,
  pune: 722,
  ahmedabad: 782,
  jaipur: 647,
  bhopal: 1146,
};

// Known coordinates for quick fallback & instant loading
const defaultCityCoordinates = {
  bengaluru: { name: 'Bengaluru', admin: 'Karnataka, India', latitude: 12.9716, longitude: 77.5946 },
  mumbai: { name: 'Mumbai', admin: 'Maharashtra, India', latitude: 19.0760, longitude: 72.8777 },
  chennai: { name: 'Chennai', admin: 'Tamil Nadu, India', latitude: 13.0827, longitude: 80.2707 },
  delhi: { name: 'Delhi', admin: 'Delhi, India', latitude: 28.6139, longitude: 77.2090 },
  kolkata: { name: 'Kolkata', admin: 'West Bengal, India', latitude: 22.5726, longitude: 88.3639 },
  hyderabad: { name: 'Hyderabad', admin: 'Telangana, India', latitude: 17.3850, longitude: 78.4867 },
  pune: { name: 'Pune', admin: 'Maharashtra, India', latitude: 18.5204, longitude: 73.8567 },
  ahmedabad: { name: 'Ahmedabad', admin: 'Gujarat, India', latitude: 23.0225, longitude: 72.5714 },
  jaipur: { name: 'Jaipur', admin: 'Rajasthan, India', latitude: 26.9124, longitude: 75.7873 },
  bhopal: { name: 'Bhopal', admin: 'Madhya Pradesh, India', latitude: 23.2599, longitude: 77.4126 }
};

let liveRainfallState = {
  city: 'Bengaluru',
  locationLabel: 'Bengaluru, Karnataka, India',
  latitude: 12.9716,
  longitude: 77.5946,
  dates: [],
  precipitation: [],
  pastDaysCount: 30,
  totalWindowRainfall: 0,
  isLoading: false,
  error: null
};

/**
 * Sync the existing calculator with real rainfall data from Open-Meteo
 */
async function updateRainfall() {
  const citySelect = document.getElementById('city-select');
  const cityKey = citySelect ? citySelect.value : 'bengaluru';
  const rainfallInput = document.getElementById('rainfall-input');
  const statusEl = document.getElementById('calc-rainfall-status');
  const hintEl = document.getElementById('calc-rainfall-hint');

  if (cityKey === 'custom') {
    if (statusEl) {
      statusEl.textContent = 'Manual Input';
      statusEl.style.color = 'var(--neutral-400)';
    }
    if (hintEl) hintEl.textContent = 'Enter your custom annual rainfall in mm.';
    return;
  }

  // If city is known, fetch or sync real rainfall
  const coords = defaultCityCoordinates[cityKey];
  if (coords) {
    if (statusEl) {
      statusEl.textContent = '● Fetching live data...';
      statusEl.style.color = 'var(--amber-400)';
    }

    try {
      // Fetch live rainfall via Open-Meteo Forecast API
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&daily=precipitation_sum&past_days=30&forecast_days=7&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      if (data && data.daily && data.daily.precipitation_sum) {
        const sum37Days = data.daily.precipitation_sum.reduce((acc, v) => acc + (v || 0), 0);
        // Annualized estimate = (37-day sum / 37) * 365
        const annualEstimate = Math.round((sum37Days / data.daily.precipitation_sum.length) * 365);
        const displayValue = annualEstimate > 50 ? annualEstimate : (cityRainfall[cityKey] || 971);

        if (rainfallInput) {
          rainfallInput.value = displayValue;
          rainfallInput.style.borderColor = 'rgba(74,222,128,0.8)';
          setTimeout(() => { if (rainfallInput) rainfallInput.style.borderColor = ''; }, 1500);
        }

        if (statusEl) {
          statusEl.textContent = `● Live Synced (${data.daily.precipitation_sum.length}d observed)`;
          statusEl.style.color = 'var(--green-300)';
        }
        if (hintEl) {
          hintEl.textContent = `Live calibrated from Open-Meteo for ${coords.name}: ~${Math.round(sum37Days)} mm in 37-day window.`;
        }
        return;
      }
    } catch (e) {
      console.warn('Real rainfall sync fallback:', e);
    }
  }

  // Fallback to static averages if offline/custom
  if (cityRainfall[cityKey] && rainfallInput) {
    rainfallInput.value = cityRainfall[cityKey];
    if (statusEl) {
      statusEl.textContent = '● IMD Historical Standard';
      statusEl.style.color = 'var(--teal-400)';
    }
  }
}

// ===== CALCULATOR =====
function calculateSavings() {
  const btn = document.getElementById('calc-btn');
  btn.textContent = '⏳ Calculating...';
  btn.disabled = true;

  setTimeout(() => {
    const rainfall = parseFloat(document.getElementById('rainfall-input').value) || 0;
    const area = parseFloat(document.getElementById('roof-area').value) || 0;
    const runoff = parseFloat(document.getElementById('runoff-coeff').value) || 0.85;
    const waterCost = parseFloat(document.getElementById('water-cost').value) || 15;

    // Use pure function from calculator.js for core calculation
    const firstFlushMm = 1;
    // Volume = max(0, rainfall_mm - first_flush) * area * runoff
    let volumeL = 0;
    if (typeof RainCalculator !== 'undefined' && RainCalculator.calculateDailyHarvest) {
      volumeL = Math.round(RainCalculator.calculateDailyHarvest(rainfall, area, runoff, firstFlushMm));
    } else {
      // Fallback
      volumeL = Math.round(Math.max(0, rainfall - firstFlushMm) * area * runoff);
    }

    // Money saved (₹ per 1000L / kL)
    const moneySaved = Math.round((volumeL / 1000) * waterCost);

    // Days of household water (family of 4, 135 L/person/day = 540 L/day)
    const dailyUse = 540;
    const days = Math.round(volumeL / dailyUse);

    // CO2 saved (approx 0.3 kg CO2 per m³ for pumping/municipal treatment)
    const volumeM3 = volumeL / 1000;
    const co2Saved = Math.round(volumeM3 * 0.3 * 10) / 10;

    // Display results
    document.getElementById('results-placeholder').style.display = 'none';
    const resultsContent = document.getElementById('results-content');
    resultsContent.style.display = 'block';
    resultsContent.style.animation = 'fadeIn 0.5s ease';

    // Animate numbers
    animateNumber('res-volume', volumeL, '', ' L');
    animateNumber('res-savings', moneySaved, '₹', '');
    animateNumber('res-days', days, '', ' days');
    document.getElementById('res-co2').textContent = `${co2Saved} kg`;

    // Show tips
    const tipsEl = document.getElementById('results-tips');
    const tips = generateTips(volumeL, rainfall, days);
    tipsEl.innerHTML = `<p>💡 <strong>Personalized Analysis:</strong> ${tips}</p>`;

    btn.textContent = '💧 Calculate My Savings';
    btn.disabled = false;
  }, 400);
}

function animateNumber(elementId, target, prefix, suffix) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const duration = 1200;
  const step = target / (duration / 16);
  let current = 0;

  const update = () => {
    current = Math.min(current + step, target);
    el.textContent = `${prefix}${Math.floor(current).toLocaleString('en-IN')}${suffix}`;
    if (current < target) requestAnimationFrame(update);
  };
  update();
}

function generateTips(volumeL, rainfall, days) {
  const tips = [];

  if (rainfall < 600) {
    tips.push('Your region has lower rainfall — consider a larger storage tank to maximize monsoon capture.');
  } else if (rainfall > 1500) {
    tips.push('Excellent rainfall! Even a basic system will significantly reduce your water bills.');
  }

  if (volumeL > 100000) {
    tips.push('With this much harvest potential, consider connecting to garden irrigation and washing systems.');
  }

  if (days < 30) {
    tips.push('To extend usage, pair your RWH system with a groundwater recharge pit for year-round benefits.');
  } else if (days > 90) {
    tips.push('Great! Your system can cover a substantial part of your annual non-drinking water needs.');
  }

  if (tips.length === 0) {
    tips.push('A standard rooftop RWH system with a 10,000L tank would work well for your setup.');
  }

  return tips.join(' ');
}

// ===== NEWSLETTER =====
function subscribeNewsletter() {
  const email = document.getElementById('newsletter-email').value;
  const btn = document.getElementById('subscribe-btn');

  if (!email || !email.includes('@')) {
    btn.textContent = '❌ Invalid Email';
    btn.style.background = '#ef4444';
    setTimeout(() => {
      btn.textContent = 'Subscribe';
      btn.style.background = '';
    }, 2000);
    return;
  }

  btn.textContent = '✅ Subscribed!';
  btn.style.background = '#22c55e';
  document.getElementById('newsletter-email').value = '';
  setTimeout(() => {
    btn.textContent = 'Subscribe';
    btn.style.background = '';
  }, 3000);
}

// ===== SMOOTH ACTIVE NAV =====
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.pageYOffset >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active-link');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active-link');
      }
    });
  });
}

// ===== LIVE RAINWATER MONITOR IMPLEMENTATION =====

let rainfallChartInstance = null;
let tankChartInstance = null;
let citySearchDebounceTimer = null;

/**
 * Initialize city search with live debounced geocoding and dropdown
 */
function initLiveMonitor() {
  const searchInput = document.getElementById('city-search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  const dropdown = document.getElementById('city-dropdown');

  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

    clearTimeout(citySearchDebounceTimer);
    if (query.length < 2) {
      if (dropdown) dropdown.style.display = 'none';
      return;
    }

    citySearchDebounceTimer = setTimeout(() => {
      fetchCitySuggestions(query);
    }, 300);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      if (dropdown) dropdown.style.display = 'none';
      searchInput.focus();
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && (!dropdown || !dropdown.contains(e.target))) {
      if (dropdown) dropdown.style.display = 'none';
    }
  });

  // Listen to Enter key in search box
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCitySearchClick();
    }
  });

  // Initial load for default city: Bengaluru
  loadCityData('Bengaluru', 12.9716, 77.5946, 'Bengaluru, Karnataka, India');
}

/**
 * Query Open-Meteo Geocoding API for city search matches
 */
async function fetchCitySuggestions(query) {
  const dropdown = document.getElementById('city-dropdown');
  if (!dropdown) return;

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding network error');
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      dropdown.innerHTML = `<div class="city-dropdown-item" style="color:var(--neutral-400); cursor:default;">No matching cities found</div>`;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = '';
    data.results.forEach(city => {
      const item = document.createElement('div');
      item.className = 'city-dropdown-item';
      const adminPart = [city.admin1, city.country].filter(Boolean).join(', ');
      item.innerHTML = `
        <span class="city-name-text"><strong>${escapeHtml(city.name)}</strong></span>
        <span class="city-admin">${escapeHtml(adminPart)}</span>
      `;
      item.addEventListener('click', () => {
        const fullLabel = `${city.name}${adminPart ? ', ' + adminPart : ''}`;
        document.getElementById('city-search-input').value = city.name;
        dropdown.style.display = 'none';
        loadCityData(city.name, city.latitude, city.longitude, fullLabel);
      });
      dropdown.appendChild(item);
    });

    dropdown.style.display = 'block';
  } catch (err) {
    console.warn('City suggestions error:', err);
  }
}

function handleCitySearchClick() {
  const query = (document.getElementById('city-search-input').value || '').trim();
  const dropdown = document.getElementById('city-dropdown');
  if (dropdown) dropdown.style.display = 'none';

  if (!query) return;

  // Check known quick lookup
  const lower = query.toLowerCase();
  if (defaultCityCoordinates[lower]) {
    const c = defaultCityCoordinates[lower];
    loadCityData(c.name, c.latitude, c.longitude, `${c.name}, ${c.admin}`);
    return;
  }

  // Otherwise fetch geocoding
  showMonitorLoading(true);
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`)
    .then(r => r.json())
    .then(data => {
      if (data.results && data.results.length > 0) {
        const city = data.results[0];
        const adminPart = [city.admin1, city.country].filter(Boolean).join(', ');
        const label = `${city.name}${adminPart ? ', ' + adminPart : ''}`;
        loadCityData(city.name, city.latitude, city.longitude, label);
      } else {
        showMonitorError(`City "${query}" not found. Try another city name.`);
      }
    })
    .catch(err => {
      showMonitorError('Unable to connect to Open-Meteo Geocoding. Please check your internet connection.');
    });
}

function retryLiveRainfallFetch() {
  loadCityData(
    liveRainfallState.city,
    liveRainfallState.latitude,
    liveRainfallState.longitude,
    liveRainfallState.locationLabel
  );
}

/**
 * Fetch Open-Meteo Forecast live precipitation for specified latitude & longitude
 */
async function loadCityData(cityName, lat, lon, locationLabel) {
  liveRainfallState.city = cityName;
  liveRainfallState.latitude = lat;
  liveRainfallState.longitude = lon;
  liveRainfallState.locationLabel = locationLabel || cityName;

  // Update banner location
  const statusName = document.getElementById('status-city-name');
  const statusCoords = document.getElementById('status-coords');
  if (statusName) statusName.textContent = liveRainfallState.locationLabel;
  if (statusCoords) statusCoords.textContent = `(${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`;

  showMonitorError(null);
  showMonitorLoading(true);

  try {
    // Open-Meteo Forecast API with past_days=30 and forecast_days=7 and timezone=auto
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&past_days=30&forecast_days=7&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API HTTP ${response.status}`);
    const data = await response.json();

    if (!data.daily || !data.daily.time || !data.daily.precipitation_sum) {
      throw new Error('Incomplete rainfall data received from Open-Meteo.');
    }

    liveRainfallState.dates = data.daily.time; // 37 dates
    // Sanitize any nulls to 0
    liveRainfallState.precipitation = data.daily.precipitation_sum.map(v => (v === null || isNaN(v)) ? 0 : Number(v));
    liveRainfallState.pastDaysCount = 30;
    liveRainfallState.totalWindowRainfall = liveRainfallState.precipitation.reduce((a, b) => a + b, 0);

    showMonitorLoading(false);

    // Run the live simulation and render dashboard
    runLiveSimulation();

    // Also sync the existing Calculator rainfall input with real rainfall data
    syncCalculatorWithRealRain(liveRainfallState.precipitation);

  } catch (err) {
    console.error('Failed to fetch live rainfall:', err);
    showMonitorLoading(false);
    showMonitorError(`Error fetching live precipitation: ${err.message || 'Network timeout'}. Click Retry.`);
  }
}

/**
 * Feed real rainfall data into the existing Calculator
 */
function syncCalculatorWithRealRain(precipitationSeries) {
  const rainfallInput = document.getElementById('rainfall-input');
  const calcStatus = document.getElementById('calc-rainfall-status');
  const calcHint = document.getElementById('calc-rainfall-hint');

  if (rainfallInput && precipitationSeries && precipitationSeries.length > 0) {
    const sum37 = precipitationSeries.reduce((a, b) => a + b, 0);
    // Project annual based on observed 37 days, or keep substantial baseline
    const annualized = Math.round((sum37 / precipitationSeries.length) * 365);
    const rainVal = annualized > 50 ? annualized : 971;

    rainfallInput.value = rainVal;
    if (calcStatus) {
      calcStatus.textContent = `● Live Synced (${liveRainfallState.city})`;
      calcStatus.style.color = 'var(--green-300)';
    }
    if (calcHint) {
      calcHint.textContent = `Synced from Open-Meteo for ${liveRainfallState.city}: ~${Math.round(sum37)} mm over 37 days (annualized ~${rainVal} mm).`;
    }
  }
}

function showMonitorLoading(show) {
  const el = document.getElementById('monitor-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function showMonitorError(message) {
  const el = document.getElementById('monitor-error');
  const msgEl = document.getElementById('monitor-error-msg');
  if (!el) return;

  if (message) {
    if (msgEl) msgEl.textContent = message;
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
}

/**
 * Execute dynamic tank simulation with inputs & live rainfall series
 */
function runLiveSimulation() {
  if (!liveRainfallState.precipitation || liveRainfallState.precipitation.length === 0) {
    return;
  }

  // 1. Gather & Validate inputs
  const roofArea = parseFloat(document.getElementById('mon-roof-area').value);
  const runoffCoeff = parseFloat(document.getElementById('mon-roof-type').value);
  const tankCapacity = parseFloat(document.getElementById('mon-tank-capacity').value);
  const dailyHouseholdUse = parseFloat(document.getElementById('mon-daily-use').value);
  const firstFlushMm = parseFloat(document.getElementById('mon-first-flush').value);
  const waterTariff = parseFloat(document.getElementById('mon-water-tariff').value);

  const validation = RainCalculator.validateInputs({
    roofArea,
    tankCapacity,
    dailyHouseholdUse,
    firstFlushMm,
    waterTariff
  });

  if (!validation.isValid) {
    const firstErr = Object.values(validation.errors)[0];
    alert(`Input Validation: ${firstErr}`);
    return;
  }

  // 2. Run simulation using pure function in calculator.js
  const simResult = RainCalculator.simulateTank({
    rainfallSeries: liveRainfallState.precipitation,
    dateSeries: liveRainfallState.dates,
    roofArea,
    runoffCoeff,
    tankCapacity,
    dailyHouseholdUse,
    firstFlushMm,
    waterTariff,
    initialTankLevel: 0,
    pastDaysCount: liveRainfallState.pastDaysCount
  });

  // 3. Update Dashboard Summary Cards
  updateDashboardCards(simResult, tankCapacity);

  // 4. Update Recommendation
  updateRecommendationBox(simResult.recommendation);

  // 5. Render Charts via Chart.js
  renderMonitorCharts(simResult, tankCapacity);
}

/**
 * Render metric cards
 */
function updateDashboardCards(sim, capacity) {
  // Total Harvested
  const elHarvested = document.getElementById('dash-harvested');
  if (elHarvested) elHarvested.textContent = `${sim.totalHarvested.toLocaleString('en-IN')} L`;
  const elRainSum = document.getElementById('dash-rain-sum');
  if (elRainSum) elRainSum.textContent = `Total Rain: ${sim.totalRainfall} mm`;

  // Current Tank Level
  const elTank = document.getElementById('dash-tank-level');
  if (elTank) elTank.textContent = `${sim.currentTankLevel.toLocaleString('en-IN')} L`;
  const pct = Math.round((sim.currentTankLevel / capacity) * 100);
  const elTankFill = document.getElementById('dash-tank-fill');
  if (elTankFill) elTankFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  const elTankPct = document.getElementById('dash-tank-pct');
  if (elTankPct) elTankPct.textContent = `${pct}% of ${capacity.toLocaleString('en-IN')} L capacity`;

  // Days of Supply Left
  const elDays = document.getElementById('dash-days-left');
  if (elDays) elDays.textContent = `${sim.daysSupplyLeft} days`;

  // Overflow Lost
  const elOverflow = document.getElementById('dash-overflow');
  if (elOverflow) elOverflow.textContent = `${sim.totalOverflow.toLocaleString('en-IN')} L`;
  const overflowPct = sim.totalHarvested > 0 ? Math.round((sim.totalOverflow / sim.totalHarvested) * 100) : 0;
  const elOverflowPct = document.getElementById('dash-overflow-pct');
  if (elOverflowPct) elOverflowPct.textContent = `${overflowPct}% of harvested spilled`;

  // Money Saved
  const elSavings = document.getElementById('dash-savings');
  if (elSavings) elSavings.textContent = `₹${sim.moneySaved.toLocaleString('en-IN')}`;
}

/**
 * Render recommendation message
 */
function updateRecommendationBox(rec) {
  const box = document.getElementById('recommendation-box');
  const icon = document.getElementById('rec-icon');
  const title = document.getElementById('rec-title');
  const text = document.getElementById('rec-text');
  if (!box || !title || !text) return;

  box.className = 'recommendation-box';
  if (rec.status === 'warning') {
    box.classList.add('warning');
    if (icon) icon.textContent = '⚠️';
  } else if (rec.status === 'info') {
    box.classList.add('info');
    if (icon) icon.textContent = 'ℹ️';
  } else {
    if (icon) icon.textContent = '✅';
  }

  title.textContent = rec.title;
  text.textContent = rec.text;
}

/**
 * Render Chart.js charts: Daily rainfall bar chart + Tank level line chart
 */
function renderMonitorCharts(sim, tankCapacity) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js library not loaded yet.');
    return;
  }

  const records = sim.dailyRecords;
  const labels = records.map(r => {
    // Format YYYY-MM-DD to DD MMM
    const parts = r.date.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${parseInt(parts[2], 10)} ${monthNames[parseInt(parts[1], 10) - 1]}`;
    }
    return r.date;
  });

  // Chart 1: Daily Rainfall Bar Chart (differentiating past days vs forecast days)
  const rainCanvas = document.getElementById('rainfallChart');
  if (rainCanvas) {
    const rainCtx = rainCanvas.getContext('2d');

    // Colors: Past days (blue) vs Forecast days (emerald green)
    const backgroundColors = records.map(r => r.isForecast ? 'rgba(16, 185, 129, 0.85)' : 'rgba(59, 130, 246, 0.8)');
    const borderColors = records.map(r => r.isForecast ? '#10b981' : '#3b82f6');

    if (rainfallChartInstance) {
      rainfallChartInstance.destroy();
    }

    rainfallChartInstance = new Chart(rainCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Precipitation (mm)',
          data: records.map(r => r.rainfallMm),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                const rec = records[idx];
                const tag = rec.isForecast ? ' [Forecast]' : (rec.isToday ? ' [Today]' : ' [Past]');
                return `${rec.date}${tag}`;
              },
              label: (item) => `Rainfall: ${item.raw} mm`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 12,
              font: { size: 10 }
            }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Rainfall (mm)', font: { size: 11, weight: '600' } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        }
      }
    });
  }

  // Chart 2: Tank Storage Level Line Chart with Capacity Threshold
  const tankCanvas = document.getElementById('tankChart');
  if (tankCanvas) {
    const tankCtx = tankCanvas.getContext('2d');

    if (tankChartInstance) {
      tankChartInstance.destroy();
    }

    tankChartInstance = new Chart(tankCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Stored Water (L)',
            data: records.map(r => r.tankLevelEnd),
            borderColor: '#0284c7',
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointRadius: 2.5,
            pointHoverRadius: 5
          },
          {
            label: 'Overflow Spilled (L)',
            data: records.map(r => r.overflowLitres),
            type: 'bar',
            backgroundColor: 'rgba(249, 115, 22, 0.7)',
            borderColor: '#f97316',
            borderWidth: 1,
            borderRadius: 3
          },
          {
            label: 'Max Tank Capacity',
            data: records.map(() => tankCapacity),
            borderColor: 'rgba(148, 163, 184, 0.8)',
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                const rec = records[idx];
                const tag = rec.isForecast ? ' [Forecast]' : (rec.isToday ? ' [Today]' : ' [Past]');
                return `${rec.date}${tag}`;
              },
              afterBody: (items) => {
                const idx = items[0].dataIndex;
                const rec = records[idx];
                return [
                  `Harvest: ${rec.harvestLitres} L`,
                  `Consumed: ${rec.consumedLitres} L`,
                  `Overflow: ${rec.overflowLitres} L`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 12,
              font: { size: 10 }
            }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Volume (Litres)', font: { size: 11, weight: '600' } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        }
      }
    });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  createRain();
  initNavbar();
  initBackToTop();
  animateHeroStats();
  initCountUp();
  initScrollAnimations();
  initActiveNav();
  initLiveMonitor();

  // Active nav link style
  const style = document.createElement('style');
  style.textContent = `
    .nav-links a.active-link {
      color: var(--green-400) !important;
    }
    .nav-links a.active-link::after {
      transform: scaleX(1) !important;
    }
  `;
  document.head.appendChild(style);
});

