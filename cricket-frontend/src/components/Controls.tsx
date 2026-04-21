type Props = {
  onRun: (runs: number) => void;
  onWicket: () => void;
  onWide: () => void;
  onNoBall: () => void;
  onUndo: () => void;
  onReset: () => void;
};

export default function Controls({
  onRun,
  onWicket,
  onWide,
  onNoBall,
  onUndo,
  onReset,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Runs */}
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3, 4, 6].map((run) => (
          <button
            key={run}
            onClick={() => onRun(run)}
            className="bg-green-600 p-4 rounded-xl text-xl font-bold hover:bg-green-500"
          >
            {run}
          </button>
        ))}
      </div>

      {/* Extras */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onWide}
          className="bg-yellow-500 px-4 py-2 rounded-xl"
        >
          Wide
        </button>

        <button
          onClick={onNoBall}
          className="bg-blue-500 px-4 py-2 rounded-xl"
        >
          No Ball
        </button>

        <button
          onClick={onWicket}
          className="bg-red-600 px-4 py-2 rounded-xl"
        >
          Wicket
        </button>

        <button
          onClick={onUndo}
          className="bg-gray-600 px-4 py-2 rounded-xl"
        >
          Undo
        </button>

        <button
          onClick={onReset}
          className="bg-slate-700 px-4 py-2 rounded-xl text-white hover:bg-slate-600"
        >
          Restart
        </button>
      </div>
    </div>
  );
}