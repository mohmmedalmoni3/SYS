import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, ".next", "standalone");
const target = path.join(root, "desktop-dist", "app");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(target, ".next", "static"), {
  recursive: true,
});
await cp(path.join(root, "public"), path.join(target, "public"), { recursive: true });

for (const filename of [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.test",
  ".env.test.local",
]) {
  await rm(path.join(target, filename), { force: true });
}

console.log("Prepared standalone Next.js files for the desktop app.");
