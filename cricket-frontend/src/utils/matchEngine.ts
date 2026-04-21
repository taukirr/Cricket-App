import type {
  BallEvent,
  BattingStats,
  BowlingStats,
  DeliveryInput,
  Innings,
  MatchHistorySnapshot,
  MatchRecord,
  MatchResult,
  MatchSetupInput,
  OverSummary,
  Partnership,
  Team,
  TeamPlayer,
  WicketType,
} from "../types/cricket";
import { createId } from "./id";

function cloneSnapshot(match: MatchRecord): MatchHistorySnapshot {
  return JSON.parse(JSON.stringify({ ...match, historyStack: [] })) as MatchHistorySnapshot;
}

function pushHistory(match: MatchRecord): MatchRecord {
  return {
    ...match,
    historyStack: [...match.historyStack, cloneSnapshot(match)],
  };
}

function createInitialBattingStats(team: Team): Record<string, BattingStats> {
  return Object.fromEntries(
    team.players.map((player) => [
      player.id,
      {
        playerId: player.id,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        status: "yet-to-bat",
        dismissalText: null,
      },
    ])
  );
}

function createInitialBowlingStats(team: Team): Record<string, BowlingStats> {
  return Object.fromEntries(
    team.players.map((player) => [
      player.id,
      {
        playerId: player.id,
        legalBalls: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
      },
    ])
  );
}

export function calculateMaxOversPerBowler(totalOvers: number, playerCount: number): number {
  return Math.max(1, Math.ceil(totalOvers / playerCount));
}

export function getTeamById(match: MatchRecord, teamId: string): Team {
  const team = match.teams.find((item) => item.id === teamId);

  if (!team) {
    throw new Error("Team not found");
  }

  return team;
}

export function getPlayerById(match: MatchRecord, playerId: string): TeamPlayer {
  for (const team of match.teams) {
    const player = team.players.find((item) => item.id === playerId);

    if (player) {
      return player;
    }
  }

  throw new Error("Player not found");
}

export function getCurrentInnings(match: MatchRecord): Innings {
  const innings = match.innings[match.currentInningsIndex];

  if (!innings) {
    throw new Error("Current innings is not available");
  }

  return innings;
}

function buildPartnership(strikerId: string | null, nonStrikerId: string | null): Partnership | null {
  if (!strikerId || !nonStrikerId) {
    return null;
  }

  return {
    batterIds: [strikerId, nonStrikerId],
    runs: 0,
    balls: 0,
  };
}

function createInnings(
  inningNumber: number,
  battingTeam: Team,
  bowlingTeam: Team,
  openingBatters: [string, string],
  openingBowlerId: string,
  target: number | null
): Innings {
  const battingStats = createInitialBattingStats(battingTeam);
  const bowlingStats = createInitialBowlingStats(bowlingTeam);
  const safeOpeningBatters: [string, string] = [
    openingBatters[0] || battingTeam.players[0]?.id || "",
    openingBatters[1] ||
      battingTeam.players.find((player) => player.id !== openingBatters[0])?.id ||
      battingTeam.players[1]?.id ||
      battingTeam.players[0]?.id ||
      "",
  ];
  const safeOpeningBowlerId = openingBowlerId || bowlingTeam.players[0]?.id || "";

  if (safeOpeningBatters[0] && battingStats[safeOpeningBatters[0]]) {
    battingStats[safeOpeningBatters[0]].status = "batting";
  }

  if (safeOpeningBatters[1] && battingStats[safeOpeningBatters[1]]) {
    battingStats[safeOpeningBatters[1]].status = "batting";
  }

  return {
    number: inningNumber,
    battingTeamId: battingTeam.id,
    bowlingTeamId: bowlingTeam.id,
    totalRuns: 0,
    wickets: 0,
    legalBalls: 0,
    strikerId: safeOpeningBatters[0],
    nonStrikerId: safeOpeningBatters[1],
    currentBowlerId: safeOpeningBowlerId,
    previousOverBowlerId: null,
    nextBowlerRequired: false,
    freeHitPending: false,
    target,
    completed: false,
    endReason: null,
    battingOrder: battingTeam.players.map((player) => player.id),
    benchPlayerIds: battingTeam.players
      .map((player) => player.id)
      .filter((playerId) => !safeOpeningBatters.includes(playerId)),
    outPlayerIds: [],
    battingStats,
    bowlingStats,
    ballEvents: [],
    commentary: [],
    fallOfWickets: [],
    currentPartnership: buildPartnership(safeOpeningBatters[0], safeOpeningBatters[1]),
    partnerships: [],
    currentOverRuns: 0,
    currentOverLegalBalls: 0,
    overSummaries: [],
  };
}

