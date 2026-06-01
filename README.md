# Joy Fullscreen Stack Motion

Standalone HTML prototype for a fullscreen scroll-scrubbed portfolio stack reveal.

## Preview locally

```bash
npm install
npm run dev
# open http://127.0.0.1:3000/
```

## Cloudflare Pages static deployment

This project is configured as a fully static Next.js export.

- Build command: `npm run build`
- Output directory: `out`
- No Worker/OpenNext runtime is required.

`next.config.ts` uses `output: "export"`, so `next build` generates static HTML/CSS/JS into `out/`.


## Debug progress

Use the `p` query parameter to freeze the animation progress:

- `/?p=0`
- `/?p=0.5`
- `/?p=1`
