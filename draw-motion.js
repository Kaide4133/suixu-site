/* Presentation only: never selects, rotates or persists a card. */
(() => {
  const active = new Map();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  function cancel(root) { active.get(root)?.(); }
  function reveal(root, control) {
    cancel(root);
    const visual = root.querySelector('.card-visual');
    const image = visual?.querySelector('img');
    if (!image || preference.matches) return;
    const rotor = document.createElement('div');
    rotor.className = 'draw-rotor';
    const back = document.createElement('div');
    back.className = 'draw-back';
    back.setAttribute('aria-hidden', 'true');
    back.textContent = '✧';
    image.before(rotor);
    rotor.append(image, back);
    visual.classList.add('draw-card');
    root.classList.add('draw-pending');
    root.setAttribute('aria-busy', 'true');
    if (control) control.disabled = true;
    let timer, finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      rotor.replaceWith(image);
      visual.classList.remove('draw-card', 'draw-playing');
      root.classList.remove('draw-pending');
      root.removeAttribute('aria-busy');
      if (control) control.disabled = false;
      active.delete(root);
    };
    active.set(root, finish);
    // Keep the back visible while decoding, but never block the reading on an asset.
    Promise.race([image.decode().catch(() => {}), new Promise(resolve => { timer = setTimeout(resolve, 500); })]).then(() => {
      clearTimeout(timer);
      if (finished) return;
      const box = visual.getBoundingClientRect();
      if (box.top < 0 || box.bottom > innerHeight) visual.scrollIntoView({block: 'center', behavior: 'instant'});
      visual.classList.add('draw-playing');
      rotor.addEventListener('animationend', finish, {once: true});
      timer = setTimeout(finish, 1250); // also settles interrupted/unsupported CSS animations
    });
  }
  function settle() { [...active.values()].forEach(finish => finish()); }
  addEventListener('hashchange', settle);
  document.addEventListener('visibilitychange', settle);
  preference.addEventListener('change', settle);
  window.SuixuDraw = { reveal, cancel };
})();
