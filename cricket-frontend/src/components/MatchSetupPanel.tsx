import { useMemo, useState } from "react";
import { PLAYER_ROLES } from "../constants/cricket";
import type {
  MatchRecord,
  MatchSettings,
  MatchSetupInput,
  MatchSetupTeamInput,
  PlayerRole,
  TeamPlayer,
} from "../types/cricket";
import { createId } from "../utils/id";

type SetupTeamDraft = MatchSetupTeamInput & {
  size: number;
};

type MatchSetupDraft = {
  oversPerInnings: number;
  battingFirstTeamKey: "team-1" | "team-2";
  teamOne: SetupTeamDraft;
  teamTwo: SetupTeamDraft;
  settings: MatchSettings;
};

type MatchSetupPanelProps = {
  initialMatch: MatchRecord | null;
  defaultSettings: MatchSettings;
  onStart: (setup: MatchSetupInput) => void;
  onCancel: () => void;
};

function createDraftPlayer(prefix: string, index: number): TeamPlayer {
  return {
    id: createId("player"),
    name: `${prefix} Player ${index + 1}`,
    role: PLAYER_ROLES[index % PLAYER_ROLES.length],
    battingStyle: "",
    bowlingStyle: "",
  };
}

function buildTeamDraft(name: string, prefix: string, size: number): SetupTeamDraft {
  const players = Array.from({ length: size }, (_, index) => createDraftPlayer(prefix, index));

  return {
    name,
    size,
    players,
    captainId: players[0]?.id || "",
  };
}

function resizePlayers(existingPlayers: TeamPlayer[], size: number, prefix: string): TeamPlayer[] {
  if (existingPlayers.length === size) {
    return existingPlayers;
  }

  if (existingPlayers.length > size) {
    return existingPlayers.slice(0, size);
  }

  const nextPlayers = [...existingPlayers];

  while (nextPlayers.length < size) {
    nextPlayers.push(createDraftPlayer(prefix, nextPlayers.length));
  }

  return nextPlayers;
}

function buildDraftFromMatch(match: MatchRecord | null, settings: MatchSettings): MatchSetupDraft {
  if (!match) {
    return {
      oversPerInnings: 10,
      battingFirstTeamKey: "team-1",
      teamOne: buildTeamDraft("Team A", "A", 5),
      teamTwo: buildTeamDraft("Team B", "B", 5),
      settings,
    };
  }

  const [teamOne, teamTwo] = match.teams;

  return {
    oversPerInnings: match.oversPerInnings,
    battingFirstTeamKey: match.innings[0].battingTeamId === teamOne.id ? "team-1" : "team-2",
    teamOne: {
      name: teamOne.name,
      size: teamOne.players.length,
      captainId: teamOne.captainId,
      players: teamOne.players,
    },
    teamTwo: {
      name: teamTwo.name,
      size: teamTwo.players.length,
      captainId: teamTwo.captainId,
      players: teamTwo.players,
    },
    settings: match.settings,
  };
}

