import { spawn } from "node:child_process";

const port = 3333;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["dist/index.js"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 8000) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Server did not become ready. Output:\n${output}`);
}

async function requestText(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${path} returned ${response.status}, expected ${expectedStatus}. Body: ${text}`);
  }
  return text;
}

async function requestJson(path, expectedStatus = 200) {
  const text = await requestText(path, expectedStatus);
  return text ? JSON.parse(text) : undefined;
}

function expectDataset(payload, key, path) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`${path} must return a JSON object`);
  }
  if (!Array.isArray(payload[key]) || !Array.isArray(payload.data)) {
    throw new Error(`${path} must return ${key} and data arrays`);
  }
  if (!payload.meta || typeof payload.meta !== "object") {
    throw new Error(`${path} must return cache metadata`);
  }
}

try {
  await waitForServer();

  const root = await requestText("/");
  if (root !== "API OK") throw new Error('/ must return "API OK"');

  const health = await requestJson("/health");
  if (health.status !== "ok") throw new Error("/health payload is invalid");

  const pharmacies = await requestJson("/pharmacies");
  expectDataset(pharmacies, "pharmacies", "/pharmacies");

  const pharmaciesByCity = await requestJson("/pharmacies?city=Koudougou");
  expectDataset(pharmaciesByCity, "pharmacies", "/pharmacies?city=Koudougou");

  const nearbyPharmacies = await requestJson("/pharmacies/nearby?lat=12.37&lng=-1.52");
  expectDataset(nearbyPharmacies, "pharmacies", "/pharmacies/nearby");

  const healthcare = await requestJson("/healthcare?city=Koudougou");
  expectDataset(healthcare, "healthcare", "/healthcare?city=Koudougou");

  console.log(JSON.stringify({
    ok: true,
    root,
    health,
    pharmacies,
    pharmaciesByCity,
    nearbyPharmacies,
    healthcare,
  }, null, 2));
} finally {
  server.kill("SIGTERM");
}
