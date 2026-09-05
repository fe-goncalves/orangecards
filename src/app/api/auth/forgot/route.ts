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
};

/** Reset de senha sem revelar se nickname/e-mail existem. */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const identifier = (body.identifier ?? "").trim();
  if (!identifier || identifier.length > 200) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (rejectInjectedText(identifier, "Identificador")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  let email: string | null = null;

  if (looksLikeEmail(identifier)) {
    email = identifier.toLowerCase();
  } else if (isValidNickname(identifier)) {
    try {
      const admin = createServiceClient();
      const { data } = await admin.rpc("resolve_login_identifier", {
        p_identifier: identifier,
      });
      const result = data as { ok?: boolean; email?: string } | null;
      if (result?.ok && result.email) email = result.email;
    } catch {
      // resposta uniforme abaixo
    }
  }

  if (email) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
  }

  return NextResponse.json({
    ok: true,
    message:
      "Se existir uma conta com esses dados, enviamos um link de recuperação.",
  });
}
