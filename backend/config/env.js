const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const REQUIRED_ADMIN_ENV = [
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "ADMIN_SECRET",
];

function validateEnvironment() {
  const missing = REQUIRED_ADMIN_ENV.filter(
    (name) => !String(process.env[name] || "").trim()
  );

  if (missing.length > 0) {
    throw new Error(
      `Nedostaju obavezne environment varijable: ${missing.join(", ")}`
    );
  }

  if (process.env.ADMIN_SECRET.trim().length < 32) {
    throw new Error("ADMIN_SECRET mora imati najmanje 32 znaka.");
  }
}

function getAllowedOrigins() {
  return String(process.env.ALLOWED_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = {
  getAllowedOrigins,
  validateEnvironment,
};
