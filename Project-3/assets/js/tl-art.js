/*
 * Schémas réseau télécom / cybersécurité du § 03 Parcours.
 *  - ordinateur (≥ 1000 px) : un grand schéma occupe toute la hauteur de la frise, à droite. Une dorsale verticale
 *    relie un équipement à chaque entrée (antenne 5G, serveur, pare-feu, poste, routeur, cloud, TLS) ;
 *    des paquets circulent en boucle, à faible vitesse, sur la dorsale, les branches et les liaisons entre équipements ;
 *  - téléphone / tablette : le petit schéma placé dans le HTML s'affiche sous la 3e entrée.
 * La boucle ne tourne que lorsqu'un schéma est visible et que l'onglet est affiché.
 * Mouvement réduit : les schémas restent visibles, statiques, sans paquets.
 */
(function () {
  var small = document.querySelector('.tl-art');
  var tl = document.querySelector('.timeline');
  if (!small || !tl) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desk = window.matchMedia('(min-width: 1000px)');
  var NS = 'http://www.w3.org/2000/svg';
  var SPEED = 30;      // unités du dessin par seconde : lent
  var scenes = [];     // { art, layer, packets, inView }
  var raf = 0, last = 0, running = false;

  // ---------- Paquets : moteur commun aux deux schémas ----------
  function makePacket(layer, pts, start, pause) {
    var segs = [], total = 0;
    for (var j = 1; j < pts.length; j++) {
      var l = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
      segs.push(l); total += l;
    }
    var el = document.createElementNS(NS, 'circle');
    el.setAttribute('class', 'tl-pk'); el.setAttribute('r', '3.4'); el.setAttribute('opacity', '0');
    layer.appendChild(el);
    return { el: el, pts: pts, segs: segs, total: total, pause: pause * SPEED, d: -start * SPEED };
  }
  function place(p) {
    var cycle = p.total + p.pause;
    if (p.d >= cycle) p.d -= cycle;
    if (p.d < 0 || p.d > p.total) { p.el.setAttribute('opacity', '0'); return; }
    var d = p.d, k = 0;
    while (k < p.segs.length - 1 && d > p.segs[k]) { d -= p.segs[k]; k++; }
    var u = Math.min(1, d / p.segs[k]), a = p.pts[k], b = p.pts[k + 1];
    p.el.setAttribute('cx', (a[0] + (b[0] - a[0]) * u).toFixed(1));
    p.el.setAttribute('cy', (a[1] + (b[1] - a[1]) * u).toFixed(1));
    var edge = Math.min(p.d, p.total - p.d) / 18;      // fondu à l'entrée et à la sortie
    p.el.setAttribute('opacity', Math.max(0, Math.min(1, edge)).toFixed(2));
  }
  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;                        // ~30 images/s : largement suffisant pour un mouvement lent
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    scenes.forEach(function (s) {
      if (!s.inView) return;
      s.packets.forEach(function (p) { p.d += SPEED * dt; place(p); });
    });
  }
  function sync() {
    var want = !document.hidden && !reduce && scenes.some(function (s) { return s.inView; });
    scenes.forEach(function (s) { s.art.classList.toggle('run', s.inView && !document.hidden && !reduce); });
    if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    else if (!want && running) { running = false; cancelAnimationFrame(raf); }
  }
  document.addEventListener('visibilitychange', sync);
  function watch(scene) {
    scenes.push(scene);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { scene.inView = en[0].isIntersecting; sync(); }, { threshold: 0.03 }).observe(scene.art);
    } else { scene.inView = true; sync(); }
  }

  // ---------- Petit schéma (téléphone / tablette, ou sans mise en page large) ----------
  var smallLayer = small.querySelector('.tl-packets');
  if (smallLayer && !reduce) {
    var node = {};
    [].forEach.call(small.querySelectorAll('[data-node]'), function (g) {
      node[g.getAttribute('data-node')] = [+g.getAttribute('data-x'), +g.getAttribute('data-y')];
    });
    var routes = [['P', 'R', 'FW', 'C'], ['A', 'R', 'FW', 'S'], ['S', 'FW', 'R', 'P'], ['C', 'FW', 'R', 'A']];
    var sp = routes.map(function (r, i) {
      return makePacket(smallLayer, r.map(function (k) { return node[k]; }), i * 2.2, 1.6);
    });
    watch({ art: small, layer: smallLayer, packets: sp, inView: false });
  }

  // ---------- Grand schéma (ordinateur) : toute la hauteur de la frise ----------
  var tall = null, tallScene = null, builtFor = '';
  var DEV = [
    { k: 'ant', l: '5G' }, { k: 'srv', l: 'SERVEUR' }, { k: 'fw', l: 'PARE-FEU' }, { k: 'pc', l: 'POSTE' },
    { k: 'rtr', l: 'ROUTEUR' }, { k: 'cld', l: 'CLOUD' }, { k: 'tls', l: 'TLS' }
  ];
  function icon(k, big) {
    switch (k) {
      case 'ant': return '<path class="tl-wave" style="--w:0s" d="M8 -8a12 12 0 0 1 0 16M-8 -8a12 12 0 0 0 0 16"/><path class="tl-wave" style="--w:.5s" d="M14 -14a20 20 0 0 1 0 28M-14 -14a20 20 0 0 0 0 28"/><path class="tl-line" d="M0 4L-10 38M0 4L10 38M-6 26H6"/><circle class="tl-core tl-ant-core" cx="0" cy="0" r="5"/>';
      case 'srv': return '<rect class="tl-box" x="-20" y="-18" width="40" height="15" rx="3"/><rect class="tl-box" x="-20" y="2" width="40" height="15" rx="3"/><circle class="tl-core" cx="-12" cy="-10.5" r="2"/><circle class="tl-core" cx="-12" cy="9.5" r="2" style="--d:1.9s"/>';
      case 'fw': return '<circle class="tl-halo" cx="0" cy="0" r="34"/><path class="tl-shield" d="M0 -30L24 -21V0C24 15 13 24 0 30C-13 24 -24 15 -24 0V-21Z"/><rect class="tl-lock" x="-8" y="-3" width="16" height="13" rx="2"/><path class="tl-line" d="M-5 -3V-8a5 5 0 0 1 10 0V-3"/>';
      case 'pc': return '<rect class="tl-box" x="-19" y="-13" width="38" height="25" rx="3"/><path class="tl-line" d="M-25 18H25"/><circle class="tl-core" cx="0" cy="-1" r="3" style="--d:1.1s"/>';
      case 'rtr': return '<rect class="tl-box" x="-25" y="-14" width="50" height="28" rx="6"/><circle class="tl-core" cx="-12" cy="0" r="3"/><circle class="tl-core" cx="0" cy="0" r="3" style="--d:1.6s"/><circle class="tl-core" cx="12" cy="0" r="3" style="--d:2.2s"/>';
      case 'cld': return '<path class="tl-box" d="M-17 10H17A10 10 0 0 0 17 -10A15 15 0 0 0 -12 -12A11 11 0 0 0 -17 10Z"/>';
      default: return '<circle class="tl-box" cx="0" cy="0" r="17"/><rect class="tl-lock" x="-7" y="-2" width="14" height="11" rx="2"/><path class="tl-line" d="M-4 -2V-6a4 4 0 0 1 8 0V-2"/>';
    }
  }
  var LABEL_Y = { ant: 54, srv: 36, fw: 50, pc: 36, rtr: 32, cld: 30, tls: 34 };

  function buildTall() {
    var items = [].slice.call(tl.querySelectorAll(':scope > .item'));
    var W = tall.clientWidth, H = tl.offsetHeight;
    if (!items.length || W < 200 || H < 200) return;
    var key = W + 'x' + H + ':' + items.map(function (it) { return it.offsetTop; }).join(',');
    if (key === builtFor) return;
    builtFor = key;

    var sx = 24;                                          // dorsale
    var xs = [W * 0.5, W * 0.8];                          // deux colonnes d'équipements, en quinconce
    var pts = items.map(function (it, i) { return { x: i % 2 ? xs[1] : xs[0], y: it.offsetTop + 36 }; });
    var s = '<text class="tl-cap" x="' + (W / 2) + '" y="' + (H - 12) + '" text-anchor="middle">// liaison sécurisée</text>';
    s += '<g class="tl-links"><line class="tl-spine" x1="' + sx + '" y1="0" x2="' + sx + '" y2="' + H + '"/>';
    pts.forEach(function (p, i) {
      s += '<line x1="' + sx + '" y1="' + p.y + '" x2="' + p.x + '" y2="' + p.y + '"/>';
      if (i < pts.length - 1) {
        var q = pts[i + 1];
        s += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '"/>';
        // nœud secondaire entre deux équipements, relié aux deux (maillage)
        var gx = i % 2 ? W * 0.28 : W - 26, gy = (p.y + q.y) / 2;
        s += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + gx + '" y2="' + gy + '"/><line x1="' + q.x + '" y1="' + q.y + '" x2="' + gx + '" y2="' + gy + '"/>';
      }
    });
    s += '</g>';
    pts.forEach(function (p, i) {
      if (i < pts.length - 1) {
        var q = pts[i + 1], gx = i % 2 ? W * 0.28 : W - 26, gy = (p.y + q.y) / 2;
        s += '<circle class="tl-core tl-ghost" cx="' + gx + '" cy="' + gy + '" r="3" style="--d:' + ((i * 0.7) % 3).toFixed(1) + 's"/>';
      }
      s += '<circle class="tl-core tl-spine-node" cx="' + sx + '" cy="' + p.y + '" r="4" style="--d:' + ((i * 0.5) % 3).toFixed(1) + 's"/>';
      var d = DEV[i % DEV.length], big = d.k === 'fw';
      s += '<g class="tl-node' + (big ? ' tl-fw' : '') + '" transform="translate(' + p.x.toFixed(1) + ' ' + p.y + ')' + (big ? ' scale(1.25)' : '') + '" style="--d:' + ((i * 0.6) % 3).toFixed(1) + 's">' + icon(d.k) +
           '<text x="0" y="' + (LABEL_Y[d.k]) + '" text-anchor="middle">' + d.l + '</text></g>';
    });
    s += '<g class="tl-packets"></g>';
    var svg = tall.querySelector('svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('height', H);
    svg.innerHTML = s;

    // paquets : dorsale, branches, liaisons entre équipements
    if (tallScene) { tallScene.packets = []; }
    if (reduce) return;
    var layer = svg.querySelector('.tl-packets'), pk = [];
    var n = Math.max(2, Math.round(H / 520));
    for (var a = 0; a < n; a++) pk.push(makePacket(layer, [[sx, 0], [sx, H]], (H / SPEED) * (a / n), 0));
    pts.forEach(function (p, i) {
      pk.push(makePacket(layer, [[sx, p.y], [p.x, p.y]], i * 1.3, 4 + (i % 3)));
      if (i < pts.length - 1) pk.push(makePacket(layer, [[p.x, p.y], [pts[i + 1].x, pts[i + 1].y]], 2 + i * 1.7, 5 + (i % 2) * 2));
    });
    if (tallScene) tallScene.packets = pk;
    else { tallScene = { art: tall, layer: layer, packets: pk, inView: false }; watch(tallScene); }
  }

  function setup() {
    if (!tall) {
      tall = document.createElement('figure');
      tall.className = 'tl-tall';
      tall.setAttribute('aria-hidden', 'true');
      tall.innerHTML = '<svg focusable="false" preserveAspectRatio="xMidYMin meet"></svg>';
      tl.appendChild(tall);
      document.documentElement.classList.add('tl-tall-on');
      if (window.ResizeObserver) new ResizeObserver(function () { if (desk.matches) buildTall(); }).observe(tl);
      window.addEventListener('load', function () { if (desk.matches) buildTall(); });
    }
    if (desk.matches) { builtFor = ''; buildTall(); }
  }
  setup();
  if (desk.addEventListener) desk.addEventListener('change', function () { setup(); });
})();
