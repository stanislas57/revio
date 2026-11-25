import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Temporary deployment diagnostic. Exposes only non-secret facts about the Supabase
 * configuration the deployment received (never the full key) so a misconfigured
 * environment variable can be spotted. Remove once the hosted setup is stable.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  let host: string | null = null;
  try {
    host = new URL(url).host;
  } catch {
    host = null;
  }

  let supabaseStatus: number | string = "not-called";
  if (host && key) {
    try {
      const res = await fetch(`https://${host}/auth/v1/settings`, {
        headers: { apikey: key },
        cache: "no-store",
      });
      supabaseStatus = res.status;
    } catch {
      supabaseStatus = "network-error";
    }
  }

  return NextResponse.json({
    url: { set: url.length > 0, host, hasWhitespace: url !== url.trim() },
    key: {
      set: key.length > 0,
      length: key.length,
      prefix: key.slice(0, 16),
      suffix: key.slice(-4),
      hasWhitespace: key !== key.trim(),
      looksLikePublishableKey: key.startsWith("sb_publishable_"),
    },
    supabaseAuthSettingsStatus: supabaseStatus,
  });
}
