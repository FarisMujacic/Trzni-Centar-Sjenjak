const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const { getAllowedOrigins, validateEnvironment } = require("./config/env");
const { getUploadsRoot } = require("./middleware/uploadSecurity");

validateEnvironment();

const adsRoutes = require("./routes/adsRoutes");
const storesRoutes = require("./routes/storesRoutes");
const adminAuthRoutes = require("./routes/adminAuth");

require("./db");

function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const startedAt = Date.now();
    const requestPath = req.path;
    res.on("finish", () => {
      console.log(
        `${req.method} ${requestPath} ${res.statusCode} ${
          Date.now() - startedAt
        }ms`
      );
    });
    next();
  });
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        const error = new Error("Origin nije dozvoljen.");
        error.status = 403;
        return callback(error);
      },
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.use(
    "/uploads",
    express.static(getUploadsRoot(), {
      fallthrough: false,
      maxAge: "1d",
    })
  );

  app.use("/api/ads", adsRoutes);
  app.use("/api/stores", storesRoutes);
  app.use("/api/admin", adminAuthRoutes);
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API ruta nije pronađena." });
  });

  app.use(express.static(path.join(__dirname, "..", "build")));

  app.get("*", (req, res, next) => {
    res.sendFile(path.join(__dirname, "..", "build", "index.html"), (error) => {
      if (error) next(error);
    });
  });

  app.use((req, res) => {
    res.status(404).json({ message: "Ruta nije pronađena." });
  });

  app.use((error, _req, res, _next) => {
    const status = Number(error.status) || 500;
    if (status >= 500) {
      console.error("Serverska greška:", error.message);
    }
    const publicMessage =
      status === 404
        ? "Resurs nije pronađen."
        : status === 400 && error.type === "entity.parse.failed"
        ? "JSON sadržaj zahtjeva nije ispravan."
        : error.message || "Zahtjev nije ispravan.";

    res.status(status).json({
      message: status >= 500 ? "Došlo je do serverske greške." : publicMessage,
    });
  });

  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  createApp().listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = createApp;
