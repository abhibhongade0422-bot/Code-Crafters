// ═══════════════════════════════════════════════════
// PhantomWatt V2 — Complete Application
// ═══════════════════════════════════════════════════

// ═══════ DEVICE DATABASE ═══════
const DEVICES = {
  "Entertainment":[
    {id:"tv_led",name:"LED/LCD TV",emoji:"📺",watts:5,tip:"Use power strip to fully cut power when not watching",room:"living"},
    {id:"tv_old",name:"Old CRT TV",emoji:"📺",watts:8,tip:"Consider upgrading — modern TVs use 60% less standby",room:"living"},
    {id:"settop",name:"Set-Top Box / DTH",emoji:"📡",watts:15,tip:"One of top vampires! Unplug when not watching TV",room:"living"},
    {id:"gaming",name:"Gaming Console",emoji:"🎮",watts:10,tip:"Disable instant-on mode to save 85% standby power",room:"living"},
    {id:"soundbar",name:"Soundbar / Speaker",emoji:"🔊",watts:6,tip:"Turn off via power strip when not in use",room:"living"},
    {id:"streaming",name:"Streaming Device",emoji:"📱",watts:3,tip:"Fire Stick, Chromecast — small drain, adds up",room:"living"},
    {id:"dvd",name:"DVD/Blu-ray Player",emoji:"💿",watts:4,tip:"Unplug — you probably don't use it daily",room:"living"}
  ],
  "Kitchen":[
    {id:"microwave",name:"Microwave Oven",emoji:"🍳",watts:3,tip:"The clock display alone uses ~3W continuously",room:"kitchen"},
    {id:"oven_electric",name:"Electric Oven/OTG",emoji:"🔥",watts:2.5,tip:"Unplug after use — the timer circuit draws power",room:"kitchen"},
    {id:"coffee",name:"Coffee Maker",emoji:"☕",watts:2,tip:"Unplug after morning coffee",room:"kitchen"},
    {id:"dishwasher",name:"Dishwasher",emoji:"🍽️",watts:2,tip:"Turn off at mains after the wash cycle",room:"kitchen"},
    {id:"water_purifier",name:"Water Purifier (RO)",emoji:"💧",watts:3,tip:"Common in India, adds up over 24/7 standby",room:"kitchen"},
    {id:"induction",name:"Induction Cooktop",emoji:"🫕",watts:1.5,tip:"Low standby but still worth unplugging",room:"kitchen"},
    {id:"mixer",name:"Mixer/Grinder",emoji:"🥤",watts:0.5,tip:"Minimal drain but good habit to unplug",room:"kitchen"}
  ],
  "Office / IT":[
    {id:"desktop",name:"Desktop Computer",emoji:"🖥️",watts:8,tip:"Shut down fully — sleep mode still draws 3-8W",room:"office"},
    {id:"monitor",name:"Monitor",emoji:"🖵",watts:3,tip:"Turn off the monitor switch, not just screen-off",room:"office"},
    {id:"laptop_charger",name:"Laptop Charger",emoji:"💻",watts:4.5,tip:"Charger draws power even without laptop connected",room:"office"},
    {id:"printer",name:"Printer",emoji:"🖨️",watts:5,tip:"Turn off when not printing — standby is high",room:"office"},
    {id:"router",name:"WiFi Router",emoji:"📶",watts:8,tip:"Runs 24/7; consider a smart timer for night off",room:"office"},
    {id:"modem",name:"Broadband Modem",emoji:"🌐",watts:6,tip:"Often left on 24/7 — turn off with router at night",room:"office"},
    {id:"ups",name:"UPS / Inverter",emoji:"🔋",watts:10,tip:"UPS drain is high — unplug when power is stable",room:"office"}
  ],
  "Charging / Mobile":[
    {id:"phone_charger",name:"Phone Charger",emoji:"🔌",watts:0.5,tip:"Tiny per unit but millions plugged in = massive waste",room:"bedroom"},
    {id:"tablet_charger",name:"Tablet Charger",emoji:"📲",watts:1,tip:"Unplug after charging — it's just warming up",room:"bedroom"},
    {id:"smartwatch",name:"Smartwatch Charger",emoji:"⌚",watts:0.5,tip:"Magnetic charger still draws when watch removed",room:"bedroom"},
    {id:"power_bank",name:"Power Bank",emoji:"🪫",watts:1,tip:"Disconnect once fully charged",room:"bedroom"},
    {id:"earbuds",name:"TWS Earbuds Case",emoji:"🎧",watts:0.3,tip:"Tiny drain, but good habit to unplug",room:"bedroom"}
  ],
  "Home Comfort":[
    {id:"ac",name:"Air Conditioner",emoji:"❄️",watts:5,tip:"AC standby powers the remote sensor — use mains switch",room:"bedroom"},
    {id:"geyser",name:"Water Heater/Geyser",emoji:"🚿",watts:3,tip:"Very common India habit to leave on — huge waste!",room:"kitchen"},
    {id:"fan_smart",name:"Smart Fan / BLDC",emoji:"🌀",watts:1,tip:"Modern fans have standby for remote control",room:"bedroom"},
    {id:"air_purifier",name:"Air Purifier",emoji:"🌬️",watts:3,tip:"Turn off when air quality is good",room:"bedroom"},
    {id:"heater",name:"Room Heater",emoji:"🔥",watts:2,tip:"Unplug during summer months",room:"bedroom"},
    {id:"iron",name:"Clothes Iron",emoji:"👔",watts:0.5,tip:"Always unplug — safety + savings",room:"bedroom"}
  ],
  "Smart Home":[
    {id:"smart_speaker",name:"Smart Speaker",emoji:"🗣️",watts:3,tip:"Always listening = always drawing power",room:"living"},
    {id:"smart_display",name:"Smart Display",emoji:"📋",watts:5,tip:"Screen + mic + speaker = significant standby",room:"living"},
    {id:"smart_plug",name:"Smart Plug (each)",emoji:"🔌",watts:1,tip:"Ironic — the energy saver itself uses power",room:"living"},
    {id:"cctv",name:"CCTV/Security Cam",emoji:"📷",watts:5,tip:"Runs 24/7 — consider motion-only recording",room:"living"},
    {id:"doorbell",name:"Smart Doorbell",emoji:"🔔",watts:2,tip:"Always on by design, hard to reduce",room:"living"}
  ]
};

const CO2_FACTOR = 0.82;
const HOURS_YEAR = 8760;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ═══════ STATE ═══════
let currentUser = null;   // { name, email, hash }
let selectedDevices = {};  // { id: { ...device, qty } }
let currentMode = 'dashboard';
let authMode = 'login';
let gameDeviceStates = {}; // { id: true/false } for game mode
let chartInstances = {};
let selectorMode = 'simple'; // 'simple' or 'story'
let storyRoomIndex = 0;

