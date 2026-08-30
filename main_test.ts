import { assertEquals, assertStringIncludes } from "@std/assert";
import { parseArgs } from "./args.ts";
import { handler, run } from "./main.ts";

const req = (path: string, method = "GET", body?: unknown): Request =>
  new Request(new URL(path, "http://localhost"), {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

Deno.test("parseArgs treats -- and --serve as serve", () => {
  assertEquals(parseArgs(["serve"]).command, "serve");
  assertEquals(parseArgs(["--", "serve"]).command, "serve");
  assertEquals(parseArgs(["--serve"]).command, "serve");
  assertEquals(parseArgs(["--serve", "--port", "9000"]).port, 9000);
});

Deno.test("help mentions compile", async () => {
  const text = await run(["--help"]);
  assertStringIncludes(text, "decomm ledger");
  assertStringIncludes(text, "compile");
});

Deno.test("cli create add show verify", async () => {
  const dir = await Deno.makeTempDir({ prefix: "decomm-ledger-cli-" });
  try {
    assertStringIncludes(await run(["--dir", dir, "init"]), dir);
    assertStringIncludes(
      await run(["--dir", dir, "create", "notes"]),
      "Created notes",
    );
    assertStringIncludes(
      await run(["--dir", dir, "add", "notes", "hello"]),
      "#0",
    );
    const shown = await run(["--dir", dir, "show", "notes"]);
    assertStringIncludes(shown, "hello");
    assertStringIncludes(await run(["--dir", dir, "list"]), "notes");
    assertStringIncludes(await run(["--dir", dir, "verify"]), "ok");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

const ledgerSh = async (args: string[]): Promise<string> => {
  const proc = new Deno.Command("sh", {
    args: [`${Deno.cwd()}/ledger.sh`, ...args],
    cwd: Deno.cwd(),
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  const stdout = new TextDecoder().decode(out.stdout);
  const stderr = new TextDecoder().decode(out.stderr);
  if (!out.success) throw new Error(stderr || stdout);
  return stdout;
};

Deno.test("ledger.sh init create add verify is the carry-in example", async () => {
  const dir = await Deno.makeTempDir({ prefix: "decomm-ledger-sh-" });
  try {
    assertStringIncludes(await ledgerSh(["--dir", dir, "init"]), dir);
    assertStringIncludes(
      await ledgerSh(["--dir", dir, "create", "notes"]),
      "Created notes",
    );
    assertStringIncludes(
      await ledgerSh(["--dir", dir, "add", "notes", "swapped the drive"]),
      "#0",
    );
    const shown = await ledgerSh(["--dir", dir, "show", "notes"]);
    assertStringIncludes(shown, "swapped the drive");
    assertStringIncludes(await ledgerSh(["--dir", dir, "verify"]), "ok");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("http read write", async () => {
  const dir = await Deno.makeTempDir({ prefix: "decomm-ledger-http-" });
  try {
    const handle = handler(dir);
    const created = await handle(req("/api/ledgers", "POST", { name: "ops" }));
    assertEquals(created.status, 200);
    const added = await handle(
      req("/api/ledgers/ops", "POST", { body: "rack moved" }),
    );
    assertEquals(added.status, 200);
    const listed = await handle(req("/api/ledgers"));
    const data = await listed.json();
    assertEquals(data.ledgers[0].name, "ops");
    assertEquals(data.ledgers[0].ok, true);
    const home = await handle(req("/"));
    const html = await home.text();
    assertStringIncludes(html, "decomm");
    assertStringIncludes(html, 'viewBox="0 0 32 32"');
    assertStringIncludes(html, 'class="shell"');
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
