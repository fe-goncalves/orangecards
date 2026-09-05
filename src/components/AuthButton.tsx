"use client";

import { useEffect, useState, FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  looksLikeEmail,
  nicknameValidationMessage,
  rejectInjectedText,
  sanitizeNicknameInput,
} from "@/lib/nickname";
import { AccountModal } from "./AccountModal";
import { GlassBackdrop, GlassPanel } from "./GlassPanel";
import { Icon } from "./Icon";
import { ModalPortal } from "./ModalPortal";

type Props = {
  initialUser: User | null;
  openSignal?: number;
  disabled?: boolean;
};

type Mode = "signin" | "signup" | "forgot";
type NickAvailability = "idle" | "checking" | "available" | "taken" | "invalid";

function displayName(user: User) {
  const nick = user.user_metadata?.nickname as string | undefined;
  if (nick?.trim()) return nick.trim();
  return user.email?.split("@")[0] ?? "conta";
}

export function AuthButton({ initialUser, openSignal = 0, disabled }: Props) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [nickAvailability, setNickAvailability] =
    useState<NickAvailability>("idle");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (disabled) return;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [disabled]);

  useEffect(() => {
    if (openSignal > 0 && !user) setOpen(true);
  }, [openSignal, user]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (mode !== "signup") {
      setNickAvailability("idle");
      return;
    }

    const nickError = nicknameValidationMessage(nickname);
    if (nickError) {
      setNickAvailability(nickname.length === 0 ? "idle" : "invalid");
      return;
    }

    setNickAvailability("checking");
    const supabase = createClient();
    const handle = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_nickname_available", {
        p_nickname: nickname,
      });
      if (error) {
        setNickAvailability("invalid");
        return;
      }
      const result = data as {
        ok?: boolean;
        available?: boolean;
        error?: string;
      } | null;
      if (!result?.ok) {
        setNickAvailability("invalid");
        return;
      }
      setNickAvailability(result.available ? "available" : "taken");
    }, 400);

    return () => window.clearTimeout(handle);
  }, [nickname, mode]);

  function resetFeedback() {
    setStatus("idle");
    setMessage("");
  }

  function closeAuth() {
    setOpen(false);
    resetFeedback();
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetFeedback();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setMessage("");
    const supabase = createClient();
    const origin = window.location.origin;

    if (mode === "forgot") {
      const inject = rejectInjectedText(identifier, "Identificador");
      if (inject) {
        setStatus("error");
        setMessage(inject);
        return;
      }
      try {
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        });
        const data = (await res.json()) as { message?: string };
        setStatus("ok");
        setMessage(
          data.message ||
            "Se existir uma conta com esses dados, enviamos um link de recuperação."
        );
      } catch {
        setStatus("error");
        setMessage("Não foi possível enviar o link agora. Tente de novo.");
      }
      return;
    }

    if (mode === "signup") {
      if (!looksLikeEmail(email.trim())) {
        setStatus("error");
        setMessage("Informe um e-mail válido.");
        return;
      }

      const nick = sanitizeNicknameInput(nickname);
      const nickError = nicknameValidationMessage(nick);
      if (nickError) {
        setStatus("error");
        setMessage(nickError);
        return;
      }
      if (nickAvailability === "taken") {
        setStatus("error");
        setMessage("Esse nickname já está em uso.");
        return;
      }
      if (nickAvailability === "checking") {
        setStatus("error");
        setMessage("Aguarde a verificação do nickname.");
        return;
      }
      if (!acceptedTerms) {
        setStatus("error");
        setMessage("Aceite os termos para criar a conta.");
        return;
      }
      if (password.length < 6) {
        setStatus("error");
        setMessage("Senha com no mínimo 6 caracteres.");
        return;
      }

      const { data: availData } = await supabase.rpc("is_nickname_available", {
        p_nickname: nick,
      });
      const avail = availData as { available?: boolean } | null;
      if (!avail?.available) {
        setNickAvailability("taken");
        setStatus("error");
        setMessage("Esse nickname já está em uso.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: { nickname: nick },
        },
      });
      if (error) {
        setStatus("error");
        const msg = error.message.toLowerCase();
        if (msg.includes("nickname_taken") || msg.includes("duplicate")) {
          setNickAvailability("taken");
          setMessage("Esse nickname já está em uso.");
        } else if (msg.includes("invalid_nickname")) {
          setMessage("Nickname inválido.");
        } else {
          setMessage(error.message);
        }
        return;
      }
      if (data.session) {
        setStatus("ok");
        closeAuth();
        return;
      }
      setStatus("ok");
      setMessage(
        "Conta criada. Confira seu e-mail para verificar antes de entrar."
      );
      return;
    }

    const inject = rejectInjectedText(identifier, "Identificador");
    if (inject) {
      setStatus("error");
      setMessage(inject);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(
          data.error === "email_unconfirmed"
            ? "Confirme o e-mail antes de entrar."
            : "Credenciais inválidas."
        );
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
      setStatus("ok");
      closeAuth();
    } catch {
      setStatus("error");
      setMessage("Não foi possível entrar agora. Tente de novo.");
    }
  }

  async function signOut() {
    const supabase = createClient();
    const { clearAllCachedClaims } = await import("@/lib/claims");
    clearAllCachedClaims();
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
    setAccountOpen(false);
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title="Configure o Supabase para ativar login"
        className="btn btn-ghost opacity-50"
      >
        Entrar
      </button>
    );
  }

  if (user) {
    return (
      <>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="glass-pill max-w-[140px] truncate sm:max-w-[180px]"
            title={user.email ?? undefined}
            aria-label={`Conta: ${displayName(user)}`}
          >
            <Icon name="user" size={14} className="shrink-0 text-mint" />
            <span className="truncate">{displayName(user)}</span>
          </button>

          <button
            type="button"
            onClick={signOut}
            className="glass-icon-btn"
            aria-label="Sair da conta"
            title="Sair"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
        {accountOpen && (
          <AccountModal
            user={user}
            onClose={() => setAccountOpen(false)}
            onUpdated={setUser}
          />
        )}
      </>
    );
  }

  const titles: Record<Mode, string> = {
    signin: "Entrar",
    signup: "Criar conta",
    forgot: "Recuperar senha",
  };

  const nickHint =
    nickAvailability === "checking"
      ? "Verificando disponibilidade…"
      : nickAvailability === "available"
        ? "Nickname disponível"
        : nickAvailability === "taken"
          ? "Nickname já em uso"
          : nickAvailability === "invalid" && nickname.length > 0
            ? nicknameValidationMessage(nickname) ?? "Nickname inválido"
            : "Tudo junto, sem espaços. Não pode terminar com .";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetFeedback();
          setMode("signin");
          setOpen(true);
        }}
        className="glass-btn px-3.5 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm"
      >
        Entrar
      </button>

      {open && (
        <ModalPortal>
          <GlassBackdrop onClose={closeAuth}>
            <GlassPanel
              title={titles[mode]}
              subtitle={
                mode === "signup"
                  ? "Verificação por e-mail na primeira vez"
                  : mode === "forgot"
                    ? "Enviaremos um link para redefinir"
                    : "Acesse com nickname ou e-mail"
              }
              onClose={closeAuth}
            >
              {mode !== "forgot" && (
                <div className="mb-4 flex gap-1 rounded-xl bg-white/[0.04] p-1">
                  <button
                    type="button"
                    className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                      mode === "signin"
                        ? "bg-white/10 text-ink"
                        : "text-ink-muted"
                    }`}
                    onClick={() => switchMode("signin")}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                      mode === "signup"
                        ? "bg-white/10 text-ink"
                        : "text-ink-muted"
                    }`}
                    onClick={() => switchMode("signup")}
                  >
                    Criar conta
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "signup" ? (
                  <AuthField
                    id="auth-email"
                    label="E-mail"
                    icon="mail"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    required
                  />
                ) : (
                  <AuthField
                    id="auth-identifier"
                    label="Nickname ou e-mail"
                    icon="user"
                    type="text"
                    value={identifier}
                    onChange={setIdentifier}
                    autoComplete="username"
                    placeholder="seu_nick ou e-mail"
                    required
                  />
                )}

                {mode === "signup" && (
                  <div>
                    <label
                      htmlFor="auth-nick"
                      className="mb-1.5 block text-xs font-medium text-ink-muted"
                    >
                      Nickname
                    </label>
                    <div className="glass-input-wrap">
                      <Icon
                        name="user"
                        size={16}
                        className="shrink-0 text-ink-faint"
                      />
                      <input
                        id="auth-nick"
                        type="text"
                        value={nickname}
                        onChange={(e) =>
                          setNickname(sanitizeNicknameInput(e.target.value))
                        }
                        placeholder="seu_nickname"
                        maxLength={32}
                        required
                        autoComplete="username"
                        spellCheck={false}
                        autoCapitalize="off"
                        className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
                      />
                      <NickStatusIcon state={nickAvailability} />
                    </div>
                    <p
                      className={`mt-1.5 text-[11px] ${
                        nickAvailability === "taken" ||
                        nickAvailability === "invalid"
                          ? "text-danger"
                          : nickAvailability === "available"
                            ? "text-mint"
                            : "text-ink-faint"
                      }`}
                    >
                      {nickHint}
                    </p>
                  </div>
                )}

                {mode !== "forgot" && (
                  <AuthField
                    id="auth-password"
                    label="Senha"
                    icon="lock"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    minLength={6}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    required
                  />
                )}

                {mode === "signup" && (
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-transparent accent-[var(--mint)]"
                      required
                    />
                    <span className="text-[11px] leading-relaxed text-ink-muted">
                      Aceito os termos de uso e a política de privacidade da
                      Orange Cards.
                    </span>
                  </label>
                )}

                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-xs text-ink-muted transition hover:text-mint"
                    onClick={() => switchMode("forgot")}
                  >
                    Esqueceu a senha?
                  </button>
                )}

                {mode === "forgot" && (
                  <button
                    type="button"
                    className="text-xs text-ink-muted transition hover:text-mint"
                    onClick={() => switchMode("signin")}
                  >
                    Voltar ao login
                  </button>
                )}

                <button
                  type="submit"
                  disabled={
                    status === "busy" ||
                    (mode === "signup" &&
                      (nickAvailability === "taken" ||
                        nickAvailability === "checking" ||
                        !acceptedTerms))
                  }
                  className="glass-btn w-full py-2.5 disabled:opacity-50"
                >
                  {status === "busy"
                    ? "…"
                    : mode === "forgot"
                      ? "Enviar link"
                      : mode === "signup"
                        ? "Criar conta"
                        : "Entrar"}
                </button>
              </form>

              {message && (
                <p
                  className={`mt-3 text-xs ${status === "error" ? "text-danger" : "text-mint"}`}
                  role="status"
                >
                  {message}
                </p>
              )}
            </GlassPanel>
          </GlassBackdrop>
        </ModalPortal>
      )}
    </>
  );
}

function NickStatusIcon({ state }: { state: NickAvailability }) {
  if (state === "checking") {
    return (
      <Icon
        name="loader"
        size={16}
        className="shrink-0 animate-spin text-ink-faint"
      />
    );
  }
  if (state === "available") {
    return <Icon name="check" size={16} className="shrink-0 text-mint" />;
  }
  if (state === "taken" || state === "invalid") {
    return <Icon name="close" size={16} className="shrink-0 text-danger" />;
  }
  return null;
}

function AuthField({
  id,
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  minLength,
  maxLength,
  autoComplete,
  pattern,
  title,
}: {
  id: string;
  label: string;
  icon: "user" | "mail" | "lock";
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
  pattern?: string;
  title?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <div className="glass-input-wrap">
        <Icon name={icon} size={16} className="shrink-0 text-ink-faint" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
          pattern={pattern}
          title={title}
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
        />
      </div>
    </div>
  );
}
