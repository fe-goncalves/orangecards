/** UID com bypass de drop antecipado + LE garantida (server-side em claim_card). */
export const CLAIM_BYPASS_USER_ID =
  "cbae6d9d-6544-4010-928f-39061448a56e";

export function isClaimBypassUser(userId: string | null | undefined): boolean {
  return Boolean(userId && userId === CLAIM_BYPASS_USER_ID);
}
