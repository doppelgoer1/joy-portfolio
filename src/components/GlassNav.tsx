"use client";

import { useSyncExternalStore } from "react";
import styles from "./GlassNav.module.css";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getSnapshot() {
  return new URLSearchParams(window.location.search).get("nav") !== "original";
}

// Static export cannot know the query. Hide until hydration so the original
// comparison never flashes a pill, and server/client initial markup agrees.
const getServerSnapshot = () => false;

export function GlassNav() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!visible) return null;

  return (
    <nav className={styles.pill} aria-label="빠른 메뉴">
      <a className={styles.link} href="#work">프로젝트</a>
      <a className={styles.link} href="#career">경력</a>
      <a className={styles.link} href="#contact">연락</a>
    </nav>
  );
}
