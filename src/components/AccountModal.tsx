"use client";

import { useEffect, useState, FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  looksLikeEmail,
  mapNicknameRpcError,
  nicknameValidationMessage,
  sanitizeNicknameInput,
} from "@/lib/nickname";
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
  const currentNick = nicknameOf(user);
  const currentEmail = user.email ?? "";

  const [tab, setTab] = useState<Tab>("profile");
  const [nickname, setNickname] = useState(currentNick);
  const [nickStep, setNickStep] = useState<"edit" | "confirm">("edit");
  const [nickPassword, setNickPassword] = useState("");
  const [nickAck, setNickAck] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailStep, setEmailStep] = useState<"edit" | "confirm">("edit");
  const [emailPassword, setEmailPassword] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passStep, setPassStep] = useState<"edit" | "confirm">("edit");

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

  function switchTab(next: Tab) {
    setTab(next);
    resetMsg();
    setNickStep("edit");
    setEmailStep("edit");
    setPassStep("edit");
    setNickPassword("");
    setEmailPassword("");
    setCurrentPassword("");
    setNickAck(false);
  }

  async function verifyCurrentPassword(password: string): Promise<string | null> {
    if (!currentEmail) return "Conta sem e-mail cadastrado.";
    if (!password) return "Informe a senha atual.";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password,
    });
    if (error) return "Senha atual incorreta.";
    return null;
  }

  function startNickConfirm(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    const nick = sanitizeNicknameInput(nickname);
    const nickError = nicknameValidationMessage(nick);
    if (nickError) {
      setStatus("error");
      setMessage(nickError);
      return;
    }
    if (nick.toLowerCase() === currentNick.trim().toLowerCase()) {
      setStatus("error");
      setMessage("Esse já é o seu nickname.");
      return;
    }
    setNickname(nick);
    setNickStep("confirm");
    setNickPassword("");
    setNickAck(false);
  }

  async function commitNickname(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    if (!nickAck) {
      setStatus("error");
      setMessage("Confirme que entendeu a mudança do link público.");
      return;
    }
    setStatus("busy");
    const authErr = await verifyCurrentPassword(nickPassword);
    if (authErr) {
      setStatus("error");
      setMessage(authErr);
      return;
    }

    const nick = sanitizeNicknameInput(nickname);
    const supabase = createClient();
    const { data: availData } = await supabase.rpc("is_nickname_available", {
      p_nickname: nick,
    });
    const avail = availData as { available?: boolean } | null;
    if (!avail?.available) {
      setStatus("error");
      setMessage("Esse nickname já está em uso.");
      setNickStep("edit");
      return;
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "set_my_nickname",
      { p_nickname: nick }
    );
    if (rpcError) {
      setStatus("error");
      setMessage(rpcError.message);
      return;
    }
    const result = rpcData as {
      ok?: boolean;
      error?: string;
      message?: string;
    } | null;
    if (!result?.ok) {
      setStatus("error");
      setMessage(result?.message || mapNicknameRpcError(result?.error));
      return;
    }
    await supabase.auth.refreshSession();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    if (data.user) onUpdated(data.user);
    setNickname(nick);
    setNickPassword("");
    setNickAck(false);
    setNickStep("edit");
    setStatus("ok");
    setMessage("Nickname atualizado. Seu link público mudou.");
  }

  function startEmailConfirm(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    const mail = newEmail.trim().toLowerCase();
    const mail2 = confirmEmail.trim().toLowerCase();
    if (!looksLikeEmail(mail)) {
      setStatus("error");
      setMessage("Informe um e-mail válido.");
      return;
    }
    if (mail !== mail2) {
      setStatus("error");
      setMessage("Os e-mails não coincidem.");
      return;
    }
    if (mail === currentEmail.trim().toLowerCase()) {
      setStatus("error");
      setMessage("Esse já é o e-mail da conta.");
      return;
    }
    setNewEmail(mail);
    setConfirmEmail(mail2);
    setEmailStep("confirm");
    setEmailPassword("");
  }

  async function commitEmail(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    setStatus("busy");
    const authErr = await verifyCurrentPassword(emailPassword);
    if (authErr) {
      setStatus("error");
      setMessage(authErr);
      return;
    }

    const supabase = createClient();
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.updateUser(
      { email: newEmail.trim().toLowerCase() },
      { emailRedirectTo: `${origin}/auth/callback` }
    );
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    if (data.user) onUpdated(data.user);
    setEmailPassword("");
    setEmailStep("edit");
    setNewEmail("");
    setConfirmEmail("");
    setStatus("ok");
    setMessage(
      "Enviamos um link de confirmação. Confira a caixa de entrada e o spam do novo e-mail (e do atual, se pedido)."
    );
  }

  function startPassConfirm(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    if (!currentPassword) {
      setStatus("error");
      setMessage("Informe a senha atual.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Nova senha: mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("A confirmação da nova senha não confere.");
      return;
    }
    if (newPassword === currentPassword) {
      setStatus("error");
      setMessage("A nova senha precisa ser diferente da atual.");
      return;
    }
    setPassStep("confirm");
  }

  async function commitPassword(e: FormEvent) {
    e.preventDefault();
    resetMsg();
    setStatus("busy");
    const authErr = await verifyCurrentPassword(currentPassword);
    if (authErr) {
      setStatus("error");
      setMessage(authErr);
      setPassStep("edit");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPassStep("edit");
    setStatus("ok");
    setMessage("Senha atualizada com sucesso.");
  }

  const tabs: { id: Tab; label: string; icon: "user" | "mail" | "lock" }[] = [
    { id: "profile", label: "Perfil", icon: "user" },
    { id: "email", label: "E-mail", icon: "mail" },
    { id: "password", label: "Senha", icon: "lock" },
  ];

  const nickChanged =
    sanitizeNicknameInput(nickname).toLowerCase() !==
    currentNick.trim().toLowerCase();

  return (
    <ModalPortal>
      <GlassBackdrop onClose={onClose}>
        <GlassPanel
          wide
          title="Sua conta"
          subtitle={currentEmail || undefined}
          onClose={onClose}
        >
          <div className="mb-4 flex gap-1 rounded-xl bg-white/[0.04] p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
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

          {tab === "profile" && nickStep === "edit" && (
            <form onSubmit={startNickConfirm} className="space-y-4">
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Trocar o nickname muda o link público da coleção. Será pedida a
                senha atual.
              </p>
              <GlassField
                id="acc-nick"
                label="Nickname"
                icon="user"
                value={nickname}
                onChange={(v) => setNickname(sanitizeNicknameInput(v))}
                placeholder="tudo_junto_sem_ponto_final"
                maxLength={32}
              />
              <GlassSubmit busy={status === "busy"} disabled={!nickChanged}>
                Continuar
              </GlassSubmit>

              <div className="rounded-xl border border-white/[0.08] bg-surface-2/40 p-3 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mint">
                  Link público
                </span>
                <p className="mt-1 truncate font-mono text-xs text-ink-muted">
                  {getShareCollectionUrl(currentNick.trim() || user.id)}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = getShareCollectionUrl(
                        currentNick.trim() || user.id
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
                    href={`/u/${encodeURIComponent(currentNick.trim() || user.id)}`}
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

          {tab === "profile" && nickStep === "confirm" && (
            <form onSubmit={commitNickname} className="space-y-4">
              <ConfirmBox
                title="Confirmar novo nickname"
                lines={[
                  `De: ${currentNick || "—"}`,
                  `Para: ${nickname}`,
                ]}
              />
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={nickAck}
                  onChange={(e) => setNickAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-transparent accent-[var(--mint)]"
                  required
                />
                <span className="text-[11px] leading-relaxed text-ink-muted">
                  Entendo que o link público antigo deixa de funcionar e o novo
                  passa a ser{" "}
                  <span className="font-mono text-ink">/u/{nickname}</span>.
                </span>
              </label>
              <GlassField
                id="acc-nick-pass"
                label="Senha atual"
                icon="lock"
                type="password"
                value={nickPassword}
                onChange={setNickPassword}
                autoComplete="current-password"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="glass-btn-ghost flex-1 py-2.5 text-sm"
                  onClick={() => {
                    setNickStep("edit");
                    setNickPassword("");
                    setNickAck(false);
                    resetMsg();
                  }}
                >
                  Voltar
                </button>
                <GlassSubmit busy={status === "busy"}>
                  Confirmar troca
                </GlassSubmit>
              </div>
            </form>
          )}

          {tab === "email" && emailStep === "edit" && (
            <form onSubmit={startEmailConfirm} className="space-y-3">
              <p className="text-[11px] leading-relaxed text-ink-faint">
                E-mail atual:{" "}
                <span className="text-ink-muted">{currentEmail || "—"}</span>
              </p>
              <GlassField
                id="acc-email"
                label="Novo e-mail"
                icon="mail"
                type="email"
                value={newEmail}
                onChange={setNewEmail}
                autoComplete="email"
                required
              />
              <GlassField
                id="acc-email2"
                label="Confirmar novo e-mail"
                icon="mail"
                type="email"
                value={confirmEmail}
                onChange={setConfirmEmail}
                autoComplete="email"
                required
              />
              <GlassSubmit busy={status === "busy"}>Continuar</GlassSubmit>
            </form>
          )}

          {tab === "email" && emailStep === "confirm" && (
            <form onSubmit={commitEmail} className="space-y-4">
              <ConfirmBox
                title="Confirmar novo e-mail"
                lines={[
                  `De: ${currentEmail || "—"}`,
                  `Para: ${newEmail}`,
                ]}
              />
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Vamos pedir a senha atual e enviar um link de verificação.
                Confira também a pasta de spam.
              </p>
              <GlassField
                id="acc-email-pass"
                label="Senha atual"
                icon="lock"
                type="password"
                value={emailPassword}
                onChange={setEmailPassword}
                autoComplete="current-password"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="glass-btn-ghost flex-1 py-2.5 text-sm"
                  onClick={() => {
                    setEmailStep("edit");
                    setEmailPassword("");
                    resetMsg();
                  }}
                >
                  Voltar
                </button>
                <GlassSubmit busy={status === "busy"}>
                  Enviar verificação
                </GlassSubmit>
              </div>
            </form>
          )}

          {tab === "password" && passStep === "edit" && (
            <form onSubmit={startPassConfirm} className="space-y-3">
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Por segurança, confirme a senha atual antes de definir a nova.
              </p>
              <GlassField
                id="acc-pass-current"
                label="Senha atual"
                icon="lock"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                required
              />
              <GlassField
                id="acc-pass"
                label="Nova senha"
                icon="lock"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                minLength={6}
                autoComplete="new-password"
                required
              />
              <GlassField
                id="acc-pass2"
                label="Confirmar nova senha"
                icon="lock"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                minLength={6}
                autoComplete="new-password"
                required
              />
              <GlassSubmit busy={status === "busy"}>Continuar</GlassSubmit>
            </form>
          )}

          {tab === "password" && passStep === "confirm" && (
            <form onSubmit={commitPassword} className="space-y-4">
              <ConfirmBox
                title="Confirmar nova senha"
                lines={["A senha da conta será alterada agora."]}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="glass-btn-ghost flex-1 py-2.5 text-sm"
                  onClick={() => {
                    setPassStep("edit");
                    resetMsg();
                  }}
                >
                  Voltar
                </button>
                <GlassSubmit busy={status === "busy"}>
                  Confirmar troca
                </GlassSubmit>
              </div>
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

function ConfirmBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-mint/20 bg-mint/5 px-3.5 py-3">
      <p className="text-xs font-semibold text-mint">{title}</p>
      <ul className="mt-2 space-y-1 text-[11px] text-ink-muted">
        {lines.map((line) => (
          <li key={line} className="font-mono text-ink">
            {line}
          </li>
        ))}
      </ul>
    </div>
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
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-ink-muted"
      >
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
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none"
        />
      </div>
    </div>
  );
}

function GlassSubmit({
  children,
  busy,
  disabled,
}: {
  children: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="glass-btn w-full flex-1 disabled:opacity-50"
    >
      {busy ? "…" : children}
    </button>
  );
}
