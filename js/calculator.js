/**
 * js/calculator.js
 *
 * Pure calculation functions for rainwater harvesting simulation.
 * No DOM access, no side effects — designed to be independently testable.
 *
 * ── CORE FORMULA ──────────────────────────────────────────────────────────────
 *
 *   1 mm of rain falling on 1 m² of surface = 1 litre (exactly).
 *      Derivation: 0.001 m (depth) × 1 m² (area) = 0.001 m³ = 1 litre.
 *
 *   Daily Harvest (L) = max(0, Rainfall_mm − FirstFlush_mm)
 *                       × RoofArea_m²
 *                       × RunoffCoefficient
 *
 *   First-flush loss is deducted only when it rains (rainfall > 0 mm).
 *   Runoff coefficient accounts for evaporation & surface absorption:
 *     • Concrete / RCC      0.85
 *     • Clay tiles           0.80
 *     • Metal / GI sheet     0.90
 *     • Asbestos sheet       0.80
 *
 * ── TANK SIMULATION ──────────────────────────────────────────────────────────
 *
 *   Each day:
 *     pre-fill  = tank + harvest
 *     overflow  = max(0, pre-fill − capacity)     ← water lost when full
 *     tank      = min(capacity, pre-fill)
 *     tank      = max(0, tank − dailyUse)          ← can't go below 0
 */

'use strict';

/* -------------------------------------------------------------------------- */
/*  dailyHarvest                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns the litres of rainwater harvested on a single day.
 *
 * @param {number} rainfallMm  Daily rainfall in millimetres (≥ 0)
 * @param {number} roofArea    Catchment area in square metres (> 0)
 * @param {number} runoffCoeff Fraction of rain collected, e.g. 0.85 (0 – 1)
 * @param {number} firstFlush  First-flush loss in mm per rain event (≥ 0)
 * @returns {number} Litres harvested (never negative)
 */
function dailyHarvest(rainfallMm, roofArea, runoffCoeff, firstFlush) {
  // Only deduct first-flush when it actually rains
  const effective = rainfallMm > 0
    ? Math.max(0, rainfallMm - firstFlush)
    : 0;
  return effective * roofArea * runoffCoeff;
}

/* -------------------------------------------------------------------------- */
/*  simulateTank                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Simulates the tank day-by-day over an array of daily rainfall values.
 *
 * @param {number[]} rainfallSeries  Array of daily rainfall (mm); length = N days
 * @param {number}   roofArea        Catchment area in m²
 * @param {number}   runoffCoeff     Runoff coefficient (0 – 1)
 * @param {number}   tankCapacity    Maximum tank storage in litres
 * @param {number}   dailyUse        Household consumption per day (L/day)
 * @param {number}   firstFlush      First-flush loss per rain event (mm)
 * @param {number}   [initialLevel]  Starting tank level (L); defaults to 50% capacity
 *
 * @returns {{
 *   harvested:  number[],   // litres harvested each day  (length N)
 *   tankLevels: number[],   // tank level at day-end      (length N)
 *   overflow:   number[],   // overflow lost each day     (length N)
 * }}
 */
function simulateTank(
  rainfallSeries, roofArea, runoffCoeff,
  tankCapacity, dailyUse, firstFlush,
  initialLevel
) {
  const n         = rainfallSeries.length;
  const harvested  = new Array(n);
  const tankLevels = new Array(n);
  const overflow   = new Array(n);

  // Start at half-capacity when no initial level is specified
  let tank = (initialLevel !== undefined)
    ? Math.max(0, Math.min(initialLevel, tankCapacity))
    : tankCapacity / 2;

  for (let i = 0; i < n; i++) {
    // Step 1 – harvest today's rain
    const h = dailyHarvest(rainfallSeries[i], roofArea, runoffCoeff, firstFlush);
    harvested[i] = h;

    // Step 2 – add harvest; compute overflow if tank would exceed capacity
    const preFill    = tank + h;
    const dayOverflow = Math.max(0, preFill - tankCapacity);
    overflow[i]       = dayOverflow;

    // Step 3 – cap at capacity
    tank = Math.min(tankCapacity, preFill);

    // Step 4 – subtract daily use; floor at 0 (the tap runs dry, not negative)
    tank = Math.max(0, tank - dailyUse);

    tankLevels[i] = tank;
  }

  return { harvested, tankLevels, overflow };
}

/* -------------------------------------------------------------------------- */
/*  monthlyHarvestTotals                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Aggregates the raw daily harvest into 12 monthly totals.
 *
 * @param {string[]} dates           ISO date strings (YYYY-MM-DD), length = N
 * @param {number[]} rainfallSeries  Daily rainfall (mm), length = N
 * @param {number}   roofArea
 * @param {number}   runoffCoeff
 * @param {number}   firstFlush
 * @returns {number[]}  12-element array indexed 0 = Jan … 11 = Dec (litres)
 */
function monthlyHarvestTotals(dates, rainfallSeries, roofArea, runoffCoeff, firstFlush) {
  const monthly = new Array(12).fill(0);
  for (let i = 0; i < dates.length; i++) {
    // "YYYY-MM-DD" → month index 0-based
    const month = parseInt(dates[i].slice(5, 7), 10) - 1;
    monthly[month] += dailyHarvest(rainfallSeries[i], roofArea, runoffCoeff, firstFlush);
  }
  return monthly;
}

/* -------------------------------------------------------------------------- */
/*  findOptimalTankSize                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Determines the tank size at which adding more capacity yields diminishing
 * returns — i.e. marginal captured-water gain falls below `threshold`.
 *
 * Algorithm:
 *   Try a range of tank sizes (500 L … 50,000 L).
 *   For each, run the full simulation and record total harvested (= total
 *   rainfall captured before overflow).  Find the first point where the
 *   marginal relative gain < threshold.
 *
 * @param {number[]} rainfallSeries
 * @param {number}   roofArea
 * @param {number}   runoffCoeff
 * @param {number}   dailyUse
 * @param {number}   firstFlush
 * @param {number}   [threshold=0.02]  Minimum fractional gain to keep sizing up
 *
 * @returns {{
 *   sizes:       number[],   // tank sizes tested (L)
 *   captured:    number[],   // useful water captured at each size (L)
 *   optimalSize: number,     // recommended tank size (L)
 * }}
 */
function findOptimalTankSize(
  rainfallSeries, roofArea, runoffCoeff, dailyUse, firstFlush,
  threshold = 0.02
) {
  // Build a test range with finer granularity at smaller sizes
  const sizes = [];
  for (let s = 500; s <= 50000; s += (s < 5000 ? 500 : s < 20000 ? 1000 : 5000)) {
    sizes.push(s);
  }

  // Run simulation for each candidate tank size
  const captured = sizes.map(s => {
    const result = simulateTank(
      rainfallSeries, roofArea, runoffCoeff, s, dailyUse, firstFlush
    );
    return result.harvested.reduce((sum, h) => sum + h, 0);
  });

  // Find the elbow: first size where marginal gain < threshold
  let optimalSize = sizes[sizes.length - 1]; // default to largest if no elbow found
  for (let i = 1; i < sizes.length; i++) {
    const marginalGain = captured[i] - captured[i - 1];
    const pctGain      = captured[i] > 0 ? marginalGain / captured[i] : 0;
    if (pctGain < threshold) {
      optimalSize = sizes[i - 1];
      break;
    }
  }

  return { sizes, captured, optimalSize };
}
