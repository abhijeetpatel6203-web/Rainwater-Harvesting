/**
 * calculator.js
 *
 * Pure calculation functions for rainwater harvesting simulations.
 * These functions have no side effects, rely on no DOM elements,
 * and can be used on both client-side or server-side / unit-tested.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RainCalculator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Runoff coefficients by roof surface material
   * Concrete / RCC: 0.85
   * Clay / Ceramic Tiles: 0.80
   * Metal / GI Sheet: 0.90
   */
  const RUNOFF_COEFFICIENTS = {
    concrete: 0.85,
    tiles: 0.80,
    metal: 0.90
  };

  /**
   * Calculate daily rainwater harvested in litres.
   *
   * Formula:
   *   harvest (L) = max(0, rainfall_mm - first_flush_mm) * roof_area * runoff_coefficient
   *
   * Explanation:
   *   1 mm of rainfall over 1 m² catchment corresponds to 1 Litre of water (1 mm * 1 m² = 10^-3 m * 1 m² = 10^-3 m³ = 1 L).
   *   The first-flush loss (first_flush_mm) washes dust and debris off the catchment surface
   *   and is diverted away from the collection tank.
   *   The remaining depth is converted into liters and scaled by the surface runoff coefficient (efficiency of collection).
   *
   * @param {number} rainfallMm - Daily rainfall in millimetres (>= 0)
   * @param {number} roofArea - Roof catchment area in square metres (m²) (> 0)
   * @param {number} runoffCoeff - Runoff coefficient (e.g. 0.85 for concrete)
   * @param {number} [firstFlushMm=1] - First-flush diversion loss in mm (default: 1 mm)
   * @returns {number} Harvested water in litres for that day (>= 0)
   */
  function calculateDailyHarvest(rainfallMm, roofArea, runoffCoeff, firstFlushMm = 1) {
    const validRainfall = Math.max(0, Number(rainfallMm) || 0);
    const validArea = Math.max(0, Number(roofArea) || 0);
    const validRunoff = Math.max(0, Math.min(1, Number(runoffCoeff) || 0.85));
    const validFirstFlush = Math.max(0, Number(firstFlushMm) || 0);

    const effectiveRainfall = Math.max(0, validRainfall - validFirstFlush);
    // 1 mm * 1 m² = 1 Liter
    const harvestLitres = effectiveRainfall * validArea * validRunoff;
    return Math.round(harvestLitres * 100) / 100;
  }

  /**
   * Simulate storage tank behavior day-by-day across a rainfall time-series.
   *
   * Tank dynamic balance per day:
   *   1. Harvest incoming water: harvest = max(0, rainfall_mm - first_flush_mm) * roof_area * runoff_coefficient
   *   2. Water entering tank is limited by remaining capacity:
   *        available_space = capacity - current_tank
   *        overflow_today = max(0, harvest - available_space)
   *        tank_after_harvest = min(capacity, current_tank + harvest)
   *   3. Water extracted for household consumption:
   *        actual_consumed = min(tank_after_harvest, daily_use)
   *        tank_end = max(0, tank_after_harvest - daily_use)
   *   4. Overflow water is tracked and accumulated.
   *
   * @param {Object} params - Simulation parameters
   * @param {Array<number>} params.rainfallSeries - Array of daily precipitation_sum in mm
   * @param {Array<string>} [params.dateSeries] - Array of corresponding ISO date strings 'YYYY-MM-DD'
   * @param {number} params.roofArea - Catchment area in m²
   * @param {number} params.runoffCoeff - Catchment runoff coefficient (0.0 - 1.0)
   * @param {number} params.tankCapacity - Total storage tank capacity in Litres
   * @param {number} params.dailyHouseholdUse - Daily household water consumption in Litres/day
   * @param {number} [params.firstFlushMm=1] - First-flush loss in mm (default 1)
   * @param {number} [params.waterTariff=15] - Water tariff in ₹ per kL (₹ per 1,000 Litres)
   * @param {number} [params.initialTankLevel=0] - Initial storage in tank at day 0 in Litres
   * @param {number} [params.pastDaysCount=30] - Number of past days in the dataset (to demarcate forecast)
   * @returns {Object} Simulation summary and daily trajectory
   */
  function simulateTank(params) {
    const {
      rainfallSeries = [],
      dateSeries = [],
      roofArea = 100,
      runoffCoeff = 0.85,
      tankCapacity = 5000,
      dailyHouseholdUse = 500,
      firstFlushMm = 1,
      waterTariff = 15,
      initialTankLevel = 0,
      pastDaysCount = 30
    } = params;

    const capacity = Math.max(1, Number(tankCapacity) || 1000);
    const dailyUse = Math.max(0, Number(dailyHouseholdUse) || 0);
    const tariff = Math.max(0, Number(waterTariff) || 0);
    let currentTank = Math.max(0, Math.min(capacity, Number(initialTankLevel) || 0));

    let totalHarvested = 0;
    let totalOverflow = 0;
    let totalConsumed = 0;
    let totalRainfall = 0;

    const dailyRecords = [];

    for (let i = 0; i < rainfallSeries.length; i++) {
      const rainMm = Math.max(0, Number(rainfallSeries[i]) || 0);
      const dateStr = dateSeries[i] || `Day ${i + 1}`;
      const isPast = i < pastDaysCount;
      const isToday = i === pastDaysCount;
      const isForecast = i > pastDaysCount;

      totalRainfall += rainMm;

      // 1. Calculate harvest for the day
      const harvest = calculateDailyHarvest(rainMm, roofArea, runoffCoeff, firstFlushMm);
      totalHarvested += harvest;

      // 2. Add to tank and capture overflow
      const tankWithHarvest = currentTank + harvest;
      let overflowToday = 0;
      let tankStored = tankWithHarvest;

      if (tankWithHarvest > capacity) {
        overflowToday = tankWithHarvest - capacity;
        tankStored = capacity;
      }
      totalOverflow += overflowToday;

      // 3. Subtract daily household use (tank never drops below 0)
      const consumedToday = Math.min(tankStored, dailyUse);
      totalConsumed += consumedToday;
      const tankEnd = Math.max(0, tankStored - dailyUse);

      currentTank = tankEnd;

      dailyRecords.push({
        dayIndex: i,
        date: dateStr,
        isPast,
        isToday,
        isForecast,
        rainfallMm: rainMm,
        harvestLitres: Math.round(harvest),
        tankLevelEnd: Math.round(tankEnd),
        overflowLitres: Math.round(overflowToday),
        consumedLitres: Math.round(consumedToday)
      });
    }

    // Current tank level (at present day / latest past day)
    const todayIndex = Math.min(pastDaysCount, dailyRecords.length - 1);
    const currentTankLevel = dailyRecords[todayIndex] ? dailyRecords[todayIndex].tankLevelEnd : currentTank;

    // Days of supply left based on current tank level and daily consumption
    const daysSupplyLeft = dailyUse > 0 ? (currentTankLevel / dailyUse) : 0;

    // Money saved: based on total rainwater successfully harvested & consumed or stored
    // Standard valuation: 1 kL = 1000 Litres
    const moneySaved = (totalHarvested / 1000) * tariff;

    // Recommendations logic
    const recommendation = generateRecommendation({
      totalHarvested,
      totalOverflow,
      tankCapacity: capacity,
      daysSupplyLeft,
      dailyUse,
      totalRainfall
    });

    return {
      totalHarvested: Math.round(totalHarvested),
      totalOverflow: Math.round(totalOverflow),
      totalConsumed: Math.round(totalConsumed),
      totalRainfall: Math.round(totalRainfall * 10) / 10,
      currentTankLevel: Math.round(currentTankLevel),
      tankCapacity: capacity,
      daysSupplyLeft: Math.round(daysSupplyLeft * 10) / 10,
      moneySaved: Math.round(moneySaved),
      recommendation,
      dailyRecords
    };
  }

  /**
   * Generates actionable engineering recommendation based on simulation outcomes.
   *
   * @param {Object} metrics
   * @returns {Object} { status: 'success'|'warning'|'info', title: string, text: string }
   */
  function generateRecommendation(metrics) {
    const { totalHarvested, totalOverflow, tankCapacity, daysSupplyLeft, dailyUse } = metrics;
    const overflowRatio = totalHarvested > 0 ? (totalOverflow / totalHarvested) : 0;

    if (totalHarvested === 0) {
      return {
        status: 'info',
        title: 'Dry Spell / Minimal Rain',
        text: 'Minimal or no rainfall recorded in this period. Maintain clean gutters and ensure first-flush diverters are cleared for the upcoming monsoons.'
      };
    }

    if (overflowRatio > 0.40) {
      const suggestedExpansion = Math.round(tankCapacity * (1 + overflowRatio));
      return {
        status: 'warning',
        title: 'High Overflow Alert (> 40% Spillage)',
        text: `You lost ${Math.round(totalOverflow).toLocaleString('en-IN')} L (${Math.round(overflowRatio * 100)}%) to overflow! We recommend installing an underground recharge pit (soakaway) or upsizing storage to ~${suggestedExpansion.toLocaleString('en-IN')} L to replenish groundwater.`
      };
    }

    if (overflowRatio > 0.15) {
      return {
        status: 'warning',
        title: 'Moderate Overflow Detected',
        text: `${Math.round(totalOverflow).toLocaleString('en-IN')} L spilled over. Direct the tank overflow into a garden bioswale, shallow percolation trench, or dual-tank cascade.`
      };
    }

    if (daysSupplyLeft < 2 && dailyUse > 0) {
      return {
        status: 'info',
        title: 'Low Storage Buffer',
        text: `Current water stored provides only ${daysSupplyLeft.toFixed(1)} days of household supply. Consider water rationing for non-potable uses during dry days or integrating a dual-source connection.`
      };
    }

    return {
      status: 'success',
      title: 'Optimal System Sizing',
      text: `Your ${tankCapacity.toLocaleString('en-IN')} L tank is capturing rainwater with excellent efficiency (${Math.round((1 - overflowRatio) * 100)}% utilization) and minimal spillage.`
    };
  }

  /**
   * Validate user input fields for the calculator and monitor.
   *
   * @param {Object} inputs
   * @returns {Object} { isValid: boolean, errors: Object }
   */
  function validateInputs(inputs) {
    const errors = {};

    const roofArea = Number(inputs.roofArea);
    if (isNaN(roofArea) || roofArea < 5 || roofArea > 50000) {
      errors.roofArea = 'Roof area must be between 5 and 50,000 m².';
    }

    const tankCapacity = Number(inputs.tankCapacity);
    if (isNaN(tankCapacity) || tankCapacity < 100 || tankCapacity > 1000000) {
      errors.tankCapacity = 'Tank capacity must be between 100 and 1,000,000 L.';
    }

    const dailyHouseholdUse = Number(inputs.dailyHouseholdUse);
    if (isNaN(dailyHouseholdUse) || dailyHouseholdUse < 10 || dailyHouseholdUse > 100000) {
      errors.dailyHouseholdUse = 'Daily use must be between 10 and 100,000 L/day.';
    }

    const firstFlushMm = Number(inputs.firstFlushMm);
    if (isNaN(firstFlushMm) || firstFlushMm < 0 || firstFlushMm > 10) {
      errors.firstFlushMm = 'First-flush diversion must be between 0 and 10 mm.';
    }

    const waterTariff = Number(inputs.waterTariff);
    if (isNaN(waterTariff) || waterTariff < 0 || waterTariff > 1000) {
      errors.waterTariff = 'Water tariff must be between ₹0 and ₹1,000 / kL.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  return {
    RUNOFF_COEFFICIENTS,
    calculateDailyHarvest,
    simulateTank,
    generateRecommendation,
    validateInputs
  };
});
