/**
 * Scaffold a local decomm ledger folder you can copy onto an isolated machine.
 *
 * @module
 */
const HELP = `decomm ledger

Copy this tool into a folder you can carry onto an isolated machine.

  deno run -A jsr:@decomm/ledger/init ./my-ledger
  cd my-ledger
  deno task compile
  ./ledger.sh --dir ./ledgers init
`;

const join = (root: string, name: string): string => `${root}/${name}`;

const resolveDir = (directory: string): string => {
  if (directory.startsWith("/")) return directory;
  return `${Deno.cwd()}/${directory}`;
};

const FILES = [
  "main.ts",
  "args.ts",
  "hash.ts",
  "store.ts",
  "ui.ts",
  "ledger.sh",
  "deno.json",
  "README.md",
  "LICENSE",
] as const;

export const init = async (
  directory: string,
  options: { force?: boolean } = {},
): Promise<void> => {
  const root = resolveDir(directory);
  const here = import.meta.dirname;
  if (!here) throw new Error("init needs a file path (not a blob URL)");

  await Deno.mkdir(root, { recursive: true });
  const existing = [...Deno.readDirSync(root)];
  if (existing.length > 0 && !options.force) {
    if (!Deno.stdin.isTerminal()) {
      throw new Error("Directory is not empty. Re-run with --force.");
    }
    const ok = confirm("Directory is not empty. Continue?");
    if (!ok) throw new Error("Directory is not empty, aborting.");
  }

  for (const name of FILES) {
    const bytes = await Deno.readFile(join(here, name));
    await Deno.writeFile(join(root, name), bytes);
  }
  await Deno.chmod(join(root, "ledger.sh"), 0o755);

  console.log(`Ledger copied to ${root}`);
  console.log("On a connected machine: deno task compile");
  console.log("Then: ./ledger.sh --dir ./ledgers init");
};

if (import.meta.main) {
  const args = Deno.args;
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(HELP);
    Deno.exit(args.length === 0 ? 2 : 0);
  }
  const force = args.includes("--force") || args.includes("-f");
  const directory = args.find((arg) => !arg.startsWith("-"));
  if (!directory) {
    console.log(HELP);
    Deno.exit(2);
  }
  try {
    await init(directory, { force });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    Deno.exit(1);
  }
}
