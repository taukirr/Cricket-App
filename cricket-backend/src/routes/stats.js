const express = require("express");
const { readDatabase } = require("../lib/database");
const { requireAuth } = require("../middleware/auth");
const { aggregatePlayerCareerStats, aggregateTeamStats } = require("../utils/stats");

const router = express.Router();

router.get("/career", requireAuth, async (request, response) => {
  const database = await readDatabase();
  const userMatches = database.matches.filter((match) => match.userId === request.user.id);

  response.json({
    players: aggregatePlayerCareerStats(userMatches),
  });
});

router.get("/teams", requireAuth, async (request, response) => {
  const database = await readDatabase();
  const userMatches = database.matches.filter((match) => match.userId === request.user.id);

  response.json({
    teams: aggregateTeamStats(userMatches),
  });
});

module.exports = router;
