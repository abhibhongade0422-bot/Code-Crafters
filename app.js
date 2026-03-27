// ═══════════════════════════════════════════════
// PhantomWatt — Device Database
// Standby power data from Lawrence Berkeley National Lab, IEA, BEE India
// ═══════════════════════════════════════════════

const DEVICE_DATABASE = {
    "Entertainment": [
        { id: "tv_led", name: "LED/LCD TV", emoji: "📺", watts: 5, tip: "Use power strip to fully cut power when not watching" },
        { id: "tv_old", name: "Old CRT TV", emoji: "📺", watts: 8, tip: "Consider upgrading — modern TVs use 60% less standby" },
        { id: "settop", name: "Set-Top Box / DTH", emoji: "📡", watts: 15, tip: "One of top vampires! Unplug when not watching TV" },
        { id: "gaming", name: "Gaming Console", emoji: "🎮", watts: 10, tip: "Disable instant-on mode to save 85% standby power" },
        { id: "soundbar", name: "Soundbar / Speaker", emoji: "🔊", watts: 6, tip: "Turn off via power strip when not in use" },
        { id: "streaming", name: "Streaming Device", emoji: "📱", watts: 3, tip: "Fire Stick, Chromecast — small drain, adds up" },
        { id: "dvd", name: "DVD/Blu-ray Player", emoji: "💿", watts: 4, tip: "Unplug — you probably don't use it daily" },
    ],
    "Kitchen": [
        { id: "microwave", name: "Microwave Oven", emoji: "🍳", watts: 3, tip: "The clock display alone uses ~3W continuously" },
        { id: "oven_electric", name: "Electric Oven/OTG", emoji: "🔥", watts: 2.5, tip: "Unplug after use — the timer circuit draws power" },
        { id: "coffee", name: "Coffee Maker", emoji: "☕", watts: 2, tip: "Unplug after morning coffee" },
        { id: "dishwasher", name: "Dishwasher", emoji: "🍽️", watts: 2, tip: "Turn off at mains after the wash cycle" },
        { id: "water_purifier", name: "Water Purifier (RO)", emoji: "💧", watts: 3, tip: "Common in India, adds up over 24/7 standby" },
        { id: "induction", name: "Induction Cooktop", emoji: "🫕", watts: 1.5, tip: "Low standby but still worth unplugging" },
        { id: "mixer", name: "Mixer/Grinder", emoji: "🥤", watts: 0.5, tip: "Minimal drain but good habit to unplug" },
    ],
    "Office / IT": [
        { id: "desktop", name: "Desktop Computer", emoji: "🖥️", watts: 8, tip: "Shut down fully — sleep mode still draws 3-8W" },
        { id: "monitor", name: "Monitor", emoji: "🖵", watts: 3, tip: "Turn off the monitor switch, not just screen-off" },
        { id: "laptop_charger", name: "Laptop Charger", emoji: "💻", watts: 4.5, tip: "Charger draws power even without laptop connected" },
        { id: "printer", name: "Printer", emoji: "🖨️", watts: 5, tip: "Turn off when not printing — standby is high" },
        { id: "router", name: "WiFi Router", emoji: "📶", watts: 8, tip: "Runs 24/7; consider a smart timer for night off" },
        { id: "modem", name: "Broadband Modem", emoji: "🌐", watts: 6, tip: "Often left on 24/7 — turn off with router at night" },
        { id: "ups", name: "UPS / Inverter", emoji: "🔋", watts: 10, tip: "UPS drain is high — unplug when power is stable" },
    ],
    "Charging / Mobile": [
        { id: "phone_charger", name: "Phone Charger", emoji: "🔌", watts: 0.5, tip: "Tiny per unit but millions plugged in = massive waste" },
        { id: "tablet_charger", name: "Tablet Charger", emoji: "📲", watts: 1, tip: "Unplug after charging — it's just warming up" },
        { id: "smartwatch", name: "Smartwatch Charger", emoji: "⌚", watts: 0.5, tip: "Magnetic charger still draws when watch removed" },
        { id: "power_bank", name: "Power Bank (charging)", emoji: "🪫", watts: 1, tip: "Disconnect once fully charged" },
        { id: "earbuds", name: "TWS Earbuds Case", emoji: "🎧", watts: 0.3, tip: "Tiny drain, but good habit to unplug" },
    ],
    "Home Comfort": [
        { id: "ac", name: "Air Conditioner", emoji: "❄️", watts: 5, tip: "AC standby powers the remote sensor — use mains switch" },
        { id: "geyser", name: "Water Heater/Geyser", emoji: "🚿", watts: 3, tip: "Very common India habit to leave on — huge waste!" },
        { id: "fan_smart", name: "Smart Fan / BLDC", emoji: "🌀", watts: 1, tip: "Modern fans have standby for remote control" },
        { id: "air_purifier", name: "Air Purifier", emoji: "🌬️", watts: 3, tip: "Turn off when air quality is good" },
        { id: "heater", name: "Room Heater", emoji: "🔥", watts: 2, tip: "Unplug during summer months" },
        { id: "iron", name: "Clothes Iron", emoji: "👔", watts: 0.5, tip: "Always unplug — safety + savings" },
    ],
    "Smart Home": [
        { id: "smart_speaker", name: "Smart Speaker", emoji: "🗣️", watts: 3, tip: "Always listening = always drawing power" },
        { id: "smart_display", name: "Smart Display", emoji: "📋", watts: 5, tip: "Screen + mic + speaker = significant standby" },
        { id: "smart_plug", name: "Smart Plug (each)", emoji: "🔌", watts: 1, tip: "Ironic — the energy saver itself uses power" },
        { id: "cctv", name: "CCTV/Security Cam", emoji: "📷", watts: 5, tip: "Runs 24/7 — consider motion-only recording" },
        { id: "doorbell", name: "Smart Doorbell", emoji: "🔔", watts: 2, tip: "Always on by design, hard to reduce" },
    ]
};

