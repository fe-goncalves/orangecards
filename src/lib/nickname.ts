const NICKNAME_RE = /^[a-zA-Z0-9_-]{2,32}$/;

/** Tokens reservados (match exato) — espelha is_valid_nickname_format no SQL. */
const RESERVED_NICKS = new Set([
  "select",
  "insert",
  "update",
  "delete",
  "drop",
  "union",
  "script",
  "javascript",
  "onerror",
  "onload",
  "ignore",
  "system",
  "prompt",
  "assistant",
  "admin",
  "null",
  "undefined",
]);

/**
 * Anti injection / prompt injection em identificadores.
 * Nickname já é charset fechado; ainda bloqueamos markup e tokens reservados.
 */
const INJECTION_MARKUP_RE = /[<>`]|--|\/\*|\*\/|[\u0000-\u001F]/;

export function normalizeNickname(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

/** Remove caracteres inválidos enquanto digita (força “tudo junto”). */
export function sanitizeNicknameInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
}

export function isValidNickname(value: string): boolean {
  return nicknameValidationMessage(value) === null;
}

export function nicknameValidationMessage(value: string): string | null {
  const nick = normalizeNickname(value);
  if (!nick) return "Informe um nickname.";
  if (/\s/.test(value)) return "Nickname deve ser tudo junto, sem espaços.";
  if (nick.length < 2) return "Mínimo de 2 caracteres.";
  if (nick.length > 32) return "Máximo de 32 caracteres.";
  if (nick.endsWith(".")) return "Nickname não pode terminar com ponto.";
  if (nick.startsWith(".") || nick.startsWith("-") || nick.startsWith("_")) {
    return "Nickname não pode começar com . _ ou -.";
  }
  if (nick.endsWith("-") || nick.endsWith("_")) {
    return "Nickname não pode terminar com _ ou -.";
  }
  if (!NICKNAME_RE.test(nick)) {
    return "Use apenas letras, números, _ ou - (sem espaços).";
  }
  if (INJECTION_MARKUP_RE.test(nick) || nick.includes("--")) {
    return "Nickname contém conteúdo não permitido.";
  }
  if (RESERVED_NICKS.has(nick.toLowerCase())) {
    return "Esse nickname não está disponível.";
  }
  return null;
}

/** Para identificadores de login (nick ou e-mail) — nunca senha. */
export function rejectInjectedText(
  value: string,
  label = "Campo"
): string | null {
  const v = value.trim();
  if (!v) return null;
  if (INJECTION_MARKUP_RE.test(v) || v.includes("--")) {
    return `${label} contém conteúdo não permitido.`;
  }
  if (v.length > 200) return `${label} muito longo.`;
  return null;
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function mapNicknameRpcError(error?: string | null): string {
  switch (error) {
    case "nickname_taken":
      return "Esse nickname já está em uso.";
    case "invalid_nickname":
    case "invalid":
      return "Nickname inválido.";
    case "not_authenticated":
      return "Faça login novamente.";
    default:
      return "Não foi possível salvar o nickname.";
  }
}