const STORY_ROOMS = [
  {
    key:'bedroom', emoji:'🛏️', name:'Bedroom',
    scene:'🌅 Chapter 1: The Silent Morning',
    desc:'It\'s 6:30 AM. Your alarm rings and you reach for your phone — still plugged into the charger from last night. The AC remote blinks green in the dark. Your smartwatch charger sits on the nightstand, even though the watch is on your wrist. The room feels quiet, but ₹40 slipped away while you slept last night...',
    challenge:'🎯 Challenge: Can you spot which devices drained the most while you were dreaming?',
    tip:'💡 Did you know? An Indian household\'s bedroom chargers and AC standby silently waste ₹300–500 every year — that\'s almost a month\'s worth of chai money!'
  },
  {
    key:'living', emoji:'🛋️', name:'Living Room',
    scene:'☀️ Chapter 2: The Afternoon Trap',
    desc:'It\'s 2 PM. Everyone\'s out — at work, at school. But the living room is far from idle. The set-top box displays "no signal" to an empty room. The soundbar hums softly. The smart speaker\'s blue ring glows, listening to... nobody. The TV\'s red standby light? It\'s been ON since last Tuesday\'s cricket match...',
    challenge:'🎯 Challenge: The set-top box alone wastes as much as leaving a light on 24/7. Can you identify all the vampires here?',
    tip:'💡 Fun fact: India\'s 200 million+ set-top boxes waste ₹4,500 crore in electricity every year just on standby! That\'s enough to power a small city.'
  },
  {
    key:'kitchen', emoji:'🍽️', name:'Kitchen',
    scene:'🌙 Chapter 3: The Kitchen After Dark',
    desc:'It\'s 11 PM. Dinner\'s done. The dishes are washed. But the microwave clock faithfully displays "23:00" — it\'s been telling time since 2019, using 3 watts every single second. The water purifier\'s UV light cycles on and off. The induction cooktop\'s display still glows. Even the mixer\'s tiny standby light burns through the night...',
    challenge:'🎯 Challenge: The microwave clock costs ₹180/year just to show the time. Find all the guilty appliances!',
    tip:'💡 Surprise: Your RO water purifier runs mini-purge cycles even at midnight! That\'s 3W × 24 hours = ₹190/year of water nobody\'s drinking.'
  },
  {
    key:'office', emoji:'💼', name:'Home Office',
    scene:'🌃 Chapter 4: The Midnight Hustle',
    desc:'It\'s past midnight. You hit "Shut Down" on your laptop and walk away. But did you really shut everything down? The desktop\'s fans spin to sleep mode. The printer\'s WiFi stays on, waiting for print jobs that won\'t come till Monday. The UPS hums continuously, and the WiFi router? It\'s been running since the day you installed it, 24/7/365...',
    challenge:'🎯 Challenge: Your home office vampires run day AND night. Can you save the most here?',
    tip:'💡 Power move: A ₹200 smart timer on your router + modem can cut 8 hours of overnight use = saving ₹500/year. The timer pays for itself in 5 months!'
  }
];

// ═══════ STORE (localStorage) ═══════
const Store = {
  _key(email, suffix) { return `pw_${email}_${suffix}`; },
  getUsers() { return JSON.parse(localStorage.getItem('pw_users') || '{}'); },
  saveUser(u) {
    const users = this.getUsers();
    users[u.email] = { name: u.name, email: u.email, hash: u.hash };
    localStorage.setItem('pw_users', JSON.stringify(users));
  },
  getDevices(email) { return JSON.parse(localStorage.getItem(this._key(email,'devices')) || '{}'); },
  saveDevices(email, devs) { localStorage.setItem(this._key(email,'devices'), JSON.stringify(devs)); },
  getBills(email) { return JSON.parse(localStorage.getItem(this._key(email,'bills')) || '[]'); },
  saveBills(email, bills) { localStorage.setItem(this._key(email,'bills'), JSON.stringify(bills)); },
  getReminders(email) { return JSON.parse(localStorage.getItem(this._key(email,'reminders')) || '[]'); },
  saveReminders(email, r) { localStorage.setItem(this._key(email,'reminders'), JSON.stringify(r)); },
  getTariff(email) { return parseFloat(localStorage.getItem(this._key(email,'tariff')) || '7'); },
  saveTariff(email, t) { localStorage.setItem(this._key(email,'tariff'), t); },
  hash(s) { let h=0; for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;} return h.toString(36); }
};

// ═══════ ROUTER ═══════
function navigate(hash) { window.location.hash = hash; }

function handleRoute() {
  const hash = window.location.hash || '#/';
  const app = document.getElementById('app');
  destroyCharts();
  if (hash === '#/' || hash === '') { renderLanding(app); }
  else if (hash === '#/dashboard') { if(!currentUser){navigate('#/');return;} renderDashboard(app); }
  else if (hash === '#/devices') { if(!currentUser){navigate('#/');return;} renderDeviceSelector(app); }
  else if (hash === '#/bills') { if(!currentUser){navigate('#/');return;} renderBills(app); }
  else if (hash === '#/reminders') { if(!currentUser){navigate('#/');return;} renderReminders(app); }
  else if (hash === '#/game') { if(!currentUser){navigate('#/');return;} renderGameMode(app); }
  else if (hash === '#/results') { if(!currentUser){navigate('#/');return;} renderResults(app); }
  else { renderLanding(app); }
  updateNavState();
}

window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('pw_current');
  if (savedEmail) {
    const users = Store.getUsers();
    if (users[savedEmail]) {
      currentUser = users[savedEmail];
      selectedDevices = Store.getDevices(savedEmail);
    }
  }
  handleRoute();
  initReminderChecker();
});

function updateNavState() {
  const hash = window.location.hash || '#/';
  const isLoggedIn = !!currentUser;
  const modeToggle = document.getElementById('mode-toggle-wrap');
  const authArea = document.getElementById('nav-auth-area');

  if (isLoggedIn) {
    modeToggle.style.display = 'flex';
    const initial = currentUser.name ? currentUser.name[0].toUpperCase() : '?';
    authArea.innerHTML = `
      <div class="nav-links">
        <a class="nav-link ${hash==='#/dashboard'?'active':''}" href="#/dashboard">Dashboard</a>
        <a class="nav-link ${hash==='#/devices'?'active':''}" href="#/devices">Devices</a>
        <a class="nav-link ${hash==='#/bills'?'active':''}" href="#/bills">Bills</a>
        <a class="nav-link ${hash==='#/reminders'?'active':''}" href="#/reminders">Reminders</a>
      </div>
      <div class="nav-user" onclick="handleLogout()">
        <div class="nav-avatar">${initial}</div>
      </div>`;
  } else {
    modeToggle.style.display = 'none';
    authArea.innerHTML = `
      <button class="nav-btn ghost" onclick="showAuthModal('login')">Log in</button>
      <button class="nav-btn primary" onclick="showAuthModal('signup')">Sign up</button>`;
  }
  // Close explore dropdown on navigation
  closeExploreDropdown();
}

function switchMode(mode) {
  currentMode = mode;
  closeExploreDropdown();
  if (mode === 'game') navigate('#/game');
  else if (mode === 'story') { selectorMode='story'; storyRoomIndex=0; navigate('#/devices'); }
  else navigate('#/dashboard');
}

// ═══════ EXPLORE DROPDOWN ═══════
function toggleExploreDropdown(e) {
  if (e) e.stopPropagation();
  const dd = document.getElementById('explore-dropdown');
  dd.classList.toggle('open');
}
function closeExploreDropdown() {
  const dd = document.getElementById('explore-dropdown');
  if (dd) dd.classList.remove('open');
}
function launchStoryMode() {
  closeExploreDropdown();
  selectorMode = 'story'; storyRoomIndex = 0;
  navigate('#/devices');
}
function launchHomeSim() {
  closeExploreDropdown();
  navigate('#/game');
}
// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('explore-dropdown');
  if (dd && !dd.contains(e.target)) closeExploreDropdown();
});

// ═══════ AUTH ═══════
function showAuthModal(mode) {
  authMode = mode;
  const m = document.getElementById('auth-modal');
  m.style.display = 'flex';
  document.getElementById('auth-error').style.display = 'none';
  if (mode === 'signup') {
    document.getElementById('auth-title').textContent = 'Create your account';
    document.getElementById('auth-subtitle').textContent = 'Start tracking your phantom power waste';
    document.getElementById('signup-name-field').style.display = 'block';
    document.getElementById('auth-submit-btn').textContent = 'Sign up';
    document.getElementById('auth-switch-text').textContent = 'Already have an account?';
    document.getElementById('auth-switch-link').textContent = 'Log in';
  } else {
    document.getElementById('auth-title').textContent = 'Welcome back';
    document.getElementById('auth-subtitle').textContent = 'Log in to access your dashboard';
    document.getElementById('signup-name-field').style.display = 'none';
    document.getElementById('auth-submit-btn').textContent = 'Log in';
    document.getElementById('auth-switch-text').textContent = "Don't have an account?";
    document.getElementById('auth-switch-link').textContent = 'Sign up';
  }
}
function closeAuthModal() { document.getElementById('auth-modal').style.display='none'; }
function toggleAuthMode(e) { e.preventDefault(); showAuthModal(authMode==='login'?'signup':'login'); }