export function createMatchFromSetup(setup: MatchSetupInput): MatchRecord {
  const now = new Date().toISOString();
  const teamA: Team = {
    id: createId("team"),
    name: setup.teams[0].name.trim() || "Team A",
    captainId: setup.teams[0].captainId,
    players: setup.teams[0].players,
  };
  const teamB: Team = {
    id: createId("team"),
    name: setup.teams[1].name.trim() || "Team B",
    captainId: setup.teams[1].captainId,
    players: setup.teams[1].players,
  };

  const rawTeams: [Team, Team] = [teamA, teamB];
  const battingFirstTeamId = setup.battingFirstTeamKey === "team-2" ? teamB.id : teamA.id;
  const battingTeam = rawTeams.find((team) => team.id === battingFirstTeamId) || rawTeams[0];
  const bowlingTeam = rawTeams.find((team) => team.id !== battingTeam.id) || rawTeams[1];
  const openingBatters: [string, string] = [
    battingTeam.players[0]?.id || "",
    battingTeam.players.find((player) => player.id !== battingTeam.players[0]?.id)?.id ||
      battingTeam.players[1]?.id ||
      battingTeam.players[0]?.id ||
      "",
  ];
  const openingBowlerId = bowlingTeam.players[0]?.id || "";

  return {
    id: createId("match"),
    createdAt: now,
    updatedAt: now,
    status: "live",
    oversPerInnings: setup.oversPerInnings,
    teams: [teamA, teamB],
    innings: [
      createInnings(
        1,
        battingTeam,
        bowlingTeam,
        openingBatters,
        openingBowlerId,
        null
      ),
      null,
    ],
    currentInningsIndex: 0,
    historyStack: [],
    result: null,
    shareId: createId("share"),
    settings: setup.settings,
  };
}

function isLegalDelivery(input: DeliveryInput): boolean {
  if (input.eventType === "run" || input.eventType === "wicket") {
    return true;
  }

  return input.extraType === "bye" || input.extraType === "leg-bye";
}

function canWicketFallOnFreeHit(wicketType: WicketType | undefined): boolean {
  return wicketType === "run-out" || wicketType === "hit-wicket";
}

function createScoreLabel(runs: number, wickets: number): string {
  return `${runs}/${wickets}`;
}

function formatDismissal(playerName: string, wicketType: WicketType): string {
  return `${playerName} ${wicketType.replace("-", " ")}`;
}

function maybeSwapStrike(innings: Innings, totalRuns: number): void {
  if (totalRuns % 2 === 1) {
    const currentStriker = innings.strikerId;
    innings.strikerId = innings.nonStrikerId;
    innings.nonStrikerId = currentStriker;
  }
}

function getAutomaticNextBowlerId(match: MatchRecord, innings: Innings): string | null {
  const bowlingTeam = getTeamById(match, innings.bowlingTeamId);
  const maxOversPerBowler = calculateMaxOversPerBowler(
    match.oversPerInnings,
    bowlingTeam.players.length
  );

  const eligibleBowler = bowlingTeam.players.find((player) => {
    const bowlingStats = innings.bowlingStats[player.id];
    const oversBowled = bowlingStats.legalBalls / 6;

    if (innings.previousOverBowlerId && innings.previousOverBowlerId === player.id) {
      return false;
    }

    return oversBowled < maxOversPerBowler;
  });

  return eligibleBowler?.id || null;
}

