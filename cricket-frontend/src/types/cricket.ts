export type ThemeMode = "dark" | "light";

export type PlayerRole = "batsman" | "bowler" | "all-rounder" | "wicketkeeper";

export type ExtraType = "wide" | "no-ball" | "bye" | "leg-bye";

export type WicketType =
  | "bowled"
  | "caught"
  | "lbw"
  | "run-out"
  | "stumped"
  | "hit-wicket"
  | "obstructing-field";

export type MatchStatus = "live" | "innings-break" | "completed";

export type MatchEventType = "run" | "extra" | "wicket";

export type TeamPlayer = {
  id: string;
  name: string;
  role: PlayerRole;
  battingStyle: string;
  bowlingStyle: string;
};

export type Team = {
  id: string;
  name: string;
  captainId: string;
  players: TeamPlayer[];
};

export type BattingStats = {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  status: "yet-to-bat" | "batting" | "out" | "retired-hurt" | "not-out";
  dismissalText: string | null;
};

export type BowlingStats = {
  playerId: string;
  legalBalls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
};

export type BallEvent = {
  id: string;
  inningsNumber: number;
  overNumber: number;
  ballInOver: number;
  displayBall: string;
  eventType: MatchEventType;
  batsmanId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  battingRuns: number;
  extraType: ExtraType | null;
  extraRuns: number;
  totalRuns: number;
  isLegalDelivery: boolean;
  freeHit: boolean;
  wicketType: WicketType | null;
  dismissedPlayerId: string | null;
  commentary: string;
  scoreAfterBall: string;
  timestamp: string;
};

export type FallOfWicket = {
  wicketNumber: number;
  score: string;
  batsmanId: string;
  incomingBatsmanId: string | null;
  overLabel: string;
};

export type Partnership = {
  batterIds: [string, string];
  runs: number;
  balls: number;
};

export type OverSummary = {
  bowlerId: string;
  legalBalls: number;
  totalRuns: number;
};

export type Innings = {
  number: number;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  strikerId: string | null;
  nonStrikerId: string | null;
  currentBowlerId: string | null;
  previousOverBowlerId: string | null;
  nextBowlerRequired: boolean;
  freeHitPending: boolean;
  target: number | null;
  completed: boolean;
  endReason: string | null;
  battingOrder: string[];
  benchPlayerIds: string[];
  outPlayerIds: string[];
  battingStats: Record<string, BattingStats>;
  bowlingStats: Record<string, BowlingStats>;
  ballEvents: BallEvent[];
  commentary: string[];
  fallOfWickets: FallOfWicket[];
  currentPartnership: Partnership | null;
  partnerships: Partnership[];
  currentOverRuns: number;
  currentOverLegalBalls: number;
  overSummaries: OverSummary[];
};

export type MatchResult = {
  winnerTeamId: string | null;
  summary: string;
  margin: string;
};

export type MatchSettings = {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  winProbabilityEnabled: boolean;
};

export type MatchRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: MatchStatus;
  oversPerInnings: number;
  teams: [Team, Team];
  innings: [Innings, Innings | null];
  currentInningsIndex: number;
  historyStack: MatchHistorySnapshot[];
  result: MatchResult | null;
  shareId: string | null;
  settings: MatchSettings;
};

export type MatchHistorySnapshot = Omit<MatchRecord, "historyStack">;

export type UserSession = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt?: string;
  };
};

export type PlayerCareerStats = {
  name: string;
  role: PlayerRole;
  teamName: string;
  matches: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  ballsBowled: number;
  runsConceded: number;
  maidens: number;
  strikeRate: number;
  economy: number;
};

export type TeamAggregateStats = {
  name: string;
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  totalRuns: number;
  totalWicketsLost: number;
};

export type MatchSetupTeamInput = {
  name: string;
  players: TeamPlayer[];
  captainId: string;
};

export type MatchSetupInput = {
  oversPerInnings: number;
  teams: [MatchSetupTeamInput, MatchSetupTeamInput];
  battingFirstTeamKey: "team-1" | "team-2";
  settings: MatchSettings;
};

export type DeliveryInput = {
  eventType: MatchEventType;
  runs: number;
  extraType?: ExtraType;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
};

export type AppStorageState = {
  session: UserSession | null;
  theme: ThemeMode;
  activeMatch: MatchRecord | null;
  localMatches: MatchRecord[];
  settings: MatchSettings;
};
