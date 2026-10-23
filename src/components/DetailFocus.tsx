"use client";
import { useEffect } from "react";
export function DetailFocus() {
  useEffect(() => {
    if (!location.hash) document.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, []);
  return null;
}