function findNextBenchBatterId(innings: Innings, allowRetiredHurt: boolean): string | null {
  const availableBatter = innings.benchPlayerIds.find((playerId) => {
    if (!allowRetiredHurt && innings.battingStats[playerId]?.status === "retired-hurt") {
      return false;
    }

    return true;
  });

  return availableBatter || null;
}

function assignAutomaticNextBatter(
  innings: Innings,
  options: { allowRetiredHurt: boolean }
): string | null {
  const nextBatterId = findNextBenchBatterId(innings, options.allowRetiredHurt);

  if (!nextBatterId) {
    return null;
  }

  innings.benchPlayerIds = innings.benchPlayerIds.filter((playerId) => playerId !== nextBatterId);

  if (!innings.strikerId) {
    innings.strikerId = nextBatterId;
  } else if (!innings.nonStrikerId) {
    innings.nonStrikerId = nextBatterId;
  }

  innings.battingStats[nextBatterId].status = "batting";

  const lastWicket = innings.fallOfWickets[innings.fallOfWickets.length - 1];

  if (lastWicket && !lastWicket.incomingBatsmanId) {
    lastWicket.incomingBatsmanId = nextBatterId;
  }

  innings.currentPartnership = buildPartnership(innings.strikerId, innings.nonStrikerId);

  return nextBatterId;
}

function finalizeOver(innings: Innings): void {
  const currentBowlerId = innings.currentBowlerId;

  if (!currentBowlerId) {
    return;
  }

  const overSummary: OverSummary = {
    bowlerId: currentBowlerId,
    legalBalls: innings.currentOverLegalBalls,
    totalRuns: innings.currentOverRuns,
  };

  innings.overSummaries.push(overSummary);

  if (innings.currentOverLegalBalls === 6 && innings.currentOverRuns === 0) {
    innings.bowlingStats[currentBowlerId].maidens += 1;
  }

  const currentStriker = innings.strikerId;
  innings.strikerId = innings.nonStrikerId;
  innings.nonStrikerId = currentStriker;
  innings.previousOverBowlerId = currentBowlerId;
  innings.currentBowlerId = null;
  innings.nextBowlerRequired = true;
  innings.currentOverRuns = 0;
  innings.currentOverLegalBalls = 0;
}

function completeMatchIfNeeded(match: MatchRecord): MatchRecord {
  const firstInnings = match.innings[0];
  const secondInnings = match.innings[1];

  if (!firstInnings || !secondInnings || !secondInnings.completed) {
    return match;
  }

  let result: MatchResult;

  if (secondInnings.totalRuns > firstInnings.totalRuns) {
    const wicketsInHand =
      getTeamById(match, secondInnings.battingTeamId).players.length - 1 - secondInnings.wickets;

    result = {
      winnerTeamId: secondInnings.battingTeamId,
      summary: `${getTeamById(match, secondInnings.battingTeamId).name} won`,
      margin: `by ${wicketsInHand} wickets`,
    };
  } else if (secondInnings.totalRuns < firstInnings.totalRuns) {
    const margin = firstInnings.totalRuns - secondInnings.totalRuns;

    result = {
      winnerTeamId: firstInnings.battingTeamId,
      summary: `${getTeamById(match, firstInnings.battingTeamId).name} won`,
      margin: `by ${margin} runs`,
    };
  } else {
    result = {
      winnerTeamId: null,
      summary: "Match tied",
      margin: "Scores level",
    };
  }

  return {
    ...match,
    status: "completed",
    result,
    updatedAt: new Date().toISOString(),
  };
}

