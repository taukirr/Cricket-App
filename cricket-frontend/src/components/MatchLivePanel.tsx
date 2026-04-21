import { useState } from "react";
import { RUN_OPTIONS, WICKET_TYPES } from "../constants/cricket";
import type { BallEvent, DeliveryInput, MatchRecord, WicketType } from "../types/cricket";
import { calculateRunRate, formatBowlingOvers, formatOversFromBalls } from "../utils/format";
import {
  applyDelivery,
  getCurrentInnings,
  getPlayerById,
  getTeamById,
  retireBatter,
  startSecondInnings,
  undoMatchAction,
} from "../utils/matchEngine";
import { getCurrentMatchMetrics, getLiveWinProbability, getPlayerOfTheMatch } from "../utils/stats";

type MatchLivePanelProps = {
  match: MatchRecord;
  onChange: (match: MatchRecord) => void;
  onBack: () => void;
  onPlayAgain: (match: MatchRecord) => void;
};

type ActionTab = "runs" | "extras" | "wicket";
type InfoTab = "players" | "over" | "commentary";

function StatTile({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        active ? "bg-cyan-400 text-slate-950" : "border border-white/10 bg-slate-950 text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function getBallBadge(ball: BallEvent): string {
  return ball.displayBall;
}

function getCommentaryTitle(ball: BallEvent): string {
  return `${ball.overNumber}.${ball.ballInOver} | ${ball.displayBall} | ${ball.scoreAfterBall}`;
}

export default function MatchLivePanel({
  match,
  onChange,
  onBack,
  onPlayAgain,
}: MatchLivePanelProps) {
  const [error, setError] = useState("");
  const [actionTab, setActionTab] = useState<ActionTab>("runs");
  const [infoTab, setInfoTab] = useState<InfoTab>("players");
  const [extraType, setExtraType] = useState<"wide" | "no-ball" | "bye" | "leg-bye">("wide");
  const [extraRuns, setExtraRuns] = useState(0);
  const [wicketType, setWicketType] = useState<WicketType>("bowled");
  const [dismissedPlayerId, setDismissedPlayerId] = useState("");
  const currentInnings = getCurrentInnings(match);
  const battingTeam = getTeamById(match, currentInnings.battingTeamId);
  const bowlingTeam = getTeamById(match, currentInnings.bowlingTeamId);
  const metrics = getCurrentMatchMetrics(match);
  const striker = currentInnings.strikerId ? getPlayerById(match, currentInnings.strikerId) : null;
  const nonStriker = currentInnings.nonStrikerId ? getPlayerById(match, currentInnings.nonStrikerId) : null;
  const bowler = currentInnings.currentBowlerId ? getPlayerById(match, currentInnings.currentBowlerId) : null;
  const effectiveDismissedPlayerId =
    [striker?.id, nonStriker?.id].find((playerId) => playerId === dismissedPlayerId) ||
    striker?.id ||
    nonStriker?.id ||
    "";
  const extraRunOptions = extraType === "no-ball" ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4];
  const availableWicketTypes = currentInnings.freeHitPending
    ? (["run-out", "hit-wicket"] as WicketType[])
    : WICKET_TYPES;
  const effectiveWicketType = availableWicketTypes.includes(wicketType)
    ? wicketType
    : availableWicketTypes[0];
  const currentBowlerStats = bowler ? currentInnings.bowlingStats[bowler.id] : null;
  const strikerStats = striker ? currentInnings.battingStats[striker.id] : null;
  const nonStrikerStats = nonStriker ? currentInnings.battingStats[nonStriker.id] : null;
  const currentRunRate = metrics.currentRunRate.toFixed(2);
  const projected = metrics.projectedScore.toFixed(0);
  const overLabel = formatOversFromBalls(currentInnings.legalBalls);
  const requiredRateLabel = metrics.requiredRunRate.toFixed(2);
  const bowlerEconomy =
    currentBowlerStats && currentBowlerStats.legalBalls > 0
      ? calculateRunRate(currentBowlerStats.runsConceded, currentBowlerStats.legalBalls).toFixed(2)
      : "0.00";
  const scoreSummary = `${currentInnings.totalRuns}/${currentInnings.wickets}`;
  const lastSixBalls = currentInnings.ballEvents.slice(-6).reverse();
  const commentaryItems = currentInnings.ballEvents.slice().reverse().slice(0, 8);
  const partnership = currentInnings.currentPartnership;
  const partnershipLabel = partnership
    ? `${partnership.runs} from ${partnership.balls} balls`
    : "New stand starting";
  const currentBowlerLabel = bowler
    ? `${bowler.name} | ${formatBowlingOvers(currentBowlerStats?.legalBalls || 0)} ov`
    : `Fielding ${bowlingTeam.name}`;
  const liveWinChance = match.settings.winProbabilityEnabled
    ? `${getLiveWinProbability(match).toFixed(1)}%`
    : "Hidden";
  const scoreHelper = currentInnings.target
    ? `Target ${currentInnings.target} | Need ${metrics.requiredRuns} from ${metrics.ballsLeft}`
    : `Projected ${projected}`;
  const rateHelper = currentInnings.target
    ? `Required RR ${requiredRateLabel}`
    : `Win chance ${liveWinChance}`;
  const matchResultText = match.result
    ? `${match.result.summary} ${match.result.margin}`.trim()
    : currentInnings.target
      ? `Need ${metrics.requiredRuns} from ${metrics.ballsLeft} balls`
      : `Projected ${projected}`;

  function updateMatch(nextMatch: MatchRecord) {
    setError("");
    onChange(nextMatch);
  }

  function runSafe(action: () => MatchRecord) {
    try {
      updateMatch(action());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete action");
    }
  }

  function handleDelivery(input: DeliveryInput) {
    runSafe(() => applyDelivery(match, input));
  }

  return (
    <section className="grid gap-4">
      <div className="sticky top-3 z-10 rounded-[1.5rem] border border-white/10 bg-slate-950/85 p-4 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">
                {currentInnings.number === 1 ? "First innings" : "Second innings"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                {battingTeam.name} {scoreSummary}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {battingTeam.name} batting | {bowlingTeam.name} bowling
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => updateMatch(undoMatchAction(match))}
                disabled={match.historyStack.length === 0}
                className="rounded-full border border-amber-400/30 px-4 py-2 text-sm text-amber-100 disabled:opacity-50"
              >
                Undo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatTile label="Score" value={scoreSummary} helper={scoreHelper} />
            <StatTile
              label="Overs"
              value={`${overLabel}/${match.oversPerInnings}`}
              helper={currentBowlerLabel}
            />
            <StatTile label="Run Rate" value={currentRunRate} helper={rateHelper} />
            <StatTile
              label="Partnership"
              value={partnership ? `${partnership.runs}` : "0"}
              helper={partnershipLabel}
            />
          </div>

          {currentInnings.freeHitPending ? (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              Free hit active. Only run out or hit wicket can dismiss the batter on this ball.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      {match.status === "innings-break" ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-5">
          <h3 className="text-2xl font-semibold text-white">First innings complete</h3>
          <p className="mt-2 text-slate-300">
            {getTeamById(match, match.innings[0].bowlingTeamId).name} now chases{" "}
            {match.innings[0].totalRuns + 1}.
          </p>
          <button
            type="button"
            onClick={() => runSafe(() => startSecondInnings(match))}
            className="mt-4 rounded-2xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950"
          >
            Start Second Innings
          </button>
        </section>
      ) : null}

      {match.status === "completed" ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-5">
          <h3 className="text-2xl font-semibold text-white">{matchResultText}</h3>
          <p className="mt-2 text-slate-300">
            Player of the match: {getPlayerOfTheMatch(match) || "TBD"}
          </p>
          <button
            type="button"
            onClick={() => onPlayAgain(match)}
            className="mt-4 rounded-2xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950"
          >
            Play Again
          </button>
        </section>
      ) : null}

      {match.status === "live" ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-5">
              <div className="flex flex-wrap gap-2">
                <TabButton
                  active={actionTab === "runs"}
                  label="Runs"
                  onClick={() => setActionTab("runs")}
                />
                <TabButton
                  active={actionTab === "extras"}
                  label="Extras"
                  onClick={() => setActionTab("extras")}
                />
                <TabButton
                  active={actionTab === "wicket"}
                  label="Wicket"
                  onClick={() => setActionTab("wicket")}
                />
              </div>

              {actionTab === "runs" ? (
                <div className="mt-4">
                  <p className="text-sm text-slate-300">Tap the run scored on this ball.</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {RUN_OPTIONS.map((run) => (
                      <button
                        key={run}
                        type="button"
                        onClick={() => handleDelivery({ eventType: "run", runs: run })}
                        className="rounded-2xl bg-emerald-500 px-4 py-5 text-2xl font-bold text-slate-950"
                      >
                        {run}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {actionTab === "extras" ? (
                <div className="mt-4 grid gap-4">
                  <div>
                    <p className="text-sm text-slate-300">Choose the extra type first.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ["wide", "Wide"],
                        ["no-ball", "No ball"],
                        ["bye", "Bye"],
                        ["leg-bye", "Leg bye"],
                      ].map(([type, label]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setExtraType(type as "wide" | "no-ball" | "bye" | "leg-bye")
                          }
                          className={`rounded-2xl px-3 py-3 text-sm ${
                            extraType === type
                              ? "bg-cyan-400 text-slate-950"
                              : "border border-white/10 bg-slate-950 text-slate-100"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-300">
                      Extra runs to add with {extraType}.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {extraRunOptions.map((run) => (
                        <button
                          key={`${extraType}-${run}`}
                          type="button"
                          onClick={() => setExtraRuns(run)}
                          className={`rounded-2xl px-3 py-3 text-sm ${
                            extraRuns === run
                              ? "bg-cyan-400 text-slate-950"
                              : "border border-white/10 bg-slate-950 text-slate-100"
                          }`}
                        >
                          {run}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelivery({
                        eventType: "extra",
                        runs: extraRuns,
                        extraType,
                      })
                    }
                    className="rounded-2xl bg-cyan-400 px-4 py-4 font-semibold text-slate-950"
                  >
                    Add {extraType}
                  </button>

                  <p className="text-sm text-slate-400">
                    {extraType === "no-ball"
                      ? "No-ball keeps the ball extra, adds 1 penalty run, and the next ball becomes a free hit. Example: choose 6 here to record no-ball plus six for 7 runs."
                      : "Wides and no-balls add an extra delivery. Byes and leg-byes count as legal balls."}
                  </p>
                </div>
              ) : null}

              {actionTab === "wicket" ? (
                <div className="mt-4 grid gap-3">
                  <p className="text-sm text-slate-300">Pick wicket type and dismissed batter.</p>

                  <select
                    value={effectiveWicketType}
                    onChange={(event) => setWicketType(event.target.value as WicketType)}
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  >
                    {availableWicketTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    value={effectiveDismissedPlayerId}
                    onChange={(event) => setDismissedPlayerId(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  >
                    {[striker, nonStriker]
                      .filter(Boolean)
                      .map((player) => (
                        <option key={player!.id} value={player!.id}>
                          {player!.name}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    disabled={!effectiveDismissedPlayerId}
                    onClick={() =>
                      handleDelivery({
                        eventType: "wicket",
                        runs: 0,
                        wicketType: effectiveWicketType,
                        dismissedPlayerId: effectiveDismissedPlayerId,
                      })
                    }
                    className="rounded-2xl bg-red-500 px-4 py-4 font-semibold text-white disabled:opacity-50"
                  >
                    Add wicket
                  </button>

                  {currentInnings.freeHitPending ? (
                    <p className="text-sm text-cyan-100">
                      Free hit is active, so only run out and hit wicket are available.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Retired hurt</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[striker, nonStriker]
                    .filter(Boolean)
                    .map((player) => (
                      <button
                        key={player!.id}
                        type="button"
                        onClick={() => runSafe(() => retireBatter(match, player!.id))}
                        className="rounded-full border border-amber-400/30 px-4 py-2 text-sm text-amber-100"
                      >
                        Retire {player!.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-5">
              <div className="flex flex-wrap gap-2">
                <TabButton
                  active={infoTab === "players"}
                  label="Players"
                  onClick={() => setInfoTab("players")}
                />
                <TabButton
                  active={infoTab === "over"}
                  label="This Over"
                  onClick={() => setInfoTab("over")}
                />
                <TabButton
                  active={infoTab === "commentary"}
                  label="Commentary"
                  onClick={() => setInfoTab("commentary")}
                />
              </div>

              {infoTab === "players" ? (
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-medium text-white">{striker?.name || "Waiting"} *</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {strikerStats
                        ? `${strikerStats.runs} (${strikerStats.balls}) | 4s ${strikerStats.fours} | 6s ${strikerStats.sixes}`
                        : "No batter"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-medium text-white">{nonStriker?.name || "Waiting"}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {nonStrikerStats
                        ? `${nonStrikerStats.runs} (${nonStrikerStats.balls}) | 4s ${nonStrikerStats.fours} | 6s ${nonStrikerStats.sixes}`
                        : "No batter"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-medium text-white">{bowler?.name || "Next bowler loading"}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {currentBowlerStats
                        ? `${formatBowlingOvers(currentBowlerStats.legalBalls)} ov | ${currentBowlerStats.wickets} wkts | ${currentBowlerStats.runsConceded} runs | Econ ${bowlerEconomy}`
                        : `Fielding ${bowlingTeam.name}`}
                    </p>
                  </div>
                </div>
              ) : null}

              {infoTab === "over" ? (
                <div className="mt-4 grid gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">This over</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lastSixBalls.length === 0 ? (
                        <span className="text-sm text-slate-400">No balls yet</span>
                      ) : (
                        lastSixBalls.map((ball) => (
                          <span
                            key={ball.id}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                          >
                            {getBallBadge(ball)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-sm font-medium text-white">Match state</p>
                    <p className="mt-2 text-sm text-slate-300">{matchResultText}</p>
                  </div>
                </div>
              ) : null}

              {infoTab === "commentary" ? (
                <div className="mt-4 grid gap-3">
                  {commentaryItems.length === 0 ? (
                    <p className="text-sm text-slate-400">No deliveries yet.</p>
                  ) : (
                    commentaryItems.map((ball) => (
                      <div key={ball.id} className="rounded-2xl bg-white/[0.03] p-3">
                        <p className="font-medium text-white">{getCommentaryTitle(ball)}</p>
                        <p className="mt-1 text-sm text-slate-400">{ball.commentary}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fall of wickets</p>
            <div className="mt-4 grid gap-3">
              {currentInnings.fallOfWickets.length === 0 ? (
                <p className="text-sm text-slate-400">No wickets yet.</p>
              ) : (
                currentInnings.fallOfWickets.map((wicket) => (
                  <div
                    key={`${wicket.wicketNumber}-${wicket.batsmanId}`}
                    className="rounded-2xl bg-white/[0.03] p-3"
                  >
                    <p className="font-medium text-white">
                      {wicket.wicketNumber}. {getPlayerById(match, wicket.batsmanId).name}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {wicket.score} at {wicket.overLabel}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
