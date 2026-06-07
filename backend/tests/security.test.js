const assert = require("assert");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const jwt = require("jsonwebtoken");

const backendRoot = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sjenjak-security-"));
const storesFile = path.join(testRoot, "stores.json");
const adsDatabase = path.join(testRoot, "ads.db");
const uploadsDirectory = path.join(testRoot, "uploads");
const username = "security-test-admin";
const password = "security-test-password";
const secret = "security-test-secret-with-more-than-32-characters";

fs.copyFileSync(path.join(backendRoot, "stores.json"), storesFile);
fs.mkdirSync(uploadsDirectory, { recursive: true });

const results = [];
let serverProcess;
let baseUrl;

function record(name, callback) {
  return Promise.resolve()
    .then(callback)
    .then(() => {
      results.push({ name, status: "PASS" });
      console.log(`PASS ${name}`);
    })
    .catch((error) => {
      results.push({ name, status: "FAIL", error });
      console.error(`FAIL ${name}: ${error.message}`);
      throw error;
    });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Server se nije pokrenuo na vrijeme.\n${output}`));
    }, 15000);

    function onData(chunk) {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
      if (text.includes("Server running on port")) {
        clearTimeout(timeout);
        resolve();
      }
    }

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Test server je završen kodom ${code}.\n${output}`));
    });
  });
}

