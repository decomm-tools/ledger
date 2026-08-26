export const sha256Hex = async (text: string): Promise<string> => {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const GENESIS = "genesis";

export const canonical = (entry: {
  n: number;
  ts: string;
  prev: string;
  body: string;
}): string => `${entry.n}\n${entry.ts}\n${entry.prev}\n${entry.body}`;
