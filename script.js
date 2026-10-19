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

// ===== RAINFALL DATA BY CITY =====
const cityRainfall = {
  mumbai: 2167,
  chennai: 1400,
  bengaluru: 971,
  delhi: 617,
  kolkata: 1582,
  hyderabad: 775,
  pune: 722,
  ahmedabad: 782,
  jaipur: 647,
  bhopal: 1146,
};

function updateRainfall() {
  const city = document.getElementById('city-select').value;
  const rainfallInput = document.getElementById('rainfall-input');
  if (city !== 'custom' && cityRainfall[city]) {
    rainfallInput.value = cityRainfall[city];
    rainfallInput.style.borderColor = 'rgba(74,222,128,0.6)';
    setTimeout(() => rainfallInput.style.borderColor = '', 1500);
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

    // Formula: Volume = Rainfall(m) × Area(m²) × Runoff coeff × System efficiency (0.85)
    const systemEfficiency = 0.85;
    const rainfallM = rainfall / 1000; // mm to m
    const volumeM3 = rainfallM * area * runoff * systemEfficiency;
    const volumeL = Math.round(volumeM3 * 1000);

    // Money saved (₹ per 1000L)
    const moneySaved = Math.round((volumeL / 1000) * waterCost);

    // Days of household water (family of 4, 135 L/person/day = 540 L/day)
    const dailyUse = 540;
    const days = Math.round(volumeL / dailyUse);

    // CO2 saved (pumping water = ~0.3 kg CO2 per m3 approximate)
    const co2Saved = Math.round(volumeM3 * 0.3 * 10) / 10;

    // Animate results
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
    tipsEl.innerHTML = `<p>💡 <strong>Personalized Tips:</strong> ${tips}</p>`;

    btn.textContent = '💧 Calculate My Savings';
    btn.disabled = false;
  }, 600);
}

function animateNumber(elementId, target, prefix, suffix) {
  const el = document.getElementById(elementId);
  const duration = 1500;
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  createRain();
  initNavbar();
  initBackToTop();
  animateHeroStats();
  initCountUp();
  initScrollAnimations();
  initActiveNav();

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
