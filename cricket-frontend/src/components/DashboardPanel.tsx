import type {
  MatchRecord,
  PlayerCareerStats,
  TeamAggregateStats,
  UserSession,
} from "../types/cricket";
import { formatDate } from "../utils/format";
import { getMatchHistorySummary, getPlayerOfTheMatch } from "../utils/stats";

type DashboardPanelProps = {
  session: UserSession | null;
  activeMatch: MatchRecord | null;
  matches: MatchRecord[];
  playerStats: PlayerCareerStats[];
  teamStats: TeamAggregateStats[];
  onNewMatch: () => void;
  onResumeMatch: () => void;
  onPlayAgain: (match: MatchRecord) => void;
  onExportJson: (match: MatchRecord) => void;
  onCopyShareLink: (match: MatchRecord) => void;
};

export default function DashboardPanel({
  session,
  activeMatch,
  matches,
  playerStats,
  teamStats,
  onNewMatch,
  onResumeMatch,
  onPlayAgain,
  onExportJson,
  onCopyShareLink,
}: DashboardPanelProps) {
  const topPlayers = playerStats.slice(0, 4);
  const topTeams = teamStats.slice(0, 4);

  return (
    <section className="grid gap-4 sm:gap-5">
      <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {session ? `Hello, ${session.user.name}` : "Local scoring mode"}
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
            Start a new match fast, resume unfinished scoring, or open saved scorecards.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-xl">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Saved</p>
              <p className="mt-1 text-xl font-semibold text-white">{matches.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Players</p>
              <p className="mt-1 text-xl font-semibold text-white">{playerStats.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Teams</p>
              <p className="mt-1 text-xl font-semibold text-white">{teamStats.length}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 self-start">
          <button
            type="button"
            onClick={onNewMatch}
            className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
          >
            Create Match
          </button>

          {activeMatch ? (
            <button
              type="button"
              onClick={onResumeMatch}
              className="rounded-2xl border border-white/15 bg-slate-900/80 px-5 py-3 text-white"
            >
              Resume Active Match
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Match History</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Recent matches</h3>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">
              {matches.length} saved
            </span>
          </div>

          <div className="mt-5 grid gap-4">
            {matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-slate-400">
                No saved matches yet.
              </div>
            ) : (
              matches.map((match) => (
                <article
                  key={match.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {match.result?.summary || "Match in progress"}
                      </h4>
                      <p className="mt-1 text-sm text-slate-400">{getMatchHistorySummary(match)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(match.updatedAt)}</p>
                    </div>

                    <div className="text-right text-sm text-slate-300">
                      <p>{match.result?.margin || match.status}</p>
                      <p className="text-slate-500">
                        Player of match: {getPlayerOfTheMatch(match) || "TBD"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onPlayAgain(match)}
                      className="rounded-full border border-cyan-400/30 px-3 py-2 text-sm text-cyan-100"
                    >
                      Play Again
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportJson(match)}
                      className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200"
                    >
                      Export JSON
                    </button>
                    {match.shareId ? (
                      <button
                        type="button"
                        onClick={() => onCopyShareLink(match)}
                        className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200"
                      >
                        Copy Share Link
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Player Career</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Top performers</h3>

            <div className="mt-4 grid gap-3">
              {topPlayers.length === 0 ? (
                <p className="text-sm text-slate-400">Player stats will appear after completed matches.</p>
              ) : (
                topPlayers.map((player) => (
                  <div key={player.name} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{player.name}</p>
                        <p className="text-sm text-slate-400">{player.role}</p>
                      </div>
                      <div className="text-right text-sm text-slate-300">
                        <p>{player.runs} runs</p>
                        <p>{player.wickets} wickets</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Team Stats</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Leaderboard</h3>

            <div className="mt-4 grid gap-3">
              {topTeams.length === 0 ? (
                <p className="text-sm text-slate-400">Team stats will appear after completed matches.</p>
              ) : (
                topTeams.map((team) => (
                  <div key={team.name} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{team.name}</p>
                        <p className="text-sm text-slate-400">{team.matches} matches</p>
                      </div>
                      <div className="text-right text-sm text-slate-300">
                        <p>{team.wins} wins</p>
                        <p>{team.totalRuns} runs</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