const CO2_FACTOR = 0.82;  // kg CO2 per kWh (India grid average)
const HOURS_PER_YEAR = 8760;

// State
let selectedDevices = {};  // { deviceId: { ...device, qty: n } }
let categoryChartInstance = null;
let topWastersChartInstance = null;

// ═══════════════ INITIALIZATION ═══════════════

document.addEventListener('DOMContentLoaded', () => {
    renderCategoryTabs();
    renderDeviceGrid('All');
});

function scrollToSelector() {
    document.getElementById('device-selector').scrollIntoView({ behavior: 'smooth' });
}

// ═══════════════ CATEGORY TABS ═══════════════

function renderCategoryTabs() {
    const tabs = document.getElementById('category-tabs');
    const categories = ['All', ...Object.keys(DEVICE_DATABASE)];
    tabs.innerHTML = categories.map(cat =>
        `<button class="cat-tab ${cat === 'All' ? 'active' : ''}" onclick="switchCategory('${cat}')">${cat}</button>`
    ).join('');
}

function switchCategory(cat) {
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderDeviceGrid(cat);
}

// ═══════════════ DEVICE GRID ═══════════════

function renderDeviceGrid(category) {
    const grid = document.getElementById('device-grid');
    let devices = [];

    if (category === 'All') {
        Object.entries(DEVICE_DATABASE).forEach(([cat, devs]) => {
            devs.forEach(d => devices.push({ ...d, category: cat }));
        });
    } else {
        devices = DEVICE_DATABASE[category].map(d => ({ ...d, category }));
    }

    grid.innerHTML = devices.map(d => {
        const sel = selectedDevices[d.id];
        const qty = sel ? sel.qty : 1;
        const isSelected = !!sel;
        return `
            <div class="device-card ${isSelected ? 'selected' : ''}" id="card-${d.id}" onclick="toggleDevice('${d.id}', '${d.category}', event)">
                <span class="device-emoji">${d.emoji}</span>
                <div class="device-name">${d.name}</div>
                <div class="device-watts">Standby: <span>${d.watts}W</span></div>
                ${isSelected ? `
                    <div class="quantity-control">
                        <button class="qty-btn" onclick="changeQty('${d.id}', -1, event)">−</button>
                        <span class="qty-value">${qty}</span>
                        <button class="qty-btn" onclick="changeQty('${d.id}', 1, event)">+</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function toggleDevice(id, category, e) {
    if (e.target.classList.contains('qty-btn')) return;

    if (selectedDevices[id]) {
        delete selectedDevices[id];
    } else {
        // Find device data
        let device = null;
        Object.values(DEVICE_DATABASE).forEach(devs => {
            const found = devs.find(d => d.id === id);
            if (found) device = { ...found, category };
        });
        if (device) selectedDevices[id] = { ...device, qty: 1 };
    }

    // Re-render current tab
    const activeTab = document.querySelector('.cat-tab.active');
    const currentCat = activeTab ? activeTab.textContent : 'All';
    renderDeviceGrid(currentCat);
    updateSummary();
}

function changeQty(id, delta, e) {
    e.stopPropagation();
    if (!selectedDevices[id]) return;
    const newQty = selectedDevices[id].qty + delta;
    if (newQty < 1) {
        delete selectedDevices[id];
    } else if (newQty <= 20) {
        selectedDevices[id].qty = newQty;
    }

    const activeTab = document.querySelector('.cat-tab.active');
    const currentCat = activeTab ? activeTab.textContent : 'All';
    renderDeviceGrid(currentCat);
    updateSummary();
}

function addCustomDevice() {
    const nameInput = document.getElementById('custom-name');
    const wattInput = document.getElementById('custom-wattage');
    const name = nameInput.value.trim();
    const watts = parseFloat(wattInput.value);

    if (!name || !watts || watts <= 0) return;

    const id = 'custom_' + Date.now();
    selectedDevices[id] = {
        id, name, emoji: '🔧', watts,
        category: 'Custom', qty: 1,
        tip: 'Unplug when not in use to save power'
    };

    nameInput.value = '';
    wattInput.value = '';

    const activeTab = document.querySelector('.cat-tab.active');
    const currentCat = activeTab ? activeTab.textContent : 'All';
    renderDeviceGrid(currentCat);
    updateSummary();
}

function updateSummary() {
    const summary = document.getElementById('selected-summary');
    const count = Object.keys(selectedDevices).length;
    const totalWatts = Object.values(selectedDevices)
        .reduce((s, d) => s + d.watts * d.qty, 0);

    if (count === 0) {
        summary.style.display = 'none';
        return;
    }

    summary.style.display = 'flex';
    document.getElementById('selected-count').textContent = count;
    document.getElementById('total-standby-watts').textContent = totalWatts.toFixed(1);
}

// ═══════════════ CALCULATION ENGINE ═══════════════

function calculateResults() {
    const tariff = parseFloat(document.getElementById('tariff-input').value) || 7;
    const devices = Object.values(selectedDevices);
    if (devices.length === 0) return;

    // Core calculations
    const totalWatts = devices.reduce((s, d) => s + d.watts * d.qty, 0);
    const kwhPerYear = (totalWatts * HOURS_PER_YEAR) / 1000;
    const costPerYear = kwhPerYear * tariff;
    const costPerMonth = costPerYear / 12;
    const co2PerYear = kwhPerYear * CO2_FACTOR;

    // Show results section
    document.getElementById('results-dashboard').style.display = 'block';
    setTimeout(() => {
        document.getElementById('results-dashboard').scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Populate cost cards
    document.getElementById('cost-yearly').textContent = `₹${Math.round(costPerYear).toLocaleString('en-IN')}`;
    document.getElementById('cost-monthly').textContent = `₹${Math.round(costPerMonth).toLocaleString('en-IN')}/month`;
    document.getElementById('kwh-yearly').textContent = `${kwhPerYear.toFixed(1)}`;
    document.getElementById('watts-total').textContent = `${totalWatts.toFixed(1)}W continuous draw`;
    document.getElementById('co2-yearly').textContent = `${co2PerYear.toFixed(1)} kg`;

    // Trees needed to offset (1 tree absorbs ~22 kg CO2/year)
    const treesNeeded = Math.ceil(co2PerYear / 22);
    document.getElementById('co2-equivalent').textContent = `≈ ${treesNeeded} tree${treesNeeded !== 1 ? 's' : ''} needed to offset`;

    // Phone charges (1 full charge ≈ 0.012 kWh)
    const phoneCharges = Math.round(kwhPerYear / 0.012);
    document.getElementById('phone-charges').textContent = phoneCharges.toLocaleString('en-IN');

    // Energy Score
    renderEnergyScore(totalWatts);

    // 5-year projection
    render5YearProjection(costPerYear);

    // Charts
    renderCategoryChart(devices, tariff);
    renderTopWastersChart(devices, tariff);

    // Smart insights
    renderInsights(devices, tariff, kwhPerYear, costPerYear, co2PerYear);

    // Equivalencies
    renderEquivalencies(kwhPerYear, costPerYear, co2PerYear);

    // Action plan
    renderActionPlan(devices, tariff);
}

// ═══════════════ ENERGY SCORE ═══════════════

function renderEnergyScore(totalWatts) {
    let grade, message, color;

    if (totalWatts <= 10) {
        grade = 'A+'; message = 'Excellent! You have minimal phantom load. Keep it up!';
        color = '#00ff88';
    } else if (totalWatts <= 20) {
        grade = 'A'; message = 'Great job! Your phantom load is well below average.';
        color = '#00ff88';
    } else if (totalWatts <= 35) {
        grade = 'B'; message = 'Good, but there\'s room for improvement. Check the tips below.';
        color = '#88ff00';
    } else if (totalWatts <= 55) {
        grade = 'C'; message = 'Average phantom load. Several devices are draining silently.';
        color = '#ffaa00';
    } else if (totalWatts <= 80) {
        grade = 'D'; message = 'High phantom load! You\'re wasting significant energy.';
        color = '#ff6644';
    } else {
        grade = 'F'; message = 'Critical! Your phantom load is very high. Immediate action recommended.';
        color = '#ff4d6a';
    }

    document.getElementById('score-grade').textContent = grade;
    document.getElementById('score-grade').style.color = color;
    document.getElementById('score-message').textContent = message;
}

// ═══════════════ 5-YEAR PROJECTION ═══════════════

function render5YearProjection(costPerYear) {
    const container = document.getElementById('projection-items');
    const inflationRate = 1.05; // 5% annual electricity price increase
    let total = 0;
    const maxHeight = 180;

    let years = [];
    for (let i = 1; i <= 5; i++) {
        const cost = costPerYear * Math.pow(inflationRate, i - 1);
        total += cost;
        years.push({ year: i, cost });
    }

    const maxCost = years[years.length - 1].cost;

    container.innerHTML = years.map((y, idx) => {
        const height = (y.cost / maxCost) * maxHeight;
        return `
            <div class="projection-year" style="animation-delay: ${idx * 0.15}s">
                <div class="projection-bar" style="height: ${height}px" data-value="₹${Math.round(y.cost).toLocaleString('en-IN')}"></div>
                <div class="projection-year-label">Year ${y.year}</div>
            </div>
        `;
    }).join('');

    document.getElementById('projection-total').innerHTML =
        `Total phantom power waste over 5 years: <strong>₹${Math.round(total).toLocaleString('en-IN')}</strong> (assuming 5% annual tariff increase)`;
}

// ═══════════════ CHARTS ═══════════════

function renderCategoryChart(devices, tariff) {
    const catData = {};
    devices.forEach(d => {
        const cat = d.category || 'Other';
        const kwh = (d.watts * d.qty * HOURS_PER_YEAR) / 1000;
        const cost = kwh * tariff;
        catData[cat] = (catData[cat] || 0) + cost;
    });

    const labels = Object.keys(catData);
    const values = Object.values(catData);
    const colors = ['#00ff88', '#00d4ff', '#ff4d6a', '#ffaa00', '#a855f7', '#f97316', '#06b6d4'];

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(document.getElementById('category-chart'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'rgba(6, 11, 26, 0.8)',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#8892a8', font: { family: 'Inter', size: 12 }, padding: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ₹${Math.round(ctx.parsed).toLocaleString('en-IN')}/year`
                    }
                }
            }
        }
    });
}

function renderTopWastersChart(devices, tariff) {
    // Calculate per-device annual cost and sort
    const deviceCosts = devices.map(d => ({
        name: d.name + (d.qty > 1 ? ` ×${d.qty}` : ''),
        cost: (d.watts * d.qty * HOURS_PER_YEAR / 1000) * tariff
    })).sort((a, b) => b.cost - a.cost).slice(0, 6);

    if (topWastersChartInstance) topWastersChartInstance.destroy();

    topWastersChartInstance = new Chart(document.getElementById('top-wasters-chart'), {
        type: 'bar',
        data: {
            labels: deviceCosts.map(d => d.name),
            datasets: [{
                data: deviceCosts.map(d => d.cost),
                backgroundColor: deviceCosts.map((_, i) => {
                    const alpha = 1 - (i * 0.12);
                    return `rgba(0, 255, 136, ${alpha})`;
                }),
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.6,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ₹${Math.round(ctx.parsed.x).toLocaleString('en-IN')}/year`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#5a6478', font: { family: 'Inter' }, callback: v => `₹${v}` }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#8892a8', font: { family: 'Inter', size: 11 } }
                }
            }
        }
    });
}

// ═══════════════ SMART INSIGHTS ═══════════════

function renderInsights(devices, tariff, totalKwh, totalCost, totalCo2) {
    const insights = [];

    // Sort by cost to find biggest offenders
    const sorted = [...devices].sort((a, b) => (b.watts * b.qty) - (a.watts * a.qty));

    // Top waster insight
    if (sorted.length > 0) {
        const top = sorted[0];
        const topCost = (top.watts * top.qty * HOURS_PER_YEAR / 1000) * tariff;
        insights.push({
            icon: '🏆',
            title: `Your #1 Energy Vampire: ${top.name}`,
            desc: `${top.tip}. This alone wastes ₹${Math.round(topCost)}/year in standby mode.`,
            savings: `Save ₹${Math.round(topCost)}/year`
        });
    }

    // Set-top box or router specific
    const hasSTB = devices.find(d => d.id === 'settop');
    if (hasSTB) {
        const stbCost = (hasSTB.watts * hasSTB.qty * HOURS_PER_YEAR / 1000) * tariff;
        insights.push({
            icon: '📡',
            title: 'Set-Top Box: The Silent Killer',
            desc: `Set-top boxes are among the worst phantom power offenders, drawing ${hasSTB.watts}W even when the TV is off. In India, over 200M set-top boxes collectively waste billions of units annually.`,
            savings: `Unplug to save ₹${Math.round(stbCost)}/year`
        });
    }

    // Night saving tip
    const nightHours = 8;
    const nightSavings = (sorted.reduce((s, d) => s + d.watts * d.qty, 0) * nightHours * 365 / 1000) * tariff;
    insights.push({
        icon: '🌙',
        title: 'Night-Time Power Strip Strategy',
        desc: `If you unplug non-essential devices during 8 hours of sleep, you could save approximately ₹${Math.round(nightSavings)}/year — that's ${((nightSavings / totalCost) * 100).toFixed(0)}% of your phantom waste.`,
        savings: `Save ₹${Math.round(nightSavings)}/year`
    });

    // Environmental perspective
    insights.push({
        icon: '🌍',
        title: 'Your Environmental Footprint',
        desc: `Your phantom devices emit ${totalCo2.toFixed(1)} kg CO₂/year. If every Indian household (300M+) has similar phantom loads, that's roughly 25 million tonnes of CO₂ — equivalent to the emissions of a mid-sized country.`,
        savings: `${totalCo2.toFixed(1)} kg CO₂ reducible`
    });

    // Smart power strip recommendation
    if (devices.length >= 3) {
        const stripSavings = totalCost * 0.7; // ~70% savings
        insights.push({
            icon: '🔌',
            title: 'Invest in Smart Power Strips',
            desc: `A ₹500-800 smart power strip can cut phantom load for ${devices.length} devices at once. It pays for itself in ${Math.ceil(800 / (stripSavings / 12))} months.`,
            savings: `ROI in ${Math.ceil(800 / (stripSavings / 12))} months`
        });
    }

    // Charger insight
    const chargers = devices.filter(d => d.id.includes('charger'));
    if (chargers.length > 0) {
        insights.push({
            icon: '⚡',
            title: 'The Charger Myth Busted',
            desc: `Your ${chargers.length} charger(s) may seem tiny individually, but across India's 1B+ phone users leaving chargers plugged in, it adds up to millions of kWh wasted daily. Every charger counts!`,
            savings: 'Small but meaningful'
        });
    }

    const list = document.getElementById('insights-list');
    list.innerHTML = insights.map((ins, i) => `
        <div class="insight-item" style="animation-delay: ${i * 0.08}s">
            <span class="insight-icon">${ins.icon}</span>
            <div class="insight-content">
                <div class="insight-title">${ins.title}</div>
                <div class="insight-desc">${ins.desc}</div>
                <span class="insight-savings">${ins.savings}</span>
            </div>
        </div>
    `).join('');
}

// ═══════════════ EQUIVALENCIES ═══════════════

function renderEquivalencies(kwh, cost, co2) {
    const equivs = [
        { emoji: '🌳', value: Math.ceil(co2 / 22), label: 'Trees needed to offset annually' },
        { emoji: '🚗', value: Math.round(co2 / 0.21), label: 'Km of car driving emissions' },
        { emoji: '💡', value: Math.round(kwh / (0.01 * 8 * 365)), label: 'LED bulbs running 8hr/day all year' },
        { emoji: '☕', value: Math.round(cost / 30), label: `Cups of chai you could buy (₹30 each)` },
        { emoji: '📱', value: Math.round(kwh / 0.012), label: 'Full smartphone charges' },
        { emoji: '🍕', value: Math.round(cost / 200), label: 'Pizzas you could order instead' },
    ];

    document.getElementById('equivalency-grid').innerHTML = equivs.map(eq => `
        <div class="equiv-card">
            <span class="equiv-emoji">${eq.emoji}</span>
            <div class="equiv-value">${eq.value.toLocaleString('en-IN')}</div>
            <div class="equiv-label">${eq.label}</div>
        </div>
    `).join('');
}

// ═══════════════ ACTION PLAN ═══════════════

function renderActionPlan(devices, tariff) {
    const sorted = [...devices].sort((a, b) => (b.watts * b.qty) - (a.watts * a.qty));
    const actions = [];
    let totalPotentialSavings = 0;

    // Top 3 device-specific actions
    sorted.slice(0, 3).forEach(d => {
        const savings = (d.watts * d.qty * HOURS_PER_YEAR / 1000) * tariff;
        totalPotentialSavings += savings * 0.9;
        actions.push(`<strong>Unplug your ${d.name}${d.qty > 1 ? ` (×${d.qty})` : ''}</strong> when not in use — saves ₹${Math.round(savings)}/year. ${d.tip}`);
    });

    // General actions
    actions.push(
        '<strong>Use a power strip with switch</strong> — one flip cuts phantom power for multiple devices at once.',
        '<strong>Set a nightly routine</strong> — turn off the power strip before bed to eliminate 8 hours of waste every night.',
        '<strong>Enable "Deep Off" modes</strong> — many modern TVs and consoles have eco modes that reduce standby to < 0.5W.'
    );

    const remaining = sorted.slice(3).reduce((s, d) => s + (d.watts * d.qty * HOURS_PER_YEAR / 1000) * tariff, 0);
    totalPotentialSavings += remaining * 0.7;

    document.getElementById('action-list').innerHTML = actions.map((a, i) => `
        <div class="action-item" style="animation-delay: ${i * 0.08}s">
            <span class="action-number">${i + 1}</span>
            <div class="action-text">${a}</div>
        </div>
    `).join('');

    document.getElementById('potential-savings').textContent =
        `₹${Math.round(totalPotentialSavings).toLocaleString('en-IN')}/year`;
}

// ═══════════════ RESET ═══════════════

function resetAndRecalculate() {
    document.getElementById('results-dashboard').style.display = 'none';
    document.getElementById('device-selector').scrollIntoView({ behavior: 'smooth' });
}
