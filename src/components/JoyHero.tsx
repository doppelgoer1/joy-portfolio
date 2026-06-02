"use client";

import { useEffect, useRef } from "react";

const STACKS = ["React", "Next.js", "TypeScript", "NestJS", "MariaDB", "CSS"];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;
const mapRange = (
  value: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
) => lerp(outStart, outEnd, clamp((value - inStart) / (inEnd - inStart)));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeSoft = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

function itemMotion(progress: number, index: number) {
  const start = 0.2 + index * 0.04;
  const grow = easeSoft(mapRange(progress, start, start + 0.19, 0, 1));
  const textIn = easeOutExpo(mapRange(progress, start + 0.004, start + 0.03, 0, 1));
  const dock = easeInOut(mapRange(progress, start + 0.014, start + 0.074, 0, 1));

  return { grow, textIn, dock };
}

export function JoyHero() {
  const stageRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);
  const targetProgress = useRef(0);
  const renderProgress = useRef(0);

  useEffect(() => {
    let frame = 0;
    const root = document.documentElement;

    const updateTarget = () => {
      const stage = stageRef.current;
      if (!stage) return;

      const debugProgress = new URLSearchParams(window.location.search).get("p");
      if (debugProgress !== null) {
        targetProgress.current = clamp(Number(debugProgress));
        return;
      }

      const rect = stage.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      targetProgress.current = clamp(-rect.top / scrollable);
    };

    const render = () => {
      updateTarget();
      renderProgress.current += (targetProgress.current - renderProgress.current) * 0.12;
      const p = renderProgress.current;

      const titleGrow = easeSoft(mapRange(p, 0.02, 0.2, 0, 1));
      const curtainHeight = easeInOut(mapRange(p, 0.06, 0.16, 0, 1));
      const curtainGrow = easeInOut(mapRange(p, 0.16, 0.3, 0, 1));
      const curtainOpen = easeInOut(mapRange(p, 0.28, 0.4, 0, 1));
      const doorLayer = mapRange(p, 0.54, 0.56, 0, 1);
      const doorPanelGrow = easeSoft(mapRange(p, 0.56, 0.76, 0, 1));
      const doorTextGrow = easeOutExpo(mapRange(p, 0.56, 0.62, 0, 1));
      const doorOpen = easeInOut(mapRange(p, 0.72, 0.88, 0, 1));
      const stackQuiet = easeOut(mapRange(p, 0.62, 0.72, 0, 1));

      root.style.setProperty("--p", p.toFixed(4));
      root.style.setProperty("--title-y", "0px");
      root.style.setProperty("--title-scale", lerp(1, 1.08, titleGrow).toFixed(4));
      root.style.setProperty("--curtain-height", `${lerp(0, 100, curtainHeight).toFixed(2)}dvh`);
      root.style.setProperty("--curtain-width", `${lerp(24, window.innerWidth, curtainGrow).toFixed(2)}px`);
      root.style.setProperty("--split-opacity", mapRange(curtainGrow, 0.82, 1, 0, 1).toFixed(4));
      root.style.setProperty("--curtain-open", curtainOpen.toFixed(4));
      root.style.setProperty("--door-layer-opacity", doorLayer.toFixed(4));
      root.style.setProperty("--door-panel-width", `${lerp(2, 112, doorPanelGrow).toFixed(2)}vw`);
      root.style.setProperty("--door-panel-height", `${lerp(2, 112, doorPanelGrow).toFixed(2)}dvh`);
      root.style.setProperty("--door-text-scale", lerp(0, 1, doorTextGrow).toFixed(4));
      root.style.setProperty("--door-text-opacity", mapRange(doorTextGrow, 0, 0.08, 0, 1).toFixed(4));
      root.style.setProperty("--door-open", doorOpen.toFixed(4));
      root.style.setProperty("--dock-copy-opacity", easeOut(mapRange(p, 0.9, 1, 0, 1)).toFixed(4));

      cardRefs.current.forEach((card, index) => {
        if (!card) return;

        const { grow } = itemMotion(p, index);
        const visible = mapRange(grow, 0, 0.08, 0, 1);
        const scale = lerp(0.02, 1.12, grow);

        card.style.setProperty("--panel-width", `${(scale * 100).toFixed(2)}vw`);
        card.style.setProperty("--panel-height", `${(scale * 100).toFixed(2)}dvh`);
        card.style.setProperty("--card-opacity", visible.toFixed(3));
      });

      textRefs.current.forEach((text, index) => {
        if (!text) return;

        const { grow, textIn, dock } = itemMotion(p, index);
        const styles = getComputedStyle(text);
        const targetY = Number(styles.getPropertyValue("--target-y")) || 0;
        const dockTargetX =
          window.innerWidth <= 780 ? -window.innerWidth * 0.34 : -window.innerWidth * 0.36;
        const dockX = lerp(0, dockTargetX, dock);
        const dockY = lerp(0, targetY, dock);
        const scale = lerp(0, 1, textIn) * lerp(1, 0.34, dock);
        const opacity = grow > 0.01 ? lerp(1, 0.38, stackQuiet) : 0;

        text.style.setProperty("--text-scale", scale.toFixed(4));
        text.style.setProperty("--text-x", dockX.toFixed(2));
        text.style.setProperty("--text-y", dockY.toFixed(2));
        text.style.setProperty("--text-opacity", opacity.toFixed(4));
      });

      frame = requestAnimationFrame(render);
    };

    updateTarget();
    renderProgress.current = targetProgress.current;
    frame = requestAnimationFrame(render);
    window.addEventListener("resize", updateTarget);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTarget);
    };
  }, []);

  return (
    <section ref={stageRef} className="joy-stage">
      <div className="joy-pin">
        <nav className="joy-nav" aria-label="Portfolio navigation">
          <span>[ + ] Joy</span>
          <span>Fullscreen stack reveal</span>
          <span>Scroll scrub</span>
        </nav>
        <div className="scroll-progress" aria-hidden="true">
          <div className="scroll-progress__bar" />
        </div>

        <div className="portfolio-title">
          <h1>
            Joy&apos;s
            <br />
            <span>Portfolio</span>
          </h1>
        </div>

        <div className="vertical-curtain" aria-hidden="true" />
        <div className="curtain-split" aria-hidden="true">
          <div className="left" />
          <div className="right" />
        </div>

        <div className="card-layer" aria-hidden="true">
          {STACKS.map((stack, index) => (
            <div
              className="stack-card"
              data-stack={stack}
              key={stack}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
            />
          ))}
        </div>

        <div className="text-layer">
          {STACKS.map((stack, index) => (
            <div
              className="stack-text"
              key={stack}
              ref={(node) => {
                textRefs.current[index] = node;
              }}
            >
              {stack}
            </div>
          ))}
        </div>

        <div className="manifest-door" aria-hidden="true">
          {["left", "right"].map((side) => (
            <div className={`manifest-door__panel manifest-door__panel--${side}`} key={side}>
              <div className="manifest-door__surface">
                <div className="door-kicker">Portfolio / 2026</div>
                <div className="door-copy-box">
                  <div className="door-manifesto">
                    <span>I build interfaces</span>
                    <span>that feel fast,</span>
                    <span>clear, and alive.</span>
                  </div>
                </div>
                <div className="door-meta door-meta--left">
                  <span>React</span>
                  <span>Next.js</span>
                  <span>TypeScript</span>
                  <span>NestJS</span>
                  <span>MariaDB</span>
                  <span>CSS</span>
                </div>
                <p className="door-note">
                  Six years building product UI with frontend motion,
                  backend fluency, and production-minded delivery.
                </p>
                <div className="door-meta door-meta--right">
                  <span>Frontend</span>
                  <span>Motion</span>
                  <span>Systems</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="dock-copy">
          <h2>
            Frontend
            <br />
            <span>Product</span>
            <br />
            Builder
          </h2>
          <p>
            Six years building React and Next.js products with TypeScript,
            backend fluency, and motion-focused interface craft.
          </p>
        </div>
      </div>
    </section>
  );
}
