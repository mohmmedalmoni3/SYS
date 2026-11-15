import process from "node:process";

const [url, cookieValue] = process.argv.slice(2);
const ENDPOINT = "http://127.0.0.1:9222";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const target = await fetch(`${ENDPOINT}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
let counter = 0;
const pending = new Map();
const logs = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.consoleAPICalled") {
    const text = message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ");
    if (["error", "warning"].includes(message.params.type)) logs.push(`[${message.params.type}] ${text}`);
  }
  if (message.method === "Log.entryAdded" && ["error", "warning"].includes(message.params.entry.level)) {
    logs.push(`[log:${message.params.entry.level}] ${message.params.entry.text}`);
  }
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
await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Network.enable");
if (cookieValue) {
  await send("Network.setCookie", { name: "authjs.session-token", value: cookieValue, domain: "localhost", path: "/", httpOnly: true });
}
await send("Page.navigate", { url });
await sleep(6000);
const overlay = await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `(() => {
    const portal = document.querySelector('nextjs-portal');
    return portal?.shadowRoot?.textContent?.slice(0, 3000) ?? 'no portal';
  })()`,
});
console.log("=== CONSOLE ===");
console.log(logs.join("\\n") || "(none)");
console.log("=== OVERLAY ===");
console.log(overlay.result.value);
socket.close();
