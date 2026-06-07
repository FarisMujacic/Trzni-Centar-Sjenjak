const fs = require("fs");
const path = require("path");

const DATA_FILE = path.resolve(
  process.env.STORES_DATA_FILE || path.join(__dirname, "stores.json")
);
const BACKUP_FILE = `${DATA_FILE}.backup`;

function ensureParentDirectory() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

function writeJsonFileDurably(filePath, content, flags = "w") {
  const handle = fs.openSync(filePath, flags);
  try {
    fs.writeFileSync(handle, content, "utf8");
    fs.fsyncSync(handle);
  } finally {
    fs.closeSync(handle);
  }
}

function initializeDataFile() {
  ensureParentDirectory();
  if (!fs.existsSync(DATA_FILE)) {
    writeJsonFileDurably(DATA_FILE, "[]\n", "wx");
  }
}

function readStoresRaw() {
  initializeDataFile();

  const raw = fs.readFileSync(DATA_FILE, "utf8");
  if (!raw.trim()) {
    throw new Error("stores.json je prazan ili oštećen.");
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("stores.json mora sadržavati JSON niz.");
  }
  return parsed;
}

function normalizeStore(obj) {
  if (!obj || typeof obj !== "object" || obj.id === undefined) {
    throw new Error("stores.json sadrži neispravan zapis prodavnice.");
  }

  return {
    id: obj.id,
    name: obj.name || "",
    category: obj.category || "",
    floor: obj.floor || "",
    workHours: obj.workHours || "",
    workHoursWeekdays: obj.workHoursWeekdays || "",
    workHoursSaturday: obj.workHoursSaturday || "",
    workHoursSunday: obj.workHoursSunday || "",
    description: obj.description || "",
    contactPhone: obj.contactPhone || "",
    imageUrl: obj.imageUrl || null,
    galleryUrls: Array.isArray(obj.galleryUrls) ? obj.galleryUrls : [],
    createdAt: obj.createdAt || null,
    updatedAt: obj.updatedAt || null,
  };
}

function readStores() {
  return readStoresRaw().map(normalizeStore);
}

function writeStores(stores) {
  ensureParentDirectory();
  const temporaryFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  const serialized = `${JSON.stringify(stores, null, 2)}\n`;

  try {
    writeJsonFileDurably(temporaryFile, serialized, "wx");
    const verification = JSON.parse(fs.readFileSync(temporaryFile, "utf8"));
    if (!Array.isArray(verification) || verification.length !== stores.length) {
      throw new Error("Provjera privremenog stores zapisa nije uspjela.");
    }

    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    }
    fs.renameSync(temporaryFile, DATA_FILE);
  } catch (error) {
    try {
      fs.unlinkSync(temporaryFile);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.error("Čišćenje privremenog stores fajla nije uspjelo.");
      }
    }
    throw error;
  }
}

function getAllStores() {
  return readStores();
}

function parseId(id) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

function getStoreById(id) {
  const numericId = parseId(id);
  if (!numericId) return null;
  return readStores().find((store) => Number(store.id) === numericId) || null;
}

function createStore(storeData) {
  const stores = readStores();
  const newId =
    stores.length === 0
      ? 1
      : Math.max(...stores.map((store) => Number(store.id) || 0)) + 1;
  const now = new Date().toISOString();

  const newStore = {
    id: newId,
    name: storeData.name || "",
    category: storeData.category || "",
    floor: storeData.floor || "",
    workHours: storeData.workHours || "",
    workHoursWeekdays: storeData.workHoursWeekdays || "",
    workHoursSaturday: storeData.workHoursSaturday || "",
    workHoursSunday: storeData.workHoursSunday || "",
    description: storeData.description || "",
    contactPhone: storeData.contactPhone || "",
    imageUrl: storeData.imageUrl || null,
    galleryUrls: Array.isArray(storeData.galleryUrls)
      ? storeData.galleryUrls
      : [],
    createdAt: now,
    updatedAt: now,
  };

  stores.push(newStore);
  writeStores(stores);
  return newStore;
}

function updateStore(id, storeData) {
  const stores = readStores();
  const numericId = parseId(id);
  if (!numericId) return null;

  const index = stores.findIndex((store) => Number(store.id) === numericId);
  if (index === -1) return null;

  const existing = stores[index];
  const updated = {
    ...existing,
    name: storeData.name ?? existing.name,
    category: storeData.category ?? existing.category,
    floor: storeData.floor ?? existing.floor,
    workHours: storeData.workHours ?? existing.workHours,
    workHoursWeekdays:
      storeData.workHoursWeekdays ?? existing.workHoursWeekdays,
    workHoursSaturday:
      storeData.workHoursSaturday ?? existing.workHoursSaturday,
    workHoursSunday: storeData.workHoursSunday ?? existing.workHoursSunday,
    description: storeData.description ?? existing.description,
    contactPhone: storeData.contactPhone ?? existing.contactPhone,
    imageUrl: storeData.imageUrl ?? existing.imageUrl,
    galleryUrls:
      storeData.galleryUrls === undefined
        ? existing.galleryUrls || []
        : Array.isArray(storeData.galleryUrls)
        ? storeData.galleryUrls
        : existing.galleryUrls || [],
    updatedAt: new Date().toISOString(),
  };

  stores[index] = updated;
  writeStores(stores);
  return updated;
}

function deleteStore(id) {
  const stores = readStores();
  const numericId = parseId(id);
  if (!numericId) return false;

  const index = stores.findIndex((store) => Number(store.id) === numericId);
  if (index === -1) return false;

  stores.splice(index, 1);
  writeStores(stores);
  return true;
}

module.exports = {
  createStore,
  deleteStore,
  getAllStores,
  getStoreById,
  updateStore,
};
