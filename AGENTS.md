# decomm ledger

TypeScript uses arrow functions only. Constructors are the exception.

Ledgers are append-only jsonl with a hash chain. Do not rewrite history in place. No telemetry.
`deno task compile` and `./ledger.sh` so the tool runs without Deno on the isolated box.
