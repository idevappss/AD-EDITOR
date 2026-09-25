// Memory tab (#/memory): the company brain. The company profile, every transcript, the shared playbooks and the
// brand kit from Assets, in one place. Owned by the MEMORY session; app.js imports this and calls mountMemory(app).
const API = "/api/memory";
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const svg = (body, size = 15) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  upload: svg(`<path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>`),
  search: svg(`<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>`, 16),
  close: svg(`<path d="M6 6l12 12M18 6 6 18"/>`),
  edit: svg(`<path d="M4 20h4L19 9l-4-4L4 16z"/>`, 14),
  paste: svg(`<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>`),
};

const TABS = [
  { id: "company", label: "Company" },
  { id: "transcripts", label: "Transcripts" },
  { id: "playbooks", label: "Playbooks" },
  { id: "brand", label: "Brand kit" },
  { id: "api", label: "For other channels" },
];
const state = { tab: "company", data: null, q: "", hits: null, kind: "all", editing: false };

function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 2400);
}

async function api(url, { method = "GET", body, form } = {}) {
  const res = await fetch(API + url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// Just enough Markdown for the shared docs: headings, lists, tables, quotes, bold/italic/code, links.
function md(src) {
  const inline = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = String(src || "").split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) continue;
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`);
    else if (/^---+$/.test(l.trim())) out.push("<hr>");
    else if (/^\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      i--;
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const body = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r));
      out.push(`<table>${body.map((r, n) => `<tr>${cells(r).map((c) => (n ? `<td>${inline(c)}</td>` : `<th>${inline(c)}</th>`)).join("")}</tr>`).join("")}</table>`);
    } else if (/^\s*([-*]|\d+\.)\s/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ""));
      i--;
      out.push(`<${ordered ? "ol" : "ul"}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`);
    } else if (/^>\s?/.test(l)) out.push(`<blockquote>${inline(l.replace(/^>\s?/, ""))}</blockquote>`);
    else out.push(`<p>${inline(l)}</p>`);
  }
  return out.join("\n");
}

const kindLabel = (id) => state.data?.kinds.find((k) => k.id === id)?.label || (id === "project" ? "App project" : id);
const fmtDate = (d) => (d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No date");
const ago = (iso) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

// ---------------------------------------------------------------------------
// Sections

function companyView() {
  const c = state.data.company;
  if (state.editing)
    return `<div class="mm-edit">
      <textarea id="mm-company" spellcheck="true">${esc(c.body)}</textarea>
      <div class="mm-edit-bar"><span class="muted small">Markdown. The old version is kept in history when you save.</span>
        <button class="btn ghost" data-act="cancel-edit">Cancel</button><button class="btn primary" data-act="save-company">Save</button></div>
    </div>`;
  if (!c.body) return `<div class="empty">No company profile yet. Add transcripts and ask the Memory chat to learn from them.</div>`;
  return `<div class="mm-doc-head"><span class="muted small">shared/COMPANY.md · updated ${ago(c.updatedAt)}</span>
      <button class="btn sm ghost" data-act="edit-company">${ICON.edit} Edit</button></div>
    <article class="mm-doc">${md(c.body)}</article>`;
}

function transcriptRow(t) {
  return `<button type="button" class="mm-row" data-open="${esc(t.id)}">
    <span class="mm-row-main"><b>${esc(t.title)}</b><span class="muted small">${fmtDate(t.date)} · ${t.words.toLocaleString()} words${t.source ? ` · ${esc(t.source)}` : ""}</span></span>
    <span class="chip">${esc(kindLabel(t.kind))}</span>
  </button>`;
}

function transcriptsView() {
  const { transcripts, projects } = state.data;
  const all = [...transcripts, ...projects];
  const kinds = ["all", ...new Set(all.map((t) => t.kind))];
  const list = all.filter((t) => state.kind === "all" || t.kind === state.kind);
  const words = transcripts.reduce((n, t) => n + t.words, 0);
  const hits = state.hits
    ? `<div class="mm-hits">${state.hits.length ? state.hits.map((h) => `
        <button type="button" class="mm-hit" data-open="${h.type === "doc" ? "" : esc(h.id)}" ${h.type === "doc" ? `data-doc="${esc(h.id)}"` : ""}>
          <span class="mm-row-main"><b>${esc(h.title)}</b><span class="muted small">${h.type === "doc" ? "Playbook" : `${esc(kindLabel(h.kind))} · ${fmtDate(h.date)}`}</span></span>
          ${h.snippets.map((s) => `<q>${esc(s)}</q>`).join("")}
        </button>`).join("") : `<div class="empty">Nothing mentions “${esc(state.q)}” yet.</div>`}</div>`
    : "";
  return `
    <div class="mm-add">
      <label class="mm-drop" data-drop>
        <input type="file" multiple hidden accept=".txt,.srt,.vtt,.md,.json,text/*" id="mm-files" />
        <span class="mm-drop-icon">${ICON.upload}</span>
        <b>Drop transcripts here</b>
        <span class="muted small">.txt, .srt, .vtt or Premiere/Resolve exports. Timecodes are stripped.</span>
      </label>
      <button type="button" class="mm-drop" data-act="paste">
        <span class="mm-drop-icon">${ICON.paste}</span>
        <b>Paste a transcript</b>
        <span class="muted small">Zoom call, podcast, sales call, anything</span>
      </button>
    </div>
    <div class="mm-toolbar">
      <label class="mm-search">${ICON.search}<input type="search" id="mm-q" value="${esc(state.q)}" placeholder="Search everything Odell has said… e.g. “close rate”, “Jeremy”, “buy back your time”" autocomplete="off" /></label>
      <span class="muted small">${transcripts.length} transcripts · ${words.toLocaleString()} words · ${projects.length} from app projects</span>
    </div>
    ${hits}
    ${state.hits ? "" : `<nav class="tab-strip mm-kinds">${kinds.map((k) => `<button type="button" data-kind="${k}" class="${state.kind === k ? "on" : ""}">${k === "all" ? "All" : esc(kindLabel(k))}</button>`).join("")}</nav>
    <div class="mm-list">${list.map(transcriptRow).join("") || `<div class="empty">No transcripts yet.</div>`}</div>`}`;
}

function playbooksView() {
  const docs = [...state.data.docs].sort((a, b) => (b.company - a.company) || a.title.localeCompare(b.title));
  return `<p class="muted mm-lede">The shared playbooks in <code>shared/</code>. Every session reads these. Company and content ideas are kept by Memory; the rest by their owners.</p>
    <div class="mm-cards">${docs.map((d) => `
      <button type="button" class="mm-card" data-doc="${esc(d.file)}">
        <b>${esc(d.title)}</b>
        <span class="muted small">${esc(d.file)} · ${d.words.toLocaleString()} words · ${ago(d.updatedAt)}</span>
        ${d.company ? `<span class="chip">Memory</span>` : ""}
      </button>`).join("")}</div>`;
}

function brandView() {
  const b = state.data.brand;
  if (!b) return `<div class="empty">The Assets brand kit isn't reachable right now. Logos, fonts and colors live in <a href="#/assets">Assets</a>.</div>`;
  const colors = b.colors?.length ? `<div class="mm-swatches">${b.colors.map((c) => `<span class="mm-swatch"><i style="background:${esc(c.hex)}"></i>${esc(c.name || "")} <code>${esc(c.hex)}</code></span>`).join("")}</div>` : `<p class="muted small">No colors yet.</p>`;
  const logos = b.logos?.length ? `<div class="mm-logos">${b.logos.map((l) => `<a class="mm-logo" href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(l.title)}"><img src="${esc(l.url)}" alt="${esc(l.title)}" /></a>`).join("")}</div>` : `<p class="muted small">No logos yet.</p>`;
  const fonts = b.fonts?.length ? `<ul>${b.fonts.map((f) => `<li>${esc(f.family)}</li>`).join("")}</ul>` : `<p class="muted small">No fonts yet.</p>`;
  return `<p class="muted mm-lede">Logos, fonts and colors live in <a href="#/assets">Assets</a>, and Memory hands them to every channel alongside the company profile. Upload new ones there.</p>
    <div class="mm-brand">
      <section class="card mm-panel"><h3>Logos</h3>${logos}</section>
      <section class="card mm-panel"><h3>Colors</h3>${colors}</section>
      <section class="card mm-panel"><h3>Fonts</h3>${fonts}</section>
      <section class="card mm-panel"><h3>Guidelines</h3>${b.guidelines?.length ? `<ul>${b.guidelines.map((g) => `<li>${esc(g.title)}</li>`).join("")}</ul>` : `<p class="muted small">None yet.</p>`}</section>
    </div>`;
}

