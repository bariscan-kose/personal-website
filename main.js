'use strict';

/* ═══════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════ */
const navbar   = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  highlightNav();
}, { passive: true });

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  }
});

function highlightNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY  = window.scrollY + 100;
  sections.forEach(section => {
    const link = document.querySelector(`.nav-links a[href="#${section.id}"]`);
    if (!link) return;
    const top = section.offsetTop, h = section.offsetHeight;
    link.classList.toggle('active', scrollY >= top && scrollY < top + h);
  });
}

/* ═══════════════════════════════════════════════
   HERO ROLE TYPER
═══════════════════════════════════════════════ */
const roles = [
  'Full-Stack Engineer',
  'Embedded Systems Dev',
  'Machine Learning Engineer',
  'Data Scientist',
  'IoT Enthusiast',
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
  let W, H, particles, mouse = { x: -9999, y: -9999 };

  const N   = 90;
  const MAX = 160;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.r  = Math.random() * 2 + 1;
      this.hue = Math.random() < 0.7 ? 190 : 270; // cyan or purple
    }
    update() {
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.8;
        this.vx += (dx / dist) * force * 0.15;
        this.vy += (dy / dist) * force * 0.15;
      }
      this.vx *= 0.99;
      this.vy *= 0.99;
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) { this.x = 0; this.vx *= -1; }
      if (this.x > W) { this.x = W; this.vx *= -1; }
      if (this.y < 0) { this.y = 0; this.vy *= -1; }
      if (this.y > H) { this.y = H; this.vy *= -1; }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue},100%,70%,0.85)`;
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
        if (d < MAX) {
          const alpha = (1 - d / MAX) * 0.45;
          const grad  = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          grad.addColorStop(0, `hsla(${particles[i].hue},100%,65%,${alpha})`);
          grad.addColorStop(1, `hsla(${particles[j].hue},100%,65%,${alpha})`);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth   = 1;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.fillStyle = 'rgba(5,10,20,0.18)';
    ctx.fillRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); particles.forEach(p => p.reset()); });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  init();
  loop();
})();

/* ═══════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════ */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ═══════════════════════════════════════════════
   STAT COUNTERS
═══════════════════════════════════════════════ */
const statObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el     = e.target;
    const target = +el.dataset.target;
    const dur    = 1500;
    const step   = 16;
    let current  = 0;
    const inc    = target / (dur / step);
    const timer  = setInterval(() => {
      current += inc;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current);
    }, step);
    statObserver.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => statObserver.observe(el));

/* ═══════════════════════════════════════════════
   ART CANVAS 1 — NEURAL WEB (flow field)
═══════════════════════════════════════════════ */
(function initArt1() {
  const canvas = document.getElementById('artCanvas1');
  const ctx    = canvas.getContext('2d');
  let W, H, t = 0;
  const pts = [];
  const N   = 55;

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
      const angle = noise(this.x, this.y, time) * Math.PI * 2;
      this.x += Math.cos(angle) * 1.4;
      this.y += Math.sin(angle) * 1.4;
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
  { text: "The only rules that really matter are these: what a man can do and what a man can't do.", author: "Captain Jack Sparrow", cat: "Pirates of the Caribbean" },
  { text: "Beauty awakens the soul to act.", author: "Dante Alighieri", cat: "Literature" },
  { text: "Gradatim ferociter.", author: "Latin", cat: "Step by step, ferociously." },
  { text: "Ostinati Rigore.", author: "Leonardo da Vinci", cat: "Rigorous persistence." },
  { text: "As space, so atoms. As mind, so life.", author: "Bariscan Kose", cat: "Original" },
  { text: "You fear your own power, you fear your anger, the drive to do great or terrible things.", author: "Ra's Al Ghul", cat: "Batman Begins" },
  { text: "He who can, does not want to. He who wants to, cannot. He who knows, does not do. He who does, does not know. And thus the world goes badly.", author: "Ascoli Piceno, 1529", cat: "Italian Inscription" },
  { text: "We are built for romance and adventure, not for comfort. You are going to find the meaning of your life in adventure. Do what is right and see what happens.", author: "Jordan B. Peterson", cat: "Philosophy" },
  { text: "Data, data, data! I can't make bricks without clay.", author: "Sherlock Holmes", cat: "Arthur Conan Doyle" },
  { text: "I must not fear. Fear is the mind-killer. Fear is the little death that brings obliteration. I will face my fear and permit it to pass over me and through me. Where the fear has gone there will be nothing — only I will remain.", author: "Frank Herbert", cat: "Dune" },
  { text: "Don't bend; don't water it down; don't try to make it logical; don't edit your own soul according to the fashion. Rather, follow your most intense obsessions mercilessly.", author: "Franz Kafka", cat: "Literature" },
  { text: "An expert is a man who has made all the mistakes which can be made, in a narrow field.", author: "Niels Bohr", cat: "Science" },
  { text: "Idleness makes the hours pass slowly and the years swiftly. Activity makes the hours short and the years long.", author: "Cesare Pavese", cat: "Literature" },
  { text: "World is decay. Life is perception.", author: "Democritus", cat: "470–370 BC" },
  { text: "What I cannot create, I do not understand.", author: "Richard Feynman", cat: "Science" },
  { text: "Problem-solving is hunting; it is savage pleasure and we are born to it.", author: "Thomas Harris", cat: "The Silence of the Lambs" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", cat: "Art & Science" },
  { text: "Knowledge isn't power until it's applied.", author: "Dale Carnegie", cat: "Self-Development" },
  { text: "You can't play truth games with people playing status games.", author: "Naval Ravikant", cat: "Philosophy" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain", cat: "Wisdom" },
  { text: "An industry is a customer-satisfying process, not a goods-producing process.", author: "Theodore Levitt", cat: "Business" },
  { text: "Play to win or don't play at all.", author: "Unknown", cat: "Wisdom" },
  { text: "Boil things down to their fundamental truths and reason up from there. Most of our life, we reason by analogy, copying what other people do with slight variations.", author: "Elon Musk", cat: "First Principles" },
  { text: "If it works, it ain't stupid.", author: "Unknown", cat: "Engineering" },
  { text: "My life got a lot better when I stopped trying to be happy and started trying to be useful.", author: "Alex Hormozi", cat: "Self-Development" },
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
  "Please tell your mama I love 'er.",
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
   ENCYCLOPEDIA PDF VIEWER
═══════════════════════════════════════════════ */
(function initEncyclopedia() {
  if (typeof pdfjsLib === 'undefined') return;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const canvas   = document.getElementById('encyclopediaCanvas');
  const ctx      = canvas.getContext('2d');
  const loadingEl = document.getElementById('encLoading');
  const pageEl    = document.getElementById('encCurrentPage');
  const totalEl   = document.getElementById('encTotalPages');
  const progressEl = document.getElementById('encProgressBar');
  const playIcon  = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');

  let pdfDoc     = null;
  let currentPage = 1;
  let totalPages  = 362;
  let isPlaying   = true;
  let autoTimer   = null;
  let rendering   = false;
  const INTERVAL  = 10000;
  let progressStart = null;

  function animateProgress(elapsed) {
    const pct = Math.min((elapsed / INTERVAL) * 100, 100);
    progressEl.style.width = pct + '%';
    if (pct < 100) requestAnimationFrame(ts => animateProgress(ts - (progressStart - elapsed + ts)));
  }

  function startProgress() {
    progressEl.style.width = '0%';
    progressEl.style.transition = `width ${INTERVAL}ms linear`;
    requestAnimationFrame(() => { progressEl.style.width = '100%'; });
  }

  function resetProgress() {
    progressEl.style.transition = 'none';
    progressEl.style.width = '0%';
  }

  async function renderPage(num) {
    if (!pdfDoc || rendering) return;
    rendering = true;
    loadingEl.style.display = 'flex';
    try {
      const page     = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: 1 });
      const wrapper  = canvas.parentElement;
      const maxW     = wrapper.clientWidth - 2;
      const maxH     = window.innerHeight * 0.72;
      const scale    = Math.min(maxW / viewport.width, maxH / viewport.height);
      const scaled   = page.getViewport({ scale });
      canvas.width   = scaled.width;
      canvas.height  = scaled.height;
      await page.render({ canvasContext: ctx, viewport: scaled }).promise;
      currentPage = num;
      pageEl.textContent = num;
    } catch (e) {
      console.error('PDF render error:', e);
    }
    loadingEl.style.display = 'none';
    rendering = false;
  }

  function scheduleNext() {
    clearTimeout(autoTimer);
    resetProgress();
    if (!isPlaying) return;
    setTimeout(() => startProgress(), 50);
    autoTimer = setTimeout(() => {
      const next = Math.floor(Math.random() * totalPages) + 1;
      renderPage(next);
      scheduleNext();
    }, INTERVAL);
  }

  document.getElementById('encPrev').addEventListener('click', () => {
    const prev = currentPage > 1 ? currentPage - 1 : totalPages;
    renderPage(prev);
    scheduleNext();
  });

  document.getElementById('encNext').addEventListener('click', () => {
    const next = currentPage < totalPages ? currentPage + 1 : 1;
    renderPage(next);
    scheduleNext();
  });

  document.getElementById('encPlayPause').addEventListener('click', () => {
    isPlaying = !isPlaying;
    playIcon.style.display  = isPlaying ? 'none'  : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';
    if (isPlaying) scheduleNext();
    else { clearTimeout(autoTimer); resetProgress(); }
  });

  // Load PDF when section enters view
  const encSection = document.getElementById('encyclopedia');
  let loaded = false;
  const loadObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !loaded) {
      loaded = true;
      loadObs.disconnect();
      pdfjsLib.getDocument('encyclopedia.pdf').promise.then(pdf => {
        pdfDoc      = pdf;
        totalPages  = pdf.numPages;
        totalEl.textContent = totalPages;
        pauseIcon.style.display = 'block';
        playIcon.style.display  = 'none';
        renderPage(Math.floor(Math.random() * totalPages) + 1);
        scheduleNext();
      }).catch(err => {
        loadingEl.innerHTML = '<p style="color:#ef4444;padding:24px;">Could not load encyclopedia.pdf — ensure the file is in the project root.</p>';
        console.error(err);
      });
    }
  }, { threshold: 0.1 });
  loadObs.observe(encSection);
})();
