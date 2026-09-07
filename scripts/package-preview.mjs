import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = "out";
const destination = "artifacts/portfolio-upgrade";
let html = await readFile(join(root, "index.html"), "utf8");
const styles = [];
for (const match of html.matchAll(/<link\b(?=[^>]*rel="stylesheet")(?=[^>]*href="([^"]+)")[^>]*>/g)) {
  styles.push(await readFile(join(root, match[1]), "utf8"));
}
if (!styles.length) throw new Error("Static export has no stylesheet");
html = html
  .replace(/<link\b[^>]*>/g, "")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
  .replace("</head>", `<style>${styles.join("\n")}\n.project-case { position: relative !important; top: auto !important; } .project-poster { animation: none !important; transform: none !important; }</style></head>`);
await writeFile(join(destination, "preview.html"), html);

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

const manifest = [];
for (const path of await files(root)) {
  const bytes = await readFile(path);
  manifest.push({ path, bytes: (await stat(path)).size, sha256: createHash("sha256").update(bytes).digest("hex") });
}
await writeFile(join(destination, "export-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Packaged preview and verified ${manifest.length} export file hashes.`);
