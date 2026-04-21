import type { MatchConfig } from "../types/match";

type Props = {
  matchConfig: MatchConfig | null;
};

export default function MatchHeader({ matchConfig }: Props) {
  return (
    <div className="mb-8 text-slate-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">
            Gully Cricket Scorer
          </p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Live match tracker</h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Set team names, choose overs, select who is batting, then score every ball with runs,
            extras, wickets, and undo support.
          </p>
        </div>

        {matchConfig ? (
          <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5 text-sm text-slate-200">
            <p className="font-semibold text-white">Match ready</p>
            <p>{matchConfig.team1} vs {matchConfig.team2}</p>
            <p>Overs: {matchConfig.totalOvers}</p>
            <p>Batting: {matchConfig.battingTeam === "team1" ? matchConfig.team1 : matchConfig.team2}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
