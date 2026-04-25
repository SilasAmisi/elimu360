const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCodeSegment(length: number) {
  let output = "";
  for (let idx = 0; idx < length; idx += 1) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    output += CODE_CHARS[randomIndex];
  }
  return output;
}

export function generateClassCode() {
  return `ELM-${randomCodeSegment(6)}`;
}
