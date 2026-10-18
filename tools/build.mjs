import { mkdir, rm, copyFile, cp, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of [
  "index.html",
  "styles.css",
  "domain.js",
  "store.js",
  "views.js",
  "app.js",
])
  await copyFile(path.join(root, name), path.join(dist, name));
await cp(path.join(root, "assets"), path.join(dist, "assets"), {
  recursive: true,
});
const assets = await readdir(path.join(dist, "assets"));
console.log(
  `Build complete: dist/ contains the app and ${assets.length} local assets. No runtime dependencies or environment variables required.`,
);
