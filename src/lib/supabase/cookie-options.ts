/** Chrome limita cookies persistentes a ~400 dias. */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: true,
  maxAge: AUTH_COOKIE_MAX_AGE,
};

export function withPersistentCookies<T extends Record<string, unknown>>(
  options?: T
) {
  return {
    ...authCookieOptions,
    ...options,
    maxAge:
      typeof options?.maxAge === "number"
        ? options.maxAge
        : AUTH_COOKIE_MAX_AGE,
    path: typeof options?.path === "string" ? options.path : "/",
  };
}
