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
    hasMouse  = true;
    target.x  = e.clientX;
    target.y  = e.clientY + window.scrollY - canvas.getBoundingClientRect().top - window.scrollY;
  });

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
  { text: "You fear your own power, you fear your anger, the drive to do great or terrible things.", author: "Ra's Al Ghul", cat: "Batman Begins" },
  { text: "He who can, does not want to. He who wants to, cannot. He who knows, does not do. He who does, does not know. And thus the world goes badly.", author: "Ascoli Piceno, 1529", cat: "Italian Inscription" },
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
  { text: "If it works, it ain't stupid.", author: "Unknown", cat: "Engineering" },
  { text: "My life got a lot better when I stopped trying to be happy and started trying to be useful.", author: "Alex Hormozi", cat: "Self-Development" },
  { text: "A man who is a master of patience is master of everything else.", author: "George Savile", cat: "Wisdom" },
  { text: "You are not a drop in the ocean. You are the entire ocean in a drop.", author: "Rumi", cat: "Philosophy" },
  { text: "When you have 8–12 investments that are uncorrelated with each other, you decrease your risk by 80%.", author: "Tony Robbins", cat: "Investing" },
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
      let next;
      do { next = Math.floor(Math.random() * total); } while (next === current && total > 1);
      showImage(next);
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