function completeInnings(match: MatchRecord, innings: Innings, reason: string): MatchRecord {
  innings.completed = true;
  innings.endReason = reason;
  innings.nextBowlerRequired = false;
  innings.currentBowlerId = null;

  if (innings.strikerId) {
    innings.battingStats[innings.strikerId].status = "not-out";
  }

  if (innings.nonStrikerId) {
    innings.battingStats[innings.nonStrikerId].status = "not-out";
  }

  if (innings.number === 1) {
    return {
      ...match,
      status: "innings-break",
      updatedAt: new Date().toISOString(),
    };
  }

  return completeMatchIfNeeded({
    ...match,
    updatedAt: new Date().toISOString(),
  });
}

function maybeCompleteInnings(match: MatchRecord): MatchRecord {
  const innings = getCurrentInnings(match);
  const battingTeam = getTeamById(match, innings.battingTeamId);
  const wicketsLimit = Math.max(0, battingTeam.players.length - 1);

  if (innings.target && innings.totalRuns >= innings.target) {
    return completeInnings(match, innings, "Target chased");
  }

  if (innings.wickets >= wicketsLimit) {
    return completeInnings(match, innings, "All out");
  }

  if (innings.legalBalls >= match.oversPerInnings * 6) {
    return completeInnings(match, innings, "Overs exhausted");
  }

  return match;
}

function registerBallEvent(innings: Innings, event: BallEvent): void {
  innings.ballEvents.push(event);
  innings.commentary.unshift(event.commentary);
}

function createBallDisplay(input: DeliveryInput, battingRuns: number, extraRuns: number): string {
  if (input.eventType === "wicket") {
    return "W";
  }

  if (input.eventType === "extra") {
    if (input.extraType === "wide") {
      return input.runs > 0 ? `Wd+${input.runs}` : "Wd";
    }

    if (input.extraType === "no-ball") {
      return battingRuns > 0 ? `Nb+${battingRuns}` : "Nb";
    }

    if (input.extraType === "bye") {
      return extraRuns > 0 ? `B${extraRuns}` : "B";
    }

    if (input.extraType === "leg-bye") {
      return extraRuns > 0 ? `Lb${extraRuns}` : "Lb";
    }
  }

  return `${battingRuns}`;
}

function createCommentary(
  input: DeliveryInput,
  overNumber: number,
  ballNumber: number,
  strikerName: string,
  bowlerName: string,
  totalRuns: number,
  dismissedPlayerName: string | null
): string {
  const ballLabel = `${overNumber}.${ballNumber}`;

  if (input.eventType === "wicket" && input.wicketType && dismissedPlayerName) {
    return `${ballLabel} ${bowlerName} to ${dismissedPlayerName}, wicket (${input.wicketType})`;
  }

  if (input.eventType === "extra") {
    if (input.extraType === "wide") {
      return `${ballLabel} ${bowlerName} bowls a wide, ${totalRuns} run${totalRuns === 1 ? "" : "s"}`;
    }

    if (input.extraType === "no-ball") {
      return `${ballLabel} ${bowlerName} bowls a no-ball, ${totalRuns} run${totalRuns === 1 ? "" : "s"}`;
    }

    const extraLabel = input.extraType === "leg-bye" ? "leg byes" : "byes";
    return `${ballLabel} ${strikerName} collects ${totalRuns} ${extraLabel}`;
  }

  return `${ballLabel} ${strikerName} scores ${totalRuns}`;
}

