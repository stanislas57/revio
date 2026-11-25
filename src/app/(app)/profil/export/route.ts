import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildExport, EXPORT_TABLES, exportFilename } from "@/modules/profile/domain/account-export";

/** Postgres "undefined table" and PostgREST "table not in schema cache". */
const MISSING_TABLE = new Set(["42P01", "PGRST205"]);

/**
 * GET /profil/export: the signed-in user's own data as a JSON download.
 * Read-only, so a GET is safe: a third-party page cannot read the response. Always scoped to the
 * caller (RLS + explicit owner filter), never cached.
 */
export async function GET() {
  const { supabase, user } = await requireUser();
  const data: Record<string, unknown[]> = {};
  const skippedTables: string[] = [];

  const results = await Promise.all(
    EXPORT_TABLES.map(async (t) => ({
      t,
      res: await supabase.from(t.table).select("*").eq(t.column, user.id),
    })),
  );
  for (const { t, res } of results) {
    if (res.error) {
      if (MISSING_TABLE.has(res.error.code)) {
        skippedTables.push(t.table);
        data[t.key] = [];
        continue;
      }
      return NextResponse.json({ error: "Export impossible pour le moment." }, { status: 500 });
    }
    data[t.key] = res.data ?? [];
  }

  // Two simple filters (sent and received) rather than an `or`, merged without duplicates.
  const [sent, received] = await Promise.all([
    supabase.from("friendships").select("*").eq("requester_id", user.id),
    supabase.from("friendships").select("*").eq("addressee_id", user.id),
  ]);
  if (sent.error || received.error) {
    return NextResponse.json({ error: "Export impossible pour le moment." }, { status: 500 });
  }
  const friendships = [...(sent.data ?? []), ...(received.data ?? [])];
  data.friendships = friendships;

  const now = new Date();
  return new NextResponse(
    JSON.stringify(buildExport({ now, email: user.email ?? null, data, skippedTables }), null, 2),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename(now)}"`,
        "Cache-Control": "no-store",
      },
    },
  );
}
