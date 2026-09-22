"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import styles from "./GlassNav.module.css";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
function getSnapshot() {
  return new URLSearchParams(window.location.search).get("nav") !== "original";
}
const getServerSnapshot = () => false;
const links = [["work", "작업"], ["career", "경력"], ["archive", "이전 프로젝트"], ["contact", "연락"]] as const;

export function GlassNav() {
  const glass = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const keyboard = useRef(false);

  useEffect(() => {
    if (!glass || !open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [glass, open]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const offset = Math.max(parseFloat(getComputedStyle(target).scrollMarginTop) || 0, 160);
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    history.pushState(null, "", `#${id}`);
    toggle.current?.focus({ preventScroll: true });
    setOpen(false);
    window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  if (!glass) return <nav aria-label="주요 메뉴">{links.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>;

  return (
    <nav ref={root} className={styles.pill} aria-label="주요 메뉴" data-glass="true" data-open={open}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") { keyboard.current = false; setOpen(true); } }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse" && !keyboard.current) setOpen(false); }}
      onPointerDown={() => { keyboard.current = false; }}
      onFocusCapture={(event) => { if (event.target.matches(":focus-visible")) { keyboard.current = true; setOpen(true); } }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { keyboard.current = false; setOpen(false); } }}
      onKeyDown={(event) => { keyboard.current = true; if (event.key === "Escape") { event.preventDefault(); toggle.current?.focus(); setOpen(false); } }}>
      <button ref={toggle} type="button" className={styles.toggle} aria-label={open ? "메뉴 닫기" : "메뉴 열기"} aria-expanded={open} aria-controls="glass-menu-links" onClick={() => setOpen(!open)}>
        <span className={styles.icon} aria-hidden="true"><span /><span /></span>
      </button>
      <div id="glass-menu-links" className={styles.links} inert={!open} aria-hidden={!open}>
        {links.map(([id, label]) => <a className={styles.link} key={id} href={`#${id}`} onClick={(event) => navigate(event, id)}>{label}</a>)}
      </div>
    </nav>
  );
}
