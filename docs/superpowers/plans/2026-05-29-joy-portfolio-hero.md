# Joy Portfolio Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js portfolio landing page with the approved scroll-driven Joy's Portfolio hero motion.

**Architecture:** Create a small App Router project. Keep the hero as one focused client component that converts scroll progress into CSS variables, while global CSS owns layout, typography, and responsive behavior.

**Tech Stack:** Next.js, React, TypeScript, CSS, requestAnimationFrame scroll scrub prototype logic.

---

### Task 1: Scaffold App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/JoyHero.tsx`

- [ ] Create the minimal Next.js project files.
- [ ] Port the approved hero DOM and scroll progress logic into `JoyHero.tsx`.
- [ ] Port responsive styles into `globals.css`.
- [ ] Run `npm.cmd install`.
- [ ] Run `npm.cmd run lint` if available, otherwise `npm.cmd run build`.
- [ ] Start `npm.cmd run dev` and verify the local URL.
