import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";

/** POST only, so a link or prefetch can never sign the user out. */
export async function POST(request: NextRequest) {
  if (getPublicEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/connexion", request.url), { status: 303 });
}
