(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  // ---------- Thème clair / sombre ----------
  var tbtn = document.querySelector('.theme-toggle');
  function syncTheme() {
    if (tbtn) tbtn.setAttribute('aria-pressed', root.dataset.theme === 'dark' ? 'true' : 'false');
  }
  syncTheme();
  if (tbtn) tbtn.addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncTheme();
    window.dispatchEvent(new Event('themechange'));
  });

  // ---------- Menu mobile ----------
  var btn = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu');
  if (btn && menu) {
    var close = function () { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function () {
      btn.setAttribute('aria-expanded', menu.classList.toggle('open'));
    });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { close(); btn.focus(); }
    });
  }

  // ---------- Photo : si assets/img/photo.jpg existe, l'emplacement s'affiche ----------
  var photo = document.getElementById('photo');
  if (photo) {
    var show = function () {
      photo.closest('.about-grid').classList.add('has-photo');
      photo.closest('.portrait').hidden = false;
    };
    if (photo.complete && photo.naturalWidth) show();
    else photo.addEventListener('load', show);
  }

  // ---------- Titres : les mots montent un par un ----------
  function split(el) {
    var i = 0;
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.className = 'wi';
            s.style.setProperty('--wi', i++); s.textContent = p;
            w.appendChild(s); f.appendChild(w);
          });
          n.replaceChild(f, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
    el.classList.add('split');
  }
  var titles = $$('h1, section h2, .detail h2');
  titles.forEach(split);

  // ---------- Texte « brouillé » avant de se fixer ----------
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789#$%&/<>';
  function scramble(el, d) {
    var final = el.textContent, start = null, dur = d || 650;
    if (reduce) return;
    function step(t) {
      if (!start) start = t;
      var k = Math.min((t - start) / dur, 1), out = '';
      for (var i = 0; i < final.length; i++) {
        out += (final[i] === ' ' || i < k * final.length) ? final[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step); else el.textContent = final;
    }
    requestAnimationFrame(step);
  }

  // ---------- Chiffres qui comptent ----------
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-count'), 10), start = null;
    if (reduce || isNaN(to)) return;
    function step(t) {
      if (!start) start = t;
      var k = Math.min((t - start) / 1000, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  // ---------- Apparition au défilement (le contenu reste visible sans JavaScript) ----------
  var groups = [
    ['section .eyebrow, section > .wrap > .body, .about-grid > div, .about-grid > figure', 0],
    ['.focus > div', 1], ['.grid > .project', 1], ['.timeline > .item', 1], ['.others', 0],
    ['.skills-ui', 0], ['.cert-grid > .cert', 1], ['.langs > li', 1], ['.contact-list > li', 1], ['.stats', 0],
    ['.detail section, .detail .pager', 1]
  ];
  var els = [];
  groups.forEach(function (g) {
    $$(g[0]).forEach(function (el, i) {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', '');
      if (g[1]) el.style.setProperty('--d', (Math.min(i, 5) * 0.09).toFixed(2) + 's');
      els.push(el);
    });
  });
  var animated = els.concat(titles);
  function onEnter(el) {
    el.classList.add('in');
    if (el.classList.contains('eyebrow')) { el.classList.add('drawn'); var s = el.querySelector('span'); if (s) scramble(s); }
    $$('[data-count]', el).forEach(countUp);
    if (el.hasAttribute('data-reveal')) {
      // une fois l'apparition terminée, on rend la main aux effets de survol
      setTimeout(function () { el.removeAttribute('data-reveal'); el.classList.remove('in'); }, 1300);
    }
  }
  if (reduce || !('IntersectionObserver' in window)) {
    animated.forEach(function (el) { el.classList.add('in'); if (el.classList.contains('eyebrow')) el.classList.add('drawn'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target); onEnter(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    animated.forEach(function (el) { io.observe(el); });
    var kick = document.querySelector('.kicker');
    if (kick) scramble(kick);
  }

  // ---------- Survol : halo, inclinaison, boutons magnétiques ----------
  if (!reduce && fine) {
    $$('.project, .skill-group, .cert').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
        c.style.setProperty('--rx', ((0.5 - py) * 5).toFixed(2) + 'deg');
        c.style.setProperty('--ry', ((px - 0.5) * 6).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', function () {
        c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg');
      });
    });
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px');
        b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () {
        b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px');
      });
    });
  }

  // ---------- Fond du hero : réseau de nœuds qui réagit à la souris ----------
  var cv = document.querySelector('.net');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), hero = cv.parentNode;
    var w = 0, h = 0, nodes = [], mouse = { x: -999, y: -999 }, visible = true, raf = 0, col;
    var readColors = function () {
      var s = getComputedStyle(root);
      col = { n: s.getPropertyValue('--accent-2').trim() || '#6f8ff5', l: s.getPropertyValue('--dolphin').trim() || '#8a96a3' };
    };
    var size = function () {
      var r = hero.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(80, Math.round(w * h / 13000)); nodes = [];
      for (var i = 0; i < n; i++) nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 1.6 + Math.random() * 1.8
      });
    };
    var draw = function (move) {
      ctx.clearRect(0, 0, w, h);
      var D = 135, M = 170, i, j, a, b, dx, dy, d;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (move) {
          dx = mouse.x - a.x; dy = mouse.y - a.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < M && d > 1) { a.vx += dx / d * 0.012; a.vy += dy / d * 0.012; }
          a.vx *= 0.995; a.vy *= 0.995;
          var sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
          if (sp > 0.9) { a.vx *= 0.9 / sp; a.vy *= 0.9 / sp; }
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < D) {
            ctx.globalAlpha = (1 - d / D) * 0.55; ctx.strokeStyle = col.l; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        dx = mouse.x - a.x; dy = mouse.y - a.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < M) {
          ctx.globalAlpha = (1 - d / M) * 0.9; ctx.strokeStyle = col.n; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.globalAlpha = 0.85; ctx.fillStyle = col.n;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    var loop = function () {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(true); raf = requestAnimationFrame(loop);
    };
    var start = function () { if (!raf && !reduce) raf = requestAnimationFrame(loop); };
    readColors(); size(); draw(false);
    if (!reduce) {
      start();
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting; if (visible) start();
      }).observe(hero);
      document.addEventListener('visibilitychange', start);
      hero.addEventListener('pointermove', function (e) {
        var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
    }
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { size(); if (reduce) draw(false); }, 150);
    });
    window.addEventListener('themechange', function () { readColors(); if (reduce) draw(false); });
  }

  // ---------- Titre principal : animation dès le chargement ----------
  $$('.hero h1, .page-head h1').forEach(function (h) { requestAnimationFrame(function () { h.classList.add('in'); }); });

  // ---------- Curseur personnalisé (souris uniquement) ----------
  if (!reduce && fine) {
    var dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); document.body.appendChild(dot);
    var cx = 0, cy = 0, rx = 0, ry = 0, moving = false;
    window.addEventListener('pointermove', function (e) {
      cx = e.clientX; cy = e.clientY;
      dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      if (!moving) { rx = cx; ry = cy; moving = true; root.classList.add('cursor-on'); requestAnimationFrame(follow); }
    });
    document.addEventListener('pointerleave', function () { root.classList.remove('cursor-on'); });
    document.addEventListener('pointerenter', function () { root.classList.add('cursor-on'); });
    function follow() {
      rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18;
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      requestAnimationFrame(follow);
    }
    document.addEventListener('pointerover', function (e) {
      ring.classList.toggle('big', !!e.target.closest('a, button, .project, .cert'));
    });
  }

  // ---------- Rideau d'entrée (une fois par session, page d'accueil) ----------
  if (!reduce && document.querySelector('.hero')) {
    var seen = false;
    try { seen = sessionStorage.getItem('intro') === '1'; sessionStorage.setItem('intro', '1'); } catch (e) {}
    if (!seen) {
      var cur = document.createElement('div');
      cur.className = 'curtain'; cur.setAttribute('aria-hidden', 'true');
      cur.innerHTML = '<span>Camyl Khebache</span>';
      document.body.appendChild(cur);
      setTimeout(function () { cur.remove(); }, 2300);
    }
  }

  // ---------- Navigation rapide (Ctrl K / Cmd K) ----------
  (function () {
    var brand = document.querySelector('.brand');
    if (!brand || !window.HTMLDialogElement) return;
    var sub = (brand.getAttribute('href') || '').indexOf('../') === 0;
    var pre = sub ? '../' : '';
    var sec = function (id) { return sub ? '../index.html#' + id : '#' + id; };
    var mail = 'camyl.khebache@gmail.com';

    var toast = document.createElement('div');
    toast.className = 'toast'; toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
    var tt;
    function say(msg) {
      toast.textContent = msg; toast.classList.add('on');
      clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('on'); }, 2200);
    }
    function go(url, blank) {
      if (blank) { window.open(url, '_blank', 'noopener'); return; }
      if (url.charAt(0) === '#') {
        var t = document.querySelector(url);
        if (t) { t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', url); }
      } else window.location.href = url;
    }
    var items = [
      { g: 'Aller à', t: 'À propos', h: '§ 01', u: sec('apropos') },
      { g: 'Aller à', t: 'Projets', h: '§ 02', u: sec('projets') },
      { g: 'Aller à', t: 'Parcours', h: '§ 03', u: sec('parcours') },
      { g: 'Aller à', t: 'Compétences', h: '§ 04', u: sec('competences') },
      { g: 'Aller à', t: 'Certifications', h: '§ 05', u: sec('certifications') },
      { g: 'Aller à', t: 'Langues', h: '§ 06', u: sec('langues') },
      { g: 'Aller à', t: 'Contact', h: '§ 07', u: sec('contact') },
      { g: 'Projets', t: 'Tous les projets', h: 'liste', u: pre + 'projets/index.html' },
      { g: 'Projets', t: 'Application Symfony conteneurisée', h: '2025', u: pre + 'projets/symfony-docker.html' },
      { g: 'Projets', t: 'Jeu web 2048', h: '2025', u: pre + 'projets/jeu-2048.html' },
      { g: 'Projets', t: 'Portfolio personnel', h: '2026', u: pre + 'projets/portfolio.html' },
      { g: 'Actions', t: 'Télécharger mon CV', h: 'PDF', f: function () { var a = document.createElement('a'); a.href = pre + 'assets/cv/CV-Camyl-Khebache.pdf'; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); } },
      { g: 'Actions', t: 'Copier mon e-mail', h: mail, f: function () {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mail).then(function () { say('E-mail copié'); }, function () { say(mail); });
          else say(mail); } },
      { g: 'Actions', t: 'Écrire un e-mail', h: 'mailto', u: 'mailto:' + mail },
      { g: 'Actions', t: 'Appeler', h: '06 73 60 88 94', u: 'tel:+33673608894' },
      { g: 'Actions', t: 'GitHub', h: '↗', u: 'https://github.com/Camyl57/Projets', b: 1 },
      { g: 'Actions', t: 'LinkedIn', h: '↗', u: 'https://www.linkedin.com/in/camyl-khebache-8961a1247/', b: 1 },
      { g: 'Actions', t: 'Basculer thème clair / sombre', h: 'thème', f: function () { if (tbtn) tbtn.click(); } }
    ];

    var dlg = document.createElement('dialog');
    dlg.className = 'palette'; dlg.setAttribute('aria-label', 'Navigation rapide');
    dlg.innerHTML = '<input class="palette-input" type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="Aller à une section, un projet, une action…" autocomplete="off" spellcheck="false">' +
      '<ul class="palette-list" id="pal-list" role="listbox" aria-label="Résultats"></ul>' +
      '<div class="palette-foot"><span>↑↓ naviguer</span><span>↵ ouvrir</span><span>Échap fermer</span></div>';
    document.body.appendChild(dlg);
    var input = dlg.querySelector('input'), list = dlg.querySelector('ul');
    var shown = [], sel = 0;
    var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };

    function render() {
      var q = norm(input.value.trim()), last = '', html = '';
      shown = items.filter(function (it) { return !q || norm(it.t + ' ' + it.g).indexOf(q) > -1; });
      if (sel >= shown.length) sel = 0;
      shown.forEach(function (it, i) {
        if (it.g !== last) { html += '<li class="grp" role="presentation">' + it.g + '</li>'; last = it.g; }
        html += '<li role="option" id="pal-' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '"><span>' + it.t + '</span><small>' + it.h + '</small></li>';
      });
      list.innerHTML = html || '<li class="palette-empty" role="presentation">Aucun résultat</li>';
      input.setAttribute('aria-activedescendant', shown.length ? 'pal-' + sel : '');
      var s = list.querySelector('[aria-selected="true"]');
      if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
    }
    function run(i) {
      var it = shown[i]; if (!it) return;
      dlg.close();
      setTimeout(function () { if (it.f) it.f(); else go(it.u, it.b); }, 60);
    }
    function openPal() { if (dlg.open) return; input.value = ''; sel = 0; render(); dlg.showModal(); input.focus(); }

    input.addEventListener('input', function () { sel = 0; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    });
    list.addEventListener('click', function (e) { var li = e.target.closest('[role="option"]'); if (li) run(+li.getAttribute('data-i')); });
    list.addEventListener('pointermove', function (e) {
      var li = e.target.closest('[role="option"]');
      if (li && +li.getAttribute('data-i') !== sel) { sel = +li.getAttribute('data-i'); [].forEach.call(list.querySelectorAll('[role="option"]'), function (n) { n.setAttribute('aria-selected', n === li); }); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openPal(); }
    });
    var pb = document.querySelector('.palette-btn');
    if (pb) {
      pb.addEventListener('click', openPal);
      if (/Mac|iPhone|iPad/.test(navigator.platform || '')) { var k = pb.querySelector('kbd'); if (k) k.textContent = '⌘'; }
    }
  })();

  // ---------- Liens du menu : le texte se « brouille » au survol ----------
  if (!reduce && fine) {
    $$('.menu a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { if (!a.dataset.busy) { a.dataset.busy = '1'; scramble(a, 380); setTimeout(function () { delete a.dataset.busy; }, 420); } });
    });
  }

  // ---------- Parallaxe à la souris dans le hero ----------
  var heroEl = document.querySelector('.hero');
  if (heroEl && !reduce && fine) {
    heroEl.addEventListener('pointermove', function (e) {
      var r = heroEl.getBoundingClientRect();
      heroEl.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      heroEl.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
    heroEl.addEventListener('pointerleave', function () { heroEl.style.setProperty('--px', 0); heroEl.style.setProperty('--py', 0); });
  }

  // ---------- Compétences : sélecteur animé ----------
  (function () {
    var ui = document.querySelector('.skills-ui');
    if (!ui) return;
    var tabs = $$('.skill-tab', ui), panels = $$('.skill-panel', ui), cur = 0;
    panels.forEach(function (p, i) {
      p.setAttribute('data-n', '0' + (i + 1));
      $$('.chips li', p).forEach(function (li, k) { li.style.setProperty('--k', k); });
    });
    function select(i, focus, manual) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === cur;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('on', on);
        if (on) { t.classList.remove('restart'); void t.offsetWidth; }
      });
      if (focus) tabs[cur].focus();
      if (manual) ui.classList.add('manual');
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false, true); });
      t.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); select(cur + 1, true, true); }
        else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); select(cur - 1, true, true); }
        else if (k === 'Home') { e.preventDefault(); select(0, true, true); }
        else if (k === 'End') { e.preventDefault(); select(tabs.length - 1, true, true); }
      });
      // la barre de progression termine : on passe au domaine suivant
      $$('.bar', t)[0].addEventListener('animationend', function () { if (!ui.classList.contains('manual')) select(cur + 1, false, false); });
    });
    select(0, false, false);
    if (reduce || !('IntersectionObserver' in window)) ui.classList.add('manual');
    else new IntersectionObserver(function (en) { ui.classList.toggle('run', en[0].isIntersecting); }, { threshold: 0.35 }).observe(ui);
  })();

  // ---------- Certifications : part de la validité écoulée ----------
  $$('.validity').forEach(function (v) {
    var a = new Date(v.getAttribute('data-from') + '-01'), b = new Date(v.getAttribute('data-to') + '-01');
    var p = Math.max(0, Math.min(1, (Date.now() - a) / (b - a)));
    v.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  });

  // ---------- Défilement : progression, section active, frise, parallaxe ----------
  var bar = document.querySelector('.progress');
  var links = $$('.menu a[href^="#"]');
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var tl = document.querySelector('.timeline');
  var bigs = $$('.bigtext');
  var ticking = false;
  function update() {
    ticking = false;
    var y0 = window.scrollY, max = root.scrollHeight - root.clientHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y0 / max, 1) : 0) + ')';
    var current = -1, y = y0 + 120;
    targets.forEach(function (t, i) { if (t && t.offsetTop <= y) current = i; });
    links.forEach(function (a, i) {
      if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if (tl) {
      var r = tl.getBoundingClientRect(), p = (window.innerHeight * 0.6 - r.top) / r.height;
      tl.style.setProperty('--tl', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    if (!reduce && y0 < 1200) root.style.setProperty('--sy', y0);
    if (!reduce) bigs.forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var k = (r.top + r.height / 2) / window.innerHeight;
      b.querySelector('p').style.setProperty('--bx', (-(1 - k) * 0.5 * b.querySelector('p').scrollWidth * 0.35).toFixed(0) + 'px');
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
