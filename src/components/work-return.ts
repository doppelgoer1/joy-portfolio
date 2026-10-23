export const workReturnKey = "joy-work-return";
export type WorkReturn = { slug: string; y: number; width: number; height: number };

export function rememberWork(slug: string) {
  const state: WorkReturn = { slug, y: scrollY, width: innerWidth, height: innerHeight };
  history.replaceState({ ...history.state, workReturn: state }, "", `${location.pathname}${location.search}#work`);
  try { sessionStorage.setItem(workReturnKey, JSON.stringify(state)); } catch { /* Storage can be disabled; history and the return URL remain usable. */ }
}

export function readWorkReturn(ids: string[]): WorkReturn | null {
  const explicit = new URLSearchParams(location.search).get("project");
  const back = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "back_forward";
  let saved = history.state?.workReturn;
  if (!saved) { try { saved = JSON.parse(sessionStorage.getItem(workReturnKey) || "null"); } catch { /* Optional persistence. */ } }
  const slug = explicit || ((back || history.state?.workReturn) ? saved?.slug : null);
  if (!ids.includes(slug)) return null;
  const sameViewport = saved?.width === innerWidth && saved?.height === innerHeight && saved?.slug === slug;
  return { slug, y: sameViewport && Number.isFinite(saved.y) ? saved.y : 0, width: innerWidth, height: innerHeight };
}
