/**
 * Copies the woff2 binaries shipped with @fontsource packages into
 * public/fonts so the app self-hosts every font (zero third-party requests,
 * font-display: swap, works offline and behind strict CSP).
 */
import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "fonts");

const FAMILIES = [
  { pkg: "@fontsource-variable/alexandria", prefix: "alexandria", variable: true },
  { pkg: "@fontsource/ibm-plex-sans-arabic", prefix: "ibm-plex-arabic", variable: false },
  { pkg: "@fontsource-variable/jetbrains-mono", prefix: "jetbrains-mono", variable: true },
  { pkg: "@fontsource-variable/vazirmatn", prefix: "vazirmatn", variable: true },
];

const SUBSETS = ["arabic", "latin"];
const WEIGHTS = ["400", "500", "600", "700"];

async function main() {
  await mkdir(OUT, { recursive: true });
  let copied = 0;

  for (const family of FAMILIES) {
    const filesDir = path.join(ROOT, "node_modules", family.pkg, "files");
    let entries;
    try {
      entries = await readdir(filesDir);
    } catch {
      console.warn(`[fonts] skip ${family.pkg} (not installed yet)`);
      continue;
    }

    for (const entry of entries) {
      if (!entry.endsWith(".woff2")) continue;

      for (const subset of SUBSETS) {
        if (family.variable) {
          if (!entry.includes(`-${subset}-wght-normal`)) continue;
          const target = `${family.prefix}-${subset}-var.woff2`;
          await copyFile(path.join(filesDir, entry), path.join(OUT, target));
          copied += 1;
          console.log(`[fonts] ${target}`);
        } else {
          for (const weight of WEIGHTS) {
            if (!entry.includes(`-${subset}-${weight}-normal`)) continue;
            const target = `${family.prefix}-${subset}-${weight}.woff2`;
            await copyFile(path.join(filesDir, entry), path.join(OUT, target));
            copied += 1;
            console.log(`[fonts] ${target}`);
          }
        }
      }
    }
  }

  console.log(`[fonts] done — ${copied} file(s) in public/fonts`);
}

main().catch((error) => {
  console.error("[fonts] failed", error);
});
