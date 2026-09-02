"use client";

import { useEffect, useState, FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { nicknameValidationMessage } from "@/lib/nickname";
import { getShareCollectionUrl } from "@/lib/site";
import { GlassBackdrop, GlassPanel } from "./GlassPanel";
import { Icon } from "./Icon";
import { ModalPortal } from "./ModalPortal";

type Props = {
  user: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
};

type Tab = "profile" | "email" | "password";

function nicknameOf(user: User) {
  return (user.user_metadata?.nickname as string) ?? "";
}

export function AccountModal({ user, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const [nickname, setNickname] = useState(nicknameOf(user));
  const [newEmail, setNewEmail] = useState(user.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function resetMsg() {
    setStatus("idle");
    setMessage("");
  }

  async function saveNickname(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    const nickError = nicknameValidationMessage(nickname);
    if (nickError) {
      setStatus("error");
      setMessage(nickError);
      return;
    }
    setStatus("busy");
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      data: { nickname: nickname.trim() },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    if (data.user) onUpdated(data.user);
    setStatus("ok");
    setMessage("Nickname salvo.");
  }

  async function saveEmail(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    setStatus("busy");
    const supabase = createClient();
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: `${origin}/auth/callback` }
    );
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    if (data.user) onUpdated(data.user);
    setStatus("ok");
    setMessage("Confirme o novo e-mail na caixa de entrada.");
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Senha mínima: 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("As senhas não coincidem.");
      return;
    }
    setStatus("busy");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setStatus("ok");
    setMessage("Senha atualizada.");
  }

  const tabs: { id: Tab; label: string; icon: "user" | "mail" | "lock" }[] = [
    { id: "profile", label: "Perfil", icon: "user" },
    { id: "email", label: "E-mail", icon: "mail" },
    { id: "password", label: "Senha", icon: "lock" },
  ];

  return (
    <ModalPortal>
      <GlassBackdrop onClose={onClose}>
        <GlassPanel
          wide
          title="Sua conta"
          subtitle={user.email ?? undefined}
          onClose={onClose}
        >
          <div className="mb-4 flex gap-1 rounded-xl bg-white/[0.04] p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  resetMsg();
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition ${
                  tab === t.id
                    ? "bg-white/10 text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Icon name={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <form onSubmit={saveNickname} className="space-y-4">
              <GlassField
                id="acc-nick"
                label="Nickname"
                icon="user"
                value={nickname}
                onChange={setNickname}
                placeholder="Como aparece na coleção"
                maxLength={32}
              />
              <GlassSubmit busy={status === "busy"}>Salvar nickname</GlassSubmit>

              {/* Link Compartilhável da Coleção */}
              <div className="rounded-xl border border-white/[0.08] bg-surface-2/40 p-3 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mint">
                  Link Público da sua Coleção
                </span>
                <p className="mt-1 text-xs font-mono text-ink-muted truncate">
                  {getShareCollectionUrl(nickname.trim() || user.id)}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = getShareCollectionUrl(
                        nickname.trim() || user.id
                      );
                      navigator.clipboard.writeText(url);
                      setMessage("Link da coleção copiado!");
                      setStatus("ok");
                    }}
                    className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] py-1.5 text-center text-xs font-semibold text-ink transition hover:border-mint/40 hover:text-mint"
                  >
                    Copiar Link
                  </button>
                  <a
                    href={`/u/${encodeURIComponent(nickname.trim() || user.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-mint/40 hover:text-mint"
                  >
                    <span>Abrir</span>
                    <Icon name="externalLink" size={12} />
                  </a>
                </div>
              </div>
            </form>
          )}

          {tab === "email" && (
            <form onSubmit={saveEmail} className="space-y-3">
              <p className="text-xs leading-relaxed text-ink-faint">
                Enviaremos um link de verificação para o novo endereço.
              </p>
              <GlassField
                id="acc-email"
                label="Novo e-mail"
                icon="mail"
                type="email"
                value={newEmail}
                onChange={setNewEmail}
                required
              />
              <GlassSubmit busy={status === "busy"}>Alterar e-mail</GlassSubmit>
            </form>
          )}

          {tab === "password" && (
            <form onSubmit={savePassword} className="space-y-3">
              <GlassField
                id="acc-pass"
                label="Nova senha"
                icon="lock"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                minLength={6}
                autoComplete="new-password"
              />
              <GlassField
                id="acc-pass2"
                label="Confirmar senha"
                icon="lock"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                minLength={6}
                autoComplete="new-password"
              />
              <GlassSubmit busy={status === "busy"}>Atualizar senha</GlassSubmit>
            </form>
          )}

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
  );
}

function GlassField({
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
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
        />
      </div>
    </div>
  );
}

function GlassSubmit({
  children,
  busy,
}: {
  children: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <button type="submit" disabled={busy} className="glass-btn w-full disabled:opacity-50">
      {busy ? "…" : children}
    </button>
  );
}
