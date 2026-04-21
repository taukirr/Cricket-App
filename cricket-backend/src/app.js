const express = require("express");
const cors = require("cors");
const { allowedOrigin } = require("./config");
const authRoutes = require("./routes/auth");
const matchRoutes = require("./routes/matches");
const statsRoutes = require("./routes/stats");

const app = express();

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/stats", statsRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Internal server error" });
});

module.exports = app;