function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');

  if (authMode === 'signup') {
    const name = document.getElementById('auth-name').value.trim();
    if (!name) { errEl.textContent='Please enter your name.'; errEl.style.display='block'; return; }
    const users = Store.getUsers();
    if (users[email]) { errEl.textContent='Account already exists. Try logging in.'; errEl.style.display='block'; return; }
    const user = { name, email, hash: Store.hash(password) };
    Store.saveUser(user);
    Store.saveReminders(email, getDefaultReminders());
    currentUser = user;
  } else {
    const users = Store.getUsers();
    const user = users[email];
    if (!user || user.hash !== Store.hash(password)) { errEl.textContent='Invalid email or password.'; errEl.style.display='block'; return; }
    currentUser = user;
  }
  localStorage.setItem('pw_current', email);
  selectedDevices = Store.getDevices(email);
  closeAuthModal();
  navigate('#/dashboard');
  showToast(`Welcome${currentUser.name ? ', '+currentUser.name : ''}! 🎉`);
}

function loginAsGuest() {
  currentUser = { name: 'Guest', email: 'guest@phantom.local', hash: '' };
  localStorage.setItem('pw_current', currentUser.email);
  selectedDevices = Store.getDevices(currentUser.email);
  closeAuthModal();
  navigate('#/dashboard');
  showToast('Logged in as Guest 👋');
}

function handleLogout() {
  currentUser = null;
  selectedDevices = {};
  localStorage.removeItem('pw_current');
  navigate('#/');
  showToast('Logged out successfully');
}

function getDefaultReminders() {
  return [
    {id:'r1',title:'Bedtime Power Check',desc:'Turn off TV standby, router, and set-top box before sleeping',time:'23:00',enabled:true,icon:'🌙'},
    {id:'r2',title:'Morning Charger Reminder',desc:'Unplug phone and laptop chargers after charging',time:'08:00',enabled:true,icon:'🔌'},
    {id:'r3',title:'Leaving Home Check',desc:'Make sure all standby devices are switched off',time:'09:30',enabled:false,icon:'🚪'}
  ];
}

// ═══════ TOAST ═══════
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display='none'; }, 3000);
}

function destroyCharts() {
  Object.values(chartInstances).forEach(c => { if(c) c.destroy(); });
  chartInstances = {};
}

// ═══════ HELPERS ═══════
function getTariff() {
  return currentUser ? Store.getTariff(currentUser.email) : 7;
}
function getAllDevicesFlat() {
  const arr = [];
  Object.entries(DEVICES).forEach(([cat, devs]) => devs.forEach(d => arr.push({...d, category: cat})));
  return arr;
}
function calcKwh(watts) { return (watts * HOURS_YEAR) / 1000; }
function calcCost(watts, tariff) { return calcKwh(watts) * tariff; }
function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }

function saveCurrentDevices() {
  if (currentUser) Store.saveDevices(currentUser.email, selectedDevices);
}

// ═══════════════════════════════════════════════════
// VIEW RENDERERS
// ═══════════════════════════════════════════════════

// ═══════ LANDING PAGE ═══════
function renderLanding(app) {
  app.innerHTML = `
    <div class="landing">
      <div class="hero-bg">
        <div class="orb orb-1"></div><div class="orb orb-2"></div><div class="grid-bg"></div>
      </div>
      <div class="landing-content">
        <div class="hero-tag">GREEN ENERGY INITIATIVE</div>
        <h1>Your Devices Are <span class="accent-glow">Silently</span> Draining Your Wallet</h1>
        <p class="subtitle">Indian households waste <strong>₹1,500 – ₹3,000 every year</strong> on phantom power — electricity consumed by devices plugged in but not in use. That's <strong>₹20,000 crore</strong> nationally.</p>
        <div class="stat-pills">
          <div class="stat-pill"><span class="stat-num">5-10%</span><span class="stat-lbl">of your bill is phantom power</span></div>
          <div class="stat-pill"><span class="stat-num">30B+</span><span class="stat-lbl">units wasted in India yearly</span></div>
          <div class="stat-pill"><span class="stat-num">24/7</span><span class="stat-lbl">devices drain even when "off"</span></div>
        </div>
        <div class="landing-actions">
          <button class="cta-button" onclick="showAuthModal('signup')"><span>Get Started Free</span></button>
          <button class="cta-button secondary" onclick="loginAsGuest()"><span>Try as Guest →</span></button>
        </div>
      </div>
    </div>`;
}

// ═══════ DASHBOARD ═══════
function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { text: 'Burning the midnight oil', emoji: '🌙', sub: 'Late night = more phantom drain in the dark' };
  if (h < 12) return { text: 'Good morning', emoji: '☀️', sub: 'Start fresh — check what drained overnight' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️', sub: 'Devices left on while you\'re away add up fast' };
  if (h < 21) return { text: 'Good evening', emoji: '🌇', sub: 'Wind-down time — how much leaked today?' };
  return { text: 'Good night', emoji: '🌙', sub: 'Perfect time to unplug before bed!' };
}