export function applyDelivery(match: MatchRecord, input: DeliveryInput): MatchRecord {
  let nextMatch = pushHistory(match);
  const innings = getCurrentInnings(nextMatch);

  if (innings.completed) {
    return nextMatch;
  }

  if (!innings.strikerId || !innings.nonStrikerId || !innings.currentBowlerId) {
    throw new Error("Current innings is missing active players");
  }

  if (innings.freeHitPending && input.eventType === "wicket" && !canWicketFallOnFreeHit(input.wicketType)) {
    throw new Error("Only run out or hit wicket is allowed on a free hit");
  }

  const striker = getPlayerById(nextMatch, innings.strikerId);
  const bowler = getPlayerById(nextMatch, innings.currentBowlerId);
  const originalStrikerId = innings.strikerId;
  const originalNonStrikerId = innings.nonStrikerId;
  const originalBowlerId = innings.currentBowlerId;
  const legalDelivery = isLegalDelivery(input);
  const battingStats = innings.battingStats[innings.strikerId];
  const bowlingStats = innings.bowlingStats[innings.currentBowlerId];
  const overNumber = Math.floor(innings.legalBalls / 6) + 1;
  const ballNumber = innings.currentOverLegalBalls + 1;
  let battingRuns = 0;
  let extraRuns = 0;
  let totalRuns = 0;
  let strikeRotationRuns = 0;

  if (input.eventType === "run") {
    battingRuns = input.runs;
    totalRuns = input.runs;
    strikeRotationRuns = input.runs;
  }

  if (input.eventType === "extra") {
    if (input.extraType === "wide") {
      extraRuns = input.runs + 1;
      totalRuns = extraRuns;
      strikeRotationRuns = input.runs;
    } else if (input.extraType === "no-ball") {
      battingRuns = input.runs;
      extraRuns = 1;
      totalRuns = battingRuns + extraRuns;
      strikeRotationRuns = battingRuns;
    } else {
      extraRuns = input.runs;
      totalRuns = input.runs;
      strikeRotationRuns = input.runs;
    }
  }

  innings.totalRuns += totalRuns;
  innings.currentOverRuns += totalRuns;

  if (legalDelivery) {
    innings.legalBalls += 1;
    innings.currentOverLegalBalls += 1;
    battingStats.balls += 1;
    bowlingStats.legalBalls += 1;

    if (innings.currentPartnership) {
      innings.currentPartnership.balls += 1;
    }
  }

  if (input.extraType !== "bye" && input.extraType !== "leg-bye") {
    bowlingStats.runsConceded += totalRuns;
  }

  battingStats.runs += battingRuns;

  if (battingRuns === 4) {
    battingStats.fours += 1;
  }

  if (battingRuns === 6) {
    battingStats.sixes += 1;
  }

  if (innings.currentPartnership) {
    innings.currentPartnership.runs += totalRuns;
  }

  let dismissedPlayerId: string | null = null;
  let wicketType: WicketType | null = null;

  if (input.eventType === "wicket" && input.wicketType) {
    dismissedPlayerId = input.dismissedPlayerId || innings.strikerId;
    wicketType = input.wicketType;
    const dismissedPlayer = getPlayerById(nextMatch, dismissedPlayerId);
    const dismissedStats = innings.battingStats[dismissedPlayerId];

    innings.wickets += 1;
    dismissedStats.status = "out";
    dismissedStats.dismissalText = formatDismissal(dismissedPlayer.name, input.wicketType);
    innings.outPlayerIds.push(dismissedPlayerId);

    if (input.wicketType !== "run-out" && input.wicketType !== "obstructing-field") {
      bowlingStats.wickets += 1;
    }

    innings.fallOfWickets.push({
      wicketNumber: innings.wickets,
      score: createScoreLabel(innings.totalRuns, innings.wickets),
      batsmanId: dismissedPlayerId,
      incomingBatsmanId: null,
      overLabel: `${overNumber}.${legalDelivery ? innings.currentOverLegalBalls : ballNumber}`,
    });

    if (innings.currentPartnership) {
      innings.partnerships.push(innings.currentPartnership);
      innings.currentPartnership = null;
    }

    if (innings.strikerId === dismissedPlayerId) {
      innings.strikerId = null;
    } else if (innings.nonStrikerId === dismissedPlayerId) {
      innings.nonStrikerId = null;
    }
  } else {
    maybeSwapStrike(innings, strikeRotationRuns);
  }

  const dismissedPlayerName = dismissedPlayerId
    ? getPlayerById(nextMatch, dismissedPlayerId).name
    : null;
  const commentary = createCommentary(
    input,
    overNumber,
    ballNumber,
    striker.name,
    bowler.name,
    totalRuns,
    dismissedPlayerName
  );

  registerBallEvent(innings, {
    id: createId("ball"),
    inningsNumber: innings.number,
    overNumber,
    ballInOver: ballNumber,
    displayBall: createBallDisplay(input, battingRuns, extraRuns),
    eventType: input.eventType,
    batsmanId: originalStrikerId,
    nonStrikerId: originalNonStrikerId,
    bowlerId: originalBowlerId,
    battingRuns,
    extraType: input.extraType || null,
    extraRuns,
    totalRuns,
    isLegalDelivery: legalDelivery,
    freeHit: innings.freeHitPending,
    wicketType,
    dismissedPlayerId,
    commentary,
    scoreAfterBall: createScoreLabel(innings.totalRuns, innings.wickets),
    timestamp: new Date().toISOString(),
  });

  innings.freeHitPending = input.extraType === "no-ball";

  if (innings.currentOverLegalBalls === 6) {
    finalizeOver(innings);
  }

  nextMatch = maybeCompleteInnings(nextMatch);

  if (getCurrentInnings(nextMatch).completed) {
    return nextMatch;
  }

  if (dismissedPlayerId) {
    assignAutomaticNextBatter(innings, { allowRetiredHurt: true });
  }

  if (innings.nextBowlerRequired) {
    const automaticNextBowlerId = getAutomaticNextBowlerId(nextMatch, innings);

    innings.currentBowlerId = automaticNextBowlerId;
    innings.nextBowlerRequired = false;
  }

  nextMatch.updatedAt = new Date().toISOString();

  return nextMatch;
}

