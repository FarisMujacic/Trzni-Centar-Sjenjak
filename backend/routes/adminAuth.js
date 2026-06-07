const express = require("express");
const jwt = require("jsonwebtoken");
const { loginRateLimit } = require("../middleware/rateLimits");

const router = express.Router();

router.post("/login", loginRateLimit, (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Username i lozinka su obavezni." });
  }

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: "admin" }, process.env.ADMIN_SECRET, {
      expiresIn: "2h",
    });
    return res.json({ ok: true, token });
  }

  return res.status(401).json({ ok: false, message: "Neispravni podaci." });
});

module.exports = router;
