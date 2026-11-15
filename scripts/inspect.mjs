import process from "node:process";

const [url, cookieValue] = process.argv.slice(2);
const ENDPOINT = "http://127.0.0.1:9222";
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
  return new Promise((resolve, reject) => {
    pending.set(counter, { resolve, reject });
    socket.send(JSON.stringify({ id: counter, method, params }));
  });
}
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
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
await sleep(6000);
const result = await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `(() => {
    const area = document.querySelector('.recharts-area-area');
    const sector = document.querySelector('path.recharts-sector');
    return {
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      areas: document.querySelectorAll('.recharts-area-area').length,
      sectors: document.querySelectorAll('path.recharts-sector').length,
      surfaces: document.querySelectorAll('.recharts-surface').length,
      areaD: area ? (area.getAttribute('d') || '').slice(0, 80) : null,
      areaBox: area ? JSON.stringify(area.getBBox()) : null,
      areaStyle: area ? getComputedStyle(area).stroke + ' / ' + getComputedStyle(area).fill + ' / op ' + getComputedStyle(area).opacity : null,
      sectorBox: sector ? JSON.stringify(sector.getBBox()) : null,
      sectorFill: sector ? getComputedStyle(sector).fill + ' / op ' + getComputedStyle(sector).opacity : null,
      chartHtml: document.querySelector('.recharts-wrapper')?.innerHTML.slice(0, 400) ?? null,
    };
  })()`,
});
console.log(JSON.stringify(result.result.value, null, 2));
socket.close();