export function retireBatter(match: MatchRecord, playerId: string): MatchRecord {
  const nextMatch = pushHistory(match);
  const innings = getCurrentInnings(nextMatch);

  if (innings.strikerId !== playerId && innings.nonStrikerId !== playerId) {
    throw new Error("That player is not batting right now");
  }

  if (!findNextBenchBatterId(innings, false)) {
    throw new Error("No replacement batter is available for retired hurt");
  }

  innings.battingStats[playerId].status = "retired-hurt";
  innings.benchPlayerIds = [...innings.benchPlayerIds, playerId];

  if (innings.currentPartnership) {
    innings.partnerships.push(innings.currentPartnership);
    innings.currentPartnership = null;
  }

  if (innings.strikerId === playerId) {
    innings.strikerId = null;
  } else {
    innings.nonStrikerId = null;
  }

  assignAutomaticNextBatter(innings, { allowRetiredHurt: false });
  nextMatch.updatedAt = new Date().toISOString();

  return nextMatch;
}

export function startSecondInnings(match: MatchRecord): MatchRecord {
  if (match.status !== "innings-break") {
    throw new Error("Second innings can only start during the innings break");
  }

  const battingTeam = getTeamById(match, match.innings[0].bowlingTeamId);
  const bowlingTeam = getTeamById(match, match.innings[0].battingTeamId);
  const openingBatters: [string, string] = [
    battingTeam.players[0]?.id || "",
    battingTeam.players.find((player) => player.id !== battingTeam.players[0]?.id)?.id ||
      battingTeam.players[1]?.id ||
      battingTeam.players[0]?.id ||
      "",
  ];
  const openingBowlerId = bowlingTeam.players[0]?.id || "";
  const secondInnings = createInnings(
    2,
    battingTeam,
    bowlingTeam,
    openingBatters,
    openingBowlerId,
    match.innings[0].totalRuns + 1
  );

  return {
    ...pushHistory(match),
    innings: [match.innings[0], secondInnings],
    currentInningsIndex: 1,
    status: "live",
    updatedAt: new Date().toISOString(),
  };
}

export function undoMatchAction(match: MatchRecord): MatchRecord {
  const previousSnapshot = match.historyStack[match.historyStack.length - 1];

  if (!previousSnapshot) {
    return match;
  }

  return {
    ...previousSnapshot,
    historyStack: match.historyStack.slice(0, -1),
  };
}
