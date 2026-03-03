import { createClient } from "./server";
import { type TableRow } from "./types";

/** Fetch the currently authenticated user's profile, or null if not logged in. */
export async function getCurrentUser(): Promise<TableRow<"users"> | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
  return data as TableRow<"users"> | null;
}
