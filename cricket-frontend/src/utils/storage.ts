import type { AppStorageState } from "../types/cricket";
import { DEFAULT_MATCH_SETTINGS } from "../constants/cricket";

const STORAGE_KEY = "cricket-app-storage";

export function createInitialStorageState(): AppStorageState {
  return {
    session: null,
    theme: "dark",
    activeMatch: null,
    localMatches: [],
    settings: DEFAULT_MATCH_SETTINGS,
  };
}

export function loadStorageState(): AppStorageState {
  if (typeof window === "undefined") {
    return createInitialStorageState();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return createInitialStorageState();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AppStorageState>;

    return {
      ...createInitialStorageState(),
      ...parsed,
      session: null,
      settings: {
        ...DEFAULT_MATCH_SETTINGS,
        ...parsed.settings,
      },
    };
  } catch {
    return createInitialStorageState();
  }
}

export function saveStorageState(state: AppStorageState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
