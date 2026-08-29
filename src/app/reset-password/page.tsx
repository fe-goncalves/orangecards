"use client";

import { useEffect, useState, FormEvent, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { Icon } from "@/components/Icon";

export default function ResetPasswordPage() {
  const router = useRouter();
  const formId = useId();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Verifica sessão ativa do link de recuperação
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setStatus("error");
      setMessage("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("As senhas não coincidem. Digite novamente.");
      return;
    }

    setStatus("busy");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Senha redefinida com sucesso! Redirecionando para a coleção...");

    setTimeout(() => {
      router.push("/");
    }, 2500);
  }

  return (
    <SiteShell
      right={
        <Link
          href="/"
          className="glass-btn px-3 py-1.5 text-xs font-bold text-mint sm:text-sm"
        >
          Voltar à Home
        </Link>
      }
    >
      <div className="my-auto flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-mint/30 bg-mint/10 text-mint shadow-[0_0_20px_var(--mint-glow)]">
              <Icon name="lock" size={26} />
            </div>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide text-ink sm:text-3xl">
              REDEFINIR SENHA
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted sm:text-sm">
              Crie uma nova senha de acesso para sua conta da Season 8.
            </p>
          </div>

          {status === "success" ? (
            <div className="rounded-xl border border-mint/40 bg-mint/10 p-5 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-mint/20 text-mint">
                <Icon name="check" size={20} />
              </div>
              <p className="text-sm font-bold text-mint">{message}</p>
              <Link
                href="/"
                className="glass-btn mt-4 inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#04140e] bg-mint shadow-md"
              >
                <span>Acessar Minha Coleção</span>
                <Icon name="arrowRight" size={14} />
              </Link>
            </div>
          ) : hasSession === false ? (
            <div className="rounded-xl border border-white/10 bg-surface-2 p-5 text-center">
              <p className="text-xs leading-relaxed text-ink-muted sm:text-sm">
                Link de recuperação expirado ou inválido. Por favor, solicite um novo link na página inicial clicando em &ldquo;Entrar&rdquo; → &ldquo;Esqueci a senha&rdquo;.
              </p>
              <Link
                href="/"
                className="glass-btn mt-4 inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-mint"
              >
                <span>Ir para a Página Inicial</span>
                <Icon name="arrowRight" size={14} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor={`${formId}-pass`}
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted"
                >
                  Nova Senha
                </label>
                <div className="glass-input-wrap flex items-center gap-2 rounded-xl border border-white/10 bg-surface-2/60 px-3 py-2.5">
                  <Icon name="lock" size={16} className="text-ink-faint shrink-0" />
                  <input
                    id={`${formId}-pass`}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={`${formId}-pass2`}
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted"
                >
                  Confirmar Nova Senha
                </label>
                <div className="glass-input-wrap flex items-center gap-2 rounded-xl border border-white/10 bg-surface-2/60 px-3 py-2.5">
                  <Icon name="lock" size={16} className="text-ink-faint shrink-0" />
                  <input
                    id={`${formId}-pass2`}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a mesma senha"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                </div>
              </div>

              {message && status === "error" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "busy"}
                className="glass-btn mt-2 flex w-full items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider text-[#04140e] bg-mint shadow-lg transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 sm:text-sm"
              >
                {status === "busy" ? (
                  <span>Salvando nova senha...</span>
                ) : (
                  <>
                    <span>Atualizar Senha</span>
                    <Icon name="check" size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
