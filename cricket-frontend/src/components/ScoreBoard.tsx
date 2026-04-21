type Props = {
  score: number;
  wickets: number;
  overs: number;
  balls: number;
  team1: string;
  team2: string;
  battingTeam: "team1" | "team2";
  totalOvers: number;
};

export default function ScoreBoard({
  score,
  wickets,
  overs,
  balls,
  team1,
  team2,
  battingTeam,
  totalOvers,
}: Props) {
  return (
    <div className="bg-slate-800 p-6 rounded-3xl shadow-xl mb-6 border border-slate-700">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
            {team1} vs {team2}
          </p>
          <h2 className="mt-3 text-4xl font-bold">
            {score}/{wickets}
          </h2>
          <p className="text-slate-400 mt-2">
            Batting: {battingTeam === "team1" ? team1 : team2}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-900 p-5 text-right">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Overs</p>
          <p className="mt-2 text-3xl font-semibold text-white">{overs}.{balls}</p>
          <p className="text-slate-400">of {totalOvers}</p>
        </div>
      </div>
    </div>
  );
}