function renderDashboard(app) {
  currentMode = 'dashboard';
  const tariff = getTariff();
  const devs = Object.values(selectedDevices);
  const totalW = devs.reduce((s,d) => s + d.watts * d.qty, 0);
  const kwhY = calcKwh(totalW);
  const costY = kwhY * tariff;
  const co2Y = kwhY * CO2_FACTOR;
  const bills = currentUser ? Store.getBills(currentUser.email) : [];
  const grade = getGrade(totalW);
  const greet = getTimeGreeting();
  const userName = currentUser?.name || 'Guest';

  // Gauge calculations
  const gaugeRadius = 54;
  const gaugeCircum = 2 * Math.PI * gaugeRadius;
  const gradeScores = {'A+':100,'A':85,'B':70,'C':50,'D':30,'F':10};
  const scoreVal = gradeScores[grade.letter] || 50;
  const gaugeDash = (scoreVal / 100) * gaugeCircum * 0.75; // 270 degree arc
  const gaugeGap = gaugeCircum - gaugeDash;

  // Live ticker: cost per second
  const costPerSec = costY / (365.25 * 24 * 3600);
  const costPerMin = costPerSec * 60;
  const costPerHr = costPerSec * 3600;

  app.innerHTML = `
    <div class="page-view"><div class="section-container">

      <!-- Hero Greeting -->
      <div class="dash-hero">
        <div class="dash-hero-left">
          <div class="section-tag">DASHBOARD</div>
          <h2 class="page-title">${greet.emoji} ${greet.text}, ${userName}!</h2>
          <p class="page-desc">${greet.sub}</p>
        </div>
        <div class="dash-hero-gauge">
          <svg viewBox="0 0 128 128" class="gauge-svg">
            <circle cx="64" cy="64" r="${gaugeRadius}" fill="none" stroke="var(--bg-2)" stroke-width="10" stroke-dasharray="${gaugeCircum * 0.75} ${gaugeCircum * 0.25}" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(135 64 64)"/>
            <circle cx="64" cy="64" r="${gaugeRadius}" fill="none" stroke="${grade.color}" stroke-width="10" stroke-dasharray="${gaugeDash} ${gaugeGap}" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(135 64 64)" class="gauge-fill"/>
          </svg>
          <div class="gauge-center">
            <div class="gauge-letter" style="color:${grade.color}">${grade.letter}</div>
            <div class="gauge-label">Energy Score</div>
          </div>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="dash-grid">
        <div class="dash-stat highlight">
          <div class="dash-stat-icon">💸</div>
          <div class="dash-stat-value">₹${fmt(costY)}</div>
          <div class="dash-stat-label">Annual Phantom Waste</div>
          <div class="dash-stat-sub">₹${fmt(costY/12)}/month · ₹${Math.round(costY/365)}/day</div>
        </div>
        <div class="dash-stat">
          <div class="dash-stat-icon">⚡</div>
          <div class="dash-stat-value">${kwhY.toFixed(1)} <span style="font-size:.7em;font-weight:500">kWh</span></div>
          <div class="dash-stat-label">Energy Wasted / Year</div>
          <div class="dash-stat-sub">${totalW.toFixed(1)}W total standby draw</div>
        </div>
        <div class="dash-stat">
          <div class="dash-stat-icon">🌍</div>
          <div class="dash-stat-value">${co2Y.toFixed(1)} <span style="font-size:.7em;font-weight:500">kg</span></div>
          <div class="dash-stat-label">CO₂ Footprint / Year</div>
          <div class="dash-stat-sub">≈ ${Math.ceil(co2Y/22)} trees needed to offset</div>
        </div>
        <div class="dash-stat">
          <div class="dash-stat-icon">⏱️</div>
          <div class="dash-stat-value">${devs.length}</div>
          <div class="dash-stat-label">Tracked Devices</div>
          <div class="dash-stat-sub">${devs.length > 0 ? 'Drawing power 24/7' : 'No devices yet — add some!'}</div>
        </div>
      </div>

      <!-- Live Ticker -->
      ${devs.length > 0 ? `
      <div class="dash-ticker">
        <div class="ticker-pulse"></div>
        <div class="ticker-content">
          <span class="ticker-label">⚡ Right now, your standby devices are wasting</span>
          <span class="ticker-amount">₹${costPerHr.toFixed(2)}/hour</span>
          <span class="ticker-sub">· ₹${costPerMin.toFixed(3)}/min · ${totalW.toFixed(1)}W continuous draw</span>
        </div>
      </div>` : ''}

      <!-- Featured Mode Cards -->
      <div class="dash-feature-cards">
        <div class="card dash-feature-card story-card" onclick="launchStoryMode()">
          <div class="feature-card-badge">INTERACTIVE</div>
          <div class="feature-card-icon">📖</div>
          <h3>Story Mode</h3>
          <p>Walk through your home room by room. Discover hidden energy vampires through an immersive narrative journey.</p>
          <div class="feature-card-action">Start Your Story <span>→</span></div>
        </div>
        <div class="card dash-feature-card game-card" onclick="launchHomeSim()">
          <div class="feature-card-badge">SIMULATION</div>
          <div class="feature-card-icon">🏠</div>
          <h3>Home Simulator</h3>
          <p>See a virtual home with all devices. Toggle them ON/OFF to watch your savings change in real-time.</p>
          <div class="feature-card-action">Launch Simulator <span>→</span></div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="dash-row">
        <div class="card"><h3>📊 Monthly Bill Trend</h3><div class="chart-wrap"><canvas id="dash-trend-chart"></canvas></div>
          ${bills.length === 0 ? '<p style="color:var(--text-3);font-size:.82rem;margin-top:8px;">No bills added yet. <a href="#/bills" style="color:var(--green)">Add your first bill →</a></p>' : ''}
        </div>
        <div class="card"><h3>🧛 Top Energy Vampires</h3><div class="chart-wrap"><canvas id="dash-vampires-chart"></canvas></div>
          ${devs.length === 0 ? '<p style="color:var(--text-3);font-size:.82rem;margin-top:8px;">No devices selected. <a href="#/devices" style="color:var(--green)">Add devices →</a></p>' : ''}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card" style="margin-bottom:20px">
        <h3>⚡ Quick Actions</h3>
        <div class="quick-actions">
          <button class="quick-action" onclick="navigate('#/devices')">➕ Manage Devices</button>
          <button class="quick-action" onclick="navigate('#/bills')">📄 Track Bills</button>
          <button class="quick-action" onclick="navigate('#/reminders')">🔔 Set Reminders</button>
          ${devs.length > 0 ? '<button class="quick-action" onclick="navigate(\'#/results\')">📊 Full Report</button>' : ''}
        </div>
      </div>

      ${devs.length > 0 ? renderInsightsHTML(devs, tariff, kwhY, costY, co2Y) : ''}
    </div></div>`;

  // Render charts after DOM is ready
  setTimeout(() => {
    if (bills.length > 0) renderBillTrendChart('dash-trend-chart', bills);
    if (devs.length > 0) renderVampiresChart('dash-vampires-chart', devs, tariff);
  }, 50);
}

function getGrade(w) {
  if (w <= 10) return {letter:'A+',color:'#00ff88',emoji:'🏆',msg:'Excellent!'};
  if (w <= 20) return {letter:'A',color:'#00ff88',emoji:'⭐',msg:'Great job!'};
  if (w <= 35) return {letter:'B',color:'#88ff00',emoji:'👍',msg:'Room to improve'};
  if (w <= 55) return {letter:'C',color:'#ffaa00',emoji:'⚠️',msg:'Average load'};
  if (w <= 80) return {letter:'D',color:'#ff6644',emoji:'😟',msg:'High waste!'};
  return {letter:'F',color:'#ff4d6a',emoji:'🚨',msg:'Critical!'};
}

function renderInsightsHTML(devs, tariff, kwhY, costY, co2Y) {
  const sorted = [...devs].sort((a,b) => (b.watts*b.qty) - (a.watts*a.qty));
  const insights = [];
  if (sorted.length > 0) {
    const top = sorted[0];
    const topC = calcCost(top.watts*top.qty, tariff);
    insights.push({icon:'🏆',title:`#1 Vampire: ${top.name}`,desc:`${top.tip}. Wastes ₹${fmt(topC)}/yr.`,sav:`Save ₹${fmt(topC)}/yr`});
  }
  const nightSav = (sorted.reduce((s,d)=>s+d.watts*d.qty,0)*8*365/1000)*tariff;
  insights.push({icon:'🌙',title:'Night-Time Strategy',desc:`Unplugging for 8hr sleep saves ₹${fmt(nightSav)}/yr.`,sav:`Save ₹${fmt(nightSav)}/yr`});
  insights.push({icon:'🌍',title:'Your CO₂ Footprint',desc:`${co2Y.toFixed(1)} kg CO₂/year from phantom power alone.`,sav:`${co2Y.toFixed(1)} kg reducible`});
  if (devs.length >= 3) {
    const roi = Math.ceil(800 / ((costY * 0.7) / 12));
    insights.push({icon:'🔌',title:'Get Smart Power Strips',desc:`Cuts phantom load for ${devs.length} devices. Pays for itself in ${roi} months.`,sav:`ROI in ${roi}mo`});
  }
  return `<div class="card"><h3>🧠 Smart Insights <span style="float:right;font-size:.68rem;padding:3px 10px;background:linear-gradient(135deg,rgba(0,212,255,.1),rgba(0,255,136,.1));border:1px solid rgba(0,212,255,.2);border-radius:100px;color:var(--accent2)">AI-Powered</span></h3>
    ${insights.map(i => `<div class="insight-item"><span class="insight-icon">${i.icon}</span><div><div class="insight-title">${i.title}</div><div class="insight-desc">${i.desc}</div><span class="insight-savings">${i.sav}</span></div></div>`).join('')}
  </div>`;
}

// ═══════ DEVICE SELECTOR ═══════
function renderDeviceSelector(app) {
  if (selectorMode === 'story') { renderStoryMode(app); return; }
  renderSimpleSelector(app);
}

function renderSimpleSelector(app) {
  const tariff = getTariff();
  const cats = ['All', ...Object.keys(DEVICES)];
  const activeCat = window._activeCat || 'All';
  let devList = [];
  if (activeCat === 'All') {
    Object.entries(DEVICES).forEach(([cat,ds]) => ds.forEach(d => devList.push({...d,category:cat})));
  } else {
    devList = DEVICES[activeCat].map(d => ({...d, category: activeCat}));
  }

  const count = Object.keys(selectedDevices).length;
  const totalW = Object.values(selectedDevices).reduce((s,d) => s+d.watts*d.qty, 0);

  app.innerHTML = `
    <div class="page-view"><div class="section-container">
      <div class="section-tag">SELECT DEVICES</div>
      <h2 class="page-title">What's Plugged In at Home?</h2>
      <p class="page-desc">Choose the devices you keep plugged in. Real standby data from energy studies.</p>

      <div class="selector-mode-toggle">
        <button class="sel-mode-btn active" onclick="setSelectorMode('simple')">📋 Simple Mode</button>
        <button class="sel-mode-btn" onclick="setSelectorMode('story')">🏠 Story Mode</button>
      </div>

      <div class="tariff-bar">
        <span style="font-weight:600;font-size:.88rem">⚡ Electricity Tariff</span>
        <div class="tariff-ctrl"><span>₹</span><input type="number" id="tariff-inp" value="${tariff}" min="1" max="20" step="0.5" onchange="saveTariffVal(this.value)"><span>/kWh</span></div>
        <span style="font-size:.72rem;color:var(--text-3)">₹5–₹9/kWh avg</span>
      </div>

      <div class="cat-tabs">${cats.map(c => `<button class="cat-tab ${c===activeCat?'active':''}" onclick="selectCat('${c}')">${c}</button>`).join('')}</div>
      <div class="dev-grid">${devList.map(d => renderDeviceCard(d)).join('')}</div>

      <h3 style="font-size:.92rem;color:var(--text-2);margin-bottom:12px">➕ Add Custom Device</h3>
      <div class="custom-form">
        <input type="text" id="cust-name" placeholder="Device name" maxlength="30">
        <input type="number" id="cust-watts" placeholder="Standby watts" min="0.1" max="100" step="0.1">
        <button onclick="addCustomDev()">Add</button>
      </div>

      ${count > 0 ? `
        <div class="sel-summary">
          <div class="sel-text"><span>${count}</span> devices — <span>${totalW.toFixed(1)}W</span> standby</div>
          <button class="cta-button sm" onclick="navigate('#/results')">View Full Report →</button>
        </div>` : ''}
    </div></div>`;
}

