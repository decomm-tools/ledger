# decomm ledger

A folder of append-only ledgers for a machine that may never see the internet again. Each note
hashes the last one. Use the CLI on the box, or run a small UI on the LAN.

A text file is a rumor. Anyone can edit last Tuesday's line and leave no scar. Ledger makes that
annoying: every entry names the hash of the entry before it. Change an old note and `verify` fails.

## Why hashing

Each line is JSON:

```json
{
  "n": 0,
  "ts": "2026-08-25T12:00:00.000Z",
  "body": "swapped the drive",
  "prev": "genesis",
  "hash": "…"
}
```

`hash` is SHA-256 of a canonical string:

```
n
ts
prev
body
```

The first note's `prev` is the literal `genesis`. Every later note's `prev` is the previous note's
`hash`. The chain is the history.

Hashing does **not** encrypt the notes. Anyone with the folder can read them. It also does not stop
someone who rewrites the whole file and recomputes every hash. It **does** catch silent edits,
truncations, and "I swear this line was always like that" when you still have the original file or a
copy you verified earlier.

## What verify does

`verify` walks the file from the top:

1. Entry `0` must point at `genesis` and its `n` must be `0`.
2. Recompute the hash from `n`, `ts`, `prev`, and `body`. It must match the stored `hash`.
3. The next entry's `prev` must equal that hash, and `n` must count up by one.

If a body was edited, a line was dropped, or two notes were swapped, verify stops and prints which
index broke. The UI shows **ok** or **broken** next to each ledger the same way.

```sh
./ledger.sh --dir ./ledgers verify
./ledger.sh --dir ./ledgers verify notes
```

## Commands

| Command             | What                                                      |
| ------------------- | --------------------------------------------------------- |
| `init`              | Create the ledger folder (`--dir`)                        |
| `create <name>`     | Empty ledger (`notes.jsonl` in that folder)               |
| `add <name> <text>` | Append a note. `--file path` to read the body from a file |
| `show <name>`       | Print entries                                             |
| `list`              | Ledger names in `--dir`                                   |
| `verify [name]`     | Check one chain, or every ledger in the folder            |
| `serve`             | Small read/write UI                                       |

`--dir` defaults to `./ledgers`, or `LEDGER_DIR`. Names are `[a-zA-Z0-9._-]+` so they stay one file
each.

## Carry-in

Init on a connected machine. Copy the folder. Run dark.

### Init

```sh
deno run -A jsr:@decomm/ledger/init ./ledger
cd ledger
deno task compile
```

Or from this repo: `deno task compile`. That leaves `bin/ledger`.

### Copy

Carry the whole `ledger/` folder onto the isolated box — USB, sneakernet,
[ferry](https://github.com/decomm-tools/ferry). Include `bin/`.

### Run dark

No network. The box never needs to come back online.

```sh
./ledger.sh --dir ./ledgers init
./ledger.sh --dir ./ledgers create notes
./ledger.sh --dir ./ledgers add notes "swapped the drive"
./ledger.sh --dir ./ledgers verify
./ledger.sh --dir ./ledgers serve --port 8787
```

`ledger.sh` uses the compiled binary if present, otherwise `deno run`. The isolated box does not
need Deno if you compiled first.

## UI

```sh
deno task dev
```

That is `serve` with `--watch`. Extra flags after `--`:

```sh
deno task dev -- --port 9000 --dir ./ledgers
```

Open the printed URL. The sidebar lists every `*.jsonl` in `--dir`. Create a ledger, append a note,
see whether the chain still holds.
