const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "cricket-app-dev-secret",
  jwtExpiresInSeconds: 60 * 60 * 24 * 7,
  databaseFilePath: path.join(__dirname, "..", "data", "db.json"),
  allowedOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
