/**
 * Comma-separated list in ELIMU360_ADMIN_EMAILS; defaults to the project owner bootstrap email.
 * These accounts receive admin in the database on sync and Clerk metadata is aligned on /after-auth.
 */
export function getAdminBootstrapEmails(): string[] {
  const raw = process.env.ELIMU360_ADMIN_EMAILS ?? "swawire@gmail.com";
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminBootstrapEmails().includes(email.trim().toLowerCase());
}
