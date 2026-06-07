const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const authenticateAdmin = require("../middleware/authMiddleware");
const { writeRateLimit } = require("../middleware/rateLimits");
const {
  IMAGE_LIMIT,
  cleanupUploadedFiles,
  createFileFilter,
  deletePublicUpload,
  getUploadsRoot,
  handleMulterError,
  makeSafeFilename,
  publicUrlFor,
  validateUploadedFiles,
} = require("../middleware/uploadSecurity");

const router = express.Router();
const uploadDirectory = path.join(getUploadsRoot(), "ads");
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
  fileFilter: createFileFilter(),
  limits: {
    fileSize: IMAGE_LIMIT,
    files: 1,
    fields: 4,
    parts: 5,
  },
});

function uploadAdImage(req, res, next) {
  upload.single("image")(req, res, (error) =>
    handleMulterError(error, req, res, next)
  );
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function cleanText(value, maximumLength) {
  return String(value || "").replace(/\0/g, "").trim().slice(0, maximumLength);
}

function getAdInput(body) {
  return {
    title: cleanText(body?.title, 160),
    category: cleanText(body?.category, 80),
    description: cleanText(body?.description, 5000),
  };
}

router.get("/", (req, res, next) => {
  const search = cleanText(req.query.search, 160);
  const like = `%${search}%`;
  const sql = search
    ? `SELECT * FROM ads
       WHERE title LIKE ? OR category LIKE ?
       ORDER BY datetime(createdAt) DESC`
    : `SELECT * FROM ads ORDER BY datetime(createdAt) DESC`;

  db.all(sql, search ? [like, like] : [], (error, rows) => {
    if (error) return next(error);
    return res.json(rows);
  });
});

router.use(writeRateLimit, authenticateAdmin);

router.post(
  "/",
  uploadAdImage,
  validateUploadedFiles(),
  (req, res, next) => {
    const { title, category, description } = getAdInput(req.body);
    if (!title || !category) {
      cleanupUploadedFiles(req);
      return res
        .status(400)
        .json({ message: "Naslov i kategorija su obavezni." });
    }

    const now = new Date().toISOString();
    const imageUrl = publicUrlFor(req.file, "ads");
    const sql = `
      INSERT INTO ads (title, category, description, imageUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [title, category, description, imageUrl, now, now],
      function onInsert(error) {
        if (error) {
          cleanupUploadedFiles(req);
          return next(error);
        }

        db.get(
          "SELECT * FROM ads WHERE id = ?",
          [this.lastID],
          (selectError, row) => {
            if (selectError) return next(selectError);
            return res.status(201).json(row);
          }
        );
      }
    );
  }
);

router.put(
  "/:id",
  uploadAdImage,
  validateUploadedFiles(),
  (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
      cleanupUploadedFiles(req);
      return res.status(400).json({ message: "ID reklame nije ispravan." });
    }

    const { title, category, description } = getAdInput(req.body);
    if (!title || !category) {
      cleanupUploadedFiles(req);
      return res
        .status(400)
        .json({ message: "Naslov i kategorija su obavezni." });
    }

    db.get("SELECT * FROM ads WHERE id = ?", [id], (error, existing) => {
      if (error) {
        cleanupUploadedFiles(req);
        return next(error);
      }
      if (!existing) {
        cleanupUploadedFiles(req);
        return res.status(404).json({ message: "Reklama nije pronađena." });
      }

      const imageUrl = req.file
        ? publicUrlFor(req.file, "ads")
        : existing.imageUrl;
      const now = new Date().toISOString();
      const sql = `
        UPDATE ads
        SET title = ?, category = ?, description = ?, imageUrl = ?, updatedAt = ?
        WHERE id = ?
      `;

      db.run(
        sql,
        [title, category, description, imageUrl, now, id],
        (updateError) => {
          if (updateError) {
            cleanupUploadedFiles(req);
            return next(updateError);
          }

          if (req.file && existing.imageUrl !== imageUrl) {
            deletePublicUpload(existing.imageUrl, "ads");
          }

          db.get(
            "SELECT * FROM ads WHERE id = ?",
            [id],
            (selectError, row) => {
              if (selectError) return next(selectError);
              return res.json(row);
            }
          );
        }
      );
    });
  }
);

router.delete("/:id", (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID reklame nije ispravan." });
  }

  db.get("SELECT * FROM ads WHERE id = ?", [id], (error, row) => {
    if (error) return next(error);
    if (!row) {
      return res.status(404).json({ message: "Reklama nije pronađena." });
    }

    db.run("DELETE FROM ads WHERE id = ?", [id], (deleteError) => {
      if (deleteError) return next(deleteError);
      deletePublicUpload(row.imageUrl, "ads");
      return res.json({ success: true });
    });
  });
});

module.exports = router;
