# T1 — HERO → WORK / 안 A 「제2악장」

Preview-only prototype from `7effab91b382e02e6564634de98a14b27f48abed`.
Scope: one transition, followed by the existing WorkStage. No T2 or production release.

## Scene and ownership

`WorkTransition` owns one ScrollTrigger and a scoped `useGSAP` / matchMedia context.
The content overlaps the last viewport of the unchanged 820dvh hero, so the pin starts
when hero progress reaches 1. A static copy of that final composition takes over at
the same coordinates. Only the inner poster, number, labels, and reading layers animate.
The pin wrapper itself is not an animation target. Hero source, variables, rAF,
interpolation, ancestors, global scrolling, and debug parameter are unchanged.

The timeline uses the hero's exact cubic `easeSoft` and quartic `easeInOut` functions.
The poster reaches 112vw × 112dvh, holds from .46 to .54, contracts to 58vw × 75dvh
(78vw on mobile), then hands off to the existing card. Names dock at .04 intervals
and .34 scale. Selection remains owned by WorkStage, including when reversing.

Desktop pin distance: 220vh. At ≤780px: 176vh. Scrub: .6. Snap destinations: .5 and 1.
Below 1200px the index is a single horizontally scrollable chip row, preserving all
nine equal choices, 13px labels, and 44px targets. The mobile plate is 78vw.

`#work` and `#archive` are real native endpoints at the top of the final reading
viewport. Focus/click alignment handles native scrolling into a pinned descendant.
Project hashes and archive aliases still select and scroll to the original panels.
The section introduction remains accessible text; the transition duplicate is aria-hidden.

Reduced motion lays out the static introduction, poster, and reading stage in normal
flow, with no ScrollTrigger pin/scrub/snap and only a 240ms selection crossfade.
Without JavaScript, all nine project panels and all native links remain available.

V1 CSS view-timeline blocks, panel entrance, chapter unfolding, and the three-column
index are removed. Career, education, contact, project content, and detail routes keep
their existing layout/data. The header is shown only at the reading stage.

## Dependencies and primary sources

Checked directly on 2026-10-21, before installation:

- `gsap@3.15.0`, `@gsap/react@2.1.2`: both package metadata refer to the
  [Standard No Charge GSAP License](https://gsap.com/community/standard-license/),
  not MIT. The page permits commercial websites; its restriction concerns competing
  visual animation builders. This portfolio is an ordinary website. License page
  effective 2025-04-30, last modified 2025-05-30.
- [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/): pin, scrub, snap,
  anticipatePin and refresh configuration.
- [Refresh ordering](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.sort()/):
  higher refreshPriority runs first. T1 uses 1.
- [React context cleanup](https://gsap.com/resources/React/): `useGSAP({ scope })`
  and local matchMedia revert. No global trigger destruction.

No external skills repository code, Codrops code, generated screenshot, or new project
copy is included. Font readiness and image load events refresh measurements. Temporary
refresh states do not change interactivity or hide the viewport.

## Reproduce

Run `npm run build` before `npm test` because existing tests inspect `out/`.
Serve `out/` with extensionless `.html` route resolution, as Cloudflare Pages does.
Set `PORTFOLIO_URL` to that URL. Playwright is a verification tool, not a runtime dependency.
`PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` can reference an existing installation.

```sh
npm run lint
npm run typecheck
npm test
npm run test:browser
npm run build
node scripts/verify-t1.mjs
node scripts/capture-t1.mjs
node scripts/measure-t1.mjs
```

Set `PORTFOLIO_ARTIFACTS` for screenshot/video output and `PERFORMANCE_OUTPUT` for the
performance JSON. Capture records actual native scroll frames, without hero `?p=` or
GSAP timeline seeking. The four captures are desktop forward, desktop reverse/fast,
390×844 forward, and reduced motion. The measurement script compares native cadence
and 4× CPU slowdown, hero alone versus T1 while the original hero rAF still runs.

Final verification, videos, URL, model attribution, and §8 assessment are recorded on JOY-592.