function apiView() {
  const rows = [
    ["GET", "/api/memory/context?q=<topic>", "Everything a prompt needs: company profile, content ideas, Odell's voice, matching transcript excerpts, brand kit. Add &format=text for one paste-ready block."],
    ["GET", "/api/memory/company", "The company profile as Markdown (shared/COMPANY.md)."],
    ["GET", "/api/memory/search?q=<words>", "Transcript and playbook hits with snippets."],
    ["GET", "/api/memory/transcripts", "Every stored transcript (metadata)."],
    ["GET", "/api/memory/transcripts/:id?format=text", "One transcript's text."],
    ["GET", "/api/memory/docs/:file", "Any shared playbook, e.g. ODELL_VOICE.md."],
    ["POST", "/api/memory/transcripts", "Add transcripts: multipart files[] or JSON { title, text, kind, date }."],
  ];
  return `<p class="muted mm-lede">Titles, captions, thumbnails, ads, edits and the director read from here instead of asking again. Server-side code can also <code>import { companyContext, contextAsText } from "../memory/index.js"</code>.</p>
    <table class="mm-api">${rows.map(([m, p, d]) => `<tr><td><span class="chip">${m}</span></td><td><a href="${p.includes("<") || p.includes(":id") ? "#" : p}" ${p.includes("<") || p.includes(":id") ? "" : 'target="_blank" rel="noopener"'}><code>${esc(p)}</code></a></td><td class="muted">${esc(d)}</td></tr>`).join("")}</table>
    <p class="muted small">Try it: <a href="${API}/context?q=close%20rate&format=text" target="_blank" rel="noopener"><code>${API}/context?q=close rate&amp;format=text</code></a></p>`;
}

// ---------------------------------------------------------------------------
// Modals

function openModal(html) {
  closeModal();
  const back = document.createElement("div");
  back.className = "modal-backdrop mm-backdrop";
  back.innerHTML = `<div class="modal mm-modal" role="dialog" aria-modal="true">${html}</div>`;
  back.addEventListener("mousedown", (e) => e.target === back && closeModal());
  document.body.append(back);
  document.body.classList.add("no-scroll");
  return back.firstElementChild;
}
function closeModal() {
  $(".mm-backdrop")?.remove();
  if (!$(".modal-backdrop")) document.body.classList.remove("no-scroll");
}

async function openTranscript(id, root) {
  const t = await api(`/transcripts/${encodeURIComponent(id)}`);
  const stored = !id.startsWith("project-");
  const paras = t.text.split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join("");
  const m = openModal(`
    <div class="mm-modal-head">
      <div><h2>${esc(t.title)}</h2><span class="muted small">${esc(kindLabel(t.kind))} · ${fmtDate(t.date)} · ${t.words.toLocaleString()} words</span></div>
      <button class="btn ghost sm" data-close>${ICON.close}</button>
    </div>
    ${stored ? `<div class="mm-meta">
      <label class="field"><span>Title</span><input id="mm-t-title" value="${esc(t.title)}" /></label>
      <label class="field"><span>Type</span><select id="mm-t-kind">${state.data.kinds.map((k) => `<option value="${k.id}" ${k.id === t.kind ? "selected" : ""}>${esc(k.label)}</option>`).join("")}</select></label>
      <label class="field"><span>Date</span><input type="date" id="mm-t-date" value="${esc(t.date || "")}" /></label>
    </div>` : `<p class="muted small">From app project <a href="#/p/${esc(t.projectId)}">${esc(t.title)}</a>. Read-only here.</p>`}
    <div class="mm-read">${paras}</div>
    ${stored ? `<div class="mm-edit-bar"><button class="btn danger" data-del>Delete</button><span></span><button class="btn primary" data-save>Save</button></div>` : ""}`);
  m.querySelector("[data-close]").onclick = closeModal;
  m.querySelector("[data-save]")?.addEventListener("click", async () => {
    try {
      await api(`/transcripts/${id}`, { method: "PATCH", body: { title: $("#mm-t-title").value, kind: $("#mm-t-kind").value, date: $("#mm-t-date").value } });
      closeModal();
      toast("Saved");
      refresh(root);
    } catch (err) {
      toast(err.message);
    }
  });
  m.querySelector("[data-del]")?.addEventListener("click", async () => {
    if (!confirm(`Delete “${t.title}” from Memory?`)) return;
    await api(`/transcripts/${id}`, { method: "DELETE" }).catch((err) => toast(err.message));
    closeModal();
    refresh(root);
  });
}

async function openDoc(file) {
  const d = await api(`/docs/${encodeURIComponent(file)}?format=json`);
  const m = openModal(`<div class="mm-modal-head"><div><h2>${esc(file)}</h2><span class="muted small">Updated ${ago(d.updatedAt)}</span></div><button class="btn ghost sm" data-close>${ICON.close}</button></div><article class="mm-doc">${md(d.body)}</article>`);
  m.querySelector("[data-close]").onclick = closeModal;
}

function pasteModal(root) {
  const m = openModal(`
    <div class="mm-modal-head"><h2>Paste a transcript</h2><button class="btn ghost sm" data-close>${ICON.close}</button></div>
    <div class="mm-meta">
      <label class="field grow"><span>Title</span><input id="mm-p-title" placeholder="e.g. Coaching call – hiring a sales manager" /></label>
      <label class="field"><span>Type</span><select id="mm-p-kind">${state.data.kinds.map((k) => `<option value="${k.id}">${esc(k.label)}</option>`).join("")}</select></label>
      <label class="field"><span>Date</span><input type="date" id="mm-p-date" /></label>
    </div>
    <label class="field"><span>Transcript</span><textarea id="mm-p-text" rows="14" placeholder="Paste the whole thing. Timecodes are fine."></textarea></label>
    <div class="mm-edit-bar"><span></span><button class="btn primary" data-save>Add to Memory</button></div>`);
  m.querySelector("[data-close]").onclick = closeModal;
  m.querySelector("[data-save]").onclick = async () => {
    try {
      const r = await api("/transcripts", { method: "POST", body: { title: $("#mm-p-title").value, kind: $("#mm-p-kind").value, date: $("#mm-p-date").value, text: $("#mm-p-text").value } });
      closeModal();
      toast(r.added.length ? "Added to Memory" : "Already in Memory");
      refresh(root);
    } catch (err) {
      toast(err.message);
    }
  };
}

async function uploadFiles(files, root) {
  if (!files.length) return;
  const form = new FormData();
  for (const f of files) form.append("files", f);
  toast(`Adding ${files.length} transcript${files.length > 1 ? "s" : ""}…`);
  try {
    const r = await api("/transcripts", { method: "POST", form });
    toast(`${r.added.length} added${r.skipped.length ? `, ${r.skipped.length} already saved` : ""}`);
    state.tab = "transcripts";
    refresh(root);
  } catch (err) {
    toast(err.message);
  }
}

// ---------------------------------------------------------------------------

function render(root) {
  $("#mm-tabs", root).innerHTML = TABS.map((t) => `<button type="button" data-tab="${t.id}" class="${state.tab === t.id ? "on" : ""}">${t.label}</button>`).join("");
  const view = { company: companyView, transcripts: transcriptsView, playbooks: playbooksView, brand: brandView, api: apiView }[state.tab];
  $("#mm-body", root).innerHTML = view();
  const d = state.data;
  $("#mm-stats", root).innerHTML = `<span><b>${d.transcripts.length}</b> transcripts</span><span><b>${d.docs.length}</b> playbooks</span><span><b>${(d.brand?.logos?.length || 0) + (d.brand?.fonts?.length || 0) + (d.brand?.colors?.length || 0)}</b> brand assets</span>`;
}

async function refresh(root) {
  state.data = await api("/");
  render(root);
}

export async function mountMemory(el) {
  el.innerHTML = `
    <div class="mm-page">
      <div class="page-head">
        <div>
          <h1>Memory</h1>
          <p class="muted">Everything HBA is, in one place: the company profile, every transcript, the playbooks and the brand kit. Every channel pulls from here.</p>
        </div>
        <div class="mm-stats" id="mm-stats"></div>
      </div>
      <nav class="tab-strip mm-tabs" id="mm-tabs"></nav>
      <div id="mm-body"><div class="loading">Loading…</div></div>
    </div>`;
  if (!$("link[data-memory-css]")) document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${API}/ui/memory.css" data-memory-css />`);
  const root = $(".mm-page", el);

  root.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-tab]");
    if (t) return (state.tab = t.dataset.tab), (state.editing = false), render(root);
    const k = e.target.closest("[data-kind]");
    if (k) return (state.kind = k.dataset.kind), render(root);
    const open = e.target.closest("[data-open]");
    if (open?.dataset.open) return openTranscript(open.dataset.open, root).catch((err) => toast(err.message));
    const doc = e.target.closest("[data-doc]");
    if (doc) return openDoc(doc.dataset.doc).catch((err) => toast(err.message));
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "paste") return pasteModal(root);
    if (act === "edit-company") return (state.editing = true), render(root);
    if (act === "cancel-edit") return (state.editing = false), render(root);
    if (act === "save-company") {
      try {
        await api("/company", { method: "PUT", body: { body: $("#mm-company", root).value } });
        state.editing = false;
        toast("Company profile saved");
        refresh(root);
      } catch (err) {
        toast(err.message);
      }
    }
  });
  root.addEventListener("change", (e) => {
    if (e.target.id === "mm-files") uploadFiles([...e.target.files], root), (e.target.value = "");
  });
  let timer;
  root.addEventListener("input", (e) => {
    if (e.target.id !== "mm-q") return;
    state.q = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      state.hits = state.q.trim() ? (await api(`/search?q=${encodeURIComponent(state.q)}&limit=12`)).hits : null;
      const pos = e.target.selectionStart;
      render(root);
      const input = $("#mm-q", root);
      input.focus();
      input.setSelectionRange(pos, pos);
    }, 250);
  });
  const over = (e) => root.isConnected && state.tab === "transcripts" && e.dataTransfer?.types.includes("Files") && (e.preventDefault(), root.querySelector("[data-drop]")?.classList.add("over"));
  const drop = (e) => {
    if (!root.isConnected || !e.dataTransfer?.files.length || $(".mm-backdrop")) return;
    e.preventDefault();
    root.querySelector("[data-drop]")?.classList.remove("over");
    uploadFiles([...e.dataTransfer.files], root);
  };
  document.addEventListener("dragover", over);
  document.addEventListener("drop", drop);

  try {
    await refresh(root);
  } catch (err) {
    $("#mm-body", root).innerHTML = `<div class="empty">Couldn't load Memory: ${esc(err.message)}</div>`;
  }
  return () => {
    document.removeEventListener("dragover", over);
    document.removeEventListener("drop", drop);
    closeModal();
  };
}