function setSelectorMode(mode) {
  selectorMode = mode;
  if (mode === 'story') storyRoomIndex = 0;
  renderDeviceSelector(document.getElementById('app'));
}

// ═══════ STORY MODE ═══════
function renderStoryMode(app) {
  const tariff = getTariff();
  const room = STORY_ROOMS[storyRoomIndex];
  const allDevs = getAllDevicesFlat();
  const roomDevs = allDevs.filter(d => d.room === room.key);
  const count = Object.keys(selectedDevices).length;
  const totalW = Object.values(selectedDevices).reduce((s,d) => s+d.watts*d.qty, 0);
  const progress = ((storyRoomIndex + 1) / STORY_ROOMS.length) * 100;

  app.innerHTML = `
    <div class="page-view"><div class="section-container">
      <div class="story-layout">
        <div class="story-main-col">
          <div class="section-tag">STORY MODE</div>
          <h2 class="page-title">Walk Through Your Home 🏡</h2>
          <p class="page-desc">Room by room, discover what's draining your energy (and wallet).</p>

          <div class="selector-mode-toggle">
            <button class="sel-mode-btn" onclick="setSelectorMode('simple')">📋 Simple Mode</button>
            <button class="sel-mode-btn active" onclick="setSelectorMode('story')">🏠 Story Mode</button>
          </div>

          <div class="tariff-bar">
            <span style="font-weight:600;font-size:.88rem">⚡ Electricity Tariff</span>
            <div class="tariff-ctrl"><span>₹</span><input type="number" id="tariff-inp" value="${tariff}" min="1" max="20" step="0.5" onchange="saveTariffVal(this.value)"><span>/kWh</span></div>
            <span style="font-size:.72rem;color:var(--text-3)">₹5–₹9/kWh avg</span>
          </div>

          <div class="story-container">
            <div class="story-room-card">
              <div class="story-scene-title">${room.scene}</div>
              <div class="story-room-header">
                <span class="story-room-emoji">${room.emoji}</span>
                <span class="story-room-name">${room.name}</span>
              </div>
              <p class="story-room-desc">${room.desc}</p>

              <div class="story-challenge">${room.challenge}</div>

              <p style="font-size:.82rem;font-weight:600;color:var(--text-2);margin-bottom:10px">Tap the devices you keep plugged in:</p>
              <div class="story-devices">
                ${roomDevs.map(d => {
                  const sel = !!selectedDevices[d.id];
                  return `<div class="story-dev ${sel?'selected':''}" onclick="toggleStoryDev('${d.id}','${d.category}')">
                    <span class="sd-emoji">${d.emoji}</span>
                    <div class="sd-name">${d.name}</div>
                    <div class="sd-watts">${d.watts}W standby</div>
                  </div>`;
                }).join('')}
              </div>

              <div class="story-tip">${room.tip}</div>

              <div class="story-nav">
                <button class="cta-button secondary sm" onclick="storyPrev()" ${storyRoomIndex === 0 ? 'disabled style="opacity:.4;pointer-events:none"' : ''}>← Back</button>
                <div class="story-progress">
                  <div class="story-progress-bar"><div class="story-progress-fill" style="width:${progress}%"></div></div>
                  <div class="story-progress-text">Room ${storyRoomIndex+1} of ${STORY_ROOMS.length}</div>
                </div>
                ${storyRoomIndex < STORY_ROOMS.length - 1
                  ? `<button class="cta-button sm" onclick="storyNext()">Next Room →</button>`
                  : `<button class="cta-button sm" onclick="navigate('#/results')">See Results 🎉</button>`
                }
              </div>
            </div>

            ${count > 0 ? `
              <div class="sel-summary">
                <div class="sel-text"><span>${count}</span> devices selected — <span>${totalW.toFixed(1)}W</span> total standby</div>
                <button class="cta-button sm" onclick="navigate('#/results')">View Full Report →</button>
              </div>` : ''}
          </div>
        </div>

        <div class="story-side-panel">
          <div class="card side-mode-switcher">
            <h4>⚡ Switch Mode</h4>
            <div class="side-mode-buttons">
              <button class="side-mode-btn active" disabled>
                <span class="smb-icon">📖</span>
                <span class="smb-text">Story Mode</span>
                <span class="smb-badge">Active</span>
              </button>
              <button class="side-mode-btn game-accent" onclick="switchMode('game')">
                <span class="smb-icon">🏠</span>
                <span class="smb-text">Home Sim</span>
                <span class="smb-arrow">→</span>
              </button>
              <button class="side-mode-btn" onclick="navigate('#/dashboard')">
                <span class="smb-icon">📊</span>
                <span class="smb-text">Dashboard</span>
                <span class="smb-arrow">→</span>
              </button>
            </div>
          </div>

          <div class="card side-stats-mini">
            <h4>📋 Selection Summary</h4>
            <div class="side-stat-row">
              <span class="side-stat-label">Devices</span>
              <span class="side-stat-value">${count}</span>
            </div>
            <div class="side-stat-row">
              <span class="side-stat-label">Standby</span>
              <span class="side-stat-value">${totalW.toFixed(1)}W</span>
            </div>
            <div class="side-stat-row">
              <span class="side-stat-label">Est. Cost/yr</span>
              <span class="side-stat-value accent">₹${fmt(calcCost(totalW, tariff))}</span>
            </div>
          </div>

          <div class="card side-room-nav">
            <h4>🗺️ Room Progress</h4>
            <div class="side-room-list">
              ${STORY_ROOMS.map((r, i) => `
                <button class="side-room-item ${i === storyRoomIndex ? 'current' : i < storyRoomIndex ? 'visited' : ''}" onclick="storyRoomIndex=${i};renderStoryMode(document.getElementById('app'))">
                  <span class="sri-emoji">${r.emoji}</span>
                  <span class="sri-name">${r.name}</span>
                  ${i < storyRoomIndex ? '<span class="sri-check">✓</span>' : i === storyRoomIndex ? '<span class="sri-dot"></span>' : ''}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div></div>`;
}

function toggleStoryDev(id, category) {
  if (selectedDevices[id]) { delete selectedDevices[id]; }
  else {
    let dev = null;
    Object.entries(DEVICES).forEach(([cat,ds]) => { const f = ds.find(d=>d.id===id); if(f) dev = {...f, category: cat}; });
    if (dev) selectedDevices[id] = {...dev, qty: 1};
  }
  saveCurrentDevices();
  renderStoryMode(document.getElementById('app'));
}

function storyNext() { if(storyRoomIndex < STORY_ROOMS.length-1){storyRoomIndex++;renderStoryMode(document.getElementById('app'));} }
function storyPrev() { if(storyRoomIndex > 0){storyRoomIndex--;renderStoryMode(document.getElementById('app'));} }

function renderDeviceCard(d) {
  const sel = selectedDevices[d.id];
  const isOn = !!sel;
  const qty = sel ? sel.qty : 1;
  return `<div class="dev-card ${isOn?'selected':''}" onclick="toggleDev('${d.id}','${d.category}',event)">
    <span class="dev-emoji">${d.emoji}</span><div class="dev-name">${d.name}</div><div class="dev-watts">Standby: <span>${d.watts}W</span></div>
    ${isOn ? `<div class="qty-ctrl"><button class="qty-btn" onclick="chgQty('${d.id}',-1,event)">−</button><span class="qty-val">${qty}</span><button class="qty-btn" onclick="chgQty('${d.id}',1,event)">+</button></div>` : ''}
  </div>`;
}

function selectCat(cat) { window._activeCat = cat; renderDeviceSelector(document.getElementById('app')); }
function saveTariffVal(v) { if(currentUser) Store.saveTariff(currentUser.email, v); }

function toggleDev(id, category, e) {
  if (e.target.classList.contains('qty-btn')) return;
  if (selectedDevices[id]) { delete selectedDevices[id]; }
  else {
    let dev = null;
    Object.entries(DEVICES).forEach(([cat,ds]) => { const f = ds.find(d=>d.id===id); if(f) dev = {...f, category: cat}; });
    if (dev) selectedDevices[id] = {...dev, qty: 1};
  }
  saveCurrentDevices();
  renderDeviceSelector(document.getElementById('app'));
}

function chgQty(id, delta, e) {
  e.stopPropagation();
  if (!selectedDevices[id]) return;
  const nq = selectedDevices[id].qty + delta;
  if (nq < 1) delete selectedDevices[id]; else if (nq <= 20) selectedDevices[id].qty = nq;
  saveCurrentDevices();
  renderDeviceSelector(document.getElementById('app'));
}

function addCustomDev() {
  const name = document.getElementById('cust-name').value.trim();
  const watts = parseFloat(document.getElementById('cust-watts').value);
  if (!name || !watts || watts <= 0) return;
  const id = 'custom_' + Date.now();
  selectedDevices[id] = {id, name, emoji:'🔧', watts, category:'Custom', qty:1, tip:'Unplug when not in use', room:'living'};
  saveCurrentDevices();
  renderDeviceSelector(document.getElementById('app'));
}

// ═══════ RESULTS ═══════
function renderResults(app) {
  const tariff = getTariff();
  const devs = Object.values(selectedDevices);
  if (devs.length === 0) { navigate('#/devices'); return; }
  const totalW = devs.reduce((s,d)=>s+d.watts*d.qty,0);
  const kwhY = calcKwh(totalW);
  const costY = kwhY * tariff;
  const co2Y = kwhY * CO2_FACTOR;
  const grade = getGrade(totalW);
  const phones = Math.round(kwhY / 0.012);

  // Equivalencies
  const equivs = [
    {e:'🌳',v:Math.ceil(co2Y/22),l:'Trees to offset'},
    {e:'🚗',v:Math.round(co2Y/0.21),l:'Km car emissions'},
    {e:'💡',v:Math.round(kwhY/(0.01*8*365)),l:'LED bulbs 8hr/day'},
    {e:'☕',v:Math.round(costY/30),l:'Cups of chai'},
    {e:'📱',v:phones,l:'Phone charges'},
    {e:'🍕',v:Math.round(costY/200),l:'Pizzas instead'}
  ];

  // Action plan
  const sorted = [...devs].sort((a,b)=>(b.watts*b.qty)-(a.watts*a.qty));
  const actions = [];
  let potSav = 0;
  sorted.slice(0,3).forEach(d => { const s=calcCost(d.watts*d.qty,tariff); potSav+=s*0.9; actions.push(`<strong>Unplug ${d.name}${d.qty>1?' (×'+d.qty+')':''}</strong> — saves ₹${fmt(s)}/yr. ${d.tip}`); });
  actions.push('<strong>Use power strips with switch</strong> — one flip cuts multiple devices.','<strong>Nightly routine</strong> — turn off strip before bed.','<strong>Enable eco/deep-off modes</strong> on TVs and consoles.');
  potSav += sorted.slice(3).reduce((s,d)=>s+calcCost(d.watts*d.qty,tariff),0)*0.7;

  // 5yr projection
  let total5=0;
  const yrs = []; for(let i=1;i<=5;i++){const c=costY*Math.pow(1.05,i-1);total5+=c;yrs.push({y:i,c});}
  const maxC = yrs[4].c;

  app.innerHTML = `
    <div class="page-view"><div class="section-container">
      <div class="section-tag">YOUR RESULTS</div>
      <h2 class="page-title">Phantom Power <span class="accent">Impact Report</span></h2>

      <div class="score-card card"><div class="score-circle"><span class="score-grade" style="color:${grade.color}">${grade.letter}</span></div><div class="score-info"><h3>Energy Score</h3><p>${grade.msg}</p></div></div>

      <div class="cost-grid">
        <div class="card cost-card primary"><div class="cost-icon">💸</div><div class="cost-value">₹${fmt(costY)}</div><div class="cost-label">Wasted / Year</div><div class="cost-sub">₹${fmt(costY/12)}/month</div></div>
        <div class="card cost-card"><div class="cost-icon">⚡</div><div class="cost-value">${kwhY.toFixed(1)}</div><div class="cost-label">kWh / Year</div><div class="cost-sub">${totalW.toFixed(1)}W draw</div></div>
        <div class="card cost-card"><div class="cost-icon">🌍</div><div class="cost-value">${co2Y.toFixed(1)} kg</div><div class="cost-label">CO₂ / Year</div><div class="cost-sub">≈ ${Math.ceil(co2Y/22)} trees</div></div>
        <div class="card cost-card"><div class="cost-icon">📱</div><div class="cost-value">${fmt(phones)}</div><div class="cost-label">Phone Charges</div><div class="cost-sub">of wasted energy</div></div>
      </div>

      <div class="card" style="margin-bottom:20px"><h3>💰 5-Year Projection</h3>
        <div class="proj-items">${yrs.map((y,i)=>`<div class="proj-year"><div class="proj-bar" style="height:${(y.c/maxC)*160}px" data-value="₹${fmt(y.c)}"></div><div class="proj-lbl">Yr ${y.y}</div></div>`).join('')}</div>
        <p style="font-size:.85rem;color:var(--text-2);text-align:center;border-top:1px solid var(--glass-border);padding-top:10px">5-year total: <strong style="color:var(--danger)">₹${fmt(total5)}</strong> (5% yearly tariff increase)</p>
      </div>

      <div class="charts-row">
        <div class="card"><h3>By Category</h3><div class="chart-wrap"><canvas id="res-cat-chart"></canvas></div></div>
        <div class="card"><h3>Top Vampires</h3><div class="chart-wrap"><canvas id="res-vamp-chart"></canvas></div></div>
      </div>

      ${renderInsightsHTML(devs, tariff, kwhY, costY, co2Y)}

      <div style="margin-top:20px"><h3 style="font-size:1.05rem;font-weight:700;margin-bottom:14px">🌱 What Your Waste Equals</h3>
        <div class="equiv-grid">${equivs.map(eq=>`<div class="card equiv-card"><span class="equiv-emoji">${eq.e}</span><div class="equiv-val">${fmt(eq.v)}</div><div class="equiv-lbl">${eq.l}</div></div>`).join('')}</div>
      </div>

      <div class="card" style="margin-top:20px"><h3>🎯 Action Plan</h3>
        <div class="action-list">${actions.map((a,i)=>`<div class="action-item"><span class="action-num">${i+1}</span><div class="action-text">${a}</div></div>`).join('')}</div>
        <div class="savings-box">Potential savings: <strong>₹${fmt(potSav)}/yr</strong></div>
      </div>

      <div style="text-align:center;margin-top:24px"><button class="cta-button secondary" onclick="navigate('#/devices')">← Edit Devices</button></div>
    </div></div>`;

  setTimeout(() => {
    renderCatChart('res-cat-chart', devs, tariff);
    renderVampiresChart('res-vamp-chart', devs, tariff);
  }, 50);
}

// ═══════ BILLS ═══════
function renderBills(app) {
  const bills = Store.getBills(currentUser.email);
  const sorted = [...bills].sort((a,b) => new Date(b.date) - new Date(a.date));
  const latest = sorted[0];
  const prev = sorted[1];

  app.innerHTML = `
    <div class="page-view"><div class="section-container">
      <div class="section-tag">BILL TRACKER</div>
      <h2 class="page-title">Electricity Bill Analysis</h2>
      <p class="page-desc">Track your monthly bills and discover usage trends.</p>

      <div class="card bill-form-card">
        <h3>📄 Add New Bill</h3>
        <div class="bill-upload-area" onclick="document.getElementById('bill-file').click()">
          <span class="upload-icon">📸</span>
          <p>Click to upload bill photo (optional)</p>
          <p class="hint">We'll display a preview — enter details manually below</p>
          <input type="file" id="bill-file" accept="image/*" style="display:none" onchange="previewBill(this)">
          <img id="bill-img-preview" class="bill-preview" style="display:none">
        </div>
        <div class="bill-fields">
          <div class="form-group"><label>Month</label><select id="bill-month">${MONTHS.map((m,i)=>`<option value="${i}" ${i===new Date().getMonth()?'selected':''}>${m}</option>`).join('')}</select></div>
          <div class="form-group"><label>Year</label><input type="number" id="bill-year" value="${new Date().getFullYear()}" min="2020" max="2030"></div>
          <div class="form-group"><label>Total Units (kWh)</label><input type="number" id="bill-units" placeholder="e.g. 250" min="0" step="1"></div>
          <div class="form-group"><label>Total Cost (₹)</label><input type="number" id="bill-cost" placeholder="e.g. 1800" min="0" step="1"></div>
        </div>
        <button class="cta-button sm" style="margin-top:16px" onclick="saveBill()">Save Bill</button>
      </div>

      ${latest && prev ? `
      <div class="bill-comparison">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:14px">📊 Month-over-Month Comparison</h3>
        <div class="compare-cards">
          <div class="card compare-card">
            <div class="compare-label">${MONTHS[prev.month]} ${prev.year}</div>
            <div class="compare-value" style="color:var(--text-2)">₹${fmt(prev.cost)}</div>
            <div class="compare-label">${prev.units} kWh</div>
          </div>
          <div class="compare-vs">→</div>
          <div class="card compare-card">
            <div class="compare-label">${MONTHS[latest.month]} ${latest.year}</div>
            <div class="compare-value" style="color:var(--accent)">₹${fmt(latest.cost)}</div>
            <div class="compare-label">${latest.units} kWh</div>
            ${(() => { const diff = ((latest.cost - prev.cost)/prev.cost*100).toFixed(1); const up = diff > 0; return `<div class="compare-badge ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(diff)}% ${up?'increase':'decrease'}</div>`; })()}
          </div>
        </div>
      </div>` : ''}

      ${bills.length > 0 ? `
      <div class="card" style="margin-bottom:20px"><h3>📈 Bill Trend</h3><div class="chart-wrap"><canvas id="bills-trend-chart"></canvas></div></div>
      <div class="card"><h3>🗂️ Bill History</h3>
        <div class="bill-history-list">
          ${sorted.map((b,i) => {
            const prevB = sorted[i+1];
            let arrow = '';
            if (prevB) { const d = b.cost - prevB.cost; arrow = d > 0 ? '<span class="bill-trend-arrow" style="color:var(--danger)">▲</span>' : '<span class="bill-trend-arrow" style="color:var(--accent)">▼</span>'; }
            return `<div class="bill-row"><div class="bill-row-left"><div><div class="bill-month">${MONTHS[b.month]} ${b.year}</div><div class="bill-detail">${b.units} kWh</div></div></div><div class="bill-row-right"><span class="bill-cost">₹${fmt(b.cost)}</span>${arrow}</div></div>`;
          }).join('')}
        </div>
      </div>` : '<div class="card"><p style="color:var(--text-3);text-align:center;padding:24px">No bills added yet. Add your first bill above!</p></div>'}
    </div></div>`;

  if (bills.length > 0) setTimeout(() => renderBillTrendChart('bills-trend-chart', bills), 50);
}

function previewBill(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => { const img = document.getElementById('bill-img-preview'); img.src = e.target.result; img.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  }
}

function saveBill() {
  const month = parseInt(document.getElementById('bill-month').value);
  const year = parseInt(document.getElementById('bill-year').value);
  const units = parseFloat(document.getElementById('bill-units').value);
  const cost = parseFloat(document.getElementById('bill-cost').value);
  if (!units || !cost) { showToast('Please enter units and cost'); return; }
  const bills = Store.getBills(currentUser.email);
  // Remove existing bill for same month/year
  const filtered = bills.filter(b => !(b.month === month && b.year === year));
  filtered.push({ month, year, units, cost, date: new Date(year, month).toISOString() });
  Store.saveBills(currentUser.email, filtered);
  showToast('Bill saved! ✅');
  renderBills(document.getElementById('app'));
}

// ═══════ REMINDERS ═══════
function renderReminders(app) {
  const reminders = Store.getReminders(currentUser.email);

  app.innerHTML = `
    <div class="page-view"><div class="section-container">
      <div class="section-tag">REMINDERS</div>
      <h2 class="page-title">Smart Reminders 🔔</h2>
      <p class="page-desc">Get notified to turn off standby devices and save energy.</p>

      <div class="card" style="margin-bottom:20px">
        <h3>➕ Add Custom Reminder</h3>
        <div class="add-reminder-form">
          <div class="form-group"><label>Title</label><input type="text" id="rem-title" placeholder="e.g. Turn off geyser"></div>
          <div class="form-group"><label>Message</label><input type="text" id="rem-desc" placeholder="e.g. Switch off after shower"></div>
          <div class="form-group"><label>Time</label><input type="time" id="rem-time" value="22:00"></div>
          <button class="cta-button sm" onclick="addReminder()">Add</button>
        </div>
      </div>

      <div class="reminder-cards">
        ${reminders.map(r => `
          <div class="card reminder-card">
            <span class="reminder-icon">${r.icon || '🔔'}</span>
            <div class="reminder-info">
              <div class="reminder-title">${r.title}</div>
              <div class="reminder-desc">${r.desc}</div>
              <div class="reminder-time">⏰ ${r.time}</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${r.enabled?'checked':''} onchange="toggleReminder('${r.id}',this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </div>
        `).join('')}
      </div>

      <div class="card" style="text-align:center">
        <p style="color:var(--text-2);font-size:.85rem;margin-bottom:12px">Enable browser notifications for reminders to work</p>
        <button class="cta-button sm" onclick="requestNotifPermission()">🔔 Enable Notifications</button>
      </div>
    </div></div>`;
}

function addReminder() {
  const title = document.getElementById('rem-title').value.trim();
  const desc = document.getElementById('rem-desc').value.trim();
  const time = document.getElementById('rem-time').value;
  if (!title) { showToast('Enter a title'); return; }
  const reminders = Store.getReminders(currentUser.email);
  reminders.push({ id: 'r_' + Date.now(), title, desc: desc || 'Remember to save energy!', time, enabled: true, icon: '🔔' });
  Store.saveReminders(currentUser.email, reminders);
  showToast('Reminder added! ✅');
  renderReminders(document.getElementById('app'));
}

function toggleReminder(id, checked) {
  const reminders = Store.getReminders(currentUser.email);
  const r = reminders.find(r => r.id === id);
  if (r) r.enabled = checked;
  Store.saveReminders(currentUser.email, reminders);
}

function requestNotifPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(p => {
      showToast(p === 'granted' ? 'Notifications enabled! 🔔' : 'Notifications blocked');
    });
  } else { showToast('Notifications not supported in this browser'); }
}

