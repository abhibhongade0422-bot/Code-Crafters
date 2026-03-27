// ═══════════════════════════════════════════════════
// PhantomWatt — AI Energy Chatbot
// ═══════════════════════════════════════════════════

(function() {
  const fab = document.getElementById('chatbot-fab');
  const panel = document.getElementById('chatbot-panel');
  const closeBtn = document.getElementById('chatbot-close');
  const msgArea = document.getElementById('chatbot-messages');
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const quickBtns = document.getElementById('chatbot-quick-actions');

  if (!fab || !panel) return;

  let isOpen = false;
  let hasGreeted = false;

  // ─── Knowledge Base ───
  const KB = {
    greetings: [
      "👋 Hi! I'm **WattBot**, your AI energy assistant. I can help you:\n\n⚡ Get personalized energy-saving tips\n📊 Analyze your electricity usage\n💡 Recommend ways to reduce bills\n🔌 Identify phantom power vampires\n\nAsk me anything or tap a quick action below!",
    ],
    savings_general: [
      "Here are the **top 5 ways to save** on your electricity bill:\n\n1. **Unplug standby devices** — saves 5-10% of your bill\n2. **Use smart power strips** — one switch cuts 5+ devices\n3. **Switch to LED bulbs** — 75% less energy than incandescent\n4. **Set AC to 24°C** — each degree lower costs 6% more\n5. **Use a timer for geysers** — 15 min is enough for heating\n\n💡 The easiest win? Unplug your phone charger when not charging!",
      "🌟 **Quick wins** for Indian homes:\n\n• Turn off the **geyser** after use — saves ₹2000+/yr\n• Unplug **set-top box** at night — biggest vampire (15W!)\n• Use a **timer on WiFi router** — 8hr overnight off = ₹500/yr\n• Switch to **5-star rated appliances** — 30-40% savings\n• Use **natural ventilation** before turning on AC",
    ],
    phantom_power: [
      "🧛 **Phantom Power** (also called vampire power or standby power) is electricity consumed by devices that are plugged in but not actively in use.\n\n**Top vampires in Indian homes:**\n• Set-Top Box/DTH: **15W** (₹960/yr)\n• Gaming Console: **10W** (₹640/yr)\n• UPS/Inverter: **10W** (₹640/yr)\n• WiFi Router: **8W** (₹512/yr)\n• Desktop (sleep): **8W** (₹512/yr)\n\n💡 Together, these waste **₹3,000+/year!**",
    ],
    ac_tips: [
      "❄️ **AC Energy-Saving Tips:**\n\n1. **Set to 24°C** — optimal comfort + efficiency\n2. **Use a timer** — don't run all night; 4 hrs is enough\n3. **Clean filters** monthly — dirty filters use 15% more\n4. **Close windows/doors** — AC works harder in open rooms\n5. **Use fan + AC combo** — set AC to 26°C with ceiling fan\n6. **Use curtains** — block sunlight to reduce cooling load\n\n🏷️ Upgrade: A **5-star inverter AC** saves ₹4,000-6,000/yr vs old 3-star!",
    ],
    kitchen_tips: [
      "🍳 **Kitchen Energy Tips:**\n\n• **Microwave clock** uses 3W 24/7 — costs ₹180/yr just to show time!\n• **RO Water Purifier** runs cycles even at night — ₹190/yr wasted\n• Use **pressure cooker** — cooks 70% faster than regular pots\n• **Induction cooktop** is 90% efficient vs 40% for gas\n• Only run **dishwasher** when full — saves 50% water + energy\n• **Defrost fridge** regularly — ice buildup increases energy 30%",
    ],
    night_routine: [
      "🌙 **Ideal Night Routine for Energy Savings:**\n\n**Before bed checklist:**\n✅ Unplug all phone/laptop chargers\n✅ Turn off set-top box (not just TV)\n✅ Switch off WiFi router (use timer)\n✅ Turn off AC after 4 hours (use timer)\n✅ Unplug microwave/OTG\n✅ Switch off geyser\n✅ Turn off smart speakers\n\n**Estimated savings:** ₹800-1,200/year just from a 2-minute nightly routine!\n\n💡 Pro tip: Use a power strip with switch for entertainment devices — one flip does it all!",
    ],
    bill_analysis: [
      "📊 **Understanding Your Electricity Bill:**\n\n• **Units (kWh)** — actual energy consumed\n• **Fixed charges** — monthly connection fees\n• **Energy charges** — cost per unit (₹5-9/kWh in India)\n• **Fuel adjustment** — varies with coal/gas prices\n• **Tax & cess** — 5-15% government charges\n\n**How to reduce your bill:**\n1. Compare units month-over-month\n2. Identify spikes (summer AC, winter heaters)\n3. Check if phantom load matches your tracked devices\n4. Aim for 5-10% reduction each month\n\n💡 Upload your bill PDF in the **Bills section** and I'll help analyze it!",
    ],
    solar_tips: [
      "☀️ **Solar Energy Tips for Indian Homes:**\n\n• A **1kW rooftop system** costs ₹45,000-60,000 (with 40% subsidy!)\n• Generates ~4 units/day → saves ₹1,200-1,500/month\n• **Break-even** in 3-4 years, lasts 25 years\n• **Net metering** lets you sell excess to grid\n• PM Surya Ghar scheme: free 300 units/month for 1 crore homes\n\n🔗 Apply: [pmsuryaghar.gov.in](https://pmsuryaghar.gov.in)",
    ],
    seasonal: [
      "📅 **Seasonal Energy Tips:**\n\n**Summer (Apr-Jun):**\n• Use fans first, AC only when needed\n• Set AC to 24-26°C\n• Use curtains/blinds during peak sun\n• Cook early morning or late evening\n\n**Monsoon (Jul-Sep):**\n• Natural cooling — open windows\n• Reduce AC usage by 50%\n• Watch for voltage fluctuations — use stabilizers\n\n**Winter (Oct-Feb):**\n• Use blankets before room heaters\n• Geyser: 15 minutes max, then switch off\n• Solar water heater = free hot water!\n\n**Year-round:** Phantom power doesn't take seasons off — always unplug!",
    ],
    appliance_rating: [
      "⭐ **BEE Star Ratings — Why They Matter:**\n\n| Appliance | 3-Star | 5-Star | Annual Savings |\n|-----------|--------|--------|----------------|\n| AC (1.5T) | ₹8,500/yr | ₹5,200/yr | **₹3,300** |\n| Fridge | ₹4,200/yr | ₹2,800/yr | **₹1,400** |\n| Fan | ₹1,100/yr | ₹580/yr | **₹520** |\n| Geyser | ₹6,000/yr | ₹3,500/yr | **₹2,500** |\n\n💵 A 5-star AC pays back the price difference in 1-2 years!",
    ],
    smart_home: [
      "🏠 **Smart Energy Devices for Indian Homes:**\n\n1. **Smart plugs** (₹500-1,500) — schedule devices on/off\n2. **Smart power strips** (₹800-2,000) — cut phantom load\n3. **Smart LED bulbs** (₹300-800) — schedule + dimming\n4. **Smart AC controllers** (₹2,000-4,000) — remote + schedule\n5. **Energy monitors** (₹3,000-8,000) — track real-time usage\n\n💡 Start with just **2 smart plugs** for your top energy vampires — ROI in 3-6 months!",
    ],
    fun_facts: [
      "🎉 **Fun Energy Facts:**\n\n• India's 200M+ set-top boxes waste ₹4,500 crore/year on standby!\n• A phone charger left plugged in uses ₹30/year — but 1 billion chargers? ₹3,000 crore!\n• Your microwave clock costs more to run per year than the microwave itself!\n• An old CRT TV in standby uses more power than a modern LED TV watching Netflix\n• If every Indian household unplugged 3 devices, we'd save enough power for 10 million homes!\n\n⚡ Small actions + big numbers = massive impact!",
    ],
  };

  // Intent patterns
  const intents = [
    { keys: ['save', 'reduce', 'cut', 'lower', 'less', 'decrease', 'saving', 'how to save', 'tips', 'help me save', 'suggestions'], topic: 'savings_general' },
    { keys: ['phantom', 'vampire', 'standby', 'plugged in', 'waste', 'drain', 'ghost', 'hidden'], topic: 'phantom_power' },
    { keys: ['ac', 'air conditioner', 'cooling', 'air conditioning', 'temperature'], topic: 'ac_tips' },
    { keys: ['kitchen', 'microwave', 'fridge', 'refrigerator', 'oven', 'cooking', 'ro', 'water purifier'], topic: 'kitchen_tips' },
    { keys: ['night', 'sleep', 'bedtime', 'before bed', 'routine', 'nightly', 'checklist'], topic: 'night_routine' },
    { keys: ['bill', 'electricity bill', 'charges', 'tariff', 'reading', 'units', 'kwh', 'pdf', 'analyze', 'analysis', 'upload'], topic: 'bill_analysis' },
    { keys: ['solar', 'panel', 'rooftop', 'renewable', 'sun', 'photovoltaic', 'surya'], topic: 'solar_tips' },
    { keys: ['season', 'summer', 'winter', 'monsoon', 'rain', 'hot', 'cold'], topic: 'seasonal' },
    { keys: ['star', 'rating', 'bee', 'efficiency', 'rated', '5 star', 'energy label'], topic: 'appliance_rating' },
    { keys: ['smart', 'iot', 'automated', 'smart home', 'smart plug', 'alexa', 'google home', 'automation'], topic: 'smart_home' },
    { keys: ['fun', 'fact', 'interesting', 'did you know', 'trivia', 'cool', 'amazing'], topic: 'fun_facts' },
    { keys: ['hello', 'hi', 'hey', 'help', 'start', 'what can you do', 'menu'], topic: 'greetings' },
  ];

  // ─── Match Intent ───
  function matchIntent(text) {
    const lower = text.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;

    for (const intent of intents) {
      let score = 0;
      for (const key of intent.keys) {
        if (lower.includes(key)) {
          score += key.length; // longer matches = more specific
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = intent.topic;
      }
    }
    return bestMatch;
  }

  // ─── Device-aware response ───
  function getDeviceContext() {
    if (typeof selectedDevices === 'undefined' || !selectedDevices) return null;
    const devs = Object.values(selectedDevices);
    if (devs.length === 0) return null;

    const sorted = [...devs].sort((a, b) => (b.watts * b.qty) - (a.watts * a.qty));
    const totalW = devs.reduce((s, d) => s + d.watts * d.qty, 0);
    const tariff = typeof getTariff === 'function' ? getTariff() : 7;
    const annualCost = (totalW * 8760 / 1000) * tariff;

    let response = `📋 **Based on your ${devs.length} tracked devices:**\n\n`;
    response += `Total standby draw: **${totalW.toFixed(1)}W**\n`;
    response += `Annual phantom cost: **₹${Math.round(annualCost).toLocaleString('en-IN')}**\n\n`;
    response += `🎯 **Your top 3 energy vampires:**\n`;
    sorted.slice(0, 3).forEach((d, i) => {
      const cost = ((d.watts * d.qty * 8760 / 1000) * tariff);
      response += `${i + 1}. **${d.name}** ${d.emoji} — ${d.watts * d.qty}W → ₹${Math.round(cost)}/yr\n`;
      response += `   💡 ${d.tip}\n\n`;
    });

    if (sorted.length > 3) {
      response += `\n...and ${sorted.length - 3} more devices.\n\n`;
    }
    response += `🔌 **Quick win:** Unplugging your #1 vampire alone saves **₹${Math.round((sorted[0].watts * sorted[0].qty * 8760 / 1000) * tariff)}/year!**`;
    return response;
  }

  // ─── Bill context ───
  function getBillContext() {
    if (typeof currentUser === 'undefined' || !currentUser) return null;
    if (typeof Store === 'undefined') return null;
    const bills = Store.getBills(currentUser.email);
    if (!bills || bills.length === 0) return null;

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const sorted = [...bills].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0];
    const prev = sorted[1];

    let response = `📊 **Your Bill Analysis:**\n\n`;
    response += `Latest bill: **${MONTHS[latest.month]} ${latest.year}**\n`;
    response += `• Units: **${latest.units} kWh**\n`;
    response += `• Cost: **₹${Math.round(latest.cost).toLocaleString('en-IN')}**\n`;
    response += `• Rate: **₹${(latest.cost / latest.units).toFixed(1)}/kWh**\n\n`;

    if (prev) {
      const diff = ((latest.cost - prev.cost) / prev.cost * 100).toFixed(1);
      const unitDiff = ((latest.units - prev.units) / prev.units * 100).toFixed(1);
      const up = diff > 0;
      response += `**vs ${MONTHS[prev.month]} ${prev.year}:**\n`;
      response += `${up ? '📈' : '📉'} Cost: ${up ? '+' : ''}${diff}% (₹${Math.round(latest.cost - prev.cost)})\n`;
      response += `${unitDiff > 0 ? '📈' : '📉'} Units: ${unitDiff > 0 ? '+' : ''}${unitDiff}%\n\n`;
    }

    // Per-day consumption
    const dailyUnits = (latest.units / 30).toFixed(1);
    const dailyCost = (latest.cost / 30).toFixed(0);
    response += `📅 **Daily average:** ${dailyUnits} kWh / ₹${dailyCost}\n\n`;

    // Phantom estimate
    const devs = typeof selectedDevices !== 'undefined' ? Object.values(selectedDevices) : [];
    if (devs.length > 0) {
      const totalW = devs.reduce((s, d) => s + d.watts * d.qty, 0);
      const phantomKwh = (totalW * 730 / 1000); // per month
      const phantomPercent = (phantomKwh / latest.units * 100).toFixed(1);
      response += `🧛 **Phantom load estimate:** ${phantomKwh.toFixed(1)} kWh/month = **${phantomPercent}%** of your bill\n`;
      response += `That's roughly **₹${Math.round(phantomKwh * (latest.cost / latest.units))}/month** you could save!`;
    }

    return response;
  }

  // ─── Generate Response ───
  function generateResponse(text) {
    const intent = matchIntent(text);

    // Check for personalized queries
    const lower = text.toLowerCase();
    if (lower.includes('my device') || lower.includes('my usage') || lower.includes('my home') || lower.includes('my vampire') || lower.includes('analyze my') || lower.includes('my top')) {
      const devCtx = getDeviceContext();
      if (devCtx) return devCtx;
      return "I don't see any devices tracked yet! Go to **Devices** page to add your household equipment, then ask me again for personalized recommendations. 🏠";
    }

    if (lower.includes('my bill') || lower.includes('bill analysis') || lower.includes('analyze bill') || lower.includes('spending') || lower.includes('bill trend')) {
      const billCtx = getBillContext();
      if (billCtx) return billCtx;
      return "No bills found yet! Go to the **Bills** tab to add or upload your electricity bills, then ask me to analyze them. 📄";
    }

    if (intent) {
      const responses = KB[intent];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Fallback
    const fallbacks = [
      "I'm not sure about that, but I can help with:\n\n💡 **Energy saving tips** — \"How can I save energy?\"\n🧛 **Phantom power** — \"What is phantom power?\"\n❄️ **AC tips** — \"How to save on AC?\"\n🌙 **Night routine** — \"Best bedtime routine?\"\n📊 **Bill analysis** — \"Analyze my bill\"\n☀️ **Solar energy** — \"Tell me about solar\"\n\nTry asking about any of these topics!",
      "I specialize in energy savings! Try asking me:\n• \"Top energy saving tips\"\n• \"What's draining my power?\"\n• \"How to reduce my bill?\"\n• \"Night routine for savings\"\n• \"Fun energy facts\"",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // ─── UI Logic ───
  function toggleChat() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    fab.classList.toggle('active', isOpen);
    if (isOpen && !hasGreeted) {
      hasGreeted = true;
      addBotMessage(KB.greetings[0]);
    }
    if (isOpen) {
      setTimeout(() => input.focus(), 300);
    }
  }

  function addBotMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg bot';

    // Typing indicator first
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot typing-msg';
    typing.innerHTML = '<div class="chat-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
    msgArea.appendChild(typing);
    msgArea.scrollTop = msgArea.scrollHeight;

    setTimeout(() => {
      typing.remove();
      // Simple markdown → HTML (bold, bullet points, links)
      let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
      msgDiv.innerHTML = `<div class="chat-avatar">⚡</div><div class="chat-bubble">${html}</div>`;
      msgArea.appendChild(msgDiv);
      msgArea.scrollTop = msgArea.scrollHeight;
    }, 600 + Math.random() * 400);
  }

  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg user';
    msgDiv.innerHTML = `<div class="chat-bubble">${text}</div>`;
    msgArea.appendChild(msgDiv);
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addUserMessage(text);
    input.value = '';
    const response = generateResponse(text);
    addBotMessage(response);
  }

  // ─── Event Listeners ───
  fab.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Quick action buttons
  if (quickBtns) {
    quickBtns.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-btn');
      if (!btn) return;
      const query = btn.dataset.query;
      addUserMessage(query);
      const response = generateResponse(query);
      addBotMessage(response);
    });
  }
})();