export default function MatchSetupPanel({
  initialMatch,
  defaultSettings,
  onStart,
  onCancel,
}: MatchSetupPanelProps) {
  const [draft, setDraft] = useState<MatchSetupDraft>(() =>
    buildDraftFromMatch(initialMatch, defaultSettings)
  );
  const battingTeamName = draft.battingFirstTeamKey === "team-1" ? draft.teamOne.name : draft.teamTwo.name;
  const bowlingTeamName = draft.battingFirstTeamKey === "team-1" ? draft.teamTwo.name : draft.teamOne.name;

  const teamSections = useMemo(
    () => [
      { key: "teamOne" as const, title: "Team A", draft: draft.teamOne, prefix: "A" },
      { key: "teamTwo" as const, title: "Team B", draft: draft.teamTwo, prefix: "B" },
    ],
    [draft.teamOne, draft.teamTwo]
  );

  function updateTeam(
    key: "teamOne" | "teamTwo",
    updater: (team: SetupTeamDraft) => SetupTeamDraft
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: updater(currentDraft[key]),
    }));
  }

  function updatePlayer(
    teamKey: "teamOne" | "teamTwo",
    playerId: string,
    field: keyof TeamPlayer,
    value: string
  ) {
    updateTeam(teamKey, (team) => ({
      ...team,
      players: team.players.map((player) =>
        player.id === playerId ? { ...player, [field]: value } : player
      ),
    }));
  }

  function handleSizeChange(teamKey: "teamOne" | "teamTwo", size: number, prefix: string) {
    updateTeam(teamKey, (team) => {
      const normalizedSize = Math.min(11, Math.max(5, size));
      const players = resizePlayers(team.players, normalizedSize, prefix);
      const captainId = players.some((player) => player.id === team.captainId)
        ? team.captainId
        : players[0]?.id || "";

      return {
        ...team,
        size: normalizedSize,
        players,
        captainId,
      };
    });
  }

  function handleStartMatch() {
    onStart({
      oversPerInnings: Math.min(20, Math.max(1, draft.oversPerInnings)),
      battingFirstTeamKey: draft.battingFirstTeamKey,
      teams: [
        {
          name: draft.teamOne.name.trim() || "Team A",
          captainId: draft.teamOne.captainId,
          players: draft.teamOne.players.map((player) => ({
            ...player,
            name: player.name.trim() || "Player",
          })),
        },
        {
          name: draft.teamTwo.name.trim() || "Team B",
          captainId: draft.teamTwo.captainId,
          players: draft.teamTwo.players.map((player) => ({
            ...player,
            name: player.name.trim() || "Player",
          })),
        },
      ],
      settings: draft.settings,
    });
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Match Setup</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Quick setup</h2>
          <p className="mt-2 text-sm text-slate-300">
            Pick overs, choose the batting side, and fill both teams. Bowling starts automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
        >
          Back
        </button>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm text-slate-200">
            Overs
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={draft.oversPerInnings}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  oversPerInnings: Number(event.target.value) || 1,
                }))
              }
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-200">
            Batting first
            <select
              value={draft.battingFirstTeamKey}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  battingFirstTeamKey: event.target.value as "team-1" | "team-2",
                }))
              }
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            >
              <option value="team-1">{draft.teamOne.name}</option>
              <option value="team-2">{draft.teamTwo.name}</option>
            </select>
          </label>

          <div className="grid gap-2 text-sm text-slate-200">
            Match settings
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "soundEnabled", label: "Sound" },
                { key: "vibrationEnabled", label: "Vibrate" },
                { key: "winProbabilityEnabled", label: "Win %" },
              ].map((setting) => (
                <button
                  key={setting.key}
                  type="button"
                  onClick={() =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      settings: {
                        ...currentDraft.settings,
                        [setting.key]:
                          !currentDraft.settings[setting.key as keyof MatchSettings],
                      },
                    }))
                  }
                  className={`rounded-2xl px-3 py-3 text-sm ${
                    draft.settings[setting.key as keyof MatchSettings]
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/10 bg-slate-950 text-slate-200"
                  }`}
                >
                  {setting.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {battingTeamName} bats first. {bowlingTeamName} bowls first automatically.
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {teamSections.map((section) => (
          <section
            key={section.key}
            className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-5"
          >
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-2 text-sm text-slate-200">
                {section.title} name
                <input
                  value={section.draft.name}
                  onChange={(event) =>
                    updateTeam(section.key, (team) => ({ ...team, name: event.target.value }))
                  }
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-200">
                Players
                <input
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={11}
                  value={section.draft.size}
                  onChange={(event) =>
                    handleSizeChange(section.key, Number(event.target.value) || 5, section.prefix)
                  }
                  className="w-24 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm text-slate-200">
              Captain
              <select
                value={section.draft.captainId}
                onChange={(event) =>
                  updateTeam(section.key, (team) => ({ ...team, captainId: event.target.value }))
                }
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
              >
                {section.draft.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.role})
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 grid gap-3">
              {section.draft.players.map((player, index) => (
                <div
                  key={player.id}
                  className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_160px]"
                >
                  <label className="grid gap-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                    Player {index + 1}
                    <input
                      value={player.name}
                      onChange={(event) =>
                        updatePlayer(section.key, player.id, "name", event.target.value)
                      }
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm normal-case tracking-normal text-white"
                    />
                  </label>

                  <label className="grid gap-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                    Role
                    <select
                      value={player.role}
                      onChange={(event) =>
                        updatePlayer(section.key, player.id, "role", event.target.value as PlayerRole)
                      }
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm normal-case tracking-normal text-white"
                    >
                      {PLAYER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleStartMatch}
          className="rounded-2xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950"
        >
          Start Match
        </button>
        <button
          type="button"
          onClick={() => setDraft(buildDraftFromMatch(initialMatch, defaultSettings))}
          className="rounded-2xl border border-white/10 px-6 py-4 text-slate-200"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
