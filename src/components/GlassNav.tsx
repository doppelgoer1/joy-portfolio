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
const getServerSnapshot = () => false;

// One navigation in both variants. SSR/no-JS keeps the original header menu.
export function GlassNav() {
  const glass = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <nav className={glass ? styles.pill : undefined} aria-label="주요 메뉴" data-glass={glass ? "true" : undefined}>
      <a className={glass ? styles.link : undefined} href="#work">작업</a>
      <a className={glass ? styles.link : undefined} href="#career">경력</a>
      <a className={glass ? styles.link : undefined} href="#archive">이전 프로젝트</a>
      <a className={glass ? styles.link : undefined} href="#contact">연락</a>
    </nav>
  );
}