function initReminderChecker() {
  setInterval(() => {
    if (!currentUser || !('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const reminders = Store.getReminders(currentUser.email);
    reminders.filter(r => r.enabled && r.time === timeStr).forEach(r => {
      new Notification('⚡ PhantomWatt Reminder', { body: `${r.title}: ${r.desc}`, icon: '⚡' });
    });
  }, 60000);
}

// ═══════ GAME MODE ═══════
function renderGameMode(app) {
  currentMode = 'game';
  const tariff = getTariff();
  // Initialize game device states (all ON = wasting by default)
  const rooms = {
    bedroom: { label: '🛏️ Bedroom', devices: [] },
    living:  { label: '🛋️ Living Room', devices: [] },
    kitchen: { label: '🍽️ Kitchen', devices: [] },
    office:  { label: '💼 Home Office', devices: [] }
  };

  const allDevs = getAllDevicesFlat();
  // Pick representative devices per room (max 6 per room)
  const roomPicks = { bedroom: [], living: [], kitchen: [], office: [] };
  allDevs.forEach(d => { if (d.room && roomPicks[d.room] && roomPicks[d.room].length < 6) roomPicks[d.room].push(d); });

  // Init game states
  Object.values(roomPicks).flat().forEach(d => { if (!(d.id in gameDeviceStates)) gameDeviceStates[d.id] = true; }); // true = ON (wasting)

  const allGameDevs = Object.values(roomPicks).flat();
  const onW = allGameDevs.filter(d => gameDeviceStates[d.id]).reduce((s,d) => s + d.watts, 0);
  const offW = allGameDevs.filter(d => !gameDeviceStates[d.id]).reduce((s,d) => s + d.watts, 0);
  const onCount = allGameDevs.filter(d => gameDeviceStates[d.id]).length;
  const offCount = allGameDevs.filter(d => !gameDeviceStates[d.id]).length;
  const liveCost = calcCost(onW, tariff);
  const savedCost = calcCost(offW, tariff);
  const totalDevs = allGameDevs.length;
  const scorePercent = totalDevs > 0 ? Math.round((offCount / totalDevs) * 100) : 0;

  app.innerHTML = `
    <div class="page-view"><div class="section-container">
      <div class="game-container">
        <div class="game-house">
          <div class="room-grid">
            ${Object.entries(roomPicks).map(([key, devs]) => `
              <div class="room">
                <div class="room-label"><span>${rooms[key].label}</span></div>
                <div class="room-devices">
                  ${devs.map(d => `
                    <div class="game-device ${gameDeviceStates[d.id] ? 'on' : 'off'}" onclick="toggleGameDev('${d.id}')" title="${d.name} (${d.watts}W)">
                      <div class="status-dot"></div>
                      <span class="gd-emoji">${d.emoji}</span>
                      <span class="gd-label">${d.name.split(' ')[0]}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="game-sidebar">
          <div class="card side-mode-switcher">
            <h4>⚡ Switch Mode</h4>
            <div class="side-mode-buttons">
              <button class="side-mode-btn active" disabled>
                <span class="smb-icon">🏠</span>
                <span class="smb-text">Home Sim</span>
                <span class="smb-badge">Active</span>
              </button>
              <button class="side-mode-btn story-accent" onclick="selectorMode='story';storyRoomIndex=0;navigate('#/devices')">
                <span class="smb-icon">📖</span>
                <span class="smb-text">Story Mode</span>
                <span class="smb-arrow">→</span>
              </button>
              <button class="side-mode-btn" onclick="navigate('#/dashboard')">
                <span class="smb-icon">📊</span>
                <span class="smb-text">Dashboard</span>
                <span class="smb-arrow">→</span>
              </button>
            </div>
          </div>

          <div class="card game-cost-live">
            <div class="live-label">🔴 Wasting Now</div>
            <div class="live-value">₹${fmt(liveCost)}<span style="font-size:.9rem;font-weight:500">/yr</span></div>
            <div class="live-sub">${onW.toFixed(1)}W from ${onCount} devices</div>
          </div>

          <div class="card game-score">
            <div class="score-label">Your Score</div>
            <div class="score-big" style="color:${scorePercent >= 70 ? 'var(--green)' : scorePercent >= 40 ? 'var(--amber)' : 'var(--terracotta)'}">${scorePercent}%</div>
            <div style="font-size:.72rem;color:var(--text-3);margin-top:4px">${offCount}/${totalDevs} devices turned off</div>
          </div>

          <div class="card" style="text-align:center;padding:16px">
            <div style="font-size:.72rem;font-weight:600;color:var(--green);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">💰 Saved</div>
            <div style="font-size:1.4rem;font-weight:800;color:var(--green)">₹${fmt(savedCost)}<span style="font-size:.8rem;font-weight:500">/yr</span></div>
          </div>

          <div class="card game-legend">
            <h4>Legend</h4>
            <div class="legend-item"><span class="legend-dot on-dot"></span> ON — wasting energy</div>
            <div class="legend-item"><span class="legend-dot off-dot"></span> OFF — saving energy</div>
            <p style="font-size:.72rem;color:var(--text-3);margin-top:8px">Click devices to toggle ON/OFF and see your savings change in real-time!</p>
          </div>

          <div class="card game-devices-list">
            <h4>All Devices</h4>
            ${allGameDevs.sort((a,b) => b.watts - a.watts).map(d => `
              <div class="gdl-item ${gameDeviceStates[d.id] ? 'is-on' : 'is-off'}">
                <div class="gdl-left"><span>${d.emoji}</span> ${d.name.length > 16 ? d.name.substring(0,16)+'…' : d.name}</div>
                <div class="gdl-watts">${d.watts}W ${gameDeviceStates[d.id] ? '🔴' : '🟢'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div></div>`;
}

function toggleGameDev(id) {
  gameDeviceStates[id] = !gameDeviceStates[id];
  renderGameMode(document.getElementById('app'));
}

// ═══════ CHART HELPERS ═══════
function renderBillTrendChart(canvasId, bills) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const sorted = [...bills].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-12);
  chartInstances[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: sorted.map(b => MONTHS[b.month] + ' ' + (b.year+'').slice(2)),
      datasets: [{
        label: '₹ Cost', data: sorted.map(b => b.cost),
        borderColor: '#2d7a4f', backgroundColor: 'rgba(45,122,79,0.08)',
        tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#2d7a4f'
      },{
        label: 'kWh', data: sorted.map(b => b.units),
        borderColor: '#3d7ec7', backgroundColor: 'rgba(61,126,199,0.05)',
        tension: 0.4, fill: false, pointRadius: 3, pointBackgroundColor: '#3d7ec7'
      }]
    },
    options: { responsive:true, maintainAspectRatio:true, plugins:{ legend:{ labels:{ color:'#6b5e4f', font:{family:'Inter',size:11} } } }, scales:{ x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#6b5e4f',font:{family:'Inter'}}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#6b5e4f',font:{family:'Inter'}}} } }
  });
}

function renderVampiresChart(canvasId, devs, tariff) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dc = devs.map(d => ({name:d.name+(d.qty>1?' ×'+d.qty:''), cost:calcCost(d.watts*d.qty,tariff)})).sort((a,b)=>b.cost-a.cost).slice(0,6);
  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: { labels: dc.map(d=>d.name), datasets: [{ data: dc.map(d=>d.cost), backgroundColor: dc.map((_,i)=>`rgba(45,122,79,${1-i*0.12})`), borderRadius:6, barPercentage:0.6 }] },
    options: { indexAxis:'y', responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' ₹'+fmt(c.parsed.x)+'/yr'}}}, scales:{x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#6b5e4f',font:{family:'Inter'},callback:v=>'₹'+v}},y:{grid:{display:false},ticks:{color:'#6b5e4f',font:{family:'Inter',size:10}}}} }
  });
}

function renderCatChart(canvasId, devs, tariff) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const catData = {};
  devs.forEach(d => { const cat=d.category||'Other'; catData[cat]=(catData[cat]||0)+calcCost(d.watts*d.qty,tariff); });
  const labels = Object.keys(catData);
  const values = Object.values(catData);
  const colors = ['#2d7a4f','#3d7ec7','#c45d3e','#c97b2a','#8b6cae','#5a9a6e','#6aada8'];
  chartInstances[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets:[{data:values,backgroundColor:colors.slice(0,labels.length),borderColor:'#ffffff',borderWidth:3,hoverOffset:6}] },
    options: { responsive:true, maintainAspectRatio:true, plugins:{legend:{position:'bottom',labels:{color:'#6b5e4f',font:{family:'Inter',size:11},padding:12}},tooltip:{callbacks:{label:c=>' ₹'+fmt(c.parsed)+'/yr'}}} }
  });
}
