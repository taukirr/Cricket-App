import { useState } from "react";
import ScoreBoard from "./components/ScoreBoard";
import Controls from "./components/Controls";
import BallTimeline from "./components/BallTimeLine";
import MatchHeader from "./components/MatchHeader";
import SetupForm from "./components/SetupForm";
import type {
  BallEvent,
  BallType,
  MatchConfig,
  MatchSnapshot,
} from "./types/match";

export default function App() {
  const [team1, setTeam1] = useState("Team 1");
  const [team2, setTeam2] = useState("Team 2");
  const [oversLimit, setOversLimit] = useState(10);
  const [battingSide, setBattingSide] = useState<"team1" | "team2">("team1");
  const [setupStep, setSetupStep] = useState(1);

  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [overs, setOvers] = useState(0);
  const [ballHistory, setBallHistory] = useState<BallEvent[]>([]);
  const [history, setHistory] = useState<MatchSnapshot[]>([]);

  const resetScoreboard = () => {
    setScore(0);
    setWickets(0);
    setBalls(0);
    setOvers(0);
    setBallHistory([]);
    setHistory([]);
  };

  const startMatch = () => {
    setMatchConfig({
      team1: team1.trim() || "Team 1",
      team2: team2.trim() || "Team 2",
      totalOvers: oversLimit,
      battingTeam: battingSide,
    });
    resetScoreboard();
  };
  const saveHistory = () => {
    setHistory((prev) => [
      ...prev,
      { score, wickets, balls, overs, ballHistory },
    ]);
  };

  const updateBall = (isLegal: boolean) => {
    if (!isLegal) return;

    if (balls === 5) {
      setOvers((prev) => prev + 1);
      setBalls(0);
    } else {
      setBalls((prev) => prev + 1);
    }
  };

  const isMatchComplete =
    matchConfig !== null && overs === matchConfig.totalOvers && balls === 0 && ballHistory.length > 0;

  const handleBall = (type: BallType, runs: number = 0) => {
    if (!matchConfig || isMatchComplete) return;

    saveHistory();
    setBallHistory((prev) => [...prev, { type, runs }]);

    if (type === "run") {
      setScore((prev) => prev + runs);
      updateBall(true);
      return;
    }

    if (type === "wicket") {
      setWickets((prev) => prev + 1);
      updateBall(true);
      return;
    }

    if (type === "wide") {
      setScore((prev) => prev + 1 + runs);
      updateBall(false);
      return;
    }

    if (type === "no-ball") {
      setScore((prev) => prev + 1 + runs);
      updateBall(false);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];

    setScore(last.score);
    setWickets(last.wickets);
    setBalls(last.balls);
    setOvers(last.overs);
    setBallHistory(last.ballHistory);

    setHistory((prev) => prev.slice(0, -1));
  };

  const handleRestart = () => {
    resetScoreboard();
    setMatchConfig(null);
    setSetupStep(1);
  };

  if (!matchConfig) {
    return (
      <div className="bg-slate-950 text-white min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <MatchHeader matchConfig={matchConfig} />
          <SetupForm
            step={setupStep}
            team1={team1}
            team2={team2}
            overs={oversLimit}
            battingTeam={battingSide}
            onChangeTeam1={setTeam1}
            onChangeTeam2={setTeam2}
            onChangeOvers={setOversLimit}
            onChangeBatting={setBattingSide}
            onNext={() => setSetupStep((prev) => Math.min(prev + 1, 3))}
            onBack={() => setSetupStep((prev) => Math.max(prev - 1, 1))}
            onStart={startMatch}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <MatchHeader matchConfig={matchConfig} />

        <div className="space-y-6">
          <ScoreBoard
            score={score}
            wickets={wickets}
            overs={overs}
            balls={balls}
            team1={matchConfig.team1}
            team2={matchConfig.team2}
            battingTeam={matchConfig.battingTeam}
            totalOvers={matchConfig.totalOvers}
          />

          <BallTimeline balls={ballHistory} />

          <Controls
            onRun={(run) => handleBall("run", run)}
            onWicket={() => handleBall("wicket")}
            onWide={() => handleBall("wide")}
            onNoBall={() => handleBall("no-ball")}
            onUndo={handleUndo}
            onReset={handleRestart}
          />

          {isMatchComplete ? (
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
              <p className="font-semibold">Match complete</p>
              <p>The innings has finished after {matchConfig.totalOvers} overs.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
