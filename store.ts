import { canonical, GENESIS, sha256Hex } from "./hash.ts";

const join = (root: string, name: string): string => `${root}/${name}`;

export type Entry = {
  n: number;
  ts: string;
  body: string;
  prev: string;
  hash: string;
};

export const ledgerPath = (dir: string, name: string): string => join(dir, `${name}.jsonl`);

export const isLedgerName = (name: string): boolean => /^[a-zA-Z0-9._-]+$/.test(name);

export const listLedgers = async (dir: string): Promise<string[]> => {
  const names: string[] = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.endsWith(".jsonl")) {
        names.push(entry.name.slice(0, -".jsonl".length));
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
  return names.sort();
};

const readLines = async (path: string): Promise<Entry[]> => {
  const text = await Deno.readTextFile(path);
  const entries: Entry[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    entries.push(JSON.parse(line) as Entry);
  }
  return entries;
};

export const readLedger = async (dir: string, name: string): Promise<Entry[]> => {
  if (!isLedgerName(name)) throw new Error(`Bad ledger name: ${name}`);
  try {
    return await readLines(ledgerPath(dir, name));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) throw new Error(`No ledger named ${name}`);
    throw error;
  }
};

export const createLedger = async (dir: string, name: string): Promise<void> => {
  if (!isLedgerName(name)) throw new Error(`Bad ledger name: ${name}`);
  await Deno.mkdir(dir, { recursive: true });
  const path = ledgerPath(dir, name);
  try {
    await Deno.stat(path);
    throw new Error(`Ledger ${name} already exists`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) throw error;
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  await Deno.writeTextFile(path, "");
};

export const appendEntry = async (
  dir: string,
  name: string,
  body: string,
  ts = new Date().toISOString(),
): Promise<Entry> => {
  if (!body.trim()) throw new Error("Note is empty");
  const entries = await readLedger(dir, name);
  const prev = entries.at(-1)?.hash ?? GENESIS;
  const n = entries.length;
  const hash = await sha256Hex(canonical({ n, ts, prev, body }));
  const entry: Entry = { n, ts, body, prev, hash };
  await Deno.writeTextFile(ledgerPath(dir, name), JSON.stringify(entry) + "\n", { append: true });
  return entry;
};

export type VerifyResult = { ok: true; count: number } | { ok: false; at: number; reason: string };

export const verifyLedger = async (dir: string, name: string): Promise<VerifyResult> => {
  const entries = await readLedger(dir, name);
  let prev = GENESIS;
  for (const entry of entries) {
    if (entry.prev !== prev) {
      return { ok: false, at: entry.n, reason: `prev mismatch at ${entry.n}` };
    }
    const expect = await sha256Hex(
      canonical({ n: entry.n, ts: entry.ts, prev: entry.prev, body: entry.body }),
    );
    if (entry.hash !== expect) {
      return { ok: false, at: entry.n, reason: `hash mismatch at ${entry.n}` };
    }
    prev = entry.hash;
  }
  for (let i = 0; i < entries.length; i++) {
    if (entries[i]!.n !== i) {
      return { ok: false, at: i, reason: `index mismatch at ${i}` };
    }
  }
  return { ok: true, count: entries.length };
};

export const verifyAll = async (
  dir: string,
): Promise<{ name: string; result: VerifyResult }[]> => {
  const names = await listLedgers(dir);
  const out = [];
  for (const name of names) {
    out.push({ name, result: await verifyLedger(dir, name) });
  }
  return out;
};
