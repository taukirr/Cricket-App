export type BallType = "run" | "wicket" | "wide" | "no-ball";

export type BallEvent = {
  type: BallType;
  runs: number;
};

export type MatchSnapshot = {
  score: number;
  wickets: number;
  balls: number;
  overs: number;
  ballHistory: BallEvent[];
};

export type MatchConfig = {
  team1: string;
  team2: string;
  totalOvers: number;
  battingTeam: "team1" | "team2";
};