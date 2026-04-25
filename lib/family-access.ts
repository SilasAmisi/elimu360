import { randomBytes } from "node:crypto";

import { sql } from "@/lib/db";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateFamilyCode(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]!;
  }
  return out;
}

/**
 * Ensures a premium parent has a stable family code row (for students to redeem).
 */
export async function ensureFamilyAccessCodeForParent(parentId: number): Promise<string | null> {
  const existing = (await sql.query(`SELECT code FROM family_access_codes WHERE parent_id = $1`, [
    parentId,
  ])) as Array<{ code: string }>;
  if (existing[0]?.code) {
    return existing[0].code;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateFamilyCode();
    try {
      await sql.query(
        `INSERT INTO family_access_codes (parent_id, code) VALUES ($1, $2)`,
        [parentId, code],
      );
      return code;
    } catch {
      // Code collision (unlikely) — retry
    }
  }
  return null;
}

export async function getFamilyCodeForParent(parentId: number): Promise<string | null> {
  const rows = (await sql.query(`SELECT code FROM family_access_codes WHERE parent_id = $1`, [
    parentId,
  ])) as Array<{ code: string }>;
  return rows[0]?.code ?? null;
}
