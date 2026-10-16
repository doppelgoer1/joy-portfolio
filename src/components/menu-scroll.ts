export function scrollSegments(from: number, to: number, heroEnd: number) {
  const cuts = [from];
  if (heroEnd > Math.min(from, to) && heroEnd < Math.max(from, to)) cuts.push(heroEnd);
  cuts.push(to);
  return cuts.slice(1).map((end, i) => {
    const start = cuts[i];
    const distance = Math.abs(end - start);
    const inHero = heroEnd > 0 && Math.max(start, end) <= heroEnd;
    return { from: start, to: end, duration: distance < 1 ? 0 : inHero
      ? Math.max(600, 3600 * distance / heroEnd)
      : Math.min(1400, Math.max(550, distance * .16)) };
  });
}

// Only menu-driven movement is animated. Native wheel/touch scrolling stays untouched.
export function animateMenuScroll(destination: number | (() => number)): () => void {
  const resolveTarget = () => Math.min(typeof destination === "function" ? destination() : destination, Math.max(0, document.documentElement.scrollHeight - innerHeight));
  const target = resolveTarget();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: target, behavior: "instant" });
    return () => {};
  }
  const hero = document.querySelector(".joy-stage");
  const heroEnd = hero ? hero.getBoundingClientRect().bottom + scrollY - innerHeight : 0;
  const segments = scrollSegments(scrollY, target, heroEnd);
  let frame = 0;
  let index = 0;
  let started: number | null = null;
  let stopped = false;
  const keys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape", "Tab"]);
  function cancel() {
    stopped = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("pointerdown", cancel);
    window.removeEventListener("resize", cancel);
    window.removeEventListener("popstate", cancel);
    window.removeEventListener("keydown", onKey);
  }
  function onKey(event: KeyboardEvent) { if (keys.has(event.key)) cancel(); }
  function tick(now: number) {
    if (stopped) return;
    const segment = segments[index];
    started ??= now;
    const p = segment.duration === 0 ? 1 : Math.min(1, (now - started) / segment.duration);
    // Gentle starts/stops while retaining enough time for the original hero's 0.12 interpolation.
    const eased = p * p * (3 - 2 * p);
    const end = index === segments.length - 1 ? resolveTarget() : segment.to;
    window.scrollTo({ top: segment.from + (end - segment.from) * eased, behavior: "instant" });
    if (p === 1) {
      index++;
      started = null;
      if (index === segments.length) { cancel(); return; }
    }
    frame = requestAnimationFrame(tick);
  }
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("pointerdown", cancel, { passive: true });
  window.addEventListener("resize", cancel);
  window.addEventListener("popstate", cancel);
  window.addEventListener("keydown", onKey);
  frame = requestAnimationFrame(tick);
  return cancel;
}
