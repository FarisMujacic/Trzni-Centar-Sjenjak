const rateLimit = require("express-rate-limit");

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Previše pokušaja prijave. Pokušajte ponovo kasnije.",
  },
});

const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Previše administratorskih zahtjeva. Pokušajte ponovo kasnije.",
  },
});

module.exports = {
  loginRateLimit,
  writeRateLimit,
};
