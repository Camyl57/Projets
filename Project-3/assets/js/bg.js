/*
 * Fond animé « réseau » : nœuds reliés par des liens, paquets qui circulent, scintillement léger,
 * grille discrète (CSS), et une couche optionnelle de photos (salle serveurs, baie réseau, fibre optique)
 * très atténuée par une superposition pour garder le texte lisible en clair comme en sombre.
 *
 * - canvas limité à 60 images/s, en pause quand l'onglet est caché, densité adaptée à l'écran ;
 * - prefers-reduced-motion : le fond reste visible mais statique (pas de paquets ni de scintillement) ;
 * - photos en WebP, chargées en différé après le chargement de la page (jamais avec « économiseur de données »).
 * Tout est décoratif (aria-hidden) ; le contenu de la page n'est jamais modifié.
 */
(function () {
  var root = document.documentElement;
  var body = document.body;
  if (!body || !window.HTMLCanvasElement) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/js\/bg\.js[^/]*$/, 'img/bg/') : 'assets/img/bg/';
  var small = function () { return window.innerWidth < 720; };

  // ---------- Structure : photos < voile < canvas, derrière tout le contenu ----------
  var scene = document.createElement('div');
  scene.className = 'bg-scene';
  scene.setAttribute('aria-hidden', 'true');
  var photoBox = document.createElement('div');
  photoBox.className = 'bg-photos';
  var shade = document.createElement('div');
  shade.className = 'bg-shade';
  var canvas = document.createElement('canvas');
  canvas.className = 'bg-net';
  scene.appendChild(photoBox); scene.appendChild(shade); scene.appendChild(canvas);
  body.insertBefore(scene, body.firstChild);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ---------- Réseau : nœuds, liens, paquets ----------
  var W = 0, H = 0, dpr = 1, nodes = [], links = [], packets = [];
  var colA = '#34e8a2', colB = '#38c8e0';

  function readColors() {
    var cs = getComputedStyle(root);
    colA = cs.getPropertyValue('--accent').trim() || colA;
    colB = cs.getPropertyValue('--accent-2').trim() || colB;
  }

  function build() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, small() ? 1 : 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = small() ? 16 : Math.max(26, Math.min(64, Math.round((W * H) / 24000)));
    var reach = small() ? 190 : 230;
    nodes = []; links = []; packets = [];
    for (var i = 0; i < count; i++) {
      // meilleur candidat parmi quelques tirages : les nœuds restent bien répartis
      var best = null, bestD = -1;
      for (var k = 0; k < 14; k++) {
        var x = Math.random() * W, y = Math.random() * H, dmin = 1e9;
        for (var j = 0; j < nodes.length; j++) dmin = Math.min(dmin, Math.hypot(nodes[j].x - x, nodes[j].y - y));
        if (dmin > bestD) { bestD = dmin; best = { x: x, y: y }; }
      }
      nodes.push({ x: best.x, y: best.y, r: 1.4 + Math.random() * 1.4, ph: Math.random() * 6.283, sp: 0.6 + Math.random() * 1.4, hub: Math.random() < 0.14 });
    }
    var seen = {};
    nodes.forEach(function (a, ia) {
      nodes.map(function (b, ib) { return { ib: ib, d: ib === ia ? 1e9 : Math.hypot(a.x - b.x, a.y - b.y) }; })
        .sort(function (p, q) { return p.d - q.d; })
        .slice(0, a.hub ? 3 : 2)
        .forEach(function (n) {
          if (n.d > reach) return;
          var key = Math.min(ia, n.ib) + '-' + Math.max(ia, n.ib);
          if (seen[key]) return;
          seen[key] = 1; links.push({ a: ia, b: n.ib, len: n.d });
        });
    });
    var np = links.length ? (small() ? 4 : 11) : 0;
    for (var p = 0; p < np; p++) packets.push(newPacket(Math.random()));
  }

  function newPacket(t) {
    return { l: Math.floor(Math.random() * links.length), t: t || 0, dir: Math.random() < 0.5 ? 1 : -1, v: 0.0028 + Math.random() * 0.004 };
  }

  function draw(now) {
    var t = (now || 0) / 1000, animate = !reduce;
    ctx.clearRect(0, 0, W, H);
    var light = root.getAttribute('data-theme') === 'light';

    ctx.lineWidth = 1;
    ctx.strokeStyle = colA; ctx.globalAlpha = light ? 0.22 : 0.16;
    ctx.beginPath();
    links.forEach(function (l) { var a = nodes[l.a], b = nodes[l.b]; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); });
    ctx.stroke();

    nodes.forEach(function (n) {
      var tw = animate ? 0.5 + 0.5 * Math.sin(t * n.sp + n.ph) : 0.6;
      ctx.globalAlpha = (light ? 0.35 : 0.3) + tw * 0.4;
      ctx.fillStyle = n.hub ? colB : colA;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.hub ? n.r + 1.2 : n.r, 0, 6.283); ctx.fill();
      if (n.hub) { ctx.globalAlpha = 0.14 + tw * 0.14; ctx.strokeStyle = colB; ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 5 + tw * 2, 0, 6.283); ctx.stroke(); }
    });

    if (animate) {
      packets.forEach(function (p, i) {
        p.t += p.v;
        if (p.t >= 1) { packets[i] = p = newPacket(0); }
        var l = links[p.l], a = nodes[l.a], b = nodes[l.b];
        var u = p.dir > 0 ? p.t : 1 - p.t;
        for (var k = 0; k < 3; k++) {
          var uu = Math.max(0, Math.min(1, u - p.dir * k * 0.02));
          ctx.globalAlpha = (light ? 0.9 : 0.85) * (1 - k * 0.32);
          ctx.fillStyle = colB;
          ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * uu, a.y + (b.y - a.y) * uu, 2.2 - k * 0.5, 0, 6.283); ctx.fill();
        }
      });
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Boucle : 60 images/s au plus, pause quand l'onglet est caché ----------
  var raf = 0, last = 0, running = false;
  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (now - last < 16.5) return;
    last = now; draw(now);
  }
  function start() { if (running || reduce || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { build(); if (reduce || !running) draw(0); }, 160);
  });
  // changement de thème : les couleurs du fond suivent
  new MutationObserver(function () { readColors(); if (reduce || !running) draw(0); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  readColors(); build(); draw(0); start();
  root.classList.add('bg-ready');

  // ---------- Photos de fond (optionnelles, WebP, chargement différé) ----------
  var PHOTOS = ['salle-serveurs', 'baie-reseau', 'fibre-optique'];
  var HOP_PHOTO = [0, 0, 1, 2, 0, 1, 2, 0];   // photo associée au hop courant (0 = haut de page)
  var els = [], ready = [], current = -1, wanted = document.querySelector('.hero') ? 0 : 1;
  var enabled = true;
  try { enabled = localStorage.getItem('bgphotos') !== '0'; } catch (e) {}
  var saver = !!(navigator.connection && navigator.connection.saveData);

  PHOTOS.forEach(function (name, i) {
    var d = document.createElement('div');
    d.className = 'bg-photo';
    photoBox.appendChild(d);
    els.push(d);
  });

  function load(i, done) {
    if (ready[i] !== undefined) { if (done && ready[i]) done(); return; }
    ready[i] = false;
    var img = new Image();
    img.onload = function () { els[i].style.backgroundImage = 'url("' + img.src + '")'; ready[i] = true; if (done) done(); };
    img.onerror = function () { ready[i] = null; };
    img.src = base + PHOTOS[i] + '.webp';
  }
  function show(i) {
    wanted = i;
    if (!enabled || saver || !loaded) return;
    if (reduce) i = 0;   // mouvement réduit : une seule photo, fixe
    if (i === current) return;
    load(i, function () {
      if (i !== (reduce ? 0 : wanted)) return;
      els.forEach(function (el, k) { el.classList.toggle('on', k === i); });
      current = i;
    });
  }
  var loaded = false;
  function begin() {
    if (loaded) return;
    loaded = true; show(wanted);
  }
  function whenIdle() {
    if (window.requestIdleCallback) requestIdleCallback(begin, { timeout: 2500 }); else setTimeout(begin, 1200);
  }
  if (document.readyState === 'complete') whenIdle(); else window.addEventListener('load', whenIdle);

  document.addEventListener('hopchange', function (e) {
    var h = e.detail | 0;
    show(HOP_PHOTO[Math.max(0, Math.min(7, h))]);
  });

  // Palette Ctrl+K : afficher / masquer les photos
  window.__toggleBgPhotos = function () {
    enabled = !enabled;
    try { localStorage.setItem('bgphotos', enabled ? '1' : '0'); } catch (e) {}
    if (!enabled) { els.forEach(function (el) { el.classList.remove('on'); }); current = -1; }
    else show(wanted);
    return enabled;
  };
})();
