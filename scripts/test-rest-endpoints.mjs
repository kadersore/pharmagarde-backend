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

async function requestJson(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(`${path} returned ${response.status}, expected ${expectedStatus}. Body: ${text}`);
  }
  return text ? JSON.parse(text) : undefined;
}

try {
  await waitForServer();

  const health = await requestJson("/health");
  if (health.status !== "ok") throw new Error("/health payload is invalid");

  const pharmacies = await requestJson("/pharmacies");
  if (!Array.isArray(pharmacies) || pharmacies.length < 1) throw new Error("/pharmacies must return a non-empty array");

  const nearbyPharmacies = await requestJson("/pharmacies/nearby?lat=12.37&lng=-1.52");
  if (!Array.isArray(nearbyPharmacies) || nearbyPharmacies.length < 1) throw new Error("/pharmacies/nearby must return nearby pharmacies");
  if (nearbyPharmacies.some((place) => typeof place.distanceKm !== "number")) throw new Error("Nearby pharmacies must include numeric distanceKm");

  const clinics = await requestJson("/clinics");
  if (!Array.isArray(clinics) || clinics.length < 1) throw new Error("/clinics must return a non-empty array");

  const nearbyClinics = await requestJson("/cliniques/nearby?lat=12.37&lng=-1.52");
  if (!Array.isArray(nearbyClinics) || nearbyClinics.length < 1) throw new Error("/cliniques/nearby must return nearby clinics");

  const invalidQuery = await requestJson("/pharmacies/nearby?lat=abc&lng=-1.52", 400);
  if (!invalidQuery.error) throw new Error("Invalid nearby query must return an error message");

  console.log(JSON.stringify({
    ok: true,
    health,
    pharmacies: pharmacies.length,
    nearbyPharmacies: nearbyPharmacies.length,
    clinics: clinics.length,
    nearbyClinics: nearbyClinics.length,
    invalidQueryStatus: 400,
  }, null, 2));
} finally {
  server.kill("SIGTERM");
}
