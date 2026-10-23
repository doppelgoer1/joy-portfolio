/* Runs before paint: returning documents never expose the hero's initial frame. */
(() => {
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
