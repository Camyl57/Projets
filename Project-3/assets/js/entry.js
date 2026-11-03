/*
 * Écran d'entrée « Établir la connexion » (page d'accueil, première visite de la session).
 * Chargé en tout début de <body> pour que le contenu ne clignote jamais avant l'écran.
 * Autonome : si main.js échoue, le bouton fonctionne quand même. Désactivé avec prefers-reduced-motion.
 *
 * Déroulé après le clic :
 *   0 ms      deux panneaux s'ouvrent comme une porte (1,3 s) ; les lignes de « traceroute camyl » s'affichent une à une
 *   1 000 ms  le tampon « CONNECTED » arrive (zoom 170 % → 100 %, rotation -24° → -12°), puis disparaît en fondu (1,2 s)
 *   1 250 ms  la connexion est établie : la page se réveille (animations du hero, des hops, des compteurs)
 */
(function () {
  var root = document.documentElement;
  try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  // Déjà vue dans cet onglet (rechargement) : pas de rejeu. Un nouvel onglet ou une nouvelle session repart de zéro.
  // Stockage indisponible (navigation privée, blocage) : l'animation se joue normalement.
  var seen = false;
  try { seen = sessionStorage.getItem('intro') === '1'; } catch (e) { seen = false; }
  if (seen) return;
  var body = document.body;
  if (!body) return;

  var HOPS = [
    ['apropos', 2], ['projets', 5], ['parcours', 9], ['competences', 14], ['certifications', 21], ['langues', 27], ['contact', 33]
  ];
  var LINES = ['$ traceroute camyl', 'traceroute to camyl.dev, 7 hops max'];
  HOPS.forEach(function (h, i) {
    var host = (h[0] + '.camyl.lan').padEnd(24, ' ');
    LINES.push(' ' + (i + 1) + '  ' + host + String(h[1]).padStart(2, ' ') + ' ms');
  });
  LINES.push('✔ destination atteinte');

  root.classList.add('entry-on');

  var entry = document.createElement('div');
  entry.id = 'entry';
  entry.className = 'entry';
  entry.setAttribute('role', 'dialog');
  entry.setAttribute('aria-modal', 'true');
  entry.setAttribute('aria-label', 'Camyl Khebache : établir la connexion pour afficher le portfolio');
  entry.innerHTML =
    '<div class="entry-door l" aria-hidden="true"></div>' +
    '<div class="entry-door r" aria-hidden="true"></div>' +
    '<div class="entry-center">' +
      '<p class="entry-kicker" aria-hidden="true">camyl.dev · 10.57.0.1</p>' +
      '<p class="entry-name">Camyl <em>Khebache</em></p>' +
      '<button class="entry-btn" type="button">Établir la connexion</button>' +
    '</div>' +
    '<pre class="entry-log" aria-hidden="true"></pre>';
  body.insertBefore(entry, body.firstChild);

  // Le contenu derrière l'écran n'est ni atteignable au clavier ni lu par les lecteurs d'écran
  // (le script est lu avant le reste de la page : on attend la fin de l'analyse du document)
  var BEHIND = 'header.site-nav, main, footer, .skip';
  function setInert(on) {
    [].slice.call(document.querySelectorAll(BEHIND)).forEach(function (el) {
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  setInert(true);
  document.addEventListener('DOMContentLoaded', function () { if (!started) setInert(true); });

  var btn = entry.querySelector('.entry-btn');
  var log = entry.querySelector('.entry-log');
  btn.focus();
  var started = false;

  function stamp() {
    var s = document.createElement('div');
    s.className = 'stamp';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<span>CONNECTED</span>';
    body.appendChild(s);
    setTimeout(function () { s.remove(); }, 2400);
  }

  function connect() {
    root.classList.remove('entry-on');
    root.classList.add('connected');
    setInert(false);
    document.dispatchEvent(new Event('connected'));
  }

  function run() {
    if (started) return;
    started = true;
    try { sessionStorage.setItem('intro', '1'); } catch (e) {}
    btn.disabled = true;
    entry.classList.add('open');
    LINES.forEach(function (text, i) {
      setTimeout(function () {
        var ln = document.createElement('span');
        ln.className = 'ln' + (i === LINES.length - 1 ? ' ok' : '');
        ln.textContent = text;
        log.appendChild(ln);
      }, 140 + i * 120);
    });
    setTimeout(stamp, 1000);
    setTimeout(connect, 1250);
    setTimeout(function () { entry.classList.add('done'); }, 1350);
    setTimeout(function () { entry.remove(); }, 2000);
  }
  btn.addEventListener('click', run);
})();
