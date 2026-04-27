/**
 * node-pg returns BIGINT / BIGSERIAL as strings by default. Use this for Map keys
 * and JSON so client numeric IDs match server lookups.
 */
export function pgInt8(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return Number(value);
}
