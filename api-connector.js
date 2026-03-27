// ═══════════════════════════════════════════════════
// PhantomWatt — API Connector (Frontend Bridge)
// ═══════════════════════════════════════════════════
//
// HOW TO CONNECT:
// 1. Add this script to index.html:
//    <script src="api-connector.js"></script>
//    (Add it AFTER app.js)
//
// 2. Set USE_BACKEND = true below
//
// 3. Start the backend:
//    node server.js
//
// 4. Refresh the frontend — it will use the backend
//    instead of localStorage for all data.
// ═══════════════════════════════════════════════════

const API_CONFIG = {
  USE_BACKEND: false,  // ← Set to true to enable backend
  BASE_URL: 'http://localhost:5000/api',
};

// ─── Token Storage ───
const TokenStore = {
  get() { return localStorage.getItem('pw_auth_token'); },
  set(token) { localStorage.setItem('pw_auth_token', token); },
  clear() { localStorage.removeItem('pw_auth_token'); },
};

// ─── API Helper ───
async function apiCall(method, endpoint, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = TokenStore.get();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  } catch (err) {
    console.error(`API ${method} ${endpoint}:`, err.message);
    throw err;
  }
}

// ═══════════════════════════════════════════════════
// Override app.js functions when backend is enabled
// ═══════════════════════════════════════════════════

if (API_CONFIG.USE_BACKEND) {
  console.log('⚡ PhantomWatt: Backend mode enabled →', API_CONFIG.BASE_URL);

  // ─── Override: handleAuth (signup/login) ───
  const _originalHandleAuth = window.handleAuth;
  window.handleAuth = async function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');

    try {
      if (authMode === 'signup') {
        const name = document.getElementById('auth-name').value.trim();
        if (!name) { errEl.textContent = 'Please enter your name.'; errEl.style.display = 'block'; return; }
        const data = await apiCall('POST', '/auth/signup', { name, email, password });
        TokenStore.set(data.token);
        currentUser = data.user;
      } else {
        const data = await apiCall('POST', '/auth/login', { email, password });
        TokenStore.set(data.token);
        currentUser = data.user;
      }

      // Load user data from backend
      localStorage.setItem('pw_current', email);
      const devData = await apiCall('GET', '/user/devices');
      selectedDevices = devData.devices || {};

      closeAuthModal();
      navigate('#/dashboard');
      showToast(`Welcome${currentUser.name ? ', ' + currentUser.name : ''}! 🎉`);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
    }
  };

  // ─── Override: handleLogout ───
  const _originalLogout = window.handleLogout;
  window.handleLogout = async function() {
    try { await apiCall('POST', '/auth/logout'); } catch(e) {}
    TokenStore.clear();
    currentUser = null;
    selectedDevices = {};
    localStorage.removeItem('pw_current');
    navigate('#/');
    showToast('Logged out successfully');
  };

  // ─── Override: saveCurrentDevices ───
  const _originalSaveDevices = window.saveCurrentDevices;
  window.saveCurrentDevices = async function() {
    // Save to localStorage as backup
    if (currentUser) Store.saveDevices(currentUser.email, selectedDevices);
    // Also save to backend
    try { await apiCall('PUT', '/user/devices', { devices: selectedDevices }); }
    catch(e) { console.warn('Backend device sync failed:', e.message); }
  };

  // ─── Override: saveBill ───
  const _originalSaveBill = window.saveBill;
  window.saveBill = async function() {
    const month = parseInt(document.getElementById('bill-month').value);
    const year = parseInt(document.getElementById('bill-year').value);
    const units = parseFloat(document.getElementById('bill-units').value);
    const cost = parseFloat(document.getElementById('bill-cost').value);
    if (!units || !cost) { showToast('Please enter units and cost'); return; }

    try {
      const data = await apiCall('POST', '/user/bills', { month, year, units, cost });
      // Also save to localStorage as backup
      Store.saveBills(currentUser.email, data.bills);
      showToast('Bill saved! ✅');
      renderBills(document.getElementById('app'));
    } catch(e) {
      // Fallback to localStorage
      showToast('Saved locally (backend unavailable)');
      _originalSaveBill?.call(window);
    }
  };

  // ─── Override: saveTariffVal ───
  const _originalSaveTariff = window.saveTariffVal;
  window.saveTariffVal = async function(v) {
    if (currentUser) Store.saveTariff(currentUser.email, v);
    try { await apiCall('PUT', '/user/tariff', { tariff: v }); }
    catch(e) { console.warn('Backend tariff sync failed:', e.message); }
  };

  // ─── Override: addReminder ───
  const _originalAddReminder = window.addReminder;
  window.addReminder = async function() {
    const title = document.getElementById('rem-title').value.trim();
    const desc = document.getElementById('rem-desc').value.trim();
    const time = document.getElementById('rem-time').value;
    if (!title) { showToast('Enter a title'); return; }

    const reminders = Store.getReminders(currentUser.email);
    reminders.push({ id: 'r_' + Date.now(), title, desc: desc || 'Remember to save energy!', time, enabled: true, icon: '🔔' });

    try {
      await apiCall('PUT', '/user/reminders', { reminders });
      Store.saveReminders(currentUser.email, reminders);
      showToast('Reminder added! ✅');
      renderReminders(document.getElementById('app'));
    } catch(e) {
      Store.saveReminders(currentUser.email, reminders);
      showToast('Saved locally');
      renderReminders(document.getElementById('app'));
    }
  };

  // ─── Override: toggleReminder ───
  const _originalToggleReminder = window.toggleReminder;
  window.toggleReminder = async function(id, checked) {
    const reminders = Store.getReminders(currentUser.email);
    const r = reminders.find(r => r.id === id);
    if (r) r.enabled = checked;
    Store.saveReminders(currentUser.email, reminders);
    try { await apiCall('PUT', '/user/reminders', { reminders }); }
    catch(e) { console.warn('Backend reminder sync failed'); }
  };

  // ─── Auto-restore session on page load ───
  const _originalDOMReady = document.addEventListener;
  window.addEventListener('load', async () => {
    const token = TokenStore.get();
    if (!token) return;

    try {
      const userData = await apiCall('GET', '/auth/me');
      currentUser = { name: userData.name, email: userData.email };
      localStorage.setItem('pw_current', userData.email);

      // Load all data from backend
      const [devData, billData, remData, tarData] = await Promise.all([
        apiCall('GET', '/user/devices'),
        apiCall('GET', '/user/bills'),
        apiCall('GET', '/user/reminders'),
        apiCall('GET', '/user/tariff'),
      ]);

      selectedDevices = devData.devices || {};
      Store.saveDevices(userData.email, selectedDevices);
      Store.saveBills(userData.email, billData.bills || []);
      Store.saveReminders(userData.email, remData.reminders || []);
      Store.saveTariff(userData.email, tarData.tariff || 7);

      handleRoute();
      console.log('⚡ Session restored from backend for:', userData.email);
    } catch(e) {
      console.warn('Session restore failed, using localStorage:', e.message);
      TokenStore.clear();
    }
  });
}
