import type { MatchSettings, PlayerRole, WicketType } from "../types/cricket";

export const PLAYER_ROLES: PlayerRole[] = [
  "batsman",
  "bowler",
  "all-rounder",
  "wicketkeeper",
];

export const WICKET_TYPES: WicketType[] = [
  "bowled",
  "caught",
  "lbw",
  "run-out",
  "stumped",
  "hit-wicket",
  "obstructing-field",
];

export const RUN_OPTIONS = [0, 1, 2, 3, 4, 6];

export const EXTRA_RUN_OPTIONS = [0, 1, 2, 3, 4];

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  winProbabilityEnabled: true,
};
