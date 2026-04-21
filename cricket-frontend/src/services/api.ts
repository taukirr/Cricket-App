import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { MatchRecord, UserSession } from "../types/cricket";

type MatchRow = {
  id: string;
  user_id: string;
  share_id: string;
  status: string;
  team_a_name: string;
  team_b_name: string;
  winner_team_name: string | null;
  overs_per_innings: number;
  result_summary: string | null;
  scorecard: MatchRecord;
  created_at: string;
  updated_at: string;
};

function normalizeSupabaseError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      (message.includes("relation") && message.includes("matches")) ||
      (message.includes("could not find the table") && message.includes("matches"))
    ) {
      return new Error(
        "Supabase table setup is missing. Run cricket-frontend/supabase-schema.sql in the Supabase SQL editor first."
      );
    }

    return error;
  }

  return new Error("Supabase request failed");
}

function mapSession(session: Session | null): UserSession | null {
  if (!session?.user) {
    return null;
  }

  return {
    token: session.access_token,
    user: {
      id: session.user.id,
      name:
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0] ||
        "Cricket User",
      email: session.user.email || "",
      createdAt: session.user.created_at,
    },
  };
}

function mapMatchToRow(match: MatchRecord, userId: string): MatchRow {
  return {
    id: match.id,
    user_id: userId,
    share_id: match.shareId || match.id,
    status: match.status,
    team_a_name: match.teams[0].name,
    team_b_name: match.teams[1].name,
    winner_team_name: match.result?.winnerTeamId
      ? match.teams.find((team) => team.id === match.result?.winnerTeamId)?.name || null
      : null,
    overs_per_innings: match.oversPerInnings,
    result_summary: match.result?.summary || null,
    scorecard: match,
    created_at: match.createdAt,
    updated_at: match.updatedAt,
  };
}

function mapRowsToMatches(rows: MatchRow[] | null): MatchRecord[] {
  return (rows || []).map((row) => row.scorecard);
}

export async function getCurrentSession(): Promise<UserSession | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw normalizeSupabaseError(error);
  }

  return mapSession(session);
}

export function subscribeToAuthChanges(
  callback: (session: UserSession | null, event: AuthChangeEvent) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(mapSession(session), event);
  });

  return subscription;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<UserSession | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    throw normalizeSupabaseError(error);
  }

  const session = mapSession(data.session);

  if (!session) {
    return null;
  }

  return session;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw normalizeSupabaseError(error);
  }

  const session = mapSession(data.session);

  if (!session) {
    throw new Error("Unable to create a session");
  }

  return session;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function fetchMatches(): Promise<MatchRecord[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("scorecard")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return mapRowsToMatches(data as MatchRow[]);
}

export async function saveMatch(match: MatchRecord): Promise<MatchRecord> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Please log in to sync matches to Supabase.");
  }

  const matchRow = mapMatchToRow(match, user.id);
  const { data, error } = await supabase
    .from("matches")
    .upsert(matchRow, {
      onConflict: "id",
    })
    .select("scorecard")
    .single();

  if (error) {
    throw error;
  }

  return (data as MatchRow).scorecard;
}

export async function fetchSharedMatch(shareId: string): Promise<MatchRecord> {
  const { data, error } = await supabase.rpc("get_shared_match", {
    p_share_id: shareId,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Shared match not found");
  }

  return data as MatchRecord;
}
