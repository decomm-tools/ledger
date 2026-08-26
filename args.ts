export type LedgerArgs = {
  command: string;
  name: string;
  dir: string;
  port: number;
  help: boolean;
  body: string;
  file?: string;
};

const take = (args: string[], i: number, flag: string): string => {
  const value = args[i];
  if (!value || value.startsWith("-")) throw new Error(`${flag} needs a value`);
  return value;
};

export const parseArgs = (argv: string[]): LedgerArgs => {
  const parsed: LedgerArgs = {
    command: "",
    name: "",
    dir: Deno.env.get("LEDGER_DIR") ?? "./ledgers",
    port: 8787,
    help: false,
    body: "",
  };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--dir") parsed.dir = take(argv, ++i, "--dir");
    else if (arg === "--port") parsed.port = Number(take(argv, ++i, "--port"));
    else if (arg === "--file") parsed.file = take(argv, ++i, "--file");
    else if (arg === "--") continue;
    else if (arg === "--serve") rest.push("serve");
    else if (!arg.startsWith("-")) rest.push(arg);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  parsed.command = rest[0] ?? "";
  parsed.name = rest[1] ?? "";
  parsed.body = rest.slice(2).join(" ");
  return parsed;
};
