import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/middleware";
import {
  isValidNickname,
  looksLikeEmail,
  rejectInjectedText,
} from "@/lib/nickname";

type Body = {
  identifier?: string;
  password?: string;
};

/**
 * Login server-side para não expor e-mail ao resolver nickname.
 * O RPC resolve_login_identifier só deve ser chamado aqui (service role).
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const identifier = (body.identifier ?? "").trim();
  const password = body.password ?? "";

  if (!identifier || !password) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  if (password.length > 200 || identifier.length > 200) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const inject = rejectInjectedText(identifier, "Identificador");
  if (inject) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  let email: string | null = null;

  if (looksLikeEmail(identifier)) {
    email = identifier.toLowerCase();
  } else {
    if (!isValidNickname(identifier)) {
      return NextResponse.json({ ok: false, error: "auth_failed" }, { status: 401 });
    }
    try {
      const admin = createServiceClient();
      const { data, error } = await admin.rpc("resolve_login_identifier", {
        p_identifier: identifier,
      });
      if (error) {
        return NextResponse.json(
          { ok: false, error: "auth_failed" },
          { status: 401 }
        );
      }
      const result = data as { ok?: boolean; email?: string } | null;
      if (result?.ok && result.email) email = result.email;
    } catch {
      return NextResponse.json(
        { ok: false, error: "server_misconfigured" },
        { status: 503 }
      );
    }
  }

  if (!email) {
    return NextResponse.json({ ok: false, error: "auth_failed" }, { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const code = error.message.includes("Email not confirmed")
      ? "email_unconfirmed"
      : "auth_failed";
    return NextResponse.json({ ok: false, error: code }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
