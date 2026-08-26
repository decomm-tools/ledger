const MARK =
  `<svg class="mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="3.5" y="8.5" width="11" height="15" rx="3" stroke="currentColor" stroke-width="1.75"/>
  <rect x="6.75" y="12.5" width="1.75" height="5" rx="0.5" fill="currentColor"/>
  <rect x="9.75" y="12.5" width="1.75" height="5" rx="0.5" fill="currentColor"/>
  <rect x="20" y="10.5" width="8.5" height="11" rx="2.25" fill="currentColor"/>
  <rect x="17.5" y="13" width="3.25" height="1.75" rx="0.5" fill="currentColor"/>
  <rect x="17.5" y="17.25" width="3.25" height="1.75" rx="0.5" fill="currentColor"/>
</svg>`;

export const page = (): string =>
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>decomm ledger</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      display: flex;
      flex-direction: column;
      font: 16px/1.5 ui-sans-serif, system-ui, sans-serif;
      background: #09090b;
      color: #fafafa;
    }
    .top {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid #27272a;
      background: #09090b;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-width: 0;
    }
    .mark { width: 2rem; height: 2rem; color: #f5b942; flex: 0 0 auto; }
    .brand-name { font-size: 1.15rem; font-weight: 650; letter-spacing: -0.03em; }
    .brand-name span { color: #a1a1aa; font-weight: 500; }
    .dir {
      color: #a1a1aa;
      font: 12px/1.4 ui-monospace, Menlo, monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 40vw;
    }
    .shell {
      flex: 1 1 auto;
      display: grid;
      grid-template-columns: 18rem minmax(0, 1fr);
      min-height: 0;
    }
    .side {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      min-height: 0;
      padding: 1rem;
      border-right: 1px solid #27272a;
      background: #111113;
    }
    .label {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 650;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #f5b942;
    }
    .new-ledger {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 0 0 auto;
    }
    .new-ledger input {
      width: 100%;
      background: #09090b;
      border: 1px solid #27272a;
      color: #fafafa;
      border-radius: 0.6rem;
      padding: 0.55rem 0.7rem;
      font: inherit;
    }
    .btn {
      border: 0;
      border-radius: 999px;
      padding: 0.5rem 0.9rem;
      font: 650 0.85rem/1 ui-sans-serif, system-ui, sans-serif;
      cursor: pointer;
      background: #f5b942;
      color: #09090b;
    }
    .btn:hover { background: #e8a317; }
    .list {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .list button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
      text-align: left;
      background: transparent;
      border: 1px solid transparent;
      color: #fafafa;
      padding: 0.55rem 0.65rem;
      border-radius: 0.6rem;
      font: inherit;
      cursor: pointer;
    }
    .list button:hover { background: #18181b; }
    .list button.active { background: #18181b; border-color: #27272a; }
    .list .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ok { color: #86efac; font-size: 0.7rem; flex: 0 0 auto; }
    .bad { color: #f87171; font-size: 0.7rem; flex: 0 0 auto; }
    .pane {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      padding: 1.25rem 1.5rem;
    }
    .pane-head {
      flex: 0 0 auto;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      margin: 0 0 1rem;
    }
    .pane-head h1 {
      margin: 0;
      font-size: 1.35rem;
      letter-spacing: -0.03em;
    }
    .composer {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin: 0 0 1rem;
    }
    .composer textarea {
      width: 100%;
      min-height: 6rem;
      resize: vertical;
      background: #111113;
      border: 1px solid #27272a;
      color: #fafafa;
      border-radius: 0.75rem;
      padding: 0.75rem 0.85rem;
      font: inherit;
    }
    .composer .btn { align-self: flex-end; }
    .entries {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .entry {
      border: 1px solid #27272a;
      border-radius: 0.85rem;
      padding: 0.85rem 1rem;
      background: #111113;
    }
    .entry-meta {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: #a1a1aa;
      margin: 0 0 0.4rem;
    }
    .hash {
      font: 12px/1.4 ui-monospace, Menlo, monospace;
      color: #71717a;
      word-break: break-all;
      margin-top: 0.5rem;
    }
    .muted { color: #a1a1aa; }
    .hint { margin: 0; color: #a1a1aa; }
    @media (max-width: 48rem) {
      .shell { grid-template-columns: 1fr; grid-template-rows: minmax(12rem, 32vh) minmax(0, 1fr); }
      .side { border-right: 0; border-bottom: 1px solid #27272a; }
      .dir { max-width: 45vw; }
    }
  </style>
</head>
<body>
  <div class="top">
    <div class="brand">
      ${MARK}
      <div class="brand-name">decomm <span>ledger</span></div>
    </div>
    <div class="dir" id="dir"></div>
  </div>
  <div class="shell">
    <aside class="side">
      <p class="label">Ledgers</p>
      <form class="new-ledger" id="newLedger">
        <input name="name" placeholder="new ledger" required />
        <button class="btn" type="submit">Create</button>
      </form>
      <div class="list" id="list"></div>
    </aside>
    <section class="pane">
      <div class="pane-head">
        <h1 id="title">Pick a ledger</h1>
        <p id="status" class="muted"></p>
      </div>
      <form class="composer" id="note" hidden>
        <textarea name="body" placeholder="What happened" required></textarea>
        <button class="btn" type="submit">Append</button>
      </form>
      <div class="entries" id="entries">
        <p class="hint">Create a ledger or pick one from the list.</p>
      </div>
    </section>
  </div>
  <script>
    const listEl = document.getElementById("list");
    const entriesEl = document.getElementById("entries");
    const titleEl = document.getElementById("title");
    const statusEl = document.getElementById("status");
    const noteForm = document.getElementById("note");
    let current = "";

    const api = (path, opts) => fetch(path, opts).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    });

    const loadList = async () => {
      const data = await api("/api/ledgers");
      document.getElementById("dir").textContent = data.dir;
      listEl.innerHTML = "";
      if (!data.ledgers.length) {
        listEl.innerHTML = "<p class=\\"hint\\">None yet</p>";
        return;
      }
      for (const row of data.ledgers) {
        const btn = document.createElement("button");
        btn.type = "button";
        const name = document.createElement("span");
        name.className = "name";
        name.textContent = row.name;
        const mark = document.createElement("span");
        mark.className = row.ok ? "ok" : "bad";
        mark.textContent = row.ok ? "ok" : "broken";
        btn.append(name, mark);
        if (row.name === current) btn.classList.add("active");
        btn.addEventListener("click", () => show(row.name));
        listEl.append(btn);
      }
    };

    const show = async (name) => {
      current = name;
      const data = await api("/api/ledgers/" + encodeURIComponent(name));
      titleEl.textContent = name;
      noteForm.hidden = false;
      statusEl.className = data.verify.ok ? "ok" : "bad";
      statusEl.textContent = data.verify.ok
        ? data.verify.count + " entries, chain holds"
        : data.verify.reason;
      entriesEl.innerHTML = "";
      if (!data.entries.length) {
        entriesEl.innerHTML = "<p class=\\"hint\\">No notes yet.</p>";
      }
      for (const entry of data.entries.slice().reverse()) {
        const div = document.createElement("div");
        div.className = "entry";
        div.innerHTML = "<div class=\\"entry-meta\\"><span>#" + entry.n +
          "</span><span>" + escapeHtml(entry.ts) + "</span></div><div>" +
          escapeHtml(entry.body) + "</div><div class=\\"hash\\">" + entry.hash + "</div>";
        entriesEl.append(div);
      }
      await loadList();
    };

    const escapeHtml = (value) => value
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

    document.getElementById("newLedger").addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = event.target.name.value.trim();
      await api("/api/ledgers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      event.target.reset();
      await show(name);
    });

    noteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const body = event.target.body.value;
      await api("/api/ledgers/" + encodeURIComponent(current), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      event.target.reset();
      await show(current);
    });

    loadList().catch((err) => { statusEl.textContent = String(err); statusEl.className = "bad"; });
  </script>
</body>
</html>
`;
