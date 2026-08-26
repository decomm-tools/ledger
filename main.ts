/**
 * Append-only notes with a SHA-256 hash chain, for a machine that may never
 * come back online.
 *
 * Each entry stores `prev` (the previous hash, or the literal `genesis`) and
 * `hash` (SHA-256 of `n`, `ts`, `prev`, and `body`). `verify` walks the file
 * and fails if a body was edited, a line was dropped, or two notes were swapped.
 *
 * Use {@linkcode run} from the CLI, or {@linkcode handler} behind `Deno.serve`
 * for a small LAN UI. Point `--dir` at a folder of `*.jsonl` ledgers.
 *
 * @example Run the CLI
 * ```ts
 * import { run } from "jsr:@decomm/ledger";
 *
 * await run(["--dir", "./ledgers", "init"]);
 * await run(["--dir", "./ledgers", "create", "notes"]);
 * await run(["--dir", "./ledgers", "add", "notes", "swapped the drive"]);
 * console.log(await run(["--dir", "./ledgers", "verify", "notes"]));
 * ```
 *
 * @example Serve the UI
 * ```ts
 * import { handler } from "jsr:@decomm/ledger";
 *
 * Deno.serve({ port: 8787 }, handler("./ledgers"));
 * ```
 *
 * @module
 */
import { parseArgs } from "./args.ts";
import {
  appendEntry,
  createLedger,
  listLedgers,
  readLedger,
  verifyAll,
  verifyLedger,
} from "./store.ts";
import { page } from "./ui.ts";

const HELP = `decomm ledger

Append-only notes with a hash chain. Point --dir at a folder of ledgers.

Commands:
  init                 Create the ledger folder
  create <name>        New empty ledger
  add <name> <text>    Append a note
  show <name>          Print entries
  list                 Names in --dir
  verify [name]        Check the chain
  serve                Small read/write UI

Examples:
  ./ledger.sh --dir ./ledgers init
  ./ledger.sh --dir ./ledgers create notes
  ./ledger.sh --dir ./ledgers add notes "swapped the drive"
  ./ledger.sh --dir ./ledgers serve --port 8787

Env: LEDGER_DIR

Compile on a connected machine (no Deno needed on the far side):
  deno task compile
`;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/**
 * HTTP handler for the ledger UI and JSON API.
 *
 * Serves the HTML UI at `/` and `/index.html`. JSON routes:
 *
 * - `GET /api/ledgers` — names, verify status, and entry counts
 * - `POST /api/ledgers` — `{ name }` creates an empty ledger
 * - `GET /api/ledgers/:name` — entries plus a verify result
 * - `POST /api/ledgers/:name` — `{ body }` appends a note
 *
 * @param dir Folder of `*.jsonl` ledgers (created by `init` / `create`).
 * @returns A `Deno.serve` callback.
 *
 * @example
 * ```ts
 * import { handler } from "jsr:@decomm/ledger";
 * Deno.serve({ port: 8787 }, handler("./ledgers"));
 * ```
 */
export const handler = (dir: string) => async (req: Request): Promise<Response> => {
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = new URL(req.url);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response(page(), { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  if (url.pathname === "/api/ledgers" && req.method === "GET") {
    const names = await listLedgers(dir);
    const ledgers = [];
    for (const name of names) {
      const result = await verifyLedger(dir, name);
      ledgers.push({ name, ok: result.ok, count: result.ok ? result.count : 0 });
    }
    return json({ dir, ledgers });
  }
  if (url.pathname === "/api/ledgers" && req.method === "POST") {
    const body = await req.json() as { name?: string };
    if (!body.name) return json({ error: "name required" }, 400);
    try {
      await createLedger(dir, body.name);
      return json({ name: body.name });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : String(error) }, 400);
    }
  }
  const one = new URLPattern({ pathname: "/api/ledgers/:name" });
  const match = one.exec(url);
  if (match) {
    const name = decodeURIComponent(match.pathname.groups.name ?? "");
    if (req.method === "GET") {
      try {
        const entries = await readLedger(dir, name);
        const verify = await verifyLedger(dir, name);
        return json({ name, entries, verify });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : String(error) }, 404);
      }
    }
    if (req.method === "POST") {
      const body = await req.json() as { body?: string };
      try {
        const entry = await appendEntry(dir, name, body.body ?? "");
        return json(entry);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : String(error) }, 400);
      }
    }
  }
  return new Response("Not Found", { status: 404 });
};

const printEntries = async (dir: string, name: string): Promise<string> => {
  const entries = await readLedger(dir, name);
  if (entries.length === 0) return `${name}: empty\n`;
  return entries.map((e) => `#${e.n} ${e.ts}\n${e.body}\n${e.hash}\n`).join("\n") + "\n";
};

/**
 * Run one CLI command and return the text that would be printed.
 *
 * Commands: `init`, `create`, `add`, `show`, `list`, `verify`, `serve`.
 * `serve` starts {@linkcode handler} and returns after the server is listening.
 *
 * @param argv Arguments after the binary name, including `--dir` and `--port`.
 * @returns Help text, or a trailing-newline status string for the command.
 *
 * @example
 * ```ts
 * import { run } from "jsr:@decomm/ledger";
 * await run(["--dir", "./ledgers", "add", "notes", "swapped the drive"]);
 * ```
 */
export const run = async (argv: string[]): Promise<string> => {
  const args = parseArgs(argv);
  if (args.help || args.command === "" || args.command === "help") return HELP;
  const dir = args.dir;

  switch (args.command) {
    case "init": {
      await Deno.mkdir(dir, { recursive: true });
      return `Ledger folder ${dir}\n`;
    }
    case "create": {
      if (!args.name) throw new Error("create needs a name");
      await createLedger(dir, args.name);
      return `Created ${args.name}\n`;
    }
    case "add": {
      if (!args.name) throw new Error("add needs a ledger name");
      let body = args.body;
      if (args.file) body = await Deno.readTextFile(args.file);
      const entry = await appendEntry(dir, args.name, body);
      return `#${entry.n} ${entry.hash}\n`;
    }
    case "show": {
      if (!args.name) throw new Error("show needs a ledger name");
      return await printEntries(dir, args.name);
    }
    case "list": {
      const names = await listLedgers(dir);
      return (names.length ? names.join("\n") : "No ledgers.") + "\n";
    }
    case "verify": {
      if (args.name) {
        const result = await verifyLedger(dir, args.name);
        if (!result.ok) throw new Error(`${args.name}: ${result.reason}`);
        return `${args.name}: ok (${result.count})\n`;
      }
      const rows = await verifyAll(dir);
      if (rows.length === 0) return "No ledgers.\n";
      const bad = rows.filter((row) => !row.result.ok);
      const lines = rows.map((row) =>
        row.result.ok
          ? `${row.name}: ok (${row.result.count})`
          : `${row.name}: ${row.result.reason}`
      );
      if (bad.length) throw new Error(lines.join("\n"));
      return lines.join("\n") + "\n";
    }
    case "serve": {
      if (!Number.isInteger(args.port) || args.port <= 0) {
        throw new Error("--port must be a positive integer");
      }
      await Deno.mkdir(dir, { recursive: true });
      Deno.serve({ port: args.port }, handler(dir));
      return `ledger UI on http://127.0.0.1:${args.port}  dir=${dir}\n`;
    }
    default:
      throw new Error(`Unknown command: ${args.command}`);
  }
};

if (import.meta.main) {
  try {
    const out = await run(Deno.args);
    if (out) console.log(out.endsWith("\n") ? out.slice(0, -1) : out);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    Deno.exit(1);
  }
}
