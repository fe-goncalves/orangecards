const NICKNAME_RE = /^[a-zA-Z0-9_-]{2,32}$/;

export function normalizeNickname(value: string): string {
  return value.trim();
}

export function isValidNickname(value: string): boolean {
  return NICKNAME_RE.test(normalizeNickname(value));
}

export function nicknameValidationMessage(value: string): string | null {
  const nick = normalizeNickname(value);
  if (!nick) return "Informe um nickname.";
  if (nick.length < 2) return "Mínimo de 2 caracteres.";
  if (nick.length > 32) return "Máximo de 32 caracteres.";
  if (!NICKNAME_RE.test(nick)) {
    return "Use apenas letras, números, _ ou - (sem espaços).";
  }
  return null;
}
