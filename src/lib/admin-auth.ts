export const ADMIN_SESSION_TOKEN =
  process.env.ADMIN_SESSION_TOKEN || "atelier-admin-session-2026";

export function isValidAdminToken(token: string | null | undefined): boolean {
  return Boolean(token) && token === ADMIN_SESSION_TOKEN;
}
