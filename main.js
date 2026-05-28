'use strict';

/* ═══════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════ */
const navbar           = document.getElementById('navbar');
const navToggle        = document.getElementById('navToggle');
const navSubBar        = document.getElementById('navSubBar');
const navLinksPersonal = document.getElementById('navLinksPersonal');

// ── Scroll: backdrop + section highlight ──────
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  highlightNav();
}, { passive: true });

// ── Hamburger: toggle sub-bar overlay on mobile ──
navToggle.addEventListener('click', () => {
  const open = navToggle.classList.toggle('open');
  navSubBar.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

// Close mobile overlay when a link is clicked
navSubBar.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    navToggle.classList.remove('open');
    navSubBar.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ── Section highlight ─────────────────────────
function highlightNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY  = window.scrollY + 100;
  sections.forEach(section => {
    const link = navLinksPersonal.querySelector(`a[href="#${section.id}"]`);
    if (!link) return;
    const top = section.offsetTop, h = section.offsetHeight;
    link.classList.toggle('active', scrollY >= top && scrollY < top + h);
  });
}

/* ═══════════════════════════════════════════════
   MARKET WIDGET
   Renders F&G index + S&P 500 yield chart
   using data from finance.bariscankose.com/api/snapshot
═══════════════════════════════════════════════ */
(async () => {
  const el = document.getElementById('marketSnapshot');
  if (!el) return;

  // ── Colour helpers ────────────────────────────
  function scoreColor(s) {
    if (s == null || s === 0) return '#4a5e80';
    if (s >= 75) return '#22c55e';
    if (s >= 55) return '#84cc16';
    if (s >= 45) return '#eab308';
    if (s >= 25) return '#f97316';
    return '#ef4444';
  }

  function ratingMeta(rating) {
    const r = (rating || '').toLowerCase();
    if (r.includes('extreme') && r.includes('greed')) return { pillCls: 'mw-pill-eg', label: 'Extreme Greed', hex: '#22c55e' };
    if (r.includes('greed'))                           return { pillCls: 'mw-pill-g',  label: 'Greed',         hex: '#84cc16' };
    if (r.includes('extreme') && r.includes('fear'))  return { pillCls: 'mw-pill-ef', label: 'Extreme Fear',  hex: '#ef4444' };
    if (r.includes('fear'))                            return { pillCls: 'mw-pill-f',  label: 'Fear',          hex: '#f97316' };
    return { pillCls: 'mw-pill-n', label: 'Neutral', hex: '#eab308' };
  }

  // ── Gauge SVG (ported from finance app) ──────
  function buildGauge(score) {
    const cx = 155, cy = 145, R = 130, ri = 88;
    const sc = Math.max(0.3, Math.min(99.7, score ?? 50));
    const s2a = s => 180 * (1 - s / 100);
    const pol = (radius, deg) => {
      const rad = deg * Math.PI / 180;
      return [cx + radius * Math.cos(rad), cy - radius * Math.sin(rad)];
    };
    const p = v => v.toFixed(2);
    function donutPath(s1, s2, ro, rii) {
      const a1 = s2a(s1), a2 = s2a(s2);
      const [x1o, y1o] = pol(ro, a1), [x2o, y2o] = pol(ro, a2);
      const [x1i, y1i] = pol(rii, a1), [x2i, y2i] = pol(rii, a2);
      return `M ${p(x1o)},${p(y1o)} A ${ro} ${ro} 0 0 0 ${p(x2o)},${p(y2o)} L ${p(x2i)},${p(y2i)} A ${rii} ${rii} 0 0 1 ${p(x1i)},${p(y1i)} Z`;
    }
    const SEGS = [[0,25,'#dc2626'],[25,45,'#ea580c'],[45,55,'#ca8a04'],[55,75,'#4d7c0f'],[75,100,'#15803d']];
    let out = `<defs><filter id="gns" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1" stdDeviation="2.5" flood-color="#000" flood-opacity="0.55"/></filter></defs>`;
    for (const [s1, s2, col] of SEGS) out += `<path d="${donutPath(s1, s2, R, ri)}" fill="${col}"/>`;
    out += `<path d="${donutPath(sc, 100, R + 1, ri - 1)}" fill="#030712" opacity="0.86"/>`;
    for (const b of [25, 45, 55, 75]) {
      const a = s2a(b), [x1,y1] = pol(ri-3,a), [x2,y2] = pol(R+3,a);
      out += `<line x1="${p(x1)}" y1="${p(y1)}" x2="${p(x2)}" y2="${p(y2)}" stroke="#030712" stroke-width="4" stroke-linecap="round"/>`;
    }
    for (const t of [0, 25, 50, 75, 100]) {
      const a = s2a(t), [x1,y1] = pol(R+6,a), [x2,y2] = pol(R+14,a);
      out += `<line x1="${p(x1)}" y1="${p(y1)}" x2="${p(x2)}" y2="${p(y2)}" stroke="#4a5e80" stroke-width="2" stroke-linecap="round"/>`;
      const [lx, ly] = pol(R+24, a);
      out += `<text x="${p(lx)}" y="${p(ly)}" text-anchor="middle" dominant-baseline="middle" fill="#6888b0" font-size="11" font-family="JetBrains Mono,monospace">${t}</text>`;
    }
    const na = s2a(sc), [tx,ty] = pol(R-10,na), [lx,ly] = pol(10,na+90), [rx,ry] = pol(10,na-90);
    out += `<polygon points="${p(tx)},${p(ty)} ${p(lx)},${p(ly)} ${p(rx)},${p(ry)}" fill="#f1f5f9" filter="url(#gns)"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="8" fill="#080d14" stroke="#4a5e80" stroke-width="2"/>`;
    return `<svg viewBox="0 0 310 155" width="100%">${out}</svg>`;
  }

  // ── F&G history chart ─────────────────────────
  function buildFGChart(history, hex) {
    const el2 = document.getElementById('wFgChart');
    if (!el2 || !history?.length) return;
    const pts = history.filter(pt => pt.v != null && isFinite(pt.v));
    if (!pts.length) return;

    // Insert a synthetic point exactly at v=50 wherever the series crosses the
    // neutral line, so the bezier curves are pinned there and neither the green
    // nor red band can overshoot into the other's territory.
    const pinned = [];
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) {
        const v1 = +pts[i - 1].v, v2 = +pts[i].v;
        if ((v1 - 50) * (v2 - 50) < 0) {
          const t1 = +pts[i - 1].t, t2 = +pts[i].t;
          const tc = t1 + (t2 - t1) * (50 - v1) / (v2 - v1);
          pinned.push({ t: tc, v: 50 });
        }
      }
      pinned.push(pts[i]);
    }

    new ApexCharts(el2, {
      series: [
        // Line uses original pts — no synthetic crossing points so no extra hover dot
        { name: 'Fear & Greed', type: 'line',      data: pts.map(pt => ({ x: +pt.t, y: +pt.v })) },
        // Bands use pinned pts so bezier is anchored exactly at 50 at each crossing
        { name: '',             type: 'rangeArea', data: pinned.map(pt => ({ x: +pt.t, y: [50, Math.max(+pt.v, 50)] })) },
        { name: '',             type: 'rangeArea', data: pinned.map(pt => ({ x: +pt.t, y: [Math.min(+pt.v, 50), 50] })) },
      ],
      // 'rangeArea' as the base type is required for mixed line+rangeArea charts
      chart: { type: 'rangeArea', height: 170, toolbar: { show: false }, animations: { enabled: false }, background: 'transparent' },
      theme: { mode: 'dark' },
      dataLabels: { enabled: false },
      colors: [hex, '#22c55e', '#ef4444'],
      stroke: { curve: ['smooth', 'straight', 'straight'], width: [1.5, 0, 0] },
      fill: {
        type: ['solid', 'gradient', 'gradient'],
        opacity: [0, 1, 1],
        gradient: {
          shade: 'dark',
          type: 'vertical',
          opacityFrom: 0.95,
          opacityTo: 0.65,
          stops: [0, 100],
        },
      },
      legend: { show: false },
      xaxis: { type: 'datetime', labels: { style: { colors: '#6888b0', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { min: 0, max: 100, show: false },
      grid: { borderColor: '#1a2744', strokeDashArray: 3, padding: { left: 4, right: 4 } },
      tooltip: {
        theme: 'dark',
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const val  = series[0][dataPointIndex];
          const ts   = w.globals.seriesX[0][dataPointIndex];
          const date = new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
          const col  = w.globals.colors[0];
          return `<div style="padding:6px 10px;font-size:12px">` +
            `<span style="color:${col}">&#9679;</span> ` +
            `<b>Fear and Greed</b>: ${(+val).toFixed(1)}` +
            `</div>`;
        },
      },
      annotations: { yaxis: [
        { y: 25, borderColor: '#7f1d1d', borderWidth: 1, label: { text: 'Extreme Fear',  style: { color: '#ef4444', background: 'transparent', fontSize: '9px', padding: { left:0, right:0, top:0, bottom:0 } } } },
        { y: 50, borderColor: '#4a5e80', borderWidth: 1, strokeDashArray: 4, label: { text: 'Neutral', style: { color: '#7080a0', background: 'transparent', fontSize: '9px', padding: { left:0, right:0, top:0, bottom:0 } } } },
        { y: 75, borderColor: '#14532d', borderWidth: 1, label: { text: 'Extreme Greed', style: { color: '#22c55e', background: 'transparent', fontSize: '9px', padding: { left:0, right:0, top:0, bottom:0 } } } },
      ]},
    }).render();
  }

  // ── Yield charts (Earnings Yield / Book Yield) ────────────────────────────
  function buildYieldChart(elId, lineData, lineColor, name, mean, meanLabel) {
    const el2 = document.getElementById(elId);
    if (!el2 || !lineData?.length) return;
    new ApexCharts(el2, {
      series: [{ name, data: lineData.map(p => [p.x, p.y]) }],
      chart: { type: 'area', height: 160, toolbar: { show: false }, animations: { enabled: false }, background: 'transparent' },
      theme: { mode: 'dark' },
      dataLabels: { enabled: false },
      colors: [lineColor],
      stroke: { curve: 'smooth', width: 1.5 },
      fill: { type: 'gradient', gradient: { shade: 'dark', opacityFrom: 0.75, opacityTo: 0.15 } },
      xaxis: { type: 'datetime', labels: { style: { colors: '#6888b0', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { formatter: v => v.toFixed(2) + '%', style: { colors: '#6888b0', fontSize: '10px' } }, tickAmount: 4 },
      grid: { borderColor: '#1a2744', strokeDashArray: 3, padding: { left: 4, right: 4 } },
      tooltip: { theme: 'dark', x: { format: 'MMM yyyy' }, y: { formatter: v => v.toFixed(3) + '%' } },
      annotations: mean != null ? { yaxis: [{
        y: mean, borderColor: '#4a5e80', borderWidth: 1, strokeDashArray: 4,
        label: { text: meanLabel, style: { color: '#6888b0', background: 'transparent', fontSize: '9px', padding: { left:2, right:2, top:0, bottom:0 } } },
      }] } : {},
    }).render();
  }

  // ── Buffett indicator ─────────────────────────
  const BUFFETT_ZONES = [
    { max:  75, label: 'Undervalued',              color: '#22c55e' },
    { max:  90, label: 'Fair Valued',              color: '#84cc16' },
    { max: 115, label: 'Modestly Overvalued',      color: '#eab308' },
    { max: 135, label: 'Overvalued',               color: '#f97316' },
    { max: Infinity, label: 'Significantly Overvalued', color: '#ef4444' },
  ];
  function buffettZone(val) {
    return BUFFETT_ZONES.find(z => val < z.max) || BUFFETT_ZONES[BUFFETT_ZONES.length - 1];
  }
  function buildBuffettChart(series, zoneColor, mean) {
    const el2 = document.getElementById('wBuffettChart');
    if (!el2 || !series?.length) return;
    const data = series.map(p => [new Date(p.date).getTime(), p.value]);
    new ApexCharts(el2, {
      series: [{ name: 'Market Cap / GDP', data }],
      chart: { type: 'area', height: 140, toolbar: { show: false }, animations: { enabled: false }, background: 'transparent' },
      theme: { mode: 'dark' },
      dataLabels: { enabled: false },
      colors: [zoneColor],
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shade: 'dark', opacityFrom: 0.75, opacityTo: 0.45 } },
      xaxis: { type: 'datetime', labels: { style: { colors: '#6888b0', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { formatter: v => v.toFixed(0) + '%', style: { colors: '#6888b0', fontSize: '10px' } }, tickAmount: 4 },
      grid: { borderColor: '#1a2744', strokeDashArray: 3, padding: { left: 4, right: 4 } },
      tooltip: { theme: 'dark', x: { format: 'MMM yyyy' }, y: { formatter: v => v.toFixed(1) + '%' } },
      annotations: { yaxis: [
        { y: 75,  borderColor: '#22c55e', borderWidth: 1, strokeDashArray: 4, label: { text: 'Undervalued',  style: { color: '#22c55e', background: 'transparent', fontSize: '9px' } } },
        { y: 100, borderColor: '#4a5e80', borderWidth: 1, strokeDashArray: 4, label: { text: 'Fair value',   style: { color: '#7080a0', background: 'transparent', fontSize: '9px' } } },
        { y: 135, borderColor: '#ef4444', borderWidth: 1, strokeDashArray: 4, label: { text: 'Overvalued',   style: { color: '#ef4444', background: 'transparent', fontSize: '9px' } } },
      ]},
    }).render();
  }

  // ── Component mini-card row ───────────────────
  const COMP_DEFS = [
    { key: 'momentum',   name: 'Market Momentum', sub: 'S&P 500 vs 125-day avg'          },
    { key: 'strength',   name: 'Price Strength',  sub: '52-week highs vs lows'            },
    { key: 'breadth',    name: 'Price Breadth',   sub: 'McClellan volume summation'        },
    { key: 'put_call',   name: 'Put / Call',       sub: 'Put-to-call options ratio'        },
    { key: 'vix',        name: 'Volatility',       sub: 'VIX vs 50-day avg'               },
    { key: 'junk_bond',  name: 'Junk Bond',        sub: 'Junk vs investment-grade demand'  },
    { key: 'safe_haven', name: 'Safe Haven',       sub: 'Stocks vs bonds return'           },
  ];

  function buildCompRow(components) {
    const comps = components || {};
    return COMP_DEFS.map(def => {
      const c   = comps[def.key];
      const sc  = c?.score ?? null;
      const col = scoreColor(sc);
      const rMeta = sc != null ? ratingMeta(c?.rating || '') : null;
      return `
        <div class="mw-comp-mini">
          <div class="mw-comp-name">${def.name}</div>
          <div class="mw-comp-sub">${def.sub}</div>
          <div class="mw-comp-score" style="color:${col}">${sc != null ? sc.toFixed(0) : '—'}</div>
          <div class="mw-comp-bar-track">
            <div class="mw-comp-bar-fill" style="width:${sc ?? 0}%;background:${col}"></div>
          </div>
          <div class="mw-comp-rating">${rMeta ? rMeta.label : '—'}</div>
        </div>`;
    }).join('');
  }

  // ── Stock rankings table ─────────────────────
  const STOCK_COLS = [
    { key: 'earnings_yield',      label: 'EY %',      fmt: v => v != null ? v.toFixed(2) + '%' : '—' },
    { key: 'book_yield',          label: 'BY %',      fmt: v => v != null ? v.toFixed(2) + '%' : '—' },
    { key: 'dividend_yield',      label: 'Div %',     fmt: v => v != null ? v.toFixed(2) + '%' : '—' },
    { key: 'roe_pct',             label: 'ROE %',     fmt: v => v != null ? v.toFixed(1) + '%' : '—' },
    { key: 'roa_pct',             label: 'ROA %',     fmt: v => v != null ? v.toFixed(1) + '%' : '—' },
    { key: 'net_margin_pct',      label: 'Net Mg',    fmt: v => v != null ? v.toFixed(1) + '%' : '—' },
    { key: 'op_margin_pct',       label: 'Op Mg',     fmt: v => v != null ? v.toFixed(1) + '%' : '—' },
    { key: 'revenue_growth_pct',  label: 'Rev Gr',    fmt: v => v != null ? (v > 0 ? '+' : '') + v.toFixed(1) + '%' : '—' },
    { key: 'earnings_growth_pct', label: 'EPS Gr',    fmt: v => v != null ? (v > 0 ? '+' : '') + v.toFixed(1) + '%' : '—' },
    { key: 'debt_to_equity',      label: 'D/E %',     fmt: v => v != null ? (v * 100).toFixed(0) + '%' : '—' },
    { key: 'peg_ratio',           label: '1/PEG %',   fmt: v => (v != null && v > 0) ? (100 / v).toFixed(1) + '%' : '—' },
    { key: 'fcf_ev_yield',        label: 'FCF/EV',    fmt: v => v != null ? v.toFixed(2) + '%' : '—' },
  ];

  function buildStocksTable(stocks) {
    if (!stocks?.length) return '';
    const rows = stocks.map((s, i) => {
      const cells = STOCK_COLS.map(c => {
        const v = s[c.key];
        const text = c.fmt(v != null ? parseFloat(v) : null);
        return `<td class="mw-td-num">${text}</td>`;
      }).join('');
      return `<tr>
        <td class="mw-td-rank">${i + 1}</td>
        <td class="mw-td-ticker"><a href="https://finance.bariscankose.com/stock/${s.ticker}" target="_blank" rel="noopener">${s.ticker}</a></td>
        <td class="mw-td-name" title="${s.name || ''}">${s.name || '—'}</td>
        <td class="mw-td-sector">${s.sector || '—'}</td>
        ${cells}
      </tr>`;
    }).join('');

    const headers = STOCK_COLS.map(c => `<th>${c.label}</th>`).join('');
    return `
      <div class="mw-table-wrap">
        <table class="mw-stocks-table">
          <thead><tr>
            <th>#</th><th>Ticker</th><th>Company</th><th>Sector</th>
            ${headers}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="mw-table-legend">EY = Earnings Yield (100 / P·E) &nbsp;·&nbsp; BY = Book Yield (100 / P·B) — higher means cheaper relative to earnings or book value &nbsp;·&nbsp; 1/PEG = earnings growth per unit of valuation (higher = better) &nbsp;·&nbsp; D/E = Debt-to-Equity as % &nbsp;·&nbsp; FCF/EV = Free Cash Flow / Enterprise Value yield</p>`;
  }

  // ── Fetch & render ────────────────────────────
  try {
    const [data, rankings] = await Promise.all([
      fetch('https://finance.bariscankose.com/api/snapshot',     { cache: 'no-store' }).then(r => r.json()),
      fetch('https://finance.bariscankose.com/api/top-rankings', { cache: 'no-store' }).then(r => r.json()),
    ]);

    const fg  = data.fear_greed;
    const yld = data.yields;
    const bi  = data.buffett;

    // F&G
    const rm    = ratingMeta(fg?.rating || '');
    const score = fg?.score ?? 50;
    const col   = rm.hex;

    // Buffett
    const bz     = bi?.current != null ? buffettZone(bi.current) : null;
    const biCur  = bi?.current != null ? bi.current.toFixed(1) + '%' : '—';
    const bzHtml = bz ? BUFFETT_ZONES.map(z => {
      const i = BUFFETT_ZONES.indexOf(z);
      const range = z.max === Infinity ? '> 135%' : i === 0 ? '< 75%' : `${BUFFETT_ZONES[i-1].max}–${z.max}%`;
      return `<div class="mw-bz-row"><div class="mw-bz-dot" style="background:${z.color}"></div><span class="mw-bz-label">${z.label} ${range}</span></div>`;
    }).join('') : '';

    // Yields — current scalars
    const eyCur = yld?.ey_current != null ? yld.ey_current.toFixed(2) + '%' : '—';
    const byCur = yld?.by_current != null ? yld.by_current.toFixed(2) + '%' : '—';

    // Invert raw ratio series → yield (100/v), compute mean over the display
    // window only (so mean matches what the chart actually shows).
    function prepYieldSeries(s, windowYears) {
      if (!s?.dates?.length || !s?.values?.length) return { series: [], mean: null, meanLabel: '' };
      const cutoff = windowYears ? Date.now() - windowYears * 365.25 * 24 * 3600 * 1000 : 0;
      const series = [];
      for (let i = 0; i < s.dates.length; i++) {
        const v = s.values[i];
        if (v == null || v <= 0) continue;
        if (new Date(s.dates[i]).getTime() >= cutoff)
          series.push({ x: new Date(s.dates[i]).getTime(), y: 100 / v });
      }
      const mean = series.length ? series.reduce((a, b) => a + b.y, 0) / series.length : null;
      return { series, mean, meanLabel: mean != null ? `Mean ${mean.toFixed(2)}%` : '' };
    }
    const eyHist = prepYieldSeries(yld?.shiller_pe, 20);
    const byHist = prepYieldSeries(yld?.sp500_pb,   null);

    el.innerHTML = `
      <!-- ── Buffett Indicator ── -->
      <div class="mw-panel">
        <div class="mw-panel-hdr">
          <span class="mw-panel-title">Buffett Indicator · Market Cap / GDP</span>
          <a class="mw-panel-link" href="https://fred.stlouisfed.org/series/NCBEILQ027S" target="_blank" rel="noopener">FRED ↗</a>
        </div>
        <div class="mw-buffett-stat">
          <span class="mw-yield-lbl">Market Cap / GDP</span>
          <span class="mw-yield-val" style="color:${bz?.color ?? '#4a5e80'}">${biCur}</span>
          ${bz ? `<span class="mw-pill" style="background:${bz.color}22;color:${bz.color}">${bz.label}</span>` : ''}
        </div>
        <div id="wBuffettChart"></div>
        <div class="mw-bz-legend">${bzHtml}</div>
      </div>

      <!-- ── S&P 500 Yields (2 columns) ── -->
      <div class="mw-yields-row">
        <div class="mw-panel">
          <div class="mw-panel-hdr">
            <span class="mw-panel-title">Earnings Yield · Shiller CAPE · 20Y</span>
            <a class="mw-panel-link" href="https://www.multpl.com/shiller-pe" target="_blank" rel="noopener">multpl.com ↗</a>
          </div>
          <div class="mw-yield-stat">
            <span class="mw-yield-lbl">100 / CAPE</span>
            <span class="mw-yield-val" style="color:#00d4ff">${eyCur}</span>
          </div>
          <div id="wEYChart"></div>
        </div>
        <div class="mw-panel">
          <div class="mw-panel-hdr">
            <span class="mw-panel-title">Book Yield · S&amp;P 500 P/B · 25Y</span>
            <a class="mw-panel-link" href="https://www.multpl.com/s-p-500-price-to-book" target="_blank" rel="noopener">multpl.com ↗</a>
          </div>
          <div class="mw-yield-stat">
            <span class="mw-yield-lbl">100 / P·B</span>
            <span class="mw-yield-val" style="color:#7c3aed">${byCur}</span>
          </div>
          <div id="wBYChart"></div>
        </div>
      </div>

      <!-- ── Fear & Greed ── -->
      <div class="mw-panel">
        <div class="mw-panel-hdr">
          <span class="mw-panel-title">Fear &amp; Greed Index</span>
          <a class="mw-panel-link" href="https://www.cnn.com/markets/fear-and-greed" target="_blank" rel="noopener">CNN Markets ↗</a>
        </div>
        <div class="mw-fg-main">
          <div class="mw-gauge-wrap">
            ${buildGauge(score)}
            <div class="mw-fg-score-row">
              <span class="mw-fg-score-num" style="color:${col}">${score.toFixed(1)}</span>
              <span class="mw-pill ${rm.pillCls}">${rm.label}</span>
            </div>
          </div>
          <div class="mw-fg-chart-side">
            <div class="mw-chart-label">Last 12 months</div>
            <div id="wFgChart"></div>
          </div>
        </div>
        <div class="mw-comps-row">${buildCompRow(fg?.components)}</div>
      </div>

      <!-- ── Top 20 Rankings ── -->
      <div class="mw-panel">
        <div class="mw-panel-hdr">
          <span class="mw-panel-title">Top 20 Ranked Stocks · Composite Score</span>
          <a class="mw-panel-link" href="https://finance.bariscankose.com/ranking" target="_blank" rel="noopener">Full rankings ↗</a>
        </div>
        ${buildStocksTable(rankings)}
      </div>`;

    // Compute mean for Buffett chart shading
    const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const biMean = bi?.series?.length ? mean(bi.series.map(p => p.value)) : null;

    // Render charts (errors here must not wipe the widget)
    try { buildBuffettChart(bi?.series, bz?.color ?? '#4a5e80', biMean); } catch {}
    try { buildFGChart(fg?.history, col); } catch {}
    try { buildYieldChart('wEYChart', eyHist.series, '#00d4ff', 'Earnings Yield', eyHist.mean, eyHist.meanLabel); } catch {}
    try { buildYieldChart('wBYChart', byHist.series, '#7c3aed', 'Book Yield',     byHist.mean, byHist.meanLabel); } catch {}

  } catch {
    el.innerHTML = '<div class="snap-loading">Market data temporarily unavailable.</div>';
  }
})();

/* ═══════════════════════════════════════════════
   HERO ROLE TYPER
═══════════════════════════════════════════════ */
const roles = [
  'Machine Learning Engineer',
  'Embedded Systems Developer',
  'Full-Stack Engineer',
];
let roleIdx = 0, charIdx = 0, deleting = false;
const roleEl = document.getElementById('roleText');

function typeRole() {
  const current = roles[roleIdx];
  if (!deleting) {
    roleEl.textContent = current.slice(0, ++charIdx);
    if (charIdx === current.length) { deleting = true; setTimeout(typeRole, 2200); return; }
  } else {
    roleEl.textContent = current.slice(0, --charIdx);
    if (charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; }
  }
  setTimeout(typeRole, deleting ? 45 : 80);
}
typeRole();

/* ═══════════════════════════════════════════════
   HERO CANVAS — INTERACTIVE PARTICLE NETWORK
═══════════════════════════════════════════════ */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles;
  let target   = { x: 0, y: 0 };
  let smoothed = { x: 0, y: 0 };
  let hasMouse = false;
  let tick     = 0;

  const N         = 120;
  const MAX_DIST  = 180;
  const ATTRACT_R = 300;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    if (!hasMouse) { target.x = smoothed.x = W / 2; target.y = smoothed.y = H / 2; }
  }

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x     = Math.random() * W;
      this.y     = Math.random() * H;
      this.baseVx = (Math.random() - 0.5) * 0.5;
      this.baseVy = (Math.random() - 0.5) * 0.5;
      this.vx    = this.baseVx;
      this.vy    = this.baseVy;
      this.r     = Math.random() * 1.8 + 0.8;
      this.hue   = Math.random() < 0.65 ? 185 + Math.random() * 25 : 258 + Math.random() * 22;
      this.phase = Math.random() * Math.PI * 2;
      this.speed = 0.4 + Math.random() * 0.7;
    }
    update(t) {
      // Organic sine-wave drift — always moving even without cursor
      this.vx = this.baseVx + Math.cos(t * 0.0006 + this.phase) * 0.4 * this.speed;
      this.vy = this.baseVy + Math.sin(t * 0.0008 + this.phase * 1.3) * 0.4 * this.speed;

      // Gentle attraction toward smoothed cursor
      const dx   = smoothed.x - this.x;
      const dy   = smoothed.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ATTRACT_R && dist > 1) {
        const str = (1 - dist / ATTRACT_R) * 0.022 * this.speed;
        this.vx  += (dx / dist) * str;
        this.vy  += (dy / dist) * str;
      }

      // Speed cap
      const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (spd > 2.4) { this.vx = this.vx / spd * 2.4; this.vy = this.vy / spd * 2.4; }

      this.x += this.vx;
      this.y += this.vy;

      // Wrap edges
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }
    draw(t) {
      const pulse = 0.75 + 0.25 * Math.sin(t * 0.0018 + this.phase);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue},100%,72%,${0.55 + 0.4 * pulse})`;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: N }, () => new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.55;
          const grad  = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          grad.addColorStop(0, `hsla(${particles[i].hue},100%,65%,${alpha})`);
          grad.addColorStop(1, `hsla(${particles[j].hue},100%,65%,${alpha})`);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = alpha * 1.6;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    tick++;

    // Lazy cursor follow
    smoothed.x += (target.x - smoothed.x) * 0.045;
    smoothed.y += (target.y - smoothed.y) * 0.045;

    ctx.fillStyle = 'rgba(5,10,20,0.2)';
    ctx.fillRect(0, 0, W, H);

    particles.forEach(p => { p.update(tick); p.draw(tick); });
    drawConnections();

    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);

  // Track cursor anywhere on the page
  window.addEventListener('mousemove', e => {
    hasMouse = true;
    target.x = e.clientX;
    target.y = e.clientY - canvas.getBoundingClientRect().top;
  });

  // Touch support
  window.addEventListener('touchmove', e => {
    hasMouse = true;
    const t  = e.touches[0];
    target.x = t.clientX;
    target.y = t.clientY - canvas.getBoundingClientRect().top;
  }, { passive: true });

  // When no cursor: slowly orbit around centre so it's always alive
  setInterval(() => {
    if (!hasMouse) {
      const t  = Date.now() * 0.00035;
      target.x = W / 2 + Math.cos(t) * W * 0.28;
      target.y = H / 2 + Math.sin(t * 0.6) * H * 0.22;
    }
  }, 16);

  init();
  loop();
})();

/* ═══════════════════════════════════════════════
   GSAP — SCROLL ANIMATIONS, ENTRANCE & COUNTERS
═══════════════════════════════════════════════ */
(function initGSAP() {
  // Safety net: if CDN didn't load, reveal everything after 2 s
  const fallback = setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = '1'; });
    // Plain counter fallback
    document.querySelectorAll('.stat-number').forEach(el => {
      el.textContent = el.dataset.target;
    });
  }, 2000);

  // Both must be present — if either CDN script failed, let the fallback reveal everything
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  clearTimeout(fallback);

  gsap.registerPlugin(ScrollTrigger);

  /* ── Hero entrance (fires on page load) ───── */
  gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform' } })
    .from('.hero-photo-wrapper', { x: -55, opacity: 0, duration: 0.95 }, 0.15)
    .from('.hero-greeting',      { x: 38,  opacity: 0, duration: 0.75 }, 0.35)
    .from('.hero-name',          { x: 38,  opacity: 0, duration: 0.75 }, 0.48)
    .from('.hero-roles',         { x: 38,  opacity: 0, duration: 0.65 }, 0.6)
    .from('.hero-location',      { x: 38,  opacity: 0, duration: 0.6  }, 0.72)
    .from('.hero-links',         { y: 20,  opacity: 0, duration: 0.65 }, 0.84)
    .from('.scroll-indicator',   { y: 14,  opacity: 0, duration: 0.5  }, 0.96);

  /* ── Hero parallax (scrub with scroll) ─────── */
  gsap.to('.hero-content', {
    yPercent: 16, ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
    }
  });

  /*
   * .reveal elements have opacity:0 in CSS.
   * gsap.from() would read that as the "to" value → animates 0→0, stays invisible.
   * Use fromTo() everywhere to explicitly set the end state to opacity:1.
   */

  /* ── Utility: fromTo reveal for individual elements ─ */
  function revealEach(selector, fromVars, toExtra) {
    gsap.utils.toArray(selector).forEach(el => {
      gsap.fromTo(el, fromVars, {
        opacity: 1, x: 0, y: 0, scale: 1,
        ...toExtra,
        clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 87%', toggleActions: 'play none none none' }
      });
    });
  }

  /* ── Section titles (slide from left) ─────── */
  revealEach('.section-title.reveal',    { x: -42, opacity: 0 }, { duration: 0.85, ease: 'power3.out' });

  /* ── Section subtitles (fade up) ─────────── */
  revealEach('.section-subtitle.reveal', { y: 24,  opacity: 0 }, { duration: 0.7,  ease: 'power2.out' });

  /* ── About text ──────────────────────────── */
  revealEach('.about-text.reveal',       { y: 32,  opacity: 0 }, { duration: 0.9,  ease: 'power3.out' });

  /* ── Stat cards (container + stagger) ─────── */
  ScrollTrigger.create({
    trigger: '.about-stats', start: 'top 84%', once: true,
    onEnter() {
      gsap.set('.about-stats.reveal', { opacity: 1 });
      gsap.fromTo('.about-stats .stat-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.13, ease: 'back.out(1.5)', clearProps: 'transform' }
      );
    }
  });

  /* ── Skill groups (container + stagger) ───── */
  ScrollTrigger.create({
    trigger: '.skills-section', start: 'top 84%', once: true,
    onEnter() {
      gsap.set('.skills-section.reveal', { opacity: 1 });
      gsap.fromTo('.skill-group',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.15, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  });

  /* ── Timeline items (slide from left) ────── */
  gsap.utils.toArray('.timeline-item.reveal').forEach(item => {
    gsap.fromTo(item,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.85, ease: 'power3.out', clearProps: 'transform',
        scrollTrigger: { trigger: item, start: 'top 84%', toggleActions: 'play none none none' } }
    );
  });

  /* ── Project cards (stagger upward) ─────────── */
  gsap.fromTo('.project-card.reveal',
    { y: 52, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.72, stagger: 0.09, ease: 'power3.out', clearProps: 'transform',
      scrollTrigger: { trigger: '.projects-grid', start: 'top 84%' } }
  );

  /* ── Art cards (stagger scale+fade) ──────────── */
  gsap.fromTo('.art-card.reveal',
    { scale: 0.88, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.78, stagger: 0.16, ease: 'back.out(1.2)', clearProps: 'transform',
      scrollTrigger: { trigger: '.art-grid', start: 'top 84%' } }
  );

  /* ── Markets widgets ─────────────────────────── */
  // (TradingView widgets removed — market widget revealed via .market-snapshot.reveal above)

  /* ── Gallery wrapper ─────────────────────────── */
  revealEach('.encyclopedia-wrapper.reveal', { y: 32, opacity: 0 }, { duration: 0.8, ease: 'power2.out' });

  /* ── Poster cards (stagger up) ───────────────── */
  gsap.fromTo('.poster-card.reveal',
    { y: 38, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.78, stagger: 0.2, ease: 'power2.out', clearProps: 'transform',
      scrollTrigger: { trigger: '.posters-grid', start: 'top 84%' } }
  );
  revealEach('.poster-credit.reveal', { y: 16, opacity: 0 }, { duration: 0.6, ease: 'power2.out' });

  /* ── Sign-offs & Quotes carousels ────────────── */
  revealEach('.signoff-carousel.reveal', { y: 40, opacity: 0 }, { duration: 0.9, ease: 'power3.out' });
  revealEach('.quotes-carousel.reveal',  { y: 40, opacity: 0 }, { duration: 0.9, ease: 'power3.out' });

  /* ── Education cards (stagger) ───────────────── */
  gsap.fromTo('.education-card.reveal',
    { y: 38, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.78, stagger: 0.2, ease: 'power2.out', clearProps: 'transform',
      scrollTrigger: { trigger: '.education-grid', start: 'top 84%' } }
  );

  /* ── Contact links ───────────────────────────── */
  revealEach('.contact-links.reveal', { y: 28, opacity: 0 }, { duration: 0.8, ease: 'power3.out' });

  /* ── Stat counters (smooth GSAP tween) ──────── */
  document.querySelectorAll('.stat-number').forEach(el => {
    const end = +el.dataset.target;
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter() {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end, duration: 2.2, ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(obj.val); }
        });
      }
    });
  });

})();

/* ═══════════════════════════════════════════════
   ART CANVAS 1 — NEURAL WEB (flow field)
═══════════════════════════════════════════════ */
(function initArt1() {
  const canvas = document.getElementById('artCanvas1');
  const ctx    = canvas.getContext('2d');
  let W, H, t = 0;
  const pts  = [];
  const N    = 65;
  let mouse  = { x: -9999, y: -9999 };

  function noise(x, y, time) {
    return Math.sin(x * 0.008 + time * 0.7) * Math.cos(y * 0.009 + time * 0.5)
         + Math.sin(x * 0.015 - y * 0.012 + time * 0.4) * 0.5;
  }

  function resize() {
    const size = canvas.parentElement.clientWidth;
    W = H = canvas.width = canvas.height = Math.min(size, 400);
  }

  class FlowParticle {
    constructor() { this.reset(); }
    reset() {
      this.x   = Math.random() * W;
      this.y   = Math.random() * H;
      this.age = 0;
      this.max = 80 + Math.random() * 80;
      this.hue = 160 + Math.random() * 120;
    }
    update(time) {
      let angle = noise(this.x, this.y, time) * Math.PI * 2;

      // Cursor repulsion — deflects flow angle when mouse is nearby
      const dx   = this.x - mouse.x;
      const dy   = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const R    = 80;
      if (dist < R && dist > 0.5) {
        const push  = (1 - dist / R) * 2.5;
        const away  = Math.atan2(dy, dx);
        angle = angle + (away - angle) * push;
      }

      this.x += Math.cos(angle) * 1.6;
      this.y += Math.sin(angle) * 1.6;
      this.age++;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H || this.age > this.max) this.reset();
    }
    draw(prevX, prevY) {
      const alpha = Math.sin(this.age / this.max * Math.PI) * 0.7;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = `hsla(${this.hue},100%,65%,${alpha})`;
      ctx.lineWidth   = 1.2;
      ctx.stroke();
    }
  }

  function init() {
    resize();
    pts.length = 0;
    for (let i = 0; i < N; i++) pts.push(new FlowParticle());
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
  }

  function loop() {
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, 0, W, H);
    const time = t * 0.003;
    pts.forEach(p => {
      const px = p.x, py = p.y;
      p.update(time);
      p.draw(px, py);
    });
    t++;
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (W / rect.width);
    mouse.y = (e.clientY - rect.top)  * (H / rect.height);
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t    = e.touches[0];
    mouse.x = (t.clientX - rect.left) * (W / rect.width);
    mouse.y = (t.clientY - rect.top)  * (H / rect.height);
  }, { passive: false });
  canvas.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });

  const resObs = new ResizeObserver(init);
  resObs.observe(canvas.parentElement);
  init();
  loop();
})();

/* ═══════════════════════════════════════════════
   ART CANVAS 2 — LORENZ ATTRACTOR
═══════════════════════════════════════════════ */
(function initArt2() {
  const canvas = document.getElementById('artCanvas2');
  const ctx    = canvas.getContext('2d');
  let W, H;

  const dt = 0.007, sigma = 10, rho = 28, beta = 8 / 3;
  let x = 0.1, y = 0, z = 0;
  let t = 0;
  const trail = [];
  const maxTrail = 800;

  function resize() {
    const size = canvas.parentElement.clientWidth;
    W = H = canvas.width = canvas.height = Math.min(size, 400);
  }

  function project(lx, ly, lz) {
    const angle = t * 0.003;
    const cosA  = Math.cos(angle), sinA = Math.sin(angle);
    const rx    = lx * cosA - ly * sinA;
    const scale = W / 55;
    return {
      sx: W / 2 + rx * scale,
      sy: H / 2 - (lz - 25) * scale * 0.95,
    };
  }

  function init() {
    resize();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
  }

  function loop() {
    const dx = sigma * (y - x) * dt;
    const dy = (x * (rho - z) - y) * dt;
    const dz = (x * y - beta * z) * dt;
    x += dx; y += dy; z += dz;

    trail.push({ x, y, z });
    if (trail.length > maxTrail) trail.shift();

    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, 0, W, H);

    for (let i = 1; i < trail.length; i++) {
      const { sx: x1, sy: y1 } = project(trail[i-1].x, trail[i-1].y, trail[i-1].z);
      const { sx: x2, sy: y2 } = project(trail[i].x, trail[i].y, trail[i].z);
      const prog  = i / trail.length;
      const hue   = (t * 0.4 + prog * 120) % 360;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsla(${hue},100%,65%,${prog * 0.9})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    t++;
    requestAnimationFrame(loop);
  }

  const resObs = new ResizeObserver(init);
  resObs.observe(canvas.parentElement);
  init();
  loop();
})();

/* ═══════════════════════════════════════════════
   ART CANVAS 3 — WAVE INTERFERENCE
═══════════════════════════════════════════════ */
(function initArt3() {
  const canvas = document.getElementById('artCanvas3');
  const ctx    = canvas.getContext('2d');
  let W, H, imageData, t = 0;

  function resize() {
    const size = canvas.parentElement.clientWidth;
    W = H = canvas.width = canvas.height = Math.min(size, 400);
    imageData = ctx.createImageData(W, H);
  }

  const sources = [
    { x: 0.25, y: 0.35 },
    { x: 0.75, y: 0.65 },
    { x: 0.5,  y: 0.2  },
  ];

  function loop() {
    const data = imageData.data;
    const time = t * 0.025;
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        let val = 0;
        sources.forEach((s, i) => {
          const dx   = px / W - s.x;
          const dy   = py / H - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const freq = 12 + i * 2;
          val += Math.sin(dist * freq * Math.PI * 2 - time * (1.2 + i * 0.3));
        });
        val /= sources.length;
        const norm = (val + 1) / 2;
        const idx  = (py * W + px) * 4;
        // Cyan-to-purple palette
        data[idx]   = Math.floor(norm * 80  + (1 - norm) * 120);
        data[idx+1] = Math.floor(norm * 200 + (1 - norm) * 20);
        data[idx+2] = Math.floor(norm * 255 + (1 - norm) * 220);
        data[idx+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    t++;
    requestAnimationFrame(loop);
  }

  const resObs = new ResizeObserver(resize);
  resObs.observe(canvas.parentElement);
  resize();
  loop();
})();

/* ═══════════════════════════════════════════════
   QUOTES CAROUSEL
═══════════════════════════════════════════════ */
const quotes = [
  { text: "Verba volant, scripta manent.", author: "Latin Proverb", cat: "Speech goes away, writing is permanent." },
  { text: "Knowledge isn't power until it's applied.", author: "Dale Carnegie", cat: "Self-Development" },
  { text: "The only rules that really matter are these: what a man can do and what a man can't do.", author: "Captain Jack Sparrow", cat: "Pirates of the Caribbean" },
  { text: "Beauty awakens the soul to act.", author: "Dante Alighieri", cat: "Literature" },
  { text: "Gradatim ferociter.", author: "Latin", cat: "Step by step, ferociously." },
  { text: "Ostinati Rigore.", author: "Leonardo da Vinci", cat: "Rigorous persistence." },
  { text: "If it works, it ain't stupid.", author: "Unknown", cat: "Engineering" },
  { text: "When you have 8–12 investments that are uncorrelated with each other, you decrease your risk by 80%.", author: "Tony Robbins", cat: "Investing" },
  { text: "You are not a drop in the ocean. You are the entire ocean in a drop.", author: "Rumi", cat: "Philosophy" },
  { text: "Data, data, data! I can't make bricks without clay.", author: "Sherlock Holmes", cat: "Arthur Conan Doyle" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", cat: "Art & Science" },
  { text: "An industry is a customer-satisfying process, not a goods-producing process.", author: "Theodore Levitt", cat: "Business" },
  { text: "What I cannot create, I do not understand.", author: "Richard Feynman", cat: "Science" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain", cat: "Wisdom" },
  { text: "My life got a lot better when I stopped trying to be happy and started trying to be useful.", author: "Alex Hormozi", cat: "Self-Development" },
  { text: "He who can, does not want to. He who wants to, cannot. He who knows, does not do. He who does, does not know. And thus the world goes badly.", author: "Ascoli Piceno, 1529", cat: "Italian Inscription" },
  { text: "You fear your own power, you fear your anger, the drive to do great or terrible things.", author: "Ra's Al Ghul", cat: "Batman Begins" },
  { text: "I must not fear. Fear is the mind-killer. Fear is the little death that brings obliteration. I will face my fear and permit it to pass over me and through me. Where the fear has gone there will be nothing — only I will remain.", author: "Frank Herbert", cat: "Dune" },
  { text: "Don't bend; don't water it down; don't try to make it logical; don't edit your own soul according to the fashion. Rather, follow your most intense obsessions mercilessly.", author: "Franz Kafka", cat: "Literature" },
  { text: "An expert is a man who has made all the mistakes which can be made, in a narrow field.", author: "Niels Bohr", cat: "Science" },
  { text: "Idleness makes the hours pass slowly and the years swiftly. Activity makes the hours short and the years long.", author: "Cesare Pavese", cat: "Literature" },
  { text: "World is decay. Life is perception.", author: "Democritus", cat: "470–370 BC" },
  { text: "Problem-solving is hunting; it is savage pleasure and we are born to it.", author: "Thomas Harris", cat: "The Silence of the Lambs" },
  { text: "You can't play truth games with people playing status games.", author: "Naval Ravikant", cat: "Philosophy" },
  { text: "Play to win or don't play at all.", author: "Unknown", cat: "Wisdom" },
  { text: "A man who is a master of patience is master of everything else.", author: "George Savile", cat: "Wisdom" },
];

let quoteIdx = 0;
let quoteTimer = null;
const quoteTextEl   = document.getElementById('quoteText');
const quoteAuthorEl = document.getElementById('quoteAuthor');
const quoteCatEl    = document.getElementById('quoteCategory');
const dotsEl        = document.getElementById('quoteDots');

function renderDots() {
  dotsEl.innerHTML = '';
  quotes.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'quote-dot' + (i === quoteIdx ? ' active' : '');
    d.setAttribute('aria-label', `Quote ${i+1}`);
    d.addEventListener('click', () => showQuote(i));
    dotsEl.appendChild(d);
  });
}

function showQuote(idx) {
  quoteIdx = (idx + quotes.length) % quotes.length;
  quoteTextEl.style.opacity = '0';
  setTimeout(() => {
    const q = quotes[quoteIdx];
    quoteTextEl.textContent  = q.text;
    quoteAuthorEl.textContent = `— ${q.author}`;
    quoteCatEl.textContent    = q.cat;
    quoteTextEl.style.opacity = '1';
    renderDots();
  }, 250);
  clearTimeout(quoteTimer);
  quoteTimer = setTimeout(() => showQuote(quoteIdx + 1), 7000);
}

document.getElementById('quotePrev').addEventListener('click', () => showQuote(quoteIdx - 1));
document.getElementById('quoteNext').addEventListener('click', () => showQuote(quoteIdx + 1));

showQuote(0);

/* ═══════════════════════════════════════════════
   SIGN-OFFS CAROUSEL
═══════════════════════════════════════════════ */
const signoffs = [
  "That's the way the cookie crumbles.",
  "In a galaxy far far away...",
  "That's Hollywood, for ya.",
  "No trees were destroyed in the sending of this message. However, a significant number of electrons were terribly inconvenienced.",
  "Don't stop believin'.",
  "That's all, folks!",
  "Tag, you're it.",
  "Like a unicorn, I'm off to spread magic elsewhere.",
  "I've already told you more than I know.",
  "Mic drop.",
  "Live, laugh, love that for you.",
  "Hakuna Matata.",
  "Risk it to get a biscuit.",
  "With anxiety.",
  "Sincerely confused.",
  "In the bleak midwinter.",
  "Let's not circle back.",
  "Respectfully no thanks.",
  "Another day of saving the bees.",
  "Please hesitate if you have any questions.",
  "Live, laugh, leave me alone.",
  "*Insert pleasantry here.*",
  "We do this not because it is easy, but because we thought it would be easy.",
  "Please hesitate to reach out.",
  "There's no toilet paper in the bathroom.",
  "Warm regards? In this economy?",
  "Your silliest goose.",
  "Drunk, lit, in this bit.",
  "With no sincerity.",
  "On the edge.",
  "Knuck if you buck.",
  "Light's on, no one's home.",
  "Firetrucks are actually watertrucks.",
];

let signoffIdx = 0;
let signoffTimer = null;
const signoffTextEl = document.getElementById('signoffText');
const signoffDotsEl = document.getElementById('signoffDots');

function renderSignoffDots() {
  signoffDotsEl.innerHTML = '';
  signoffs.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'quote-dot' + (i === signoffIdx ? ' active' : '');
    d.setAttribute('aria-label', `Sign-off ${i + 1}`);
    d.addEventListener('click', () => showSignoff(i));
    signoffDotsEl.appendChild(d);
  });
}

function showSignoff(idx) {
  signoffIdx = (idx + signoffs.length) % signoffs.length;
  signoffTextEl.style.opacity = '0';
  setTimeout(() => {
    signoffTextEl.textContent = signoffs[signoffIdx];
    signoffTextEl.style.opacity = '1';
    renderSignoffDots();
  }, 200);
  clearTimeout(signoffTimer);
  signoffTimer = setTimeout(() => showSignoff(signoffIdx + 1), 4000);
}

document.getElementById('signoffPrev').addEventListener('click', () => showSignoff(signoffIdx - 1));
document.getElementById('signoffNext').addEventListener('click', () => showSignoff(signoffIdx + 1));

showSignoff(0);

/* ═══════════════════════════════════════════════
   CURATED GALLERY VIEWER
═══════════════════════════════════════════════ */
(function initGallery() {
  const images    = (typeof GALLERY_IMAGES !== 'undefined') ? GALLERY_IMAGES : [];
  const imgEl     = document.getElementById('galleryImg');
  const captionEl = document.getElementById('galleryCaption');
  const loadingEl = document.getElementById('encLoading');
  const emptyEl   = document.getElementById('galleryEmpty');
  const pageEl    = document.getElementById('encCurrentPage');
  const totalEl   = document.getElementById('encTotalPages');
  const progressEl = document.getElementById('encProgressBar');
  const playIcon  = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');

  if (!images.length) {
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display  = 'none';
  pauseIcon.style.display = 'block';
  playIcon.style.display  = 'none';

  let current   = 0;
  let isPlaying = true;
  let autoTimer = null;
  const INTERVAL = 10000;
  const total    = images.length;

  totalEl.textContent = total;

  function resetProgress() {
    progressEl.style.transition = 'none';
    progressEl.style.width = '0%';
  }

  function startProgress() {
    resetProgress();
    setTimeout(() => {
      progressEl.style.transition = `width ${INTERVAL}ms linear`;
      progressEl.style.width = '100%';
    }, 50);
  }

  function showImage(idx) {
    current = (idx + total) % total;
    const entry = images[current];
    pageEl.textContent = current + 1;

    loadingEl.style.display = 'flex';
    imgEl.style.display = 'none';

    const tmp = new Image();
    tmp.onload = () => {
      imgEl.src = tmp.src;
      imgEl.alt = entry.caption || '';
      imgEl.style.display = 'block';
      captionEl.textContent = entry.caption || '';
      loadingEl.style.display = 'none';
    };
    tmp.onerror = () => {
      loadingEl.style.display = 'none';
      captionEl.textContent = `Could not load: ${entry.file}`;
    };
    tmp.src = `gallery/${entry.file}`;
  }

  function scheduleNext() {
    clearTimeout(autoTimer);
    if (!isPlaying) return;
    startProgress();
    autoTimer = setTimeout(() => {
      showImage(current + 1);
      scheduleNext();
    }, INTERVAL);
  }

  document.getElementById('encPrev').addEventListener('click', () => {
    showImage(current - 1);
    scheduleNext();
  });

  document.getElementById('encNext').addEventListener('click', () => {
    showImage(current + 1);
    scheduleNext();
  });

  document.getElementById('encPlayPause').addEventListener('click', () => {
    isPlaying = !isPlaying;
    playIcon.style.display  = isPlaying ? 'none'  : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';
    if (isPlaying) scheduleNext();
    else { clearTimeout(autoTimer); resetProgress(); }
  });

  showImage(0);
  scheduleNext();
})();
