import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return NextResponse.json(
    {
      ok: true,
      service: "orange-cards",
      season: 8,
      supabase_configured: hasSupabase,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
