import type { Innings, MatchRecord, PlayerCareerStats, Team, TeamAggregateStats } from "../types/cricket";
import { calculateRunRate, formatOversFromBalls } from "./format";
import { getCurrentInnings, getPlayerById, getTeamById } from "./matchEngine";

export function getMatchHistorySummary(match: MatchRecord): string {
  const firstInnings = match.innings[0];
  const secondInnings = match.innings[1];

  if (!secondInnings) {
    return `${getTeamById(match, firstInnings.battingTeamId).name} ${firstInnings.totalRuns}/${firstInnings.wickets}`;
  }

  return `${getTeamById(match, firstInnings.battingTeamId).name} ${firstInnings.totalRuns}/${firstInnings.wickets} - ${getTeamById(match, secondInnings.battingTeamId).name} ${secondInnings.totalRuns}/${secondInnings.wickets}`;
}

export function getCurrentMatchMetrics(match: MatchRecord) {
  const innings = getCurrentInnings(match);
  const currentRunRate = calculateRunRate(innings.totalRuns, innings.legalBalls);
  const projectedScore = Number((currentRunRate * match.oversPerInnings).toFixed(2));
  const ballsLeft = match.oversPerInnings * 6 - innings.legalBalls;
  const requiredRuns = innings.target ? Math.max(0, innings.target - innings.totalRuns) : 0;
  const requiredRunRate =
    ballsLeft > 0 ? Number(((requiredRuns / ballsLeft) * 6).toFixed(2)) : 0;

  return {
    innings,
    currentRunRate,
    projectedScore,
    requiredRuns,
    ballsLeft,
    requiredRunRate,
  };
}

export function getLiveWinProbability(match: MatchRecord): number {
  const { innings, requiredRuns, ballsLeft } = getCurrentMatchMetrics(match);

  if (innings.number === 1 || !innings.target) {
    const progress = (innings.totalRuns / Math.max(1, match.oversPerInnings * 10)) * 100;
    return Math.max(5, Math.min(95, progress));
  }

  if (requiredRuns === 0) {
    return 100;
  }

  if (ballsLeft === 0) {
    return 0;
  }

  const chaseFactor = ((innings.target - 1 - requiredRuns) / Math.max(1, innings.target - 1)) * 100;
  const timeFactor = (ballsLeft / (match.oversPerInnings * 6)) * 100;

  return Math.max(1, Math.min(99, Number((chaseFactor * 0.7 + timeFactor * 0.3).toFixed(1))));
}

export function buildLocalPlayerStats(matches: MatchRecord[]): PlayerCareerStats[] {
  const playerMap = new Map<string, PlayerCareerStats>();

  matches.forEach((match) => {
    const matchSeen = new Set<string>();

    match.teams.forEach((team) => {
      const allBattingStats = Object.assign({}, match.innings[0].battingStats, match.innings[1]?.battingStats);
      const allBowlingStats = Object.assign({}, match.innings[0].bowlingStats, match.innings[1]?.bowlingStats);

      team.players.forEach((player) => {
        const key = player.name.trim().toLowerCase();
        const stats =
          playerMap.get(key) || {
            name: player.name,
            role: player.role,
            teamName: team.name,
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

        if (!matchSeen.has(`${match.id}:${key}`)) {
          stats.matches += 1;
          matchSeen.add(`${match.id}:${key}`);
        }

        const batting = allBattingStats[player.id];
        const bowling = allBowlingStats[player.id];

        if (batting) {
          stats.runs += batting.runs;
          stats.balls += batting.balls;
          stats.fours += batting.fours;
          stats.sixes += batting.sixes;
        }

        if (bowling) {
          stats.wickets += bowling.wickets;
          stats.ballsBowled += bowling.legalBalls;
          stats.runsConceded += bowling.runsConceded;
          stats.maidens += bowling.maidens;
        }

        stats.strikeRate = stats.balls > 0 ? Number(((stats.runs / stats.balls) * 100).toFixed(2)) : 0;
        stats.economy =
          stats.ballsBowled > 0 ? Number(((stats.runsConceded / stats.ballsBowled) * 6).toFixed(2)) : 0;

        playerMap.set(key, stats);
      });
    });
  });

  return Array.from(playerMap.values()).sort((left, right) => right.runs - left.runs);
}

export function buildLocalTeamStats(matches: MatchRecord[]): TeamAggregateStats[] {
  const teamMap = new Map<string, TeamAggregateStats>();

  matches.forEach((match) => {
    match.teams.forEach((team) => {
      const key = team.name.trim().toLowerCase();
      const innings = match.innings.find((item) => item?.battingTeamId === team.id) as Innings | undefined;
      const stats =
        teamMap.get(key) || {
          name: team.name,
          matches: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          totalRuns: 0,
          totalWicketsLost: 0,
        };

      stats.matches += 1;
      stats.totalRuns += innings?.totalRuns || 0;
      stats.totalWicketsLost += innings?.wickets || 0;

      if (!match.result?.winnerTeamId) {
        stats.ties += 1;
      } else if (match.result.winnerTeamId === team.id) {
        stats.wins += 1;
      } else {
        stats.losses += 1;
      }

      teamMap.set(key, stats);
    });
  });

  return Array.from(teamMap.values()).sort((left, right) => right.wins - left.wins);
}

export function getPlayerOfTheMatch(match: MatchRecord): string | null {
  let bestPlayerId: string | null = null;
  let bestImpact = -1;

  match.teams.forEach((team: Team) => {
    team.players.forEach((player) => {
      const batting =
        match.innings[0].battingStats[player.id] || match.innings[1]?.battingStats[player.id];
      const bowling =
        match.innings[0].bowlingStats[player.id] || match.innings[1]?.bowlingStats[player.id];
      const impact =
        (batting?.runs || 0) +
        (batting?.fours || 0) * 2 +
        (batting?.sixes || 0) * 3 +
        (bowling?.wickets || 0) * 20 -
        (bowling?.runsConceded || 0) * 0.5;

      if (impact > bestImpact) {
        bestImpact = impact;
        bestPlayerId = player.id;
      }
    });
  });

  return bestPlayerId ? getPlayerById(match, bestPlayerId).name : null;
}

export function getBowlingOvers(legalBalls: number): string {
  return formatOversFromBalls(legalBalls);
}
