import { assertEquals, assertRejects } from "@std/assert";
import { appendEntry, createLedger, listLedgers, readLedger, verifyLedger } from "./store.ts";

Deno.test("append hashes the previous entry", async () => {
  const dir = await Deno.makeTempDir({ prefix: "decomm-ledger-" });
  try {
    await createLedger(dir, "notes");
    const a = await appendEntry(dir, "notes", "first", "2026-01-01T00:00:00.000Z");
    const b = await appendEntry(dir, "notes", "second", "2026-01-01T00:01:00.000Z");
    assertEquals(a.n, 0);
    assertEquals(a.prev, "genesis");
    assertEquals(b.n, 1);
    assertEquals(b.prev, a.hash);
    const again = await appendEntry(dir, "notes", "first", "2026-01-01T00:00:00.000Z");
    // different n/prev so different hash even with same body
    assertEquals(again.hash === a.hash, false);

    const listed = await listLedgers(dir);
    assertEquals(listed, ["notes"]);
    const verify = await verifyLedger(dir, "notes");
    assertEquals(verify, { ok: true, count: 3 });
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("tamper breaks verify", async () => {
  const dir = await Deno.makeTempDir({ prefix: "decomm-ledger-" });
  try {
    await createLedger(dir, "ops");
    await appendEntry(dir, "ops", "ok", "2026-01-01T00:00:00.000Z");
    const path = `${dir}/ops.jsonl`;
    const raw = await Deno.readTextFile(path);
    await Deno.writeTextFile(path, raw.replace("ok", "nope"));
    const verify = await verifyLedger(dir, "ops");
    assertEquals(verify.ok, false);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("same body at same slot is deterministic", async () => {
  const dir = await Deno.makeTempDir({ prefix: "decomm-ledger-" });
  try {
    await createLedger(dir, "a");
    await createLedger(dir, "b");
    const left = await appendEntry(dir, "a", "hi", "2026-01-01T00:00:00.000Z");
    const right = await appendEntry(dir, "b", "hi", "2026-01-01T00:00:00.000Z");
    assertEquals(left.hash, right.hash);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("bad name rejected", async () => {
  const dir = await Deno.makeTempDir({ prefix: "decomm-ledger-" });
  try {
    await assertRejects(() => createLedger(dir, "../x"), Error, "Bad ledger name");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("read missing ledger", async () => {
  const dir = await Deno.makeTempDir({ prefix: "decomm-ledger-" });
  try {
    await assertRejects(() => readLedger(dir, "none"), Error, "No ledger named none");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
