const jwt = require("jsonwebtoken");

function authenticateAdmin(req, res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(/\s+/);

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Autentifikacija je obavezna." });
  }

  try {
    const payload = jwt.verify(token, process.env.ADMIN_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Pristup nije dozvoljen." });
    }

    req.admin = payload;
    return next();
  } catch (_error) {
    return res
      .status(401)
      .json({ message: "Token je neispravan ili je istekao." });
  }
}

module.exports = authenticateAdmin;
