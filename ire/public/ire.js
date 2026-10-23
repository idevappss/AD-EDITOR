// IRE tab (#/ire): the Intentional Reels Editor. Each question Dr Odell has been asked on camera sits here with the
// reel it was written for, and the takes filmed for it are dropped in next to it. app.js imports this and calls
// mountIre(app). See ire/index.js.
const API = "/api/ire";
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const mb = (bytes) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`);

const svg = (body, size = 15) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  upload: svg(`<path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>`, 18),
  trash: svg(`<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>`, 14),
  mic: svg(`<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>`, 13),
};

async function api(url, { method = "GET", body } = {}) {
  const res = await fetch(API + url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 2600);
}

function uploadTakes(reelId, files, onProgress) {
  return new Promise((resolve, reject) => {
    const data = new FormData();
    for (const f of files) data.append("takes", f);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/reels/${encodeURIComponent(reelId)}/takes`);
    xhr.upload.onprogress = (ev) => ev.total && onProgress((100 * ev.loaded) / ev.total);
    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 300) reject(new Error(res.error || "Upload failed"));
      else resolve(res);
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(data);
  });
}

// ---------------------------------------------------------------------------

function takeCard(reel, t, i) {
  return `<article class="ire-take" data-file="${esc(t.file)}">
    <div class="ire-well"><video src="${esc(t.url)}" controls playsinline preload="metadata"></video></div>
    <div class="ire-tbody">
      <div class="ire-thead"><b>Take ${i + 1}</b><button class="btn sm ghost" data-act="remove-take" title="Remove this take">${ICON.trash}</button></div>
      <span class="ire-tname" title="${esc(t.name)}">${esc(t.name)} · ${mb(t.size)}</span>
    </div>
  </article>`;
}

function reelCard(reel) {
  const filmed = reel.takes.length > 0;
  return `<section class="card ire-reel" data-reel="${esc(reel.id)}">
    <header class="ire-rhead">
      <div class="ire-rtitle">
        <small>${filmed ? `${reel.takes.length} take${reel.takes.length === 1 ? "" : "s"}` : "Asked · no takes yet"}</small>
        <b>${esc(reel.title)}</b>
      </div>
      <span class="chip ${filmed ? "done" : ""}">${filmed ? "Filmed" : "Asked"}</span>
    </header>
    <div class="ire-plan">
      <div class="ire-hook"><span>Hook</span><p>“${esc(reel.hook)}”</p></div>
      <dl>
        <dt>${ICON.mic} Question</dt><dd>${esc(reel.question)}</dd>
        ${reel.follow_up ? `<dt>Follow-up</dt><dd>${esc(reel.follow_up)}</dd>` : ""}
        ${reel.angle ? `<dt>Angle</dt><dd>${esc(reel.angle)}</dd>` : ""}
        ${reel.who ? `<dt>For</dt><dd>${esc(reel.who)}</dd>` : ""}
      </dl>
    </div>
    <div class="ire-takes">
      ${reel.takes.map((t, i) => takeCard(reel, t, i)).join("")}
      <label class="ire-drop" data-drop>
        <input type="file" accept="video/*,.mov,.mkv,.m4v" multiple hidden />
        <span class="ire-dz-icon">${ICON.upload}</span>
        <b>${filmed ? "Add another take" : "Drop the take"}</b>
        <small>or click to choose</small>
        <i class="ire-bar" hidden><i></i></i>
      </label>
    </div>
  </section>`;
}

async function refresh(root) {
  const data = await api("/");
  const list = $("#ire-reels", root);
  if (!data.reels.length) {
    list.innerHTML = `<div class="card empty ire-empty">
      <b>No reels to edit yet</b>
      <p class="muted">Mark a question as <em>asked</em> or <em>filmed</em> on <a href="#/reels">Intentional reels</a> and it shows up here, ready for its takes.${data.unasked ? ` ${data.unasked} question${data.unasked === 1 ? " is" : "s are"} waiting to be asked.` : ""}</p>
    </div>`;
    return;
  }
  const withTakes = data.reels.filter((r) => r.takes.length).length;
  $("#ire-count", root).textContent = `${withTakes} of ${data.reels.length} filmed${data.unasked ? ` · ${data.unasked} still to ask` : ""}`;
  list.innerHTML = data.reels.map(reelCard).join("");
}

async function send(root, drop, files) {
  const reelId = drop.closest("[data-reel]").dataset.reel;
  const bar = $(".ire-bar", drop);
  bar.hidden = false;
  drop.classList.add("busy");
  try {
    await uploadTakes(reelId, files, (p) => ($("i", bar).style.width = `${p}%`));
    toast(files.length === 1 ? "Take added" : `${files.length} takes added`);
    await refresh(root);
  } catch (err) {
    toast(err.message);
    bar.hidden = true;
    drop.classList.remove("busy");
  }
}

export async function mountIre(el) {
  el.innerHTML = `
    <div class="ire-page">
      <div class="page-head">
        <div>
          <h1>Reels Editor</h1>
          <p class="muted">The answers to the questions from <a href="#/reels">Intentional reels</a> come back here. Each question he's been asked sits next to the reel it was written for — hook, angle, headline — so every take gets edited against what it's meant to become.</p>
        </div>
        <span id="ire-count" class="ire-count"></span>
      </div>
      <div id="ire-reels" class="ire-reels"><div class="loading">Loading…</div></div>
    </div>`;
  if (!$("link[data-ire-css]")) document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${API}/ui/ire.css" data-ire-css />`);
  const root = $(".ire-page", el);

  root.addEventListener("change", (e) => {
    const input = e.target.closest("[data-drop] input[type=file]");
    if (input?.files.length) send(root, input.closest("[data-drop]"), [...input.files]);
  });
  root.addEventListener("dragover", (e) => {
    const drop = e.target.closest("[data-drop]");
    if (!drop) return;
    e.preventDefault();
    drop.classList.add("over");
  });
  root.addEventListener("dragleave", (e) => e.target.closest("[data-drop]")?.classList.remove("over"));
  root.addEventListener("drop", (e) => {
    const drop = e.target.closest("[data-drop]");
    if (!drop) return;
    e.preventDefault();
    drop.classList.remove("over");
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) send(root, drop, files);
  });
  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act=remove-take]");
    if (!btn) return;
    const reelId = btn.closest("[data-reel]").dataset.reel;
    const file = btn.closest("[data-file]").dataset.file;
    if (!confirm("Remove this take? The video file is deleted.")) return;
    try {
      await api(`/reels/${encodeURIComponent(reelId)}/takes/${encodeURIComponent(file)}`, { method: "DELETE" });
      await refresh(root);
    } catch (err) {
      toast(err.message);
    }
  });

  await refresh(root).catch((err) => {
    $("#ire-reels", root).innerHTML = `<div class="empty">${esc(err.message)}</div>`;
  });
}
