import type { MatchRecord } from "../types/cricket";
import { formatDate, formatOversFromBalls } from "../utils/format";
import { getPlayerOfTheMatch } from "../utils/stats";
import { getTeamById } from "../utils/matchEngine";

type SharedMatchViewProps = {
  match: MatchRecord;
  onClose: () => void;
};

export default function SharedMatchView({ match, onClose }: SharedMatchViewProps) {
  return (
    <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Shared Scorecard</p>
          <h1 className="mt-2 text-3xl font-semibold">{match.result?.summary || "Live scorecard"}</h1>
          <p className="mt-2 text-slate-400">{formatDate(match.updatedAt)}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
        >
          Return
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {match.innings.filter(Boolean).map((innings) => (
          <article key={innings!.number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Innings {innings!.number}</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {getTeamById(match, innings!.battingTeamId).name}
            </h2>
            <p className="mt-2 text-slate-300">
              {innings!.totalRuns}/{innings!.wickets} in {formatOversFromBalls(innings!.legalBalls)} overs
            </p>
            <p className="mt-2 text-sm text-slate-400">{innings!.endReason || "In progress"}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Player of the match</p>
        <p className="mt-2 text-xl font-semibold">{getPlayerOfTheMatch(match) || "TBD"}</p>
      </div>
    </section>
  );
}
