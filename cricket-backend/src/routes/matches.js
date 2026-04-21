const express = require("express");
const { readDatabase, updateDatabase } = require("../lib/database");
const { requireAuth } = require("../middleware/auth");
const { createId } = require("../utils/id");

const router = express.Router();

router.get("/", requireAuth, async (request, response) => {
  const database = await readDatabase();
  const matches = database.matches
    .filter((match) => match.userId === request.user.id)
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));

  response.json({ matches });
});

router.get("/share/:shareId", async (request, response) => {
  const database = await readDatabase();
  const match = database.matches.find((item) => item.shareId === request.params.shareId);

  if (!match) {
    response.status(404).json({ message: "Shared match not found" });
    return;
  }

  response.json({ match });
});

router.get("/:matchId", requireAuth, async (request, response) => {
  const database = await readDatabase();
  const match = database.matches.find(
    (item) => item.id === request.params.matchId && item.userId === request.user.id
  );

  if (!match) {
    response.status(404).json({ message: "Match not found" });
    return;
  }

  response.json({ match });
});

router.post("/", requireAuth, async (request, response) => {
  const submittedMatch = request.body?.match;

  if (!submittedMatch || !Array.isArray(submittedMatch.teams) || submittedMatch.teams.length !== 2) {
    response.status(400).json({ message: "A complete match payload is required" });
    return;
  }

  const now = new Date().toISOString();
  const nextMatch = {
    ...submittedMatch,
    id: submittedMatch.id || createId("match"),
    userId: request.user.id,
    shareId: submittedMatch.shareId || createId("share"),
    updatedAt: now,
    createdAt: submittedMatch.createdAt || now,
  };

  await updateDatabase((currentDatabase) => {
    const existingIndex = currentDatabase.matches.findIndex(
      (item) => item.id === nextMatch.id && item.userId === request.user.id
    );

    if (existingIndex === -1) {
      return {
        ...currentDatabase,
        matches: [...currentDatabase.matches, nextMatch],
      };
    }

    const nextMatches = [...currentDatabase.matches];
    nextMatches[existingIndex] = nextMatch;

    return {
      ...currentDatabase,
      matches: nextMatches,
    };
  });

  response.status(201).json({ match: nextMatch });
});

module.exports = router;
