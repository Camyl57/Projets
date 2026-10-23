(function () {
  document.documentElement.classList.add('js');

  // Menu mobile
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

  // Photo : si assets/img/photo.jpg existe, l'emplacement s'affiche ; sinon il reste masqué
  var photo = document.getElementById('photo');
  if (photo) {
    var show = function () {
      photo.closest('.about-grid').classList.add('has-photo');
      photo.closest('.portrait').hidden = false;
    };
    if (photo.complete && photo.naturalWidth) show();
    else photo.addEventListener('load', show);
  }
})();
