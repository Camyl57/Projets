/* Saut de hop : quand le défilement change de section, un gros balayage plein écran annonce la suivante.
   Ne bloque pas le défilement (pointer-events: none). Pas de saut au chargement, ni pendant l'écran d'entrée,
   ni quand la transition des liens du menu (.wipe) est déjà en cours. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !document.querySelector('.hero')) return;
  var DUR = 700, lastAt = 0, GAP = 2500, COLS = window.innerWidth < 720 ? 6 : 10;
  var hero = document.querySelector('.hero');
  var items = [{ el: hero, n: 0, name: 'camyl', t: 'Accueil' }].concat(
    [['apropos', 'À propos'], ['projets', 'Projets'], ['parcours', 'Parcours'], ['competences', 'Compétences'], ['certifications', 'Certifications'], ['langues', 'Langues'], ['contact', 'Contact']].map(function (a, k) {
      return { el: document.getElementById(a[0]), n: k + 1, name: a[0], t: a[1] };
    })).filter(function (o) { return o.el; });
  var cur = 0, busy = false, raf = 0;

  function play(o) {
    busy = true; lastAt = Date.now();
    var j = document.createElement('div');
    j.className = 'jump'; j.setAttribute('aria-hidden', 'true');
    var h = '';
    for (var i = 0; i < COLS; i++) h += '<i class="jp-col" style="--i:' + Math.abs(i - (COLS - 1) / 2).toFixed(1) + '"></i>';
    h += '<i class="jp-flash"></i><div class="jp-label"><b>' + '<em>' + o.t + '</em>' +
         '</b><span>→ ' + (o.n ? '10.57.' + o.n + '.1 · ' : '') + o.name + '.camyl.lan</span></div>';
    j.innerHTML = h;
    document.body.appendChild(j);
    setTimeout(function () { j.remove(); busy = false; check(true); }, DUR + 450);
  }

  function index() {
    var y = innerHeight * .35, k = 0;
    items.forEach(function (o, i) { if (o.el.getBoundingClientRect().top <= y) k = i; });
    return k;
  }
  function check(silent) {
    raf = 0;
    var k = index();
    if (k === cur) return;
    cur = k;
    var skip = silent === true || busy || Date.now() - lastAt < GAP || document.documentElement.classList.contains('entry-on') || document.querySelector('.wipe');
    if (!skip) play(items[k]);
  }
  addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(check); }, { passive: true });
  addEventListener('load', function () { cur = index(); });
  cur = index();
})();
