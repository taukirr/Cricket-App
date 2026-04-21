import { useEffect, useMemo, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import DashboardPanel from "./components/DashboardPanel";
import MatchLivePanel from "./components/MatchLivePanel";
import MatchSetupPanel from "./components/MatchSetupPanel";
import SharedMatchView from "./components/SharedMatchView";
import {
  fetchMatches,
  fetchSharedMatch,
  getCurrentSession,
  loginUser,
  logoutUser,
  registerUser,
  saveMatch,
  subscribeToAuthChanges,
} from "./services/api";
import type { MatchRecord, MatchSetupInput, ThemeMode, UserSession } from "./types/cricket";
import { createMatchFromSetup } from "./utils/matchEngine";
import { buildLocalPlayerStats, buildLocalTeamStats } from "./utils/stats";
import {
  createInitialStorageState,
  loadStorageState,
  saveStorageState,
} from "./utils/storage";

type AppMode = "dashboard" | "setup" | "live";

function mergeMatches(localMatches: MatchRecord[], remoteMatches: MatchRecord[]) {
  const matchMap = new Map<string, MatchRecord>();

  [...remoteMatches, ...localMatches].forEach((match) => {
    const existingMatch = matchMap.get(match.id);

    if (!existingMatch || new Date(match.updatedAt) > new Date(existingMatch.updatedAt)) {
      matchMap.set(match.id, match);
    }
  });

  return Array.from(matchMap.values()).sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function upsertMatch(matches: MatchRecord[], nextMatch: MatchRecord) {
  const filteredMatches = matches.filter((match) => match.id !== nextMatch.id);

  return [nextMatch, ...filteredMatches].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function getThemeClasses(theme: ThemeMode) {
  if (theme === "light") {
    return "min-h-screen bg-[radial-gradient(circle_at_top_left,_#ecfeff,_#ffffff_35%,_#dbeafe_100%)] text-slate-950";
  }

  return "min-h-screen bg-[radial-gradient(circle_at_top_left,_#164e63,_#020617_35%,_#020617_100%)] text-white";
}

export default function App() {
  const [storageState, setStorageState] = useState(loadStorageState);
  const [mode, setMode] = useState<AppMode>(storageState.activeMatch ? "live" : "dashboard");
  const [setupSeed, setSetupSeed] = useState<MatchRecord | null>(null);
  const [remoteMatches, setRemoteMatches] = useState<MatchRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [sharedMatch, setSharedMatch] = useState<MatchRecord | null>(null);
  const [sharedError, setSharedError] = useState("");

  useEffect(() => {
    saveStorageState(storageState);
  }, [storageState]);

  useEffect(() => {
    let isMounted = true;

    getCurrentSession()
      .then((session) => {
        if (!isMounted) {
          return;
        }

        setStorageState((currentState) => ({
          ...currentState,
          session,
        }));
      })
      .catch((error) => {
        setStatusMessage(error instanceof Error ? error.message : "Unable to read session");
      });

    const subscription = subscribeToAuthChanges((session) => {
      setStorageState((currentState) => ({
        ...currentState,
        session,
      }));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sharedMatchId = searchParams.get("shared");

    if (!sharedMatchId) {
      return;
    }

    fetchSharedMatch(sharedMatchId)
      .then((match) => setSharedMatch(match))
      .catch((error) => {
        setSharedError(error instanceof Error ? error.message : "Unable to open shared match");
      });
  }, []);

  async function refreshRemoteData() {
    const matches = await fetchMatches();
    setRemoteMatches(matches);
  }

  async function syncLocalMatches(session: UserSession) {
    for (const match of storageState.localMatches) {
      await saveMatch(match);
    }

    if (session) {
      await refreshRemoteData();
    }
  }

  async function handleAuthenticationSuccess(session: UserSession) {
    setStorageState((currentState) => ({
      ...currentState,
      session,
    }));

    await syncLocalMatches(session);
    setStatusMessage("Authenticated and synced with Supabase");
  }

  async function handleLogin(email: string, password: string) {
    const session = await loginUser(email, password);
    await handleAuthenticationSuccess(session);
  }

  async function handleRegister(name: string, email: string, password: string) {
    const session = await registerUser(name, email, password);

    if (session) {
      await handleAuthenticationSuccess(session);
      return;
    }

    setStatusMessage("Account created. Confirm the email in Supabase, then log in.");
  }

  useEffect(() => {
    if (!storageState.session) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      refreshRemoteData().catch((error) => {
        setStatusMessage(error instanceof Error ? error.message : "Unable to load dashboard data");
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [storageState.session]);

  const combinedMatches = useMemo(
    () => mergeMatches(storageState.localMatches, storageState.session ? remoteMatches : []),
    [remoteMatches, storageState.localMatches, storageState.session]
  );
  const visiblePlayerStats = buildLocalPlayerStats(combinedMatches);
  const visibleTeamStats = buildLocalTeamStats(combinedMatches);

  async function persistMatch(nextMatch: MatchRecord) {
    setStorageState((currentState) => ({
      ...currentState,
      activeMatch: nextMatch,
    }));

    if (nextMatch.status !== "completed") {
      return;
    }

    setStorageState((currentState) => ({
      ...currentState,
      activeMatch: nextMatch,
      localMatches: upsertMatch(currentState.localMatches, nextMatch),
    }));

    if (!storageState.session) {
      setStatusMessage("Match saved locally");
      return;
    }

    try {
      const savedMatch = await saveMatch(nextMatch);

      setStorageState((currentState) => ({
        ...currentState,
        activeMatch: savedMatch,
        localMatches: upsertMatch(currentState.localMatches, savedMatch),
      }));

      await refreshRemoteData();
      setStatusMessage("Match saved and synced");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to sync match");
    }
  }

  function handleCreateMatch(setup: MatchSetupInput) {
    const nextMatch = createMatchFromSetup(setup);

    setStorageState((currentState) => ({
      ...currentState,
      activeMatch: nextMatch,
      settings: nextMatch.settings,
    }));
    setMode("live");
  }

  function handleMatchChange(nextMatch: MatchRecord) {
    void persistMatch(nextMatch);
  }

  function handleCopyShareLink(match: MatchRecord) {
    if (!match.shareId) {
      setStatusMessage("Share link becomes available after the match is saved.");
      return;
    }

    const shareUrl = `${window.location.origin}?shared=${match.shareId}`;
    void navigator.clipboard.writeText(shareUrl);
    setStatusMessage("Share link copied");
  }

  function handleExportJson(match: MatchRecord) {
    const blob = new Blob([JSON.stringify(match, null, 2)], {
      type: "application/json",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${match.id}.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  function handlePlayAgain(match: MatchRecord) {
    setSetupSeed(match);
    setMode("setup");
  }

  function handleResumeMatch() {
    if (storageState.activeMatch) {
      setMode("live");
    }
  }

  async function handleLogout() {
    await logoutUser();
    setStorageState((currentState) => ({
      ...currentState,
      session: null,
    }));
    setRemoteMatches([]);
    setStatusMessage("Logged out");
  }

  function handleCloseSharedMatch() {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("shared");
    const nextUrl = searchParams.toString()
      ? `${window.location.pathname}?${searchParams.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, "", nextUrl);
    setSharedMatch(null);
    setSharedError("");
  }

  return (
    <div className={getThemeClasses(storageState.theme)}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-3 py-4 sm:px-4 lg:px-6">
        <header className="mb-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Simple mobile scorer</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Cricket Score Counter</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Live scoring, player roles, match history, and Supabase sync in a simpler layout
                that is easier to use on phones.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setStorageState((currentState) => ({
                    ...currentState,
                    theme: currentState.theme === "dark" ? "light" : "dark",
                  }))
                }
                className="rounded-full border border-white/10 px-4 py-2 text-sm"
              >
                {storageState.theme === "dark" ? "Light theme" : "Dark theme"}
              </button>

              {storageState.session ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>

          {statusMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {statusMessage}
            </div>
          ) : null}
        </header>

        {sharedMatch ? (
          <SharedMatchView match={sharedMatch} onClose={handleCloseSharedMatch} />
        ) : sharedError ? (
          <div className="rounded-[1.75rem] border border-red-500/20 bg-red-500/10 p-5 text-red-100">
            {sharedError}
          </div>
        ) : (
          <div className="grid gap-4">
            {!storageState.session && mode === "dashboard" ? (
              <AuthPanel onLogin={handleLogin} onRegister={handleRegister} />
            ) : null}

            {mode === "dashboard" ? (
              <DashboardPanel
                session={storageState.session}
                activeMatch={storageState.activeMatch}
                matches={combinedMatches}
                playerStats={visiblePlayerStats}
                teamStats={visibleTeamStats}
                onNewMatch={() => {
                  setSetupSeed(null);
                  setMode("setup");
                }}
                onResumeMatch={handleResumeMatch}
                onPlayAgain={handlePlayAgain}
                onExportJson={handleExportJson}
                onCopyShareLink={handleCopyShareLink}
              />
            ) : null}

            {mode === "setup" ? (
              <MatchSetupPanel
                key={setupSeed?.id || "new-match"}
                initialMatch={setupSeed}
                defaultSettings={storageState.settings || createInitialStorageState().settings}
                onStart={handleCreateMatch}
                onCancel={() => setMode("dashboard")}
              />
            ) : null}

            {mode === "live" && storageState.activeMatch ? (
              <MatchLivePanel
                match={storageState.activeMatch}
                onChange={handleMatchChange}
                onBack={() => setMode("dashboard")}
                onPlayAgain={handlePlayAgain}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
