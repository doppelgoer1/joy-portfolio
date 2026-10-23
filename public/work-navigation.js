/* Runs before paint: returning documents never expose the hero's initial frame. */
(() => {
  // Carry a one-shot pointer entry across documents; keyboard input restores the ring.
  const pointerEntryKey = 'joy-detail-pointer-entry';
  try {
    const entry = JSON.parse(sessionStorage.getItem(pointerEntryKey) || 'null');
    sessionStorage.removeItem(pointerEntryKey);
    if (entry?.path === location.pathname && Date.now() - entry.at < 5000) {
      document.documentElement.setAttribute('data-detail-pointer-entry', '');
    }
  } catch { /* Storage is optional; keep the accessible focus ring as fallback. */ }
  document.addEventListener('keydown', () => {
    document.documentElement.removeAttribute('data-detail-pointer-entry');
  }, { capture: true });
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const destination = new URL(link.href);
    if (destination.origin !== location.origin || !destination.pathname.startsWith('/projects/')) return;
    try {
      if (event.detail > 0) sessionStorage.setItem(pointerEntryKey, JSON.stringify({ path: destination.pathname, at: Date.now() }));
      else sessionStorage.removeItem(pointerEntryKey);
    } catch { /* Navigation also works without storage. */ }
  });
  // The shared image transition is an entry enhancement. Returning is immediate.
  addEventListener('pageswap', event => {
    const destination = event.activation?.entry?.url;
    if (event.viewTransition && destination && new URL(destination).pathname === '/') {
      event.viewTransition.ready.catch(() => {});
      event.viewTransition.skipTransition();
    }
  });
  if (location.pathname !== '/') return;
  const explicit = new URLSearchParams(location.search).get('project');
  const back = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  if (!explicit && !back && !history.state?.workReturn) return;
  let saved = history.state?.workReturn;
  try { saved ||= JSON.parse(sessionStorage.getItem('joy-work-return') || 'null'); } catch {}
  if (!explicit && !saved) return;
  document.documentElement.setAttribute('data-work-restoring', '');
  document.documentElement.style.setProperty('--p', '1.0000');
  history.scrollRestoration = 'manual';
  const position = () => {
    const work = document.getElementById('work');
    if (!work) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stage = document.querySelector('.t1');
    const distance = reduced ? innerHeight : innerHeight * (innerWidth <= 780 ? 2.8 : 3.6);
    const top = stage.getBoundingClientRect().top + scrollY + distance - (reduced ? 0 : innerHeight);
    scrollTo({top: Math.max(top, saved?.y || 0), behavior: 'instant'});
  };
  document.addEventListener('DOMContentLoaded', position, {once:true});
  // If hydration is unavailable, the native anchor and no-JS project list remain visible.
  window.addEventListener('load', () => setTimeout(() => document.documentElement.removeAttribute('data-work-restoring'), 1500), {once:true});
})();