async function request(urlPath, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${urlPath}`, {
    method: options.method || "GET",
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function jpegBuffer(size = 32) {
  const buffer = Buffer.alloc(Math.max(size, 8), 0);
  buffer.set([0xff, 0xd8, 0xff, 0xe0], 0);
  buffer.set([0xff, 0xd9], buffer.length - 2);
  return buffer;
}

function mp4Buffer() {
  const buffer = Buffer.alloc(24, 0);
  buffer.writeUInt32BE(24, 0);
  buffer.write("ftyp", 4, "ascii");
  buffer.write("isom", 8, "ascii");
  return buffer;
}

function appendFields(form, fields) {
  Object.entries(fields).forEach(([key, value]) => {
    form.append(key, value);
  });
  return form;
}

function uploadPathFromUrl(relativeUrl) {
  const normalized = relativeUrl.replace(/^\/uploads\//, "");
  return path.join(uploadsDirectory, ...normalized.split("/"));
}

async function main() {
  await record("startup odbija nedostajuće admin env varijable", () => {
    const result = spawnSync(process.execPath, ["server.js"], {
      cwd: backendRoot,
      env: {
        ...process.env,
        ADMIN_USERNAME: "",
        ADMIN_PASSWORD: "",
        ADMIN_SECRET: "",
      },
      encoding: "utf8",
      timeout: 10000,
    });
    assert.notStrictEqual(result.status, 0);
    assert.match(
      `${result.stdout}${result.stderr}`,
      /Nedostaju obavezne environment varijable/
    );
  });

  const port = await getFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: backendRoot,
    env: {
      ...process.env,
      PORT: String(port),
      ADMIN_USERNAME: username,
      ADMIN_PASSWORD: password,
      ADMIN_SECRET: secret,
      ALLOWED_ORIGIN: "http://localhost:3000",
      STORES_DATA_FILE: storesFile,
      ADS_DB_FILE: adsDatabase,
      UPLOADS_DIR: uploadsDirectory,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForServer(serverProcess);

  let token;
  await record("javni GET endpoint radi bez tokena", async () => {
    const { response, data } = await request("/api/stores");
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(data));
  });
  await record("CORS dozvoljava konfigurisan origin", async () => {
    const { response } = await request("/api/stores", {
      headers: { Origin: "http://localhost:3000" },
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000"
    );
  });
  await record("CORS odbija nepoznat origin", async () => {
    const { response } = await request("/api/stores", {
      headers: { Origin: "https://not-allowed.example" },
    });
    assert.strictEqual(response.status, 403);
  });
  await record("prazan login vraća 400", async () => {
    const { response } = await request("/api/admin/login", {
      method: "POST",
      body: {},
    });
    assert.strictEqual(response.status, 400);
  });
  await record("pogrešan login vraća 401", async () => {
    const { response } = await request("/api/admin/login", {
      method: "POST",
      body: { username, password: "wrong" },
    });
    assert.strictEqual(response.status, 401);
  });
  await record("ispravan login vraća JWT", async () => {
    const { response, data } = await request("/api/admin/login", {
      method: "POST",
      body: { username, password },
    });
    assert.strictEqual(response.status, 200);
    assert.ok(data.token);
    token = data.token;
  });
  await record("write bez tokena vraća 401", async () => {
    const { response } = await request("/api/ads", {
      method: "POST",
      body: {},
    });
    assert.strictEqual(response.status, 401);
  });
  await record("write sa neispravnim tokenom vraća 401", async () => {
    const { response } = await request("/api/ads", {
      method: "POST",
      token: "invalid-token",
      body: {},
    });
    assert.strictEqual(response.status, 401);
  });
  await record("write sa isteklim tokenom vraća 401", async () => {
    const expiredToken = jwt.sign(
      { role: "admin" },
      secret,
      { expiresIn: -1 }
    );
    const { response } = await request("/api/ads", {
      method: "POST",
      token: expiredToken,
      body: {},
    });
    assert.strictEqual(response.status, 401);
  });
  await record("ispravan token prolazi do validacije", async () => {
    const { response } = await request("/api/ads", {
      method: "POST",
      token,
      body: {},
    });
    assert.strictEqual(response.status, 400);
  });

  await record("HTML upload se odbija", async () => {
    const form = appendFields(new FormData(), {
      title: "HTML test",
      category: "Ostalo",
    });
    form.append(
      "image",
      new Blob(["<html></html>"], { type: "text/html" }),
      "test.html"
    );
    const { response } = await request("/api/ads", {
      method: "POST",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 400);
  });
  await record("SVG upload se odbija", async () => {
    const form = appendFields(new FormData(), {
      title: "SVG test",
      category: "Ostalo",
    });
    form.append(
      "image",
      new Blob(["<svg></svg>"], { type: "image/svg+xml" }),
      "test.svg"
    );
    const { response } = await request("/api/ads", {
      method: "POST",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 400);
  });
  await record("lažno deklarisan JPEG se odbija magic-byte provjerom", async () => {
    const form = appendFields(new FormData(), {
      title: "Spoofed image test",
      category: "Ostalo",
    });
    form.append(
      "image",
      new Blob(["<html>nije slika</html>"], { type: "image/jpeg" }),
      "spoofed.jpg"
    );
    const { response } = await request("/api/ads", {
      method: "POST",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 400);
  });
  await record("prevelika oglasna slika se odbija", async () => {
    const form = appendFields(new FormData(), {
      title: "Large test",
      category: "Ostalo",
    });
    form.append(
      "image",
      new Blob([jpegBuffer(3 * 1024 * 1024 + 1)], { type: "image/jpeg" }),
      "large.jpg"
    );
    const { response } = await request("/api/ads", {
      method: "POST",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 400);
  });
  await record("nedozvoljeno upload polje se odbija", async () => {
    const form = appendFields(new FormData(), {
      name: "Field test",
      category: "Ostalo",
    });
    form.append(
      "unknownFile",
      new Blob([jpegBuffer()], { type: "image/jpeg" }),
      "test.jpg"
    );
    const { response } = await request("/api/stores", {
      method: "POST",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 400);
  });
  await record("više od osam galerijskih fajlova se odbija", async () => {
    const form = appendFields(new FormData(), {
      name: "Gallery limit test",
      category: "Ostalo",
    });
    for (let index = 0; index < 9; index += 1) {
      form.append(
        "galleryImages",
        new Blob([jpegBuffer()], { type: "image/jpeg" }),
        `gallery-${index}.jpg`
      );
    }
    const { response } = await request("/api/stores", {
      method: "POST",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 400);
  });

  let storeId;
  await record("kreiranje radnje čuva sva polja i medije", async () => {
    const form = appendFields(new FormData(), {
      name: "Security Test Store",
      category: "Ostalo",
      floor: "Test lokacija",
      workHours: "Pon-Pet 09-17",
      workHoursWeekdays: "09:00-17:00",
      workHoursSaturday: "10:00-14:00",
      workHoursSunday: "Zatvoreno",
      description: "Privremena testna radnja",
      contactPhone: "+387 60 000 000",
    });
    form.append(
      "image",
      new Blob([jpegBuffer()], { type: "image/jpeg" }),
      "cover.jpg"
    );
    form.append(
      "galleryImages",
      new Blob([mp4Buffer()], { type: "video/mp4" }),
      "gallery.mp4"
    );

    const { response, data } = await request("/api/stores", {
      method: "POST",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 201);
    assert.strictEqual(data.contactPhone, "+387 60 000 000");
    assert.strictEqual(data.workHoursWeekdays, "09:00-17:00");
    assert.strictEqual(data.workHoursSaturday, "10:00-14:00");
    assert.strictEqual(data.workHoursSunday, "Zatvoreno");
    assert.strictEqual(data.floor, "Test lokacija");
    assert.strictEqual(data.galleryUrls.length, 1);
    storeId = data.id;
  });
  await record("izmjena i ponovno čitanje radnje čuva polja", async () => {
    const form = appendFields(new FormData(), {
      name: "Security Test Store Updated",
      category: "Ostalo",
      floor: "2",
      workHours: "Pon-Sub 08-18",
      workHoursWeekdays: "08:00-18:00",
      workHoursSaturday: "08:00-18:00",
      workHoursSunday: "Zatvoreno",
      description: "Izmijenjen testni opis",
      contactPhone: "+387 61 111 111",
    });
    const update = await request(`/api/stores/${storeId}`, {
      method: "PUT",
      token,
      body: form,
    });
    assert.strictEqual(update.response.status, 200);

    const read = await request(`/api/stores/${storeId}`);
    assert.strictEqual(read.response.status, 200);
    assert.strictEqual(read.data.contactPhone, "+387 61 111 111");
    assert.strictEqual(read.data.workHoursWeekdays, "08:00-18:00");
    assert.strictEqual(read.data.workHoursSaturday, "08:00-18:00");
    assert.strictEqual(read.data.workHoursSunday, "Zatvoreno");
    assert.strictEqual(read.data.floor, "2");
    assert.ok(fs.existsSync(`${storesFile}.backup`));
  });
  await record("brisanje testne radnje uklanja zapis", async () => {
    const deletion = await request(`/api/stores/${storeId}`, {
      method: "DELETE",
      token,
    });
    assert.strictEqual(deletion.response.status, 200);
    const read = await request(`/api/stores/${storeId}`);
    assert.strictEqual(read.response.status, 404);
  });

  let adId;
  let currentAdImage;
  await record("kreiranje oglasa sa dozvoljenom slikom", async () => {
    const form = appendFields(new FormData(), {
      title: "Security Test Ad",
      category: "Ostalo",
      description: "Privremeni oglas",
    });
    form.append(
      "image",
      new Blob([jpegBuffer()], { type: "image/jpeg" }),
      "ad.jpg"
    );
    const { response, data } = await request("/api/ads", {
      method: "POST",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 201);
    assert.ok(data.imageUrl);
    assert.ok(fs.existsSync(uploadPathFromUrl(data.imageUrl)));
    adId = data.id;
    currentAdImage = data.imageUrl;
  });
  await record("uspješna izmjena oglasa briše tek staru sliku", async () => {
    const oldImagePath = uploadPathFromUrl(currentAdImage);
    const form = appendFields(new FormData(), {
      title: "Security Test Ad Updated",
      category: "Shopping",
      description: "Izmijenjen testni oglas",
    });
    form.append(
      "image",
      new Blob([jpegBuffer(64)], { type: "image/jpeg" }),
      "replacement.jpg"
    );
    const { response, data } = await request(`/api/ads/${adId}`, {
      method: "PUT",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 200);
    assert.notStrictEqual(data.imageUrl, currentAdImage);
    assert.strictEqual(fs.existsSync(oldImagePath), false);
    assert.ok(fs.existsSync(uploadPathFromUrl(data.imageUrl)));
    currentAdImage = data.imageUrl;
  });
  await record("neuspješna izmjena čuva postojeću sliku i čisti novu", async () => {
    const adsDirectory = path.join(uploadsDirectory, "ads");
    const before = fs.readdirSync(adsDirectory).sort();
    const form = appendFields(new FormData(), {
      title: "",
      category: "Shopping",
    });
    form.append(
      "image",
      new Blob([jpegBuffer(96)], { type: "image/jpeg" }),
      "invalid-replacement.jpg"
    );
    const { response } = await request(`/api/ads/${adId}`, {
      method: "PUT",
      token,
      body: form,
    });
    assert.strictEqual(response.status, 400);
    assert.ok(fs.existsSync(uploadPathFromUrl(currentAdImage)));
    assert.deepStrictEqual(fs.readdirSync(adsDirectory).sort(), before);
  });
  await record("brisanje oglasa prvo briše DB zapis pa sliku", async () => {
    const imagePath = uploadPathFromUrl(currentAdImage);
    const deletion = await request(`/api/ads/${adId}`, {
      method: "DELETE",
      token,
    });
    assert.strictEqual(deletion.response.status, 200);
    assert.strictEqual(fs.existsSync(imagePath), false);
    const ads = await request("/api/ads");
    assert.ok(!ads.data.some((ad) => ad.id === adId));
  });
}

async function cleanup() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      serverProcess.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  const resolvedTestRoot = path.resolve(testRoot);
  const resolvedTemp = path.resolve(os.tmpdir());
  if (resolvedTestRoot.startsWith(`${resolvedTemp}${path.sep}`)) {
    fs.rmSync(resolvedTestRoot, { recursive: true, force: true });
  }
}

main()
  .then(async () => {
    await cleanup();
    console.log(`\n${results.length} sigurnosnih testova je prošlo.`);
  })
  .catch(async (error) => {
    await cleanup();
    console.error(`\nSigurnosni testovi nisu prošli: ${error.stack}`);
    process.exitCode = 1;
  });
