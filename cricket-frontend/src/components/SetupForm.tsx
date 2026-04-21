type SetupFormProps = {
  step: number;
  team1: string;
  team2: string;
  overs: number;
  battingTeam: "team1" | "team2";
  onChangeTeam1: (value: string) => void;
  onChangeTeam2: (value: string) => void;
  onChangeOvers: (value: number) => void;
  onChangeBatting: (value: "team1" | "team2") => void;
  onNext: () => void;
  onBack: () => void;
  onStart: () => void;
};

const steps = ["Teams", "Overs", "Batting"]; 

export default function SetupForm({
  step,
  team1,
  team2,
  overs,
  battingTeam,
  onChangeTeam1,
  onChangeTeam2,
  onChangeOvers,
  onChangeBatting,
  onNext,
  onBack,
  onStart,
}: SetupFormProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-3xl shadow-xl max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          {steps.map((label, index) => (
            <div key={label} className="text-center flex-1">
              <div
                className={`mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  step === index + 1
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {index + 1}
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Team 1 Name</label>
            <input
              value={team1}
              onChange={(event) => onChangeTeam1(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              placeholder="Enter Team 1 name"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Team 2 Name</label>
            <input
              value={team2}
              onChange={(event) => onChangeTeam2(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
              placeholder="Enter Team 2 name"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Overs</label>
            <input
              type="number"
              min={1}
              max={50}
              value={overs}
              onChange={(event) => onChangeOvers(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-sm text-slate-400 mt-2">
              Set how many overs this innings should last.
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400 mb-2">Select batting team</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onChangeBatting("team1")}
                className={`rounded-3xl border px-5 py-4 text-left transition ${
                  battingTeam === "team1"
                    ? "border-cyan-500 bg-cyan-500/10 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-300"
                }`}
              >
                <p className="font-semibold">{team1}</p>
                <p className="text-sm text-slate-400">Batting</p>
              </button>

              <button
                type="button"
                onClick={() => onChangeBatting("team2")}
                className={`rounded-3xl border px-5 py-4 text-left transition ${
                  battingTeam === "team2"
                    ? "border-cyan-500 bg-cyan-500/10 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-300"
                }`}
              >
                <p className="font-semibold">{team2}</p>
                <p className="text-sm text-slate-400">Batting</p>
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-950/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-3">Match preview</h3>
            <p className="text-slate-400">{team1} vs {team2}</p>
            <p className="text-slate-400">Overs: {overs}</p>
            <p className="text-slate-400">
              Batting: {battingTeam === "team1" ? team1 : team2}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-white text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={step === 1}
        >
          Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="rounded-2xl bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-green-400"
          >
            Start Match
          </button>
        )}
      </div>
    </div>
  );
}
