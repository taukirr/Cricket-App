import type { BallEvent } from "../types/match";

export default function BallTimeline({ balls }: { balls: BallEvent[] }) {
  return (
    <div className="bg-gray-800 p-4 rounded-2xl mt-6">
      <h3 className="mb-3 text-lg font-semibold">This Over</h3>

      <div className="flex gap-2 flex-wrap">
        {balls.slice(-6).map((ball, index) => {
          let display = "";
          let color = "bg-gray-500";

          if (ball.type === "run") {
            display = String(ball.runs);
            color = "bg-green-600";
          }

          if (ball.type === "wicket") {
            display = "W";
            color = "bg-red-600";
          }

          if (ball.type === "wide") {
            display = ball.runs > 0 ? `wd+${ball.runs}` : "wd";
            color = "bg-yellow-500";
          }

          if (ball.type === "no-ball") {
            display = ball.runs > 0 ? `nb+${ball.runs}` : "nb";
            color = "bg-blue-500";
          }

          return (
            <div
              key={index}
              className={`${color} w-10 h-10 flex items-center justify-center rounded-full font-bold`}
            >
              {display}
            </div>
          );
        })}
      </div>
    </div>
  );
}