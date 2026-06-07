const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
const VIDEO_TYPES = {
  "video/mp4": [".mp4"],
};

const IMAGE_LIMIT = 3 * 1024 * 1024;
const VIDEO_LIMIT = 10 * 1024 * 1024;

function getUploadsRoot() {
  return path.resolve(
    process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads")
  );
}

function makeSafeFilename(file) {
  const allowed = { ...IMAGE_TYPES, ...VIDEO_TYPES };
  const extension = allowed[file.mimetype]?.[0];
  if (!extension) {
    throw new Error("Nepodržan tip fajla.");
  }
  return `${file.fieldname}-${crypto.randomUUID()}${extension}`;
}

function hasAllowedExtension(file, typeMap) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  return Boolean(
    typeMap[file.mimetype] && typeMap[file.mimetype].includes(extension)
  );
}

function createFileFilter({ allowVideo = false, coverField = "image" } = {}) {
  return (_req, file, callback) => {
    const isCover = file.fieldname === coverField;
    const allowedTypes =
      allowVideo && !isCover
        ? { ...IMAGE_TYPES, ...VIDEO_TYPES }
        : IMAGE_TYPES;

    if (!hasAllowedExtension(file, allowedTypes)) {
      const error = new Error(
        isCover
          ? "Dozvoljene su samo JPEG, PNG i WebP slike."
          : "Dozvoljeni su JPEG, PNG, WebP i MP4 fajlovi."
      );
      error.status = 400;
      return callback(error);
    }

    return callback(null, true);
  };
}

function getUploadedFiles(req) {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }
  return [];
}

function removeFile(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Brisanje upload fajla nije uspjelo:", error.message);
    }
  }
}

function cleanupUploadedFiles(req) {
  getUploadedFiles(req).forEach((file) => removeFile(file.path));
}

function detectFileType(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp"
  ) {
    return "video/mp4";
  }
  return null;
}

function inspectFile(file) {
  const handle = fs.openSync(file.path, "r");
  try {
    const header = Buffer.alloc(16);
    const bytesRead = fs.readSync(handle, header, 0, header.length, 0);
    return detectFileType(header.subarray(0, bytesRead));
  } finally {
    fs.closeSync(handle);
  }
}

function validateUploadedFiles({ allowVideo = false, coverField = "image" } = {}) {
  return (req, _res, next) => {
    const files = getUploadedFiles(req);

    try {
      for (const file of files) {
        const detectedType = inspectFile(file);
        const isCover = file.fieldname === coverField;
        const allowedTypes =
          allowVideo && !isCover
            ? { ...IMAGE_TYPES, ...VIDEO_TYPES }
            : IMAGE_TYPES;

        if (!detectedType || !allowedTypes[detectedType]) {
          const error = new Error("Sadržaj uploadovanog fajla nije dozvoljen.");
          error.status = 400;
          throw error;
        }

        if (detectedType !== file.mimetype) {
          const error = new Error("Tip uploadovanog fajla nije ispravan.");
          error.status = 400;
          throw error;
        }

        const sizeLimit = detectedType === "video/mp4" ? VIDEO_LIMIT : IMAGE_LIMIT;
        if (file.size > sizeLimit) {
          const error = new Error(
            detectedType === "video/mp4"
              ? "Video može imati najviše 10 MB."
              : "Slika može imati najviše 3 MB."
          );
          error.status = 400;
          throw error;
        }
      }
      return next();
    } catch (error) {
      cleanupUploadedFiles(req);
      return next(error);
    }
  };
}

function publicUrlFor(file, subdirectory) {
  return file ? `/uploads/${subdirectory}/${file.filename}` : null;
}

function deletePublicUpload(relativeUrl, expectedSubdirectory) {
  if (!relativeUrl) return;

  const uploadsRoot = getUploadsRoot();
  const expectedRoot = path.resolve(uploadsRoot, expectedSubdirectory);
  const normalized = String(relativeUrl).replace(/^\/+/, "");
  const withoutPrefix = normalized.replace(/^uploads[\\/]/, "");
  const fullPath = path.resolve(uploadsRoot, withoutPrefix);

  if (
    fullPath !== expectedRoot &&
    !fullPath.startsWith(`${expectedRoot}${path.sep}`)
  ) {
    console.error("Odbijeno brisanje fajla izvan očekivanog upload foldera.");
    return;
  }

  removeFile(fullPath);
}

function handleMulterError(error, req, _res, next) {
  if (!error) return next();
  cleanupUploadedFiles(req);

  if (error.code === "LIMIT_FILE_SIZE") {
    error.status = 400;
    error.message = "Uploadovani fajl je prevelik.";
  } else if (
    error.code === "LIMIT_UNEXPECTED_FILE" ||
    error.name === "MulterError"
  ) {
    error.status = 400;
    error.message = "Upload polje ili broj fajlova nije dozvoljen.";
  }

  return next(error);
}

module.exports = {
  IMAGE_LIMIT,
  VIDEO_LIMIT,
  cleanupUploadedFiles,
  createFileFilter,
  deletePublicUpload,
  getUploadsRoot,
  handleMulterError,
  makeSafeFilename,
  publicUrlFor,
  validateUploadedFiles,
};
