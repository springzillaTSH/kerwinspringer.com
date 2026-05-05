/* ============================================================
   PAPERS PULL — drives the bottom-of-page library reveal +
   Kairu nudge on papers.html.
   - Smooth physics: scroll sets a target, current value lerps
     toward it every rAF tick (0.085 damping), so the page
     settles instead of snapping.
   - Pan: ~38s sine cycle, starts from middle, goes left first.
   - Particles: spawned into .pp-particles, anchored to the
     same pan transform as the photograph (set via CSS vars
     on <html> so both layers move together).
   - Kairu: hops on entry + on every message change.
   ============================================================ */
(function(){
  'use strict';

  var html = document.documentElement;
  var bar  = document.getElementById('ppKairuBar');
  if (!bar) return; // page didn't include the markup; bail

  var text   = document.getElementById('ppKairuText');
  var inner  = document.getElementById('ppKairuInner');
  var ctaEl  = document.getElementById('ppKairuCta');
  var libBox = document.getElementById('ppParticles');

  var target = 0;
  var current = 0;
  var lastTime = performance.now();
  var panTime = 0;
  var wasActive = false;

  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function easeInOutCubic(x){
    return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
  }

  function recomputeTarget(){
    // 1) Never pull while the user is browsing the subject list on mobile —
    //    they're trying to find a subject, not finishing their session.
    if (document.body.classList.contains('mobile-list')){
      target = 0; return;
    }
    var docH = document.documentElement.scrollHeight;
    var winH = window.innerHeight;
    var maxScroll = Math.max(1, docH - winH);
    var y = window.scrollY || window.pageYOffset || 0;
    // 2) Smaller zone on mobile (220 vs 700) so the pull doesn't eat
    //    half the scroll on short pages.
    var isMobile = window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
    var baseZone = isMobile ? 220 : 700;
    // 3) And cap the zone at a fraction of the scrollable distance, so very
    //    short pages don't trigger the pull from near the top.
    var zone = Math.min(baseZone, maxScroll * (isMobile ? 0.30 : 0.55));
    if (zone < 80){ target = 0; return; } // page too short — don't pull at all
    var start = maxScroll - zone;
    var raw = (y - start) / zone;
    target = easeInOutCubic(clamp(raw, 0, 1));
  }

  function frame(now){
    var dt = Math.min(50, now - lastTime);
    lastTime = now;
    var alpha = 1 - Math.pow(1 - 0.085, dt / 16.67);
    current += (target - current) * alpha;
    if (Math.abs(target - current) < 0.0005) current = target;

    html.style.setProperty('--pp-pull', current.toFixed(4));
    html.style.setProperty('--pp-pull-pe', current > 0.4 ? 'auto' : 'none');

    // Each fresh entry into the pull zone restarts the pan from middle
    if (current > 0.05 && !wasActive){ panTime = 0; wasActive = true; }
    if (current < 0.02 &&  wasActive){ wasActive = false; }

    // OSCILLATING PAN: middle → left → middle → right → middle, cycle
    panTime += dt * 0.000165; // ~38s full cycle
    var s = -Math.sin(panTime); // negate so we go LEFT first
    var center = -17.5, amp = 17.5;
    var revealPan = center + s * amp;
    var jitter = Math.sin(panTime * 3.7) * 0.35;
    var panX = revealPan + jitter;
    var scale = 1.04 + current * 0.025;
    html.style.setProperty('--pp-lib-pan-x', panX.toFixed(3) + '%');
    html.style.setProperty('--pp-lib-scale', scale.toFixed(3));

    // arrival flag drives the CTA sheen
    if (current > 0.92 && !bar.classList.contains('pp-arrived')) bar.classList.add('pp-arrived');
    if (current < 0.85 &&  bar.classList.contains('pp-arrived')) bar.classList.remove('pp-arrived');

    if (current > 0.85 && !bar.dataset.entered){
      bar.dataset.entered = '1';
      triggerHop();
      startCycle();
    }
    if (current < 0.20 &&  bar.dataset.entered){
      bar.dataset.entered = '';
      stopCycle();
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', recomputeTarget, { passive: true });
  window.addEventListener('resize', recomputeTarget);
  recomputeTarget();
  requestAnimationFrame(frame);

  // ============================================================
  // AMBIENT PARTICLES — three depth tiers anchored to the photo
  // ============================================================
  function spawnParticles(){
    if (!libBox) return;
    var pathsByTier = {
      near: ['pp-drift-e','pp-drift-e','pp-drift-f','pp-drift-a','pp-drift-b'],
      mid:  ['pp-drift-a','pp-drift-b','pp-drift-c','pp-drift-d','pp-drift-a','pp-drift-b'],
      far:  ['pp-drift-e','pp-drift-f','pp-drift-a','pp-drift-b']
    };
    var easings = ['linear','ease-in-out','ease-out','cubic-bezier(.4,.05,.6,.95)','linear'];
    function rand(a,b){ return a + Math.random()*(b-a); }
    function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function spawn(tier, sizeMin, sizeMax, durMin, durMax, opMin, opMax){
      var p = document.createElement('div');
      p.className = 'pp-p pp-' + tier;
      p.style.left = (Math.random() * 100) + '%';
      var sz = rand(sizeMin, sizeMax);
      p.style.width  = sz.toFixed(2) + 'px';
      p.style.height = sz.toFixed(2) + 'px';
      p.style.animationName = pick(pathsByTier[tier]);
      p.style.animationDuration = rand(durMin, durMax).toFixed(1) + 's';
      p.style.animationDelay = (-rand(0, durMax)).toFixed(1) + 's';
      p.style.animationTimingFunction = pick(easings);
      p.style.setProperty('--pp-max-op', rand(opMin, opMax).toFixed(2));
      libBox.appendChild(p);
    }
    for (var i = 0; i < 6;  i++) spawn('near', 3.6, 5.4, 26, 38, 0.55, 0.85);
    for (var i = 0; i < 14; i++) spawn('mid',  1.8, 3.0, 20, 32, 0.40, 0.65);
    for (var i = 0; i < 8;  i++) spawn('far',  0.8, 1.7, 34, 48, 0.30, 0.45);
  }
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    spawnParticles();
  }

  // ============================================================
  // Kairu hop + cycling messages
  // ============================================================
  function triggerHop(){
    var bird   = bar.querySelector('#ppKairuBird');
    var shadow = bar.querySelector('#ppKairuShadow');
    if (!bird) return;
    bird.style.animation   = 'none';
    shadow.style.animation = 'none';
    void bird.offsetWidth;
    bird.style.animation   = 'pp-kairu-hop 780ms cubic-bezier(.22,1,.36,1)';
    shadow.style.animation = 'pp-kairu-shadow 780ms ease-in-out';
  }

  var messages = [
    "How about grinding out some Paper Ones?",
    "Eh, while you're here — quick MCQ run?",
    "Five minutes, sixty questions. Game?",
    "Reading is half the work. Try a Paper One?",
    "You scrolled all the way down. Now warm up?",
    "Sharpen up — a few MCQs while it's fresh.",
    "Bookmark for later, or quiz right now?",
    "One round and we'll call it a session.",
    "Test what stuck. Paper One Practice is open.",
    "Big finish: a Paper One round before you go?"
  ];
  var idx = Math.floor(Math.random() * messages.length);
  var cycleTimer = null;

  function setMessage(){
    text.classList.add('pp-fading');
    setTimeout(function(){
      idx = (idx + 1) % messages.length;
      text.textContent = messages[idx];
      text.classList.remove('pp-fading');
      triggerHop();
    }, 380);
  }
  function startCycle(){
    text.textContent = messages[idx];
    if (cycleTimer) clearInterval(cycleTimer);
    cycleTimer = setInterval(setMessage, 5500);
  }
  function stopCycle(){
    if (cycleTimer){ clearInterval(cycleTimer); cycleTimer = null; }
  }

  // Whole-card click → open MCQ Practice
  function launch(){
    if (ctaEl){ ctaEl.textContent = 'Opening…'; }
    window.location.href = 'tools/csec-mcq/';
  }
  if (inner){
    inner.addEventListener('click', launch);
    inner.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); launch(); }
    });
  }
  if (ctaEl){
    ctaEl.addEventListener('click', function(e){ e.preventDefault(); launch(); });
  }
})();
