/* ============================================================
   Kairu's Timetables — Engine v0.2 (Phase 0 polished)
   ------------------------------------------------------------
   Design principles (see docs/DESIGN.md):
     • One verb: nudge. Up/Down to glide one zone.
     • Restart latency < 200ms — no menus, no buttons.
     • Juice on every input — sound + particle + animation.
     • Read order: question arrives first, panels second.
     • The world is the score — sky changes per tier.
     • The needle moment — slo-mo at impact.
   ============================================================ */

(function () {
  "use strict";

  /* ===== TIERS ==============================================
     Speed curve is tuned so the player's reaction window
     (gate-spawn -> impact, no boost) never falls below ~0.81s
     even at extreme Infinite Kairu levels. Past L180 the speed
     is capped and difficulty grows by raising the multiplication
     ceiling instead (see tableMaxForLevel).
     window(s) ~= 3.39 / state.speed   (no boost, 60fps reference)
  ============================================================ */
  const MAX_SPEED = 4.20;   // hard cap -> ~0.81s reaction window

  /* ===== CONTENT SCHEDULE ====================================
     Drives what kinds of problems appear at each level. Speed
     and content are decoupled: speed is governed by TIERS above,
     content is governed by this schedule below.
     Each row = a content snapshot that becomes active when the
     player crosses minLvl. Higher rows OVERRIDE lower ones.
       mult       : array of allowed left-factors
       multBmax   : largest allowed right-factor in 'a x b'
       squareMax  : if set, n^2 problems for n in [2..squareMax]
       rootMax    : if set, sqrt(n^2) problems for n in [2..rootMax]
       divMax     : if set, division problems with divisor in [2..divMax]
                    and quotient in [2..divMax]
  ============================================================ */
  const CONTENT_SCHEDULE = [
    { minLvl:   0, mult: [2, 5, 10],                 multBmax: 12 },
    { minLvl:  10, mult: [2, 3, 5, 10, 11],          multBmax: 12 },
    { minLvl:  20, mult: [2, 3, 4, 5, 6, 10, 11],    multBmax: 12 },
    { minLvl:  30, mult: [2, 3, 4, 5, 6, 9, 10, 11, 12], multBmax: 12 },
    { minLvl:  40, mult: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], multBmax: 12 },
    { minLvl:  60, squareMax: 15, rootMax: 15 },
    { minLvl:  80, divMax: 12 },
    { minLvl: 100, mult: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], multBmax: 12 },
    { minLvl: 120, mult: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 20], multBmax: 12 },
    { minLvl: 160, mult: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20], multBmax: 12 },
    { minLvl: 180, mult: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], multBmax: 12 },
    { minLvl: 200, squareMax: 25, rootMax: 25 },
    { minLvl: 250, mult: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30], multBmax: 12 },
    { minLvl: 300, divMax: 20 }
  ];

  // Returns the merged content-config active at the given level.
  // Walks the schedule top-to-bottom; later rows override earlier ones
  // for any field they specify.
  function contentAt(level) {
    const cfg = { mult: [], multBmax: 12, squareMax: 0, rootMax: 0, divMax: 0 };
    for (const row of CONTENT_SCHEDULE) {
      if (level < row.minLvl) break;
      if (row.mult)      cfg.mult     = row.mult;
      if (row.multBmax)  cfg.multBmax = row.multBmax;
      if (row.squareMax) cfg.squareMax = row.squareMax;
      if (row.rootMax)   cfg.rootMax   = row.rootMax;
      if (row.divMax)    cfg.divMax    = row.divMax;
    }
    return cfg;
  }
  const TIERS = [
    { name: "Fledgling Flight", tables: [2, 3, 5, 10],   minLvl: 0,   baseSpeed: 0.70, speedStep: 0.030, sky: 0 },
    { name: "Feather Flutter",  tables: [4, 6, 9, 11],   minLvl: 12,  baseSpeed: 1.05, speedStep: 0.030, sky: 1 },
    { name: "Canopy Cruise",    tables: [7, 8, 12],      minLvl: 26,  baseSpeed: 1.45, speedStep: 0.030, sky: 2 },
    { name: "Cloud Chase",      tables: "all",           minLvl: 42,  baseSpeed: 1.92, speedStep: 0.027, sky: 3 },
    { name: "Storm Rider",      tables: "all",           minLvl: 60,  baseSpeed: 2.40, speedStep: 0.024, sky: 4 },
    { name: "Sun Seeker",       tables: "allSquares",    minLvl: 80,  baseSpeed: 2.88, speedStep: 0.020, sky: 5 },
    { name: "Infinite Kairu",   tables: "allSquares",    minLvl: 100, baseSpeed: 3.30, speedStep: 0.0113, sky: 6 }
  ];

  // [skyTop, skyBottom, horizon, accent]
  const SKY_PALETTES = [
    ["#FFE6D5", "#FFB088", "#7B5E8A", "#FFD78A"], // Dawn
    ["#BEE7FF", "#7FCBFF", "#4F7B9C", "#FFE8A0"], // Morning
    ["#9BE5C8", "#34A78A", "#1E5D4F", "#FFE0A0"], // Canopy
    ["#FAB6D4", "#9F7BC4", "#3F2855", "#FFC8E0"], // Sunset
    ["#F58282", "#7C2952", "#1F0F2F", "#FFD96A"], // Storm
    ["#FFD58A", "#E36A1A", "#5D2A12", "#FFF1B0"], // Sun spire
    ["#1A1742", "#070420", "#0E0824", "#FFF6C0"]  // Cosmic
  ];

  const ZONE_COUNT = 4;
  const ZONE_COLOURS = ["#E84545", "#F6A23D", "#2DD4A4", "#4F8DF7"];

  /* ===== STATE ============================================== */
  let canvas, ctx, W, H;
  let state = null;
  let rafId = null;
  let lastTs = 0;

  /* ===== AUDIO ============================================== */
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    init() {
      if (this.ctx) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.4;
        this.master.connect(this.ctx.destination);
        try { this.muted = localStorage.getItem("ktMute") === "1"; } catch (e) {}
        if (this.muted) this.master.gain.value = 0;
      } catch (e) { /* silent — audio is bonus */ }
    },
    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.value = m ? 0 : 0.4;
      try { localStorage.setItem("ktMute", m ? "1" : "0"); } catch (e) {}
    },
    play(name) {
      if (!this.ctx || this.muted) return;
      try {
        const t = this.ctx.currentTime;
        if (name === "nudge") {
          // Soft whoosh — pitched white noise burst
          const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          const filt = this.ctx.createBiquadFilter();
          filt.type = "bandpass"; filt.frequency.value = 700; filt.Q.value = 1.2;
          const g = this.ctx.createGain(); g.gain.value = 0.3;
          src.connect(filt); filt.connect(g); g.connect(this.master);
          src.start(t); src.stop(t + 0.08);
        }
        else if (name === "correct") {
          // Two-note chime, C5 + E5
          this._note(523.25, 0.20, "sine", 0.32, t);
          this._note(659.25, 0.22, "sine", 0.28, t + 0.04);
        }
        else if (name === "tierUp") {
          // Ascending arpeggio C E G C
          [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
            this._note(f, 0.18, "sine", 0.32, t + i * 0.085);
          });
        }
        else if (name === "wrong") {
          // Low thud — two stacked sines
          this._note(60, 0.28, "sine", 0.5, t);
          this._note(90, 0.28, "sine", 0.3, t);
        }
        else if (name === "streak3") {
          [659.25, 783.99, 987.77].forEach((f, i) => {
            this._note(f, 0.10, "triangle", 0.22, t + i * 0.06);
          });
        }
        else if (name === "streak10") {
          [880, 1175, 1568].forEach((f, i) => {
            this._note(f, 0.10, "sine", 0.30, t + i * 0.05);
          });
        }
        else if (name === "tap") {
          this._note(330, 0.06, "sine", 0.18, t);
        }
      } catch (e) { /* swallow */ }
    },
    _note(freq, dur, type, vol, when) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, when);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(this.master);
      o.start(when); o.stop(when + dur + 0.02);
    }
  };

  /* ===== HELPERS ============================================ */
  function activeTier(level) {
    let t = TIERS[0];
    for (const tier of TIERS) { if (level >= tier.minLvl) t = tier; }
    return t;
  }
  function tierIndex(level) {
    return TIERS.indexOf(activeTier(level));
  }
  function readBest() {
    try { return Number(localStorage.getItem("ktBest") || 0) || 0; }
    catch (e) { return Number(window.__ktBest || 0); }
  }
  function writeBest(v) {
    try { localStorage.setItem("ktBest", String(v)); } catch (e) {}
    window.__ktBest = v;
  }
  function readBestMeta() {
    try {
      state.bestName = localStorage.getItem("ktBestName") || "";
      state.bestTier = localStorage.getItem("ktBestTier") || "";
      state.bestDate = localStorage.getItem("ktBestDate") || "";
    } catch (e) {
      state.bestName = ""; state.bestTier = ""; state.bestDate = "";
    }
  }
  function writeBestMeta() {
    try {
      localStorage.setItem("ktBestName", state.bestName || "");
      localStorage.setItem("ktBestTier", state.bestTier || "");
      localStorage.setItem("ktBestDate", state.bestDate || "");
    } catch (e) {}
  }
  function formatDate(d) {
    try {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return d.toDateString();
    }
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ===== PROBLEMS =========================================== */
  // Anti-streak memory: track the last few correct-zone positions
  // so the same slot can't be "the right answer" more than 3 in a row.
  const _zoneStreak = [];
  const _STREAK_CAP = 3;

  function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Build a pool of plausible mult products around the answer, drawn
  // from the same unlocked-tables set so distractors aren't trivially
  // identifiable as "the only multiple of an allowed factor".
  function _multDistractorPool(cfg, ans, a, b) {
    const pool = new Set();
    const tables = cfg.mult.length ? cfg.mult : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const bmax = cfg.multBmax || 12;
    // Same left-factor, neighbouring right-factor.
    for (let db = -2; db <= 2; db++) {
      const nb = b + db;
      if (nb >= 2 && nb <= bmax && nb !== b) pool.add(a * nb);
    }
    // Same right-factor, neighbouring left-factor (from the pool only).
    const aIdx = tables.indexOf(a);
    if (aIdx >= 0) {
      for (let da = -2; da <= 2; da++) {
        const ai = aIdx + da;
        if (ai >= 0 && ai < tables.length && tables[ai] !== a) pool.add(tables[ai] * b);
      }
    }
    // A handful of random other plausible products.
    for (let i = 0; i < 12; i++) {
      const ra = _rand(tables);
      const rb = 2 + Math.floor(Math.random() * (bmax - 1));
      const v = ra * rb;
      if (v !== ans) pool.add(v);
    }
    pool.delete(ans);
    return [...pool].filter(v => v > 0);
  }

  function _squareDistractorPool(maxN, ans) {
    const pool = new Set();
    for (let n = 2; n <= maxN; n++) {
      if (n * n !== ans) pool.add(n * n);
      if ((n * (n + 1)) !== ans) pool.add(n * (n + 1));   // n*(n+1) reads as plausible
    }
    return [...pool];
  }

  function _rootDistractorPool(maxN, ans) {
    const pool = new Set();
    for (let n = 2; n <= maxN; n++) if (n !== ans) pool.add(n);
    return [...pool];
  }

  function _divDistractorPool(divMax, ans, divisor) {
    // Plausible quotients in the same range; also nearby integers.
    const pool = new Set();
    for (let q = 2; q <= divMax; q++) if (q !== ans) pool.add(q);
    for (let d = -3; d <= 3; d++) {
      const v = ans + d;
      if (v > 0 && v !== ans) pool.add(v);
    }
    return [...pool];
  }

  function pickProblem(level) {
    const cfg = contentAt(level);
    const haveMult   = cfg.mult.length > 0;
    const haveSquare = cfg.squareMax > 0;
    const haveRoot   = cfg.rootMax > 0;
    const haveDiv    = cfg.divMax > 0 && haveMult;

    // Weighted kind selection. Once everything is unlocked the mix
    // settles at: 65% mult, 13% sq, 7% root, 15% div.
    const weights = [];
    if (haveMult)   weights.push(["mult",   65]);
    if (haveSquare) weights.push(["square", 13]);
    if (haveRoot)   weights.push(["root",    7]);
    if (haveDiv)    weights.push(["div",    15]);
    if (!weights.length) weights.push(["mult", 1]); // safety net
    const totalW = weights.reduce((s, w) => s + w[1], 0);
    let r = Math.random() * totalW;
    let kind = weights[0][0];
    for (const [k, w] of weights) { r -= w; if (r <= 0) { kind = k; break; } }

    let ans, text, distractorPool;
    if (kind === "mult") {
      const a = _rand(cfg.mult);
      const b = 2 + Math.floor(Math.random() * (cfg.multBmax - 1));
      ans = a * b;
      text = a + " \u00D7 " + b;
      distractorPool = _multDistractorPool(cfg, ans, a, b);
    } else if (kind === "square") {
      const n = 2 + Math.floor(Math.random() * (cfg.squareMax - 1));
      ans = n * n;
      text = n + "\u00B2";
      distractorPool = _squareDistractorPool(cfg.squareMax, ans);
    } else if (kind === "root") {
      const n = 2 + Math.floor(Math.random() * (cfg.rootMax - 1));
      ans = n;
      text = "\u221A" + (n * n);
      distractorPool = _rootDistractorPool(cfg.rootMax, ans);
    } else { // div
      // dividend = divisor * quotient; both in the unlocked range.
      const divisor  = 2 + Math.floor(Math.random() * (cfg.divMax - 1));
      const quotient = 2 + Math.floor(Math.random() * (cfg.divMax - 1));
      ans  = quotient;
      text = (divisor * quotient) + " \u00F7 " + divisor;
      distractorPool = _divDistractorPool(cfg.divMax, ans, divisor);
    }

    // Pick 3 distractors uniformly at random from the pool.
    const optsSet = new Set([ans]);
    // Shuffle the pool (Fisher-Yates) then take the first few unique.
    const shuffled = distractorPool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (const v of shuffled) {
      if (optsSet.size >= 4) break;
      if (v > 0 && v !== ans) optsSet.add(v);
    }
    // Pad if pool was thin.
    let bump = 1;
    while (optsSet.size < 4) { optsSet.add(ans + 13 * bump); bump++; }

    const opts = [...optsSet].slice(0, 4);
    // Fisher-Yates shuffle of the visible positions.
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    let correctZone = opts.indexOf(ans);

    // Anti-streak: if the same zone has been correct STREAK_CAP times
    // in a row, swap the answer into a different zone for this round.
    if (_zoneStreak.length >= _STREAK_CAP &&
        _zoneStreak.slice(-_STREAK_CAP).every(z => z === correctZone)) {
      const others = [0, 1, 2, 3].filter(z => z !== correctZone);
      const newZone = _rand(others);
      [opts[correctZone], opts[newZone]] = [opts[newZone], opts[correctZone]];
      correctZone = newZone;
    }
    _zoneStreak.push(correctZone);
    if (_zoneStreak.length > 6) _zoneStreak.shift();

    return { text, ans, opts, correctZone, kind };
  }

  /* ===== STATE LIFECYCLE ==================================== */
  function initState(keepBest) {
    const prevBest = keepBest && state ? state.best : readBest();
    state = {
      phase: "demo",          // demo | playing | over
      level: 0,
      best: prevBest,
      streak: 0,
      kairu: {
        x: 0.22, zone: 1, curY: null,
        vy: 0,                // for body-rotation feedback
        rot: 0, targetRot: 0,
        gorgetFlash: 0,
        blink: 0, blinkUntil: 0,
        idleBob: 0,
        tumble: 0,            // game-over tumble rotation
        tumbleVy: 0,
        boostT: 0             // visual boost trail timer (driven by forward push)
      },
      keys: { forward: false, back: false },
      gate: null,
      speed: TIERS[0].baseSpeed,
      boostMultiplier: 1.0,   // ramps up when forward is held at max x
      effectiveSpeed: TIERS[0].baseSpeed,
      cloudOffset: 0,
      starOffset: 0,
      particles: [],
      windStreaks: [],
      shakeT: 0, shakeMag: 0,
      flashT: 0, flashColor: null,
      slowMoT: 0,
      tierBannerT: 0, tierBannerName: "",
      tierIdxLast: 0,
      pulseLevelT: 0,
      pulseStreakT: 0,
      lastTouchRipple: null,
      gameOverScoreShown: 0,
      gameOverT: 0,
      gameOverLockUntil: 0,   // input-lock timestamp; restart is blocked until now
      awaitingName: false,    // true while the name-entry overlay is up
      questionPulseT: 0,      // pulse-on-update for the question banner
      bestName: "",
      bestTier: "",
      bestDate: ""
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width  = Math.floor(rect.width  * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    W = rect.width; H = rect.height;
  }

  function zoneY(i) {
    const margin = H * 0.12;
    const zh = (H - 2 * margin) / ZONE_COUNT;
    return margin + i * zh + zh / 2;
  }
  function zoneBand(i) {
    const margin = H * 0.12;
    const zh = (H - 2 * margin) / ZONE_COUNT;
    return { top: margin + i * zh, bottom: margin + (i + 1) * zh };
  }

  /* ===== PARTICLES ========================================== */
  function spawnFeathers(x, y, n, color, spread) {
    spread = spread || 80;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * spread;
      state.particles.push({
        type: "feather",
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        life: 0.7 + Math.random() * 0.4,
        max: 1.1,
        color,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 6,
        size: 4 + Math.random() * 4
      });
    }
  }
  function spawnSparkle(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 140;
      state.particles.push({
        type: "spark",
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.5 + Math.random() * 0.4,
        max: 0.9,
        color,
        size: 2 + Math.random() * 2
      });
    }
  }
  function spawnDust(x, y) {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      state.particles.push({
        type: "dust",
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.6,
        max: 0.6,
        color: "rgba(255,255,255,0.7)",
        size: 5 + Math.random() * 6
      });
    }
  }
  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) { state.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt; // light gravity for feathers/sparks
      if (p.rotV !== undefined) p.rot += p.rotV * dt;
    }
  }
  function drawParticles() {
    for (const p of state.particles) {
      const alpha = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = alpha;
      if (p.type === "feather") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === "spark") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "dust") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ===== DRAWING ============================================ */
  function drawSky() {
    const tier = activeTier(state.level);
    const palette = SKY_PALETTES[tier.sky] || SKY_PALETTES[0];
    const [c1, c2, horizon, accent] = palette;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c1); grad.addColorStop(1, c2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Sun / moon — top-right
    if (tier.sky === 6) {
      // Cosmic — stars
      drawStars();
    } else {
      ctx.beginPath();
      const sx = W * 0.86, sy = H * 0.18, sr = Math.min(W, H) * 0.06;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.85;
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Horizon silhouette at the bottom — varies per tier
    drawHorizon(horizon, tier.sky);

    // Subtle zone tints
    for (let i = 0; i < ZONE_COUNT; i++) {
      const b = zoneBand(i);
      ctx.fillStyle = ZONE_COLOURS[i];
      ctx.globalAlpha = 0.045;
      ctx.fillRect(0, b.top, W, b.bottom - b.top);
      ctx.globalAlpha = 1;
    }

    // Cloud parallax — driven by effective speed so boost whips clouds past
    state.cloudOffset -= state.effectiveSpeed * 0.5;
    if (state.cloudOffset < -300) state.cloudOffset += 300;
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 240 + state.cloudOffset) % (W + 240) + W + 240) % (W + 240);
      const cy = 30 + (i * 41) % 110;
      drawCloud(cx, cy, 1 - (i % 3) * 0.15);
    }
  }

  function drawCloud(cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(18, -6, 26, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(-18, -3, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStars() {
    state.starOffset -= state.effectiveSpeed * 0.2;
    if (state.starOffset < -W) state.starOffset += W;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 73 + state.starOffset) % W + W) % W;
      const sy = (i * 37) % (H * 0.6) + 10;
      const tw = 0.5 + 0.5 * Math.sin(Date.now() / 600 + i);
      ctx.globalAlpha = 0.4 + tw * 0.5;
      const sr = (i % 7 === 0) ? 1.8 : 1;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHorizon(color, skyIdx) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    const baseY = H - H * 0.08;
    ctx.moveTo(0, H);
    if (skyIdx === 2) {
      // Canopy — bumpy treeline
      ctx.lineTo(0, baseY);
      const bumps = 18;
      for (let i = 0; i <= bumps; i++) {
        const x = (i / bumps) * W;
        const y = baseY - (Math.sin(i * 0.7) * 12 + Math.sin(i * 1.6) * 6 + 14);
        ctx.lineTo(x, y);
      }
    } else if (skyIdx === 3 || skyIdx === 4) {
      // Cloud / Storm — distant mountains
      ctx.lineTo(0, baseY);
      const peaks = 6;
      for (let i = 0; i <= peaks; i++) {
        const x = (i / peaks) * W;
        const y = baseY - (40 + (i % 2 === 0 ? 18 : 6) + Math.sin(i * 1.4) * 12);
        ctx.lineTo(x, y);
      }
    } else if (skyIdx === 5) {
      // Sun spire — angular silhouette
      ctx.lineTo(0, baseY);
      ctx.lineTo(W * 0.18, baseY - 20);
      ctx.lineTo(W * 0.32, baseY - 60);
      ctx.lineTo(W * 0.46, baseY - 30);
      ctx.lineTo(W * 0.62, baseY - 75);
      ctx.lineTo(W * 0.78, baseY - 25);
      ctx.lineTo(W * 0.92, baseY - 50);
      ctx.lineTo(W, baseY - 20);
    } else if (skyIdx === 6) {
      // Cosmic — flat dark mountains
      ctx.lineTo(0, baseY - 10);
      ctx.lineTo(W * 0.3, baseY - 24);
      ctx.lineTo(W * 0.55, baseY - 12);
      ctx.lineTo(W * 0.8, baseY - 28);
      ctx.lineTo(W, baseY - 14);
    } else {
      // Default — gentle hills
      ctx.lineTo(0, baseY);
      const bumps = 8;
      for (let i = 0; i <= bumps; i++) {
        const x = (i / bumps) * W;
        const y = baseY - (10 + Math.sin(i * 0.9) * 8);
        ctx.lineTo(x, y);
      }
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawKairu() {
    const k = state.kairu;

    // Smooth ease to current zone target
    const targetY = zoneY(k.zone);
    if (k.curY == null) k.curY = targetY;
    const prevY = k.curY;
    k.curY += (targetY - k.curY) * 0.18;
    k.vy = (k.curY - prevY) / Math.max(1 / 60, 0.016); // px/s rough

    // Body rotation — leans into the move
    k.targetRot = clamp(k.vy * 0.0015, -0.25, 0.25);
    if (state.phase === "over") k.targetRot = k.tumble;
    k.rot += (k.targetRot - k.rot) * 0.18;

    // Idle bob in demo
    let bobY = 0;
    if (state.phase === "demo") {
      k.idleBob += 1 / 60;
      bobY = Math.sin(k.idleBob * 2.4) * 6;
    }

    // Blinking
    if (state.phase === "demo") {
      k.blink -= 1 / 60;
      if (k.blink <= 0) {
        if (k.blinkUntil > 0) {
          k.blink = 4 + Math.random() * 4;
          k.blinkUntil = 0;
        } else {
          k.blinkUntil = 0.12;
          k.blink = 0.12;
        }
      }
    } else {
      k.blink = 1; k.blinkUntil = 0;
    }

    // Tumble after game over
    if (state.phase === "over") {
      k.tumble += 0.32;
      k.tumbleVy += 30 * (1 / 60);
      k.curY += k.tumbleVy;
    }

    const cx = W * k.x;
    const cy = k.curY + bobY;

    // Soft drop shadow on horizon line
    if (state.phase !== "over") {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(cx, H - H * 0.07, 22, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(k.rot);

    // Tail (forked)
    ctx.fillStyle = "#1A4A8A";
    ctx.beginPath();
    ctx.moveTo(-12, -1);
    ctx.lineTo(-32, -10);
    ctx.lineTo(-26, -2);
    ctx.lineTo(-34, 2);
    ctx.lineTo(-26, 4);
    ctx.lineTo(-32, 12);
    ctx.closePath();
    ctx.fill();

    // Body — teardrop
    const bodyGrad = ctx.createLinearGradient(-14, -10, 14, 10);
    bodyGrad.addColorStop(0, "#1F8FE0");
    bodyGrad.addColorStop(1, "#0E5DA0");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gorget (throat) — tinted patch that flashes
    const flashLevel = clamp(k.gorgetFlash, 0, 1);
    const gorgetColor = flashLevel > 0
      ? `rgba(255, 80, ${Math.floor(120 + flashLevel * 80)}, ${0.6 + flashLevel * 0.4})`
      : "rgba(220, 50, 90, 0.55)";
    ctx.fillStyle = gorgetColor;
    ctx.beginPath();
    ctx.ellipse(8, 5, 7, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    if (k.gorgetFlash > 0) k.gorgetFlash -= 0.04;

    // Wing — motion-blurred translucent ovals
    // Flap rate scales with EFFECTIVE speed (boost included) so the player's
    // hustle is visible in Kairu's wings.
    const flapDivisor = Math.max(12, 36 - state.effectiveSpeed * 6);
    const flap = Math.sin(Date.now() / flapDivisor);
    const speedBlur = clamp((state.effectiveSpeed - 1.0) / 2.5, 0, 1);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#76C5F2";
    ctx.beginPath();
    ctx.ellipse(-2, -6, 22 + speedBlur * 6, 7 + Math.abs(flap) * 1.2, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(-2, -6, 24 + speedBlur * 10, 9 + Math.abs(flap) * 1.5, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Head
    ctx.fillStyle = "#2FA9F2";
    ctx.beginPath();
    ctx.arc(13, -2, 9, 0, Math.PI * 2);
    ctx.fill();

    // Beak — long thin
    ctx.fillStyle = "#1A1A1A";
    ctx.lineWidth = 0;
    ctx.beginPath();
    ctx.moveTo(20, -2);
    ctx.lineTo(38, -1);
    ctx.lineTo(20, 0);
    ctx.closePath();
    ctx.fill();

    // Eye
    if (k.blink > 0.05 || state.phase !== "demo") {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(15, -4, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath(); ctx.arc(16, -4, 1.4, 0, Math.PI * 2); ctx.fill();
    } else {
      // Closed eye line
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(13, -4); ctx.lineTo(17, -4);
      ctx.stroke();
    }

    ctx.restore();

    // Boost motion lines — when player is pushing forward, draw streaking lines
    // behind Kairu. Lines grow longer + brighter as boostMultiplier climbs.
    if (state.phase === "playing" && state.kairu.boostT > 0) {
      const intensity = clamp(state.kairu.boostT / 0.35, 0, 1);
      const boostGain = clamp((state.boostMultiplier - 1) / 1.5, 0, 1); // 0..1 across boost range
      const lineCount = 4 + Math.floor(boostGain * 6);                  // up to 10 lines
      ctx.strokeStyle = "rgba(255,255,255," + (0.18 + intensity * 0.5 + boostGain * 0.3) + ")";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < lineCount; i++) {
        const yo = (i - (lineCount - 1) / 2) * 5;
        const len = 30 + intensity * 30 + boostGain * 80;
        ctx.beginPath();
        ctx.moveTo(cx - 22, cy + yo);
        ctx.lineTo(cx - 22 - len, cy + yo);
        ctx.stroke();
      }
      state.kairu.boostT -= 1 / 60;
    }

    // Streak trail — gold particles trailing Kairu when streak >= 3
    if (state.phase === "playing" && state.streak >= 3 && Math.random() < 0.5) {
      state.particles.push({
        type: "spark", x: cx - 18, y: cy + (Math.random() - 0.5) * 6,
        vx: -40, vy: (Math.random() - 0.5) * 30,
        life: 0.5, max: 0.7,
        color: state.streak >= 10 ? "#FFE08A" : "#F5C56B",
        size: 1.5 + Math.random()
      });
    }
  }

  function drawGate() {
    const g = state.gate;
    if (!g) return;
    const margin = H * 0.12;
    const panelW = Math.max(70, Math.min(100, W * 0.10));
    const panelH = (H - 2 * margin) / ZONE_COUNT;

    for (let i = 0; i < ZONE_COUNT; i++) {
      const py = margin + i * panelH;
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(g.x + 2, py + 10, panelW, panelH - 14);
      // Panel
      const grad = ctx.createLinearGradient(g.x, py, g.x + panelW, py + panelH);
      grad.addColorStop(0, ZONE_COLOURS[i]);
      grad.addColorStop(1, shade(ZONE_COLOURS[i], -22));
      ctx.fillStyle = grad;
      ctx.fillRect(g.x, py + 8, panelW, panelH - 16);
      // Number
      ctx.fillStyle = "#fff";
      ctx.font = "bold " + Math.floor(panelH * 0.45) + "px Poppins, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(g.opts[i]), g.x + panelW / 2, py + panelH / 2);
    }
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }

  function shade(hex, percent) {
    // negative = darker
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const f = (1 + percent / 100);
    return "#" + [r, g, b].map(v => clamp(Math.floor(v * f), 0, 255).toString(16).padStart(2, "0")).join("");
  }

  function drawQuestion() {
    const g = state.gate;
    if (!g) return;
    // Compact, persistent banner at the top-centre. Always in the same place
    // so the player learns once where to look. Subtle pulse on update.
    const pulse = clamp(state.questionPulseT / 0.35, 0, 1);
    const scale = 1 + pulse * 0.10;
    const fontSize = Math.floor(26 * scale);
    const text = g.text + " = ?";

    ctx.save();
    ctx.font = "bold " + fontSize + "px Fredoka, Poppins, sans-serif";
    const tw = ctx.measureText(text).width;
    const bw = tw + 32;
    const bh = fontSize + 14;
    const bx = W / 2 - bw / 2;
    const by = 18;

    // Soft outer glow on pulse
    if (pulse > 0) {
      ctx.shadowColor = "rgba(255, 224, 138, " + (0.55 * pulse) + ")";
      ctx.shadowBlur = 18 * pulse;
    }

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Text
    ctx.fillStyle = "#FFE08A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, W / 2, by + bh / 2);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTierBanner() {
    if (state.tierBannerT <= 0) return;
    const total = 1.2;
    const t = 1 - state.tierBannerT / total;
    const intro = clamp(t * 4, 0, 1);
    const outro = clamp((t - 0.7) * 4, 0, 1);
    const alpha = intro * (1 - outro);
    if (alpha <= 0.001) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    const text = state.tierBannerName.toUpperCase();
    ctx.font = "700 36px Fredoka, Poppins, sans-serif";
    const tw = ctx.measureText(text).width;
    const bw = tw + 60;
    const bh = 64;
    const bx = W / 2 - bw / 2;
    const by = H * 0.32;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(bx, by, bw, bh, 16); ctx.fill();
    ctx.fillStyle = "#FFE08A";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, W / 2, by + bh / 2);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  function drawDemoOverlay() {
    if (state.phase !== "demo") return;
    // Soft top vignette
    const grad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
    grad.addColorStop(0, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H * 0.4);
    // Bottom vignette
    const grad2 = ctx.createLinearGradient(0, H * 0.6, 0, H);
    grad2.addColorStop(0, "rgba(0,0,0,0)");
    grad2.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = grad2; ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Title
    ctx.fillStyle = "#FFE08A";
    ctx.font = "700 " + Math.floor(Math.min(W, H) * 0.075) + "px Fredoka, Poppins, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Kairu's Timetables", W / 2, H * 0.22);

    // Hint
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 " + Math.floor(Math.min(W, H) * 0.038) + "px Poppins, sans-serif";
    const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 380);
    ctx.globalAlpha = pulse;
    ctx.fillText("Press \u2191 \u2193 or tap to fly", W / 2, H * 0.78);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "500 " + Math.floor(Math.min(W, H) * 0.027) + "px Poppins, sans-serif";
    ctx.fillText("\u2192 boost  \u00B7  \u2190 ease back  \u00B7  How high can you climb?", W / 2, H * 0.86);
    ctx.globalAlpha = 1;

    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }

  function drawGameOverOverlay() {
    if (state.phase !== "over") return;
    // Wait for the bird to tumble out (~700ms) before the card appears
    state.gameOverT += 1 / 60;
    if (state.gameOverT < 0.7) return;

    // Vignette
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);

    // Score counts up
    state.gameOverScoreShown = lerp(state.gameOverScoreShown, state.level, 0.18);
    const shown = Math.floor(state.gameOverScoreShown);

    ctx.fillStyle = "#FFE08A";
    ctx.font = "800 " + Math.floor(Math.min(W, H) * 0.18) + "px Fredoka, Poppins, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(shown), W / 2, H * 0.42);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 18px Poppins, sans-serif";
    const newBest = state.level >= state.best && state.level > 0;
    const line2 = newBest ? "your best yet \u2728" : "best " + state.best;
    ctx.fillText(line2, W / 2, H * 0.55);

    // Hint fades in starting at 1.0s; suppressed entirely while name overlay is up
    if (!state.awaitingName) {
      const hintT = clamp((state.gameOverT - 1.0) / 0.5, 0, 1);
      if (hintT > 0) {
        const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 380);
        ctx.globalAlpha = hintT * pulse;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "500 14px Poppins, sans-serif";
        ctx.fillText("Press \u2191 \u2193 or tap to fly again", W / 2, H * 0.66);
        ctx.globalAlpha = 1;
      }
    }

    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }

  function syncDomHud() {
    const lvl = document.getElementById("gLevel");
    const tEl = document.getElementById("gTier");
    const bEl = document.getElementById("gBest");
    const sEl = document.getElementById("gStreak");
    const tier = activeTier(state.level);
    if (lvl) lvl.textContent = state.level;
    if (tEl) tEl.textContent = tier.name;
    if (bEl) bEl.textContent = state.best;
    if (sEl) {
      if (state.streak >= 3) {
        sEl.style.display = "";
        sEl.textContent = "\uD83D\uDD25 " + state.streak;
        sEl.className = "streak-flame" + (state.streak >= 10 ? " hot" : "");
      } else {
        sEl.style.display = "none";
      }
    }
    // Pulse class on level chip
    const lvlChip = document.getElementById("gLevelChip");
    if (lvlChip) {
      if (state.pulseLevelT > 0) lvlChip.classList.add("pulse");
      else lvlChip.classList.remove("pulse");
    }
  }

  function applyShake() {
    if (state.shakeT > 0) {
      const dx = (Math.random() - 0.5) * state.shakeMag;
      const dy = (Math.random() - 0.5) * state.shakeMag;
      ctx.translate(dx, dy);
    }
  }

  function applyFlash() {
    if (state.flashT > 0) {
      ctx.fillStyle = state.flashColor || "rgba(245,166,35,0.25)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ===== GAME EVENTS ======================================== */
  function spawnGate() {
    const p = pickProblem(state.level);
    const tier = activeTier(state.level);
    state.speed = Math.min(MAX_SPEED, tier.baseSpeed + (state.level - tier.minLvl) * tier.speedStep);
    state.gate = { x: W + 120, ...p, answered: false, spawnAt: Date.now() };
    state.questionPulseT = 0.35;
  }

  /* ===== SPEED VISUALIZATION ================================ */
  function updateWindStreaks(dt) {
    if (state.phase !== "playing") return;
    // Wind density + length + velocity all ride effective speed (so the player's
    // boost visibly intensifies the world).
    const eff = state.effectiveSpeed;
    const speedFactor = eff / 0.7;              // 1.0 at baseline
    if (speedFactor < 1.15) return;
    const intensity = clamp((speedFactor - 1.15) / 2.5, 0, 1);
    const spawnRate = 8 + intensity * 90;       // streaks per second
    let toSpawn = spawnRate * dt;
    while (toSpawn > 0) {
      if (Math.random() < toSpawn || toSpawn >= 1) {
        state.windStreaks.push({
          x: W + 30,
          y: 20 + Math.random() * (H - 40),
          length: 22 + Math.random() * 50 + intensity * 40,
          vx: -(220 + eff * 160 + Math.random() * 80),
          alpha: 0.18 + Math.random() * 0.25 + intensity * 0.30,
          life: 0.6 + Math.random() * 0.5
        });
      }
      toSpawn -= 1;
    }
    for (let i = state.windStreaks.length - 1; i >= 0; i--) {
      const s = state.windStreaks[i];
      s.x += s.vx * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x + s.length < -10) state.windStreaks.splice(i, 1);
    }
  }
  function drawWindStreaks() {
    if (!state.windStreaks.length) return;
    ctx.lineWidth = 1.4;
    for (const s of state.windStreaks) {
      ctx.strokeStyle = "rgba(255,255,255," + s.alpha + ")";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.length, s.y);
      ctx.stroke();
    }
  }

  /* ===== KAIRU X CONTROL (forward / back) =================== */
  // Forward press first slides Kairu's x toward the front of the canvas.
  // Once she's against the cap and the player keeps holding forward, the
  // input converts into a gate-speed boost that ramps up to 2.5x. Lets
  // skilled players hustle through the slow early levels.
  function updateKairuX(dt) {
    if (state.phase !== "playing") return;
    const dir = (state.keys.forward ? 1 : 0) - (state.keys.back ? 1 : 0);
    const X_MIN = 0.12, X_MAX = 0.52;
    const rate = 0.45;                                   // 45% canvas width / s

    if (dir > 0) {
      state.kairu.boostT = 0.35;                          // refresh visual trail
      if (state.kairu.x < X_MAX - 0.001) {
        state.kairu.x = clamp(state.kairu.x + rate * dt, X_MIN, X_MAX);
      } else {
        // At the cap — convert the held forward press into a speed boost
        state.boostMultiplier = clamp(state.boostMultiplier + 1.6 * dt, 1.0, 2.5);
      }
    } else if (dir < 0) {
      state.kairu.x = clamp(state.kairu.x - rate * dt, X_MIN, X_MAX);
      state.boostMultiplier = clamp(state.boostMultiplier - 5.0 * dt, 1.0, 2.5);
    } else {
      state.boostMultiplier = clamp(state.boostMultiplier - 4.0 * dt, 1.0, 2.5);
    }

    state.effectiveSpeed = state.speed * state.boostMultiplier;
  }

  function onCorrect(g) {
    state.level += 1;
    state.streak += 1;
    state.kairu.gorgetFlash = 1;
    state.pulseLevelT = 0.45;

    // Shatter all four panels — burst of coloured sparkles where each panel was.
    // The correct panel gets an extra gold burst. This replaces the old "freeze + delay"
    // and gives the player the feeling of flying THROUGH the gate.
    const margin = H * 0.12;
    const panelH = (H - 2 * margin) / ZONE_COUNT;
    const panelW = Math.max(70, Math.min(100, W * 0.10));
    for (let i = 0; i < ZONE_COUNT; i++) {
      const py = margin + i * panelH + panelH / 2;
      const px = g.x + panelW / 2;
      spawnSparkle(px, py, 14, ZONE_COLOURS[i]);
      if (i === g.correctZone) {
        spawnSparkle(px, py, 22, "#FFE08A");
        spawnFeathers(px, py, 6, ZONE_COLOURS[i], 90);
      }
    }
    spawnFeathers(W * state.kairu.x, state.kairu.curY, 5, "#FFE08A", 60);

    audio.play("correct");
    if (state.streak === 3)  { audio.play("streak3"); }
    if (state.streak === 10) { audio.play("streak10"); }

    // Tier-up handling
    const tier = activeTier(state.level);
    const idx = TIERS.indexOf(tier);
    if (idx > state.tierIdxLast) {
      state.tierIdxLast = idx;
      state.tierBannerT = 1.2;
      state.tierBannerName = tier.name;
      state.flashT = 0.5;
      state.flashColor = "rgba(255, 220, 130, 0.30)";
      audio.play("tierUp");
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 80 + Math.random() * 200;
        state.particles.push({
          type: "spark", x: W / 2, y: H * 0.4,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
          life: 0.9, max: 1.2,
          color: ZONE_COLOURS[Math.floor(Math.random() * 4)],
          size: 2 + Math.random() * 2
        });
      }
    }

    // Immediate next-gate spawn — replaces the shattered one. No pause, no jerk.
    spawnGate();
    state.questionPulseT = 0.35;
  }

  function onWrong() {
    audio.play("wrong");
    state.shakeT = 0.35; state.shakeMag = 14;
    state.flashT = 0.25; state.flashColor = "rgba(232,69,69,0.28)";
    spawnDust(W * state.kairu.x + 30, state.kairu.curY);
    state.kairu.tumble = 0.1;
    state.kairu.tumbleVy = -2;
    state.streak = 0;
    state.gameOverT = 0;
    state.gameOverScoreShown = 0;
    endGame();
  }

  function endGame() {
    state.phase = "over";
    state.gameOverT = 0;
    state.gameOverScoreShown = 0;
    state.gameOverLockUntil = Date.now() + 1500; // 1.5s before restart inputs respond
    const oldBest = state.best;
    if (state.level > oldBest) {
      state.best = state.level;
      state.bestTier = activeTier(state.level).name;
      state.bestDate = formatDate(new Date());
      writeBest(state.best);
      writeBestMeta();
      // Only prompt for a name on meaningful runs — no spam at level 1.
      if (state.level >= 10) {
        state.awaitingName = true;
        // Wait for the tumble + score-count beat before showing the input
        setTimeout(showNameInput, 1300);
      }
    }
  }

  /* ===== NAME ENTRY ========================================= */
  function showNameInput() {
    if (state.phase !== "over") return; // user may have already restarted somehow
    const overlay = document.getElementById("nameOverlay");
    const field = document.getElementById("nameField");
    const score = document.getElementById("nameScore");
    if (!overlay || !field || !score) return;
    score.textContent = state.level;
    field.value = state.bestName || "";
    overlay.removeAttribute("hidden");
    setTimeout(() => { try { field.focus(); field.select(); } catch (e) {} }, 60);
  }
  function hideNameInput() {
    const overlay = document.getElementById("nameOverlay");
    if (overlay) overlay.setAttribute("hidden", "");
  }

  window.ktSaveName = function () {
    const f = document.getElementById("nameField");
    const v = (f && f.value || "").trim().substring(0, 14);
    if (v) {
      state.bestName = v;
      writeBestMeta();
    }
    state.awaitingName = false;
    hideNameInput();
    syncDomHud();
  };
  window.ktSkipName = function () {
    state.awaitingName = false;
    hideNameInput();
  };

  /* ===== TROPHY MODAL ======================================= */
  window.ktShowBest = function () {
    if (!state) return;
    if (state.phase === "playing") return; // don't interrupt a run
    const m = document.getElementById("bestModal");
    if (!m) return;
    const tn = document.getElementById("trophyNumber");
    const nm = document.getElementById("trophyName");
    const tr = document.getElementById("trophyTier");
    const dt = document.getElementById("trophyDate");
    const sub = document.getElementById("trophyLabel");
    if (state.best > 0) {
      if (sub) sub.textContent = "Personal Best";
      if (tn) tn.textContent = state.best;
      if (nm) {
        if (state.bestName) { nm.textContent = state.bestName; nm.style.display = ""; }
        else { nm.style.display = "none"; }
      }
      if (tr) {
        const tname = state.bestTier || activeTier(state.best).name;
        tr.textContent = tname;
        tr.style.display = "";
      }
      if (dt) {
        dt.textContent = state.bestDate || "";
        dt.style.display = state.bestDate ? "" : "none";
      }
    } else {
      if (sub) sub.textContent = "No best yet";
      if (tn) tn.textContent = "0";
      if (nm) nm.style.display = "none";
      if (tr) { tr.textContent = "Fly Kairu and beat your own best"; tr.style.display = ""; }
      if (dt) dt.style.display = "none";
    }
    m.removeAttribute("hidden");
  };
  window.ktCloseBest = function () {
    const m = document.getElementById("bestModal");
    if (m) m.setAttribute("hidden", "");
  };

  /* ===== MAIN LOOP ========================================== */
  function tick(ts) {
    if (!state) return;
    rafId = requestAnimationFrame(tick);
    if (!lastTs) lastTs = ts || performance.now();
    const nowTs = ts || performance.now();
    let dt = (nowTs - lastTs) / 1000;
    lastTs = nowTs;
    // Anti-cheat: if a long gap is detected (tab hidden / window blurred /
    // devtool pause), fast-forward the gate by the FULL real-time gap so
    // the player can't get free thinking time. Then cap dt for everything
    // else (animations, particles) so visuals don't snap.
    if (dt > 0.3) {
      if (state.phase === "playing" && state.gate && !state.gate.answered) {
        const eff = state.speed * (state.boostMultiplier || 1);
        state.gate.x -= eff * 270 * dt;
      }
      dt = 0.05;
    } else if (dt > 0.05) {
      dt = 0.05; // cap
    }

    // Slo-mo factor near impact
    let timeScale = 1;
    if (state.phase === "playing" && state.gate && !state.gate.answered) {
      const distToImpact = state.gate.x - W * state.kairu.x;
      if (distToImpact < 120 && distToImpact > -10) {
        timeScale = 0.45;
        state.slowMoT = 0.1;
      }
    }
    const dtScaled = dt * timeScale;

    // Decay timers
    if (state.shakeT > 0) state.shakeT -= dt;
    if (state.flashT > 0) state.flashT -= dt;
    if (state.tierBannerT > 0) state.tierBannerT -= dt;
    if (state.pulseLevelT > 0) state.pulseLevelT -= dt;
    if (state.pulseStreakT > 0) state.pulseStreakT -= dt;
    if (state.questionPulseT > 0) state.questionPulseT -= dt;

    // Forward/back input — uses real time (not slo-mo) so input feels responsive
    updateKairuX(dt);
    // Refresh effective speed for all visuals downstream
    state.effectiveSpeed = state.speed * (state.boostMultiplier || 1);
    // Wind streaks ride real time too — ambient world doesn't slo-mo
    updateWindStreaks(dt);

    ctx.save();
    applyShake();

    drawSky();
    drawWindStreaks();

    if (state.phase === "playing" && state.gate) {
      // Effective speed = base tier speed × player boost multiplier.
      // Slo-mo at impact is applied on top so the needle moment still bites.
      const effSpeed = state.speed * (state.boostMultiplier || 1);
      state.effectiveSpeed = effSpeed;
      // Frame-rate independent: 4.5 px/frame at 60fps == 270 px/s.
      state.gate.x -= effSpeed * 270 * dt * (timeScale === 1 ? 1 : timeScale * 1.6);
      drawGate();
      drawQuestion();

      const kairuX = W * state.kairu.x;
      if (!state.gate.answered && state.gate.x <= kairuX) {
        if (state.kairu.zone === state.gate.correctZone) {
          onCorrect(state.gate);
        } else {
          onWrong();
        }
      }
    }

    updateParticles(dtScaled);
    drawParticles();

    drawKairu();
    applyFlash();
    drawTierBanner();
    drawDemoOverlay();
    drawGameOverOverlay();

    ctx.restore();
    syncDomHud();
  }

  /* ===== PUBLIC API ========================================= */
  function restartLocked() {
    if (!state) return false;
    if (state.awaitingName) return true;
    if (state.phase === "over" && Date.now() < state.gameOverLockUntil) return true;
    return false;
  }

  function startPlaying() {
    audio.init();
    if (restartLocked()) return;
    if (state.phase === "demo" || state.phase === "over") {
      // Carry over best info; reset everything else
      const best = state.best;
      const bestName = state.bestName, bestTier = state.bestTier, bestDate = state.bestDate;
      initState(true);
      state.best = best;
      state.bestName = bestName; state.bestTier = bestTier; state.bestDate = bestDate;
      state.tierIdxLast = 0;
      state.phase = "playing";
      spawnGate();
      audio.play("nudge");
    }
  }

  window.ktNudge = function (dir) {
    audio.init();
    if (state.phase === "demo" || state.phase === "over") {
      if (restartLocked()) return;
      startPlaying();
      // Apply nudge immediately so the input feels responsive
      state.kairu.zone = clamp(state.kairu.zone + Math.sign(dir), 0, ZONE_COUNT - 1);
      flashControlBtn(dir < 0 ? "gUpBtn" : "gDownBtn");
      return;
    }
    const next = clamp(state.kairu.zone + Math.sign(dir), 0, ZONE_COUNT - 1);
    if (next === state.kairu.zone) return;
    state.kairu.zone = next;
    audio.play("nudge");
    spawnFeathers(W * state.kairu.x - 6, state.kairu.curY, 4, "rgba(255,255,255,0.85)", 50);
    flashControlBtn(dir < 0 ? "gUpBtn" : "gDownBtn");
  };

  window.ktResetBest = function () {
    if (!confirm("Reset your best score?")) return;
    writeBest(0);
    state.best = 0;
    state.bestName = ""; state.bestTier = ""; state.bestDate = "";
    writeBestMeta();
    syncDomHud();
  };

  window.ktToggleMute = function () {
    audio.init();
    audio.setMuted(!audio.muted);
    const btn = document.getElementById("gMuteBtn");
    if (btn) {
      btn.textContent = audio.muted ? "\uD83D\uDD07 Sound off" : "\uD83D\uDD0A Sound on";
      btn.setAttribute("aria-pressed", audio.muted ? "true" : "false");
    }
  };

  function flashControlBtn(id) {
    const b = document.getElementById(id);
    if (!b) return;
    b.classList.add("pressed");
    setTimeout(() => b.classList.remove("pressed"), 110);
  }

  /* ===== INPUT ============================================== */
  function onKeyDown(e) {
    const el = document.getElementById("gameCanvas");
    if (!el || !document.body.contains(el)) return;
    // Don't hijack typing when the name input is focused
    const ae = document.activeElement;
    if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
    const k = e.key;
    if (k === "ArrowUp" || k === "w" || k === "W") {
      if (!e.repeat) { window.ktNudge(-1); }
      e.preventDefault();
    } else if (k === "ArrowDown" || k === "s" || k === "S") {
      if (!e.repeat) { window.ktNudge(+1); }
      e.preventDefault();
    } else if (k === "ArrowRight" || k === "d" || k === "D") {
      if (state.phase === "demo" || state.phase === "over") startPlaying();
      state.keys.forward = true;
      e.preventDefault();
    } else if (k === "ArrowLeft" || k === "a" || k === "A") {
      if (state.phase === "demo" || state.phase === "over") startPlaying();
      state.keys.back = true;
      e.preventDefault();
    } else if (k === " " || k === "Enter") {
      if (state.phase !== "playing") startPlaying();
      e.preventDefault();
    } else if (k === "m" || k === "M") {
      window.ktToggleMute();
    }
  }
  function onKeyUp(e) {
    const k = e.key;
    if (k === "ArrowRight" || k === "d" || k === "D") {
      state.keys.forward = false;
    } else if (k === "ArrowLeft" || k === "a" || k === "A") {
      state.keys.back = false;
    }
  }

  function onCanvasTap(e) {
    audio.init();
    if (state && state.awaitingName) return;
    const rect = canvas.getBoundingClientRect();
    let clientY;
    if (e.touches && e.touches.length) clientY = e.touches[0].clientY;
    else clientY = e.clientY;
    const y = clientY - rect.top;
    if (y < rect.height / 2) window.ktNudge(-1);
    else                     window.ktNudge(+1);
    e.preventDefault();
  }

  /* ===== BOOT =============================================== */
  function bootKairu() {
    canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    initState();
    state.best = readBest();
    readBestMeta();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("click", onCanvasTap);
    canvas.addEventListener("touchstart", onCanvasTap, { passive: false });
    if (!rafId) rafId = requestAnimationFrame(tick);
    syncDomHud();

    // Wire the name input field — Enter saves, Esc skips
    const nameField = document.getElementById("nameField");
    if (nameField) {
      nameField.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter")  { e.preventDefault(); window.ktSaveName(); }
        if (e.key === "Escape") { e.preventDefault(); window.ktSkipName(); }
      });
    }

    // Esc closes the trophy modal
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const m = document.getElementById("bestModal");
        if (m && !m.hasAttribute("hidden")) window.ktCloseBest();
      }
    });

    // Sync mute button label on first paint
    const mb = document.getElementById("gMuteBtn");
    if (mb) {
      try {
        const m = localStorage.getItem("ktMute") === "1";
        mb.textContent = m ? "\uD83D\uDD07 Sound off" : "\uD83D\uDD0A Sound on";
      } catch (e) {}
    }
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(bootKairu, 50);
  } else {
    window.addEventListener("DOMContentLoaded", () => setTimeout(bootKairu, 50));
  }
})();
