"use client";

import { useEffect, useState, FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { nicknameValidationMessage } from "@/lib/nickname";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (disabled) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  function resetFeedback() {
    setStatus("idle");
    setMessage("");
  }

  function closeAuth() {
    setOpen(false);
    resetFeedback();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setMessage("");
    const supabase = createClient();
    const origin = window.location.origin;
    const mail = email.trim();

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      setStatus("ok");
      setMessage("Link de recuperação enviado ao seu e-mail.");
      return;
    }

    if (mode === "signup") {
      const nick = nickname.trim();
      const nickError = nicknameValidationMessage(nick);
      if (nickError) {
        setStatus("error");
        setMessage(nickError);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: { nickname: nick },
        },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
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

    const { error } = await supabase.auth.signInWithPassword({
      email: mail,
      password,
    });
    if (error) {
      setStatus("error");
      setMessage(
        error.message.includes("Email not confirmed")
          ? "Confirme o e-mail antes de entrar."
          : error.message
      );
      return;
    }
    setStatus("ok");
    closeAuth();
  }

  async function signOut() {
    const supabase = createClient();
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
          {/* Botão Perfil (Ícone no mobile, Pill com nome no desktop) */}
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="glass-pill hidden max-w-[160px] truncate sm:inline-flex"
            title={user.email ?? undefined}
          >
            <Icon name="user" size={14} className="shrink-0 text-mint" />
            <span className="truncate">{displayName(user)}</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="glass-icon-btn sm:hidden"
            aria-label="Perfil"
            title={user.email ?? undefined}
          >
            <Icon name="user" size={16} className="text-mint" />
          </button>

          {/* Botão Logout */}
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
                    : "Acesse sua coleção"
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
                    onClick={() => {
                      setMode("signin");
                      resetFeedback();
                    }}
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
                    onClick={() => {
                      setMode("signup");
                      resetFeedback();
                    }}
                  >
                    Criar conta
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
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

                {mode === "signup" && (
                  <AuthField
                    id="auth-nick"
                    label="Nickname"
                    icon="user"
                    value={nickname}
                    onChange={setNickname}
                    placeholder="seu_nickname"
                    maxLength={32}
                    required
                    pattern="[a-zA-Z0-9_-]{2,32}"
                    title="2–32 caracteres: letras, números, _ ou -"
                  />
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

                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-xs text-ink-muted transition hover:text-mint"
                    onClick={() => {
                      setMode("forgot");
                      resetFeedback();
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                )}

                {mode === "forgot" && (
                  <button
                    type="button"
                    className="text-xs text-ink-muted transition hover:text-mint"
                    onClick={() => {
                      setMode("signin");
                      resetFeedback();
                    }}
                  >
                    Voltar ao login
                  </button>
                )}

                <button
                  type="submit"
                  disabled={status === "busy"}
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
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
        />
      </div>
    </div>
  );
}
