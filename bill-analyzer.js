// ═══════════════════════════════════════════════════
// PhantomWatt — PDF Bill Analyzer
// ═══════════════════════════════════════════════════

const BillAnalyzer = {
  // ─── Parse text from PDF using PDF.js ───
  async extractText(file) {
    if (!window.pdfjsLib) {
      console.error('PDF.js not loaded');
      return null;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (err) {
      console.error('PDF extraction error:', err);
      return null;
    }
  },

  // ─── Smart Bill Data Parser ───
  parseBillData(text) {
    if (!text) return null;

    const data = {
      units: null,
      cost: null,
      month: null,
      year: null,
      tariffRate: null,
      prevReading: null,
      currReading: null,
      dueDate: null,
      accountNo: null,
      consumerName: null,
      sanctionedLoad: null,
      rawText: text,
      confidence: 0,
      extractedFields: [],
    };

    const lower = text.toLowerCase();

    // ── Extract Units (kWh) ──
    const unitPatterns = [
      /(?:total|net|consumed|billed)\s*(?:units?|kwh|energy)\s*[:=\-]?\s*(\d+[\.,]?\d*)/i,
      /(\d+[\.,]?\d*)\s*(?:kwh|units?\s*consumed|units?\s*billed)/i,
      /units?\s*(?:consumed|billed|used)\s*[:=\-]?\s*(\d+[\.,]?\d*)/i,
      /consumption\s*[:=\-]?\s*(\d+[\.,]?\d*)\s*(?:kwh|units?)/i,
      /kwh\s*[:=\-]?\s*(\d+[\.,]?\d*)/i,
      /(?:energy|electricity)\s*(?:charges?|consumption)\s*[:=\-]?\s*(\d+[\.,]?\d*)\s*(?:kwh|units?)/i,
    ];

    for (const pat of unitPatterns) {
      const m = text.match(pat);
      if (m) {
        const val = parseFloat(m[1].replace(',', ''));
        if (val > 0 && val < 50000) {
          data.units = val;
          data.extractedFields.push('units');
          data.confidence += 20;
          break;
        }
      }
    }

    // ── Extract Cost (₹) ──
    const costPatterns = [
      /(?:total|net|grand)\s*(?:amount|bill|payable|charges?)\s*[:=\-]?\s*[₹rs\.]*\s*(\d+[\.,]?\d*)/i,
      /(?:amount|bill)\s*(?:payable|due|total)\s*[:=\-]?\s*[₹rs\.]*\s*(\d+[\.,]?\d*)/i,
      /[₹]\s*(\d+[\.,]?\d*)\s*(?:total|payable|due)/i,
      /(?:payable|due)\s*[:=\-]?\s*[₹rs\.]*\s*(\d+[\.,]?\d*)/i,
      /(?:current\s*)?(?:bill\s*)?amount\s*[:=\-]?\s*[₹rs\.]*\s*(\d+[\.,]?\d*)/i,
      /rs\.?\s*(\d{3,}[\.,]?\d*)/i,
    ];

    for (const pat of costPatterns) {
      const m = text.match(pat);
      if (m) {
        const val = parseFloat(m[1].replace(',', ''));
        if (val > 50 && val < 500000) {
          data.cost = val;
          data.extractedFields.push('cost');
          data.confidence += 20;
          break;
        }
      }
    }

    // ── Extract Month/Year ──
    const monthNames = { 'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11, 'january': 0, 'february': 1, 'march': 2, 'april': 3, 'june': 5, 'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11 };

    const datePatterns = [
      /(?:billing?\s*(?:period|month|date)|bill\s*(?:date|period))\s*[:=\-]?\s*(?:\w+\s*)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s\-,]*(\d{4}|\d{2})/i,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s\-,']*(\d{4})/i,
      /(\d{1,2})\s*[-\/]\s*(\d{1,2})\s*[-\/]\s*(\d{4})/,
    ];

    for (const pat of datePatterns) {
      const m = text.match(pat);
      if (m) {
        if (m[1] && monthNames[m[1].toLowerCase().substring(0, 3)] !== undefined) {
          data.month = monthNames[m[1].toLowerCase().substring(0, 3)];
          let yr = parseInt(m[2]);
          if (yr < 100) yr += 2000;
          data.year = yr;
          data.extractedFields.push('month', 'year');
          data.confidence += 15;
        } else if (m.length === 4) {
          data.month = parseInt(m[2]) - 1;
          data.year = parseInt(m[3]);
          data.extractedFields.push('month', 'year');
          data.confidence += 10;
        }
        break;
      }
    }

    // ── Extract Meter Readings ──
    const readingPatterns = [
      /(?:previous|prev|last)\s*(?:reading|meter)\s*[:=\-]?\s*(\d+)/i,
      /(?:current|present|new)\s*(?:reading|meter)\s*[:=\-]?\s*(\d+)/i,
    ];

    const prevMatch = text.match(readingPatterns[0]);
    if (prevMatch) {
      data.prevReading = parseInt(prevMatch[1]);
      data.extractedFields.push('prevReading');
      data.confidence += 10;
    }

    const currMatch = text.match(readingPatterns[1]);
    if (currMatch) {
      data.currReading = parseInt(currMatch[1]);
      data.extractedFields.push('currReading');
      data.confidence += 10;
    }

    // ── Extract Tariff Rate ──
    const tariffPatterns = [
      /(?:tariff|rate|charge)\s*[:=\-]?\s*[₹rs\.]*\s*(\d+[\.,]?\d*)\s*(?:per\s*(?:unit|kwh)|\/\s*(?:unit|kwh))/i,
      /[₹rs\.]*\s*(\d+[\.,]?\d*)\s*(?:per\s*(?:unit|kwh)|\/\s*(?:unit|kwh))/i,
    ];

    for (const pat of tariffPatterns) {
      const m = text.match(pat);
      if (m) {
        const val = parseFloat(m[1].replace(',', ''));
        if (val > 0 && val < 30) {
          data.tariffRate = val;
          data.extractedFields.push('tariffRate');
          data.confidence += 10;
          break;
        }
      }
    }

    // ── Calculate derived tariff ──
    if (!data.tariffRate && data.units && data.cost) {
      data.tariffRate = Math.round((data.cost / data.units) * 100) / 100;
      data.extractedFields.push('tariffRate (calculated)');
    }

    // ── Extract Account/Consumer Number ──
    const acctMatch = text.match(/(?:account|consumer|ca)\s*(?:no|number|#)\s*[:=\-]?\s*([A-Z0-9\-\/]+)/i);
    if (acctMatch) {
      data.accountNo = acctMatch[1];
      data.extractedFields.push('accountNo');
      data.confidence += 5;
    }

    // ── Consumer Name ──
    const nameMatch = text.match(/(?:consumer|customer)\s*(?:name)\s*[:=\-]?\s*([A-Za-z\s]+?)(?:\s{2,}|\n|$)/i);
    if (nameMatch) {
      data.consumerName = nameMatch[1].trim();
      data.extractedFields.push('consumerName');
      data.confidence += 5;
    }

    // Normalize confidence
    data.confidence = Math.min(data.confidence, 100);

    return data;
  },

  // ─── Generate AI Insights from extracted data ───
  generateInsights(data, existingBills) {
    const insights = [];

    if (data.units && data.cost) {
      const dailyUnits = (data.units / 30).toFixed(1);
      const dailyCost = Math.round(data.cost / 30);
      insights.push({
        icon: '📅',
        title: 'Daily Consumption',
        desc: `You use about ${dailyUnits} kWh/day (₹${dailyCost}/day). The Indian average is 3-5 kWh/day.`,
        type: data.units / 30 > 8 ? 'warning' : 'good',
      });
    }

    if (data.tariffRate) {
      const avgRate = 7;
      insights.push({
        icon: '💰',
        title: 'Your Tariff Rate',
        desc: `₹${data.tariffRate}/kWh — ${data.tariffRate > avgRate ? 'above' : 'below'} average (₹${avgRate}/kWh). ${data.tariffRate > avgRate ? 'Higher slab rate suggests high consumption.' : 'Good — you\'re in a lower slab!'}`,
        type: data.tariffRate > avgRate ? 'warning' : 'good',
      });
    }

    if (data.units) {
      // Phantom load estimate
      const phantomEstimate = data.units * 0.08; // ~8% phantom
      const phantomCost = data.tariffRate ? phantomEstimate * data.tariffRate : phantomEstimate * 7;
      insights.push({
        icon: '🧛',
        title: 'Estimated Phantom Load',
        desc: `~${phantomEstimate.toFixed(0)} kWh/month (₹${Math.round(phantomCost)}) is likely phantom power. That's about 8% of your bill!`,
        type: 'warning',
      });
    }

    if (data.units && data.cost) {
      const annual = data.cost * 12;
      insights.push({
        icon: '📊',
        title: 'Projected Annual Cost',
        desc: `At this rate, your yearly electricity bill would be ₹${Math.round(annual).toLocaleString('en-IN')}. Even a 10% reduction saves ₹${Math.round(annual * 0.1).toLocaleString('en-IN')}/yr!`,
        type: 'info',
      });
    }

    // Compare with existing bills
    if (existingBills && existingBills.length > 0) {
      const sorted = [...existingBills].sort((a, b) => new Date(b.date) - new Date(a.date));
      const prevBill = sorted[0];

      if (data.cost && prevBill.cost) {
        const diff = ((data.cost - prevBill.cost) / prevBill.cost * 100).toFixed(1);
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        insights.push({
          icon: diff > 0 ? '📈' : '📉',
          title: `vs ${MONTHS[prevBill.month]} ${prevBill.year}`,
          desc: `Your bill ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)}% (₹${Math.abs(Math.round(data.cost - prevBill.cost))}). ${diff > 5 ? 'Check for seasonal changes or new appliances.' : diff < -5 ? 'Great improvement! Keep it up!' : 'Roughly stable.'}`,
          type: diff > 5 ? 'warning' : diff < -5 ? 'good' : 'info',
        });
      }

      // Average comparison
      const avgCost = existingBills.reduce((s, b) => s + b.cost, 0) / existingBills.length;
      if (data.cost) {
        const vsAvg = ((data.cost - avgCost) / avgCost * 100).toFixed(1);
        insights.push({
          icon: '📋',
          title: 'vs Your Average',
          desc: `This bill is ${vsAvg > 0 ? vsAvg + '% above' : Math.abs(vsAvg) + '% below'} your average of ₹${Math.round(avgCost).toLocaleString('en-IN')}/month.`,
          type: vsAvg > 10 ? 'warning' : vsAvg < -10 ? 'good' : 'info',
        });
      }
    }

    // Savings recommendations
    insights.push({
      icon: '💡',
      title: 'Quick Savings Tips',
      desc: 'Top 3 actions: (1) Unplug top 3 standby devices (save ~₹200/mo), (2) Set AC to 24°C (save ~₹400/mo), (3) Night-time power strip off (save ~₹150/mo).',
      type: 'tip',
    });

    return insights;
  },

  // ─── Render Analysis Card ───
  renderAnalysisCard(data, insights) {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const confidenceColor = data.confidence >= 60 ? 'var(--green)' : data.confidence >= 30 ? 'var(--amber)' : 'var(--terracotta)';
    const confidenceLabel = data.confidence >= 60 ? 'High' : data.confidence >= 30 ? 'Medium' : 'Low';

    let html = `
      <div class="bill-analysis-card card">
        <h3>🤖 AI Bill Analysis
          <span class="analysis-confidence" style="color:${confidenceColor}">
            ${confidenceLabel} confidence (${data.confidence}%)
          </span>
        </h3>

        <div class="analysis-extracted">
          <h4>📋 Extracted Data</h4>
          <div class="analysis-grid">
            ${data.units ? `<div class="analysis-item"><span class="ai-label">Units</span><span class="ai-value">${data.units} kWh</span></div>` : ''}
            ${data.cost ? `<div class="analysis-item"><span class="ai-label">Cost</span><span class="ai-value">₹${data.cost.toLocaleString('en-IN')}</span></div>` : ''}
            ${data.month !== null && data.year ? `<div class="analysis-item"><span class="ai-label">Period</span><span class="ai-value">${MONTHS[data.month]} ${data.year}</span></div>` : ''}
            ${data.tariffRate ? `<div class="analysis-item"><span class="ai-label">Rate</span><span class="ai-value">₹${data.tariffRate}/kWh</span></div>` : ''}
            ${data.prevReading ? `<div class="analysis-item"><span class="ai-label">Prev Reading</span><span class="ai-value">${data.prevReading}</span></div>` : ''}
            ${data.currReading ? `<div class="analysis-item"><span class="ai-label">Curr Reading</span><span class="ai-value">${data.currReading}</span></div>` : ''}
            ${data.consumerName ? `<div class="analysis-item"><span class="ai-label">Consumer</span><span class="ai-value">${data.consumerName}</span></div>` : ''}
            ${data.accountNo ? `<div class="analysis-item"><span class="ai-label">Account</span><span class="ai-value">${data.accountNo}</span></div>` : ''}
          </div>
        </div>

        <div class="analysis-insights">
          <h4>🧠 AI Insights</h4>
          ${insights.map(i => `
            <div class="analysis-insight ${i.type}">
              <span class="ai-insight-icon">${i.icon}</span>
              <div>
                <div class="ai-insight-title">${i.title}</div>
                <div class="ai-insight-desc">${i.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="analysis-actions">
          <button class="cta-button sm" onclick="autoFillFromAnalysis()">✅ Auto-fill Bill Form</button>
          <button class="cta-button secondary sm" onclick="document.getElementById('bill-analysis-card')?.remove()">✕ Dismiss</button>
        </div>
      </div>
    `;
    return html;
  }
};

// ─── Global: Auto-fill form from analysis ───
let lastAnalysisData = null;

function autoFillFromAnalysis() {
  if (!lastAnalysisData) return;
  const d = lastAnalysisData;
  if (d.units) {
    const el = document.getElementById('bill-units');
    if (el) el.value = d.units;
  }
  if (d.cost) {
    const el = document.getElementById('bill-cost');
    if (el) el.value = d.cost;
  }
  if (d.month !== null) {
    const el = document.getElementById('bill-month');
    if (el) el.value = d.month;
  }
  if (d.year) {
    const el = document.getElementById('bill-year');
    if (el) el.value = d.year;
  }
  if (typeof showToast === 'function') showToast('Bill fields auto-filled from PDF! ✅');
}

// ─── Handle PDF file upload ───
async function handlePDFUpload(file) {
  if (!file || file.type !== 'application/pdf') {
    if (typeof showToast === 'function') showToast('Please upload a PDF file');
    return;
  }

  // Show loading state
  const uploadArea = document.querySelector('.bill-upload-area');
  if (uploadArea) {
    uploadArea.innerHTML = `
      <div class="upload-loading">
        <div class="upload-spinner"></div>
        <p>Analyzing your bill with AI...</p>
        <p class="hint">Extracting text and parsing data</p>
      </div>
    `;
  }

  try {
    const text = await BillAnalyzer.extractText(file);
    if (!text || text.trim().length < 10) {
      if (typeof showToast === 'function') showToast('Could not extract text from this PDF. Try a different file or enter data manually.');
      resetUploadArea();
      return;
    }

    const data = BillAnalyzer.parseBillData(text);
    if (!data) {
      if (typeof showToast === 'function') showToast('Could not parse bill data. Please enter data manually.');
      resetUploadArea();
      return;
    }

    lastAnalysisData = data;

    // Get existing bills for comparison
    let existingBills = [];
    if (typeof currentUser !== 'undefined' && currentUser && typeof Store !== 'undefined') {
      existingBills = Store.getBills(currentUser.email);
    }

    const insights = BillAnalyzer.generateInsights(data, existingBills);
    const analysisHTML = BillAnalyzer.renderAnalysisCard(data, insights);

    // Insert analysis card before the form
    const formCard = document.querySelector('.bill-form-card');
    if (formCard) {
      // Remove old analysis card
      const old = document.getElementById('bill-analysis-card');
      if (old) old.remove();

      const container = document.createElement('div');
      container.id = 'bill-analysis-card';
      container.innerHTML = analysisHTML;
      formCard.parentNode.insertBefore(container, formCard);

      // Auto-fill form
      autoFillFromAnalysis();
    }

    // Reset upload area with success
    if (uploadArea) {
      uploadArea.innerHTML = `
        <span class="upload-icon">✅</span>
        <p><strong>PDF analyzed successfully!</strong></p>
        <p class="hint">${data.extractedFields.length} fields extracted • Click to upload another</p>
        <input type="file" id="bill-file" accept=".pdf,image/*" style="display:none" onchange="handleFileChange(this)">
      `;
      uploadArea.onclick = () => document.getElementById('bill-file').click();
    }

    if (typeof showToast === 'function') showToast(`Bill analyzed! ${data.extractedFields.length} fields extracted 🎉`);

  } catch (err) {
    console.error('Bill analysis error:', err);
    if (typeof showToast === 'function') showToast('Error analyzing PDF. Please try again or enter data manually.');
    resetUploadArea();
  }
}

function resetUploadArea() {
  const uploadArea = document.querySelector('.bill-upload-area');
  if (uploadArea) {
    uploadArea.innerHTML = `
      <span class="upload-icon">📄</span>
      <p>Click or drag to upload bill (PDF or image)</p>
      <p class="hint">AI will extract and analyze bill data automatically</p>
      <input type="file" id="bill-file" accept=".pdf,image/*" style="display:none" onchange="handleFileChange(this)">
    `;
    uploadArea.onclick = () => document.getElementById('bill-file').click();
  }
}

function handleFileChange(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.type === 'application/pdf') {
      handlePDFUpload(file);
    } else if (file.type.startsWith('image/')) {
      // Show preview for images (existing behavior)
      if (typeof previewBill === 'function') previewBill(input);
    }
  }
}

// ─── Drag and Drop ───
document.addEventListener('DOMContentLoaded', () => {
  // Use event delegation for drag-drop since upload area is rendered dynamically
  document.addEventListener('dragover', (e) => {
    const uploadArea = document.querySelector('.bill-upload-area');
    if (uploadArea && uploadArea.contains(e.target)) {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    }
  });
  document.addEventListener('dragleave', (e) => {
    const uploadArea = document.querySelector('.bill-upload-area');
    if (uploadArea && uploadArea.contains(e.target)) {
      uploadArea.classList.remove('drag-over');
    }
  });
  document.addEventListener('drop', (e) => {
    const uploadArea = document.querySelector('.bill-upload-area');
    if (uploadArea && uploadArea.contains(e.target)) {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.type === 'application/pdf') {
          handlePDFUpload(file);
        } else if (file.type.startsWith('image/')) {
          const dt = new DataTransfer();
          dt.items.add(file);
          const inp = document.getElementById('bill-file');
          if (inp) { inp.files = dt.files; if (typeof previewBill === 'function') previewBill(inp); }
        }
      }
    }
  });
});
