function createEmptyPlayerSummary(name, role, teamName) {
  return {
    name,
    role,
    teamName,
    matches: 0,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    wickets: 0,
    ballsBowled: 0,
    runsConceded: 0,
    maidens: 0,
    strikeRate: 0,
    economy: 0,
  };
}

function aggregatePlayerCareerStats(matches) {
  const summaryMap = new Map();

  matches.forEach((match) => {
    const matchPlayersCounted = new Set();

    (match.teams || []).forEach((team) => {
      const battingStats = {};
      const bowlingStats = {};

      (match.innings || []).forEach((innings) => {
        Object.assign(battingStats, innings.battingStats || {});
        Object.assign(bowlingStats, innings.bowlingStats || {});
      });

      (team.players || []).forEach((player) => {
        const summaryKey = player.name.trim().toLowerCase();
        const existingSummary =
          summaryMap.get(summaryKey) || createEmptyPlayerSummary(player.name, player.role, team.name);
        const playerBatting = battingStats[player.id];
        const playerBowling = bowlingStats[player.id];

        if (!matchPlayersCounted.has(`${match.id}:${summaryKey}`)) {
          existingSummary.matches += 1;
          matchPlayersCounted.add(`${match.id}:${summaryKey}`);
        }

        if (playerBatting) {
          existingSummary.runs += playerBatting.runs || 0;
          existingSummary.balls += playerBatting.balls || 0;
          existingSummary.fours += playerBatting.fours || 0;
          existingSummary.sixes += playerBatting.sixes || 0;
        }

        if (playerBowling) {
          existingSummary.wickets += playerBowling.wickets || 0;
          existingSummary.ballsBowled += playerBowling.legalBalls || 0;
          existingSummary.runsConceded += playerBowling.runsConceded || 0;
          existingSummary.maidens += playerBowling.maidens || 0;
        }

        existingSummary.strikeRate =
          existingSummary.balls > 0
            ? Number(((existingSummary.runs / existingSummary.balls) * 100).toFixed(2))
            : 0;
        existingSummary.economy =
          existingSummary.ballsBowled > 0
            ? Number(((existingSummary.runsConceded / existingSummary.ballsBowled) * 6).toFixed(2))
            : 0;

        summaryMap.set(summaryKey, existingSummary);
      });
    });
  });

  return Array.from(summaryMap.values()).sort((left, right) => right.runs - left.runs);
}

function aggregateTeamStats(matches) {
  const summaryMap = new Map();

  matches.forEach((match) => {
    const inningsByTeamId = new Map(
      (match.innings || []).map((innings) => [innings.battingTeamId, innings])
    );

    (match.teams || []).forEach((team) => {
      const teamKey = team.name.trim().toLowerCase();
      const currentSummary = summaryMap.get(teamKey) || {
        name: team.name,
        matches: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        totalRuns: 0,
        totalWicketsLost: 0,
      };

      const innings = inningsByTeamId.get(team.id);

      currentSummary.matches += 1;
      currentSummary.totalRuns += innings?.totalRuns || 0;
      currentSummary.totalWicketsLost += innings?.wickets || 0;

      if (match.winnerTeamId === team.id) {
        currentSummary.wins += 1;
      } else if (!match.winnerTeamId) {
        currentSummary.ties += 1;
      } else {
        currentSummary.losses += 1;
      }

      summaryMap.set(teamKey, currentSummary);
    });
  });

  return Array.from(summaryMap.values()).sort((left, right) => right.wins - left.wins);
}

module.exports = {
  aggregatePlayerCareerStats,
  aggregateTeamStats,
};
