/**
 * Dev-only screenshot helper: drives headless Chrome through the DevTools
 * protocol to capture authenticated pages (used for visual QA).
 *
 * usage: node scripts/shoot.mjs <url> <outfile> [cookieValue]
 */
import { writeFile } from "node:fs/promises";

const [url, outfile, cookieValue] = process.argv.slice(2);
if (!url || !outfile) {
  console.error("usage: node scripts/shoot.mjs <url> <outfile> [sessionCookie]");
  process.exit(1);
}

const ENDPOINT = `http://127.0.0.1:${process.env.CDP_PORT ?? 9222}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const target = await fetch(`${ENDPOINT}/json/new?about:blank`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
let counter = 0;
const pending = new Map();

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  counter += 1;
  const id = counter;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(process.env.WIDTH ?? 1440),
  height: Number(process.env.HEIGHT ?? 1000),
  deviceScaleFactor: 1,
  mobile: process.env.MOBILE === "1",
});

if (cookieValue) {
  await send("Network.setCookie", {
    name: "authjs.session-token",
    value: cookieValue,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    secure: false,
  });
}

await send("Page.navigate", { url });
await sleep(2600);
await send("Runtime.evaluate", {
  expression: "sessionStorage.setItem('tectnal:preloaded','1'); localStorage.setItem('tectnal:theme','dark');",
});
await send("Page.reload", { ignoreCache: false });
await sleep(3800);

const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(outfile, Buffer.from(shot.data, "base64"));
console.log(`saved ${outfile}`);
socket.close();

