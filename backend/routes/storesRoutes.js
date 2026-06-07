const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const authenticateAdmin = require("../middleware/authMiddleware");
const { writeRateLimit } = require("../middleware/rateLimits");
const {
  VIDEO_LIMIT,
  cleanupUploadedFiles,
  createFileFilter,
  deletePublicUpload,
  getUploadsRoot,
  handleMulterError,
  makeSafeFilename,
  publicUrlFor,
  validateUploadedFiles,
} = require("../middleware/uploadSecurity");
const {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
} = require("../dbStores");

const router = express.Router();
const uploadDirectory = path.join(getUploadsRoot(), "stores");
const MAX_GALLERY_FILES = 8;
const ALLOWED_CATEGORIES = new Set([
  "Shopping",
  "Beauty & usluge",
  "Hrana i piće",
  "Ostalo",
]);
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      try {
        callback(null, makeSafeFilename(file));
      } catch (error) {
        callback(error);
      }
    },
  }),
  fileFilter: createFileFilter({ allowVideo: true }),
  limits: {
    fileSize: VIDEO_LIMIT,
    files: 9,
    fields: 12,
    parts: 21,
  },
});

function uploadStoreMedia(req, res, next) {
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "galleryImages", maxCount: MAX_GALLERY_FILES },
  ])(req, res, (error) => handleMulterError(error, req, res, next));
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function cleanText(value, maximumLength) {
  return String(value || "").replace(/\0/g, "").trim().slice(0, maximumLength);
}

function getStoreInput(body) {
  return {
    name: cleanText(body?.name, 120),
    category: cleanText(body?.category, 80),
    floor: cleanText(body?.floor, 60),
    workHours: cleanText(body?.workHours, 300),
    workHoursWeekdays: cleanText(body?.workHoursWeekdays, 120),
    workHoursSaturday: cleanText(body?.workHoursSaturday, 120),
    workHoursSunday: cleanText(body?.workHoursSunday, 120),
    description: cleanText(body?.description, 5000),
    contactPhone: cleanText(body?.contactPhone, 80),
  };
}

function validateStoreInput(input) {
  if (!input.name || !input.category) {
    return "Naziv prodavnice i kategorija su obavezni.";
  }
  if (!ALLOWED_CATEGORIES.has(input.category)) {
    return "Kategorija prodavnice nije dozvoljena.";
  }
  return null;
}

function getStoreFiles(req) {
  const cover = req.files?.image?.[0] || null;
  const gallery = req.files?.galleryImages || [];
  return { cover, gallery };
}

router.get("/", (req, res, next) => {
  try {
    const category = cleanText(req.query.category, 80).toLowerCase();
    let stores = getAllStores();
    if (category) {
      stores = stores.filter(
        (store) => String(store.category || "").toLowerCase() === category
      );
    }
    return res.json(stores);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "ID prodavnice nije ispravan." });
    }
    const store = getStoreById(id);
    if (!store) {
      return res.status(404).json({ message: "Prodavnica nije pronađena." });
    }
    return res.json(store);
  } catch (error) {
    return next(error);
  }
});

router.use(writeRateLimit, authenticateAdmin);

router.post(
  "/",
  uploadStoreMedia,
  validateUploadedFiles({ allowVideo: true }),
  (req, res, next) => {
    const input = getStoreInput(req.body);
    const validationError = validateStoreInput(input);
    if (validationError) {
      cleanupUploadedFiles(req);
      return res.status(400).json({ message: validationError });
    }

    const { cover, gallery } = getStoreFiles(req);
    try {
      const created = createStore({
        ...input,
        imageUrl: publicUrlFor(cover, "stores"),
        galleryUrls: gallery.map((file) => publicUrlFor(file, "stores")),
      });
      return res.status(201).json(created);
    } catch (error) {
      cleanupUploadedFiles(req);
      return next(error);
    }
  }
);

router.put(
  "/:id",
  uploadStoreMedia,
  validateUploadedFiles({ allowVideo: true }),
  (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
      cleanupUploadedFiles(req);
      return res.status(400).json({ message: "ID prodavnice nije ispravan." });
    }

    try {
      const existing = getStoreById(id);
      if (!existing) {
        cleanupUploadedFiles(req);
        return res.status(404).json({ message: "Prodavnica nije pronađena." });
      }

      const input = getStoreInput(req.body);
      const validationError = validateStoreInput(input);
      if (validationError) {
        cleanupUploadedFiles(req);
        return res.status(400).json({ message: validationError });
      }

      const { cover, gallery } = getStoreFiles(req);
      const existingGallery = Array.isArray(existing.galleryUrls)
        ? existing.galleryUrls
        : [];
      if (existingGallery.length + gallery.length > MAX_GALLERY_FILES) {
        cleanupUploadedFiles(req);
        return res.status(400).json({
          message: `Galerija može sadržavati najviše ${MAX_GALLERY_FILES} fajlova.`,
        });
      }
      const imageUrl = cover
        ? publicUrlFor(cover, "stores")
        : existing.imageUrl;
      const galleryUrls = [
        ...existingGallery,
        ...gallery.map((file) => publicUrlFor(file, "stores")),
      ];
      const updated = updateStore(id, {
        ...input,
        imageUrl,
        galleryUrls,
      });

      if (cover && existing.imageUrl !== imageUrl) {
        deletePublicUpload(existing.imageUrl, "stores");
      }
      return res.json(updated);
    } catch (error) {
      cleanupUploadedFiles(req);
      return next(error);
    }
  }
);

router.delete("/:id", (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID prodavnice nije ispravan." });
  }

  try {
    const existing = getStoreById(id);
    if (!existing) {
      return res.status(404).json({ message: "Prodavnica nije pronađena." });
    }

    if (!deleteStore(id)) {
      return res.status(404).json({ message: "Prodavnica nije pronađena." });
    }

    deletePublicUpload(existing.imageUrl, "stores");
    (existing.galleryUrls || []).forEach((url) =>
      deletePublicUpload(url, "stores")
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
