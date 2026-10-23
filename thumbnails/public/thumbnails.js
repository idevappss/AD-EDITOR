// Thumbnails tab (#/thumbnails): three thumbnail variations for every video, built and checked by the creator's
// YouTube Thumbnails SOP, thumbnails from the creator's own photos, and the switches that stop them being made.
// Owned by the THUMBNAILS session; app.js imports this and calls mountThumbnails(app).
const API = "/api/thumbnails";
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const svg = (body, size = 15) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  close: svg(`<path d="M6 6l12 12M18 6 6 18"/>`),
  download: svg(`<path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14"/>`),
  again: svg(`<path d="M19 12a7 7 0 1 1-2.2-5.1"/><path d="M19.5 4v4h-4"/>`),
  wand: svg(`<path d="M4 20 15 9m0 0 3-3-2-2-3 3m2 2-2-2"/><path d="M6 4v3M4.5 5.5h3M18 15v3m-1.5-1.5h3"/>`),
  heart: svg(`<path d="M12 19s-6.5-4.2-6.5-8.4A3.6 3.6 0 0 1 12 8.2a3.6 3.6 0 0 1 6.5 2.4C18.5 14.8 12 19 12 19z"/>`, 14),
  image: svg(`<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 4.5-4.5L12 16l3-3 5 5"/>`, 30),
  upload: svg(`<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15"/>`, 20),
  check: svg(`<path d="m5 12.5 4.5 4.5L19 7.5"/>`, 13),
  cross: svg(`<path d="M7 7l10 10M17 7 7 17"/>`, 13),
  list: svg(`<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>`),
};

const state = { settings: {}, layouts: [], presets: [], sop: { types: [], tones: [], checklist: [] }, videos: [], photos: [], history: [], working: [], claude: true, open: null, tab: "videos" };
let poll = null;
/** Photos picked on the upload form, waiting for "Make thumbnails". */
let picked = [];
let uploading = false;
/** Your style: the swipe file, its profile, and references picked but not sent yet. */
const style = { profile: null, refs: [], picked: [], busy: "" };

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

function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 2600);
}

const mmss = (s) => (s == null ? "" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`);
const busy = (v) => v.state === "working" || (v.auto && state.settings.auto !== false && v.state === "waiting");
const typeLabel = (id) => state.sop.types.find((t) => t.id === id)?.label || "";
const bust = (t) => `${t.url}?v=${encodeURIComponent(t.updatedAt || "")}`;

/** "11/12" against the SOP checklist, or nothing when it hasn't been checked. */
function score(t) {
  if (!t?.checks?.length) return "";
  const all = t.passed === t.checks.length;
  return `<span class="chip tn-score ${all ? "pass" : "miss"}" title="${t.checksStale ? "Edited since the checklist ran" : "Banger checklist"}">${all ? ICON.check : ""}${t.passed}/${t.checks.length}${t.checksStale ? "*" : ""}</span>`;
}

// ---------------------------------------------------------------------------

function tile(v) {
  const t = v.thumbnail;
  const shot = t
    ? `<img src="${esc(bust(t))}" alt="" loading="lazy" />`
    : `<div class="tn-blank">${ICON.image}<span>${
        v.state === "working" ? "Making 3 variations…" : v.auto === false ? "Switched off for this video" : state.settings.auto === false ? "Auto is off" : v.state === "failed" ? "Couldn't make one" : "Waiting for the video"
      }</span></div>`;
  const chips = [
    v.state === "working" ? `<span class="chip live">Making it</span>` : "",
    v.state === "failed" ? `<span class="chip error" title="${esc(v.error || "")}">Failed</span>` : "",
    t?.type ? `<span class="chip">${esc(typeLabel(t.type))}</span>` : "",
    score(t),
    t?.demo ? `<span class="chip">No Claude key</span>` : "",
    t?.liked === true ? `<span class="chip done">♥</span>` : "",
  ].filter(Boolean).join("");
  const count = t?.variants?.length > 1 ? ` · ${t.variants.length} variations` : "";

  return `<article class="tn-card ${busy(v) ? "working" : ""}" data-id="${esc(v.id)}">
    <div class="tn-shot" data-act="open">${shot}</div>
    <div class="tn-body">
      <div class="tn-title"><b>${esc(v.name || "Untitled")}</b></div>
      <div class="tn-chips">${chips}</div>
      <div class="tn-meta">${t ? `“${esc(t.headline)}”${count}` : esc(v.status || "")}${v.duration ? ` · ${mmss(v.duration)}` : ""}</div>
      <div class="tn-actions">
        <label class="toggle tn-auto" title="Make thumbnails for this video automatically">
          <input type="checkbox" data-act="auto" ${v.auto ? "checked" : ""} /><span class="track"></span>Auto
        </label>
        <span class="spacer"></span>
        ${t ? `<a class="btn sm ghost" href="${esc(t.downloadUrl)}">${ICON.download} Save</a>
               <button class="btn sm" data-act="open">Edit</button>`
             : `<button class="btn sm primary" data-act="make" ${v.state === "working" ? "disabled" : ""}>${ICON.wand} Make them</button>`}
      </div>
    </div>
  </article>`;
}

const when = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(+d) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/** The thumbnail each video and photo set leads with now. */
const leads = () => [
  ...state.videos.filter((v) => v.thumbnail).map((v) => ({ ...v.thumbnail, videoId: v.id, videoName: v.name, past: false })),
  ...state.photos.map((t) => ({ ...t, videoId: t.projectId, past: false })),
];

/** Every thumbnail there has ever been: the ones leading now, their other variations, and the ones replaced. */
function gallery() {
  return [...leads(), ...state.history].sort((a, b) => (b.replacedAt || b.createdAt || "").localeCompare(a.replacedAt || a.createdAt || "") || (a.variant || "").localeCompare(b.variant || ""));
}

function shotCard(t) {
  const status = !t.past ? `<span class="chip done">Current</span>` : t.alt ? `<span class="chip">Variation ${esc(t.variant || "")}</span>` : `<span class="chip">Replaced ${esc(when(t.replacedAt))}</span>`;
  return `<article class="tn-card tn-shotcard" data-thumb="${esc(t.id)}">
    <div class="tn-shot"><img src="${esc(bust(t))}" alt="" loading="lazy" /></div>
    <div class="tn-body">
      <div class="tn-title"><b>${esc(t.headline || "—")}</b></div>
      <div class="tn-chips">${status}${t.type ? `<span class="chip">${esc(typeLabel(t.type))}</span>` : ""}${score(t)}</div>
      <div class="tn-meta">${esc(t.videoName || t.name || "")}</div>
    </div>
  </article>`;
}

function presetOptions(selected = "") {
  return state.presets.map((p) => `<option value="${esc(p)}" ${p === selected ? "selected" : ""}>${esc(p)}</option>`).join("");
}

/** The photo tab: the upload form, then every photo set that isn't tied to a video. */
function photosView() {
  const videos = state.videos.map((v) => `<option value="${esc(v.id)}">${esc(v.name || "Untitled")}</option>`).join("");
  const working = state.working.filter((k) => k.startsWith("photos-")).length + (uploading ? 1 : 0);
  return `
    <section class="tn-upload" id="tn-upload-anchor">
      <div class="tn-upload-head">
        <h2>Make thumbnails from your photos</h2>
        <p class="muted small">The SOP says never wrap a shoot without thumbnail photos: different angles, framings and real expressions. Drop them here and you get ${state.sop.variations || 3} variations, each built on one of the five types and run through the checklist.</p>
      </div>
      <label class="dropzone tn-drop" id="tn-drop">
        <input type="file" id="tn-files" accept="image/*,.heic,.heif" multiple hidden />
        <span class="dz-icon">${ICON.upload}</span>
        <span class="dz-copy"><b>Drop photos here, or click to upload</b><small>Up to 12 · JPEG, PNG, HEIC or WebP</small></span>
      </label>
      <div class="tn-picked" id="tn-picked">${picked.map((f, i) => `<figure><img src="${esc(f.preview)}" alt="" /><button type="button" data-unpick="${i}" aria-label="Remove">${ICON.close}</button></figure>`).join("")}</div>
      <div class="tn-form tn-upload-form">
        <label class="field"><span>Which video is it for? <em>optional</em></span><select id="tn-up-video"><option value="">None, it stands on its own</option>${videos}</select></label>
        <label class="field"><span>YouTube title <em>optional</em></span><input id="tn-up-title" maxlength="120" placeholder="The title it will run with" /></label>
        <label class="field"><span>Words</span><select id="tn-up-preset"><option value="">Let Claude write them</option>${presetOptions()}<option value="__own">My own words…</option></select></label>
        <label class="field" id="tn-up-own-wrap" hidden><span>Your words</span><input id="tn-up-own" maxlength="60" placeholder="e.g. Week In The Life" /></label>
        <label class="field grow"><span>What's the video about? <em>optional</em></span><textarea id="tn-up-about" rows="2" maxlength="400" placeholder="A few words, so the curiosity gap fits the video"></textarea></label>
      </div>
      <div class="tn-upload-go">
        <span class="muted small">${picked.length ? `${picked.length} photo${picked.length === 1 ? "" : "s"} ready` : "No photos yet"}</span>
        <button class="btn primary" id="tn-up-go" ${picked.length && !uploading ? "" : "disabled"}>${ICON.wand} ${uploading ? "Making them…" : "Make thumbnails"}</button>
      </div>
    </section>
    <div class="tn-grid">
      ${Array.from({ length: working }, () => `<article class="tn-card working"><div class="tn-shot"><div class="tn-blank">${ICON.image}<span>Building ${state.sop.variations || 3} variations from your photos…</span></div></div><div class="tn-body"><div class="tn-meta">About a minute or two</div></div></article>`).join("")}
      ${state.photos.map(shotCard).join("")}
      ${state.photos.length || working ? "" : `<div class="empty">Thumbnails made from photos land here. Ones made for a video show on that video's card.</div>`}
    </div>`;
}

const typeChip = (id) => (id ? `<span class="chip">${esc(typeLabel(id))}</span>` : "");

/** Your style: what it has learned, the form that teaches it, and every reference it learned from. */
function styleView() {
  const p = style.profile;
  const profile = p
    ? `<section class="tn-profile">
        <div class="tn-profile-head"><h2>What it has learned</h2><span class="muted small">From ${p.from} thumbnail${p.from === 1 ? "" : "s"} · ${esc(when(p.updatedAt))}</span><span class="spacer"></span><button class="btn sm ghost" data-style="rebuild">${ICON.again} Relearn</button></div>
        <p>${esc(p.summary)}</p>
        <div class="tn-profile-cols">
          <div><b>Do</b><ul>${p.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
          ${p.avoid.length ? `<div><b>Avoid</b><ul>${p.avoid.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>` : ""}
        </div>
        <div class="tn-chips">${p.favoriteTypes.map(typeChip).join("")}<span class="chip">Up to ${p.maxWords} words</span><span class="chip"><i class="tn-swatch" style="background:${esc(p.textColor)}"></i>Headline colour</span>${p.uppercase ? `<span class="chip">ALL CAPS</span>` : ""}</div>
      </section>`
    : `<section class="tn-profile empty-profile"><h2>Teach it your taste</h2><p class="muted">Add thumbnails you love: upload the pictures or paste YouTube links, and say what you like about them. Claude breaks each one down by your SOP (type, curiosity gap, stoppers, words, face, colours) and learns the pattern. Every thumbnail after that is built in your style, and the checklist checks it.</p></section>`;
  const n = style.picked.length;
  return `
    ${profile}
    <section class="tn-upload">
      <div class="tn-upload-head"><h2>Add thumbnails you love</h2><p class="muted small">Other creators' or your own. The more you add, the sharper it gets.</p></div>
      <label class="dropzone tn-drop" id="tn-style-drop">
        <input type="file" id="tn-style-files" accept="image/*,.heic,.heif" multiple hidden />
        <span class="dz-icon">${ICON.upload}</span>
        <span class="dz-copy"><b>Drop thumbnails here, or click to upload</b><small>Screenshots work · up to 30 at a time</small></span>
      </label>
      <div class="tn-picked">${style.picked.map((f, i) => `<figure><img src="${esc(f.preview)}" alt="" /><button type="button" data-style-unpick="${i}" aria-label="Remove">${ICON.close}</button></figure>`).join("")}</div>
      <div class="tn-form tn-upload-form">
        <label class="field grow"><span>Or paste YouTube links <em>one per line</em></span><textarea id="tn-style-links" rows="3" placeholder="https://www.youtube.com/watch?v=…"></textarea></label>
        <label class="field grow"><span>What do you like about them? <em>optional, but it's what counts most</em></span><input id="tn-style-note" maxlength="400" placeholder="e.g. the shocked face, only 2 words, yellow text, the red arrow" /></label>
      </div>
      <div class="tn-upload-go">
        <span class="muted small">${style.busy ? esc(style.busy) : n ? `${n} picture${n === 1 ? "" : "s"} ready` : ""}</span>
        <button class="btn primary" data-style="teach" ${style.busy ? "disabled" : ""}>${ICON.wand} ${style.busy ? "Learning…" : "Teach it"}</button>
      </div>
    </section>
    <div class="tn-grid">
      ${style.refs.map((r) => `
        <article class="tn-card tn-ref" data-ref="${esc(r.id)}">
          <div class="tn-shot"><img src="${esc(r.image)}" alt="" loading="lazy" />${r.url ? `<a class="tn-ref-link" href="${esc(r.url)}" target="_blank" rel="noopener" title="Open on YouTube">YouTube</a>` : ""}</div>
          <div class="tn-body">
            <div class="tn-title"><b>${esc(r.title || r.analysis?.words || "Reference")}</b></div>
            <div class="tn-chips">${typeChip(r.analysis?.type)}${(r.analysis?.stoppers || []).map((x) => `<span class="chip">${esc(x)}</span>`).join("")}${r.error ? `<span class="chip error" title="${esc(r.error)}">Not analysed</span>` : ""}</div>
            ${r.analysis ? `<div class="tn-meta tn-wrap">${esc(r.analysis.why)}</div>` : ""}
            <div class="tn-actions">
              <input class="tn-ref-note" data-ref-note="${esc(r.id)}" value="${esc(r.note || "")}" maxlength="400" placeholder="What you like about it" />
              <button class="icon-btn" data-ref-delete="${esc(r.id)}" title="Remove from your style" aria-label="Remove">${ICON.close}</button>
            </div>
          </div>
        </article>`).join("")}
    </div>`;
}

async function loadStyle() {
  const data = await api("/style");
  style.profile = data.profile;
  style.refs = data.refs;
}

function pickStyle(files, root) {
  const images = [...files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
  for (const f of images.slice(0, 30 - style.picked.length)) style.picked.push({ file: f, preview: URL.createObjectURL(f) });
  render(root);
}

async function teach(root) {
  const grid = $("#tn-grid", root);
  const links = $("#tn-style-links", grid).value.trim();
  const note = $("#tn-style-note", grid).value.trim();
  if (!style.picked.length && !links) return toast("Add some thumbnails or paste a YouTube link first.");
  const count = style.picked.length + (links ? links.split(/\s+/).filter(Boolean).length : 0);
  style.busy = `Studying ${count} thumbnail${count === 1 ? "" : "s"}. About ${Math.max(1, Math.round(count * 0.3))} min…`;
  render(root);
  try {
    const added = [];
    if (style.picked.length) {
      const form = new FormData();
      style.picked.forEach((p) => form.append("refs", p.file, p.file.name));
      form.append("note", note);
      style.picked.forEach((p) => URL.revokeObjectURL(p.preview));
      style.picked = [];
      added.push(...(await api("/style/refs", { method: "POST", form })).added);
    }
    if (links) added.push(...(await api("/style/links", { method: "POST", body: { urls: links, note } })).added);
    const failed = added.filter((a) => !a.id);
    toast(failed.length ? `Learned ${added.length - failed.length}. ${failed[0].error}` : `Learned from ${added.length} thumbnail${added.length === 1 ? "" : "s"}.`);
  } catch (err) {
    toast(err.message);
  }
  style.busy = "";
  await loadStyle().catch(() => {});
  render(root);
}

function render(root) {
  const auto = state.settings.auto !== false;
  $("#tn-auto", root).checked = auto;
  $("#tn-auto-note", root).textContent = auto
    ? `On: every new video gets ${state.sop.variations || 3} variations while it's still transcribing.`
    : "Off: nothing is made automatically. Use Make them on a video.";
  const off = state.videos.filter((v) => !v.auto).length;
  $("#tn-count", root).textContent = `${state.videos.filter((v) => v.thumbnail).length} made${off ? ` · ${off} switched off` : ""}${state.claude ? "" : " · no Claude key"}`;

  const all = gallery();
  $("#tn-tabs", root).innerHTML = [
    ["videos", `Videos <span class="tn-n">${state.videos.length}</span>`],
    ["photos", `From your photos <span class="tn-n">${state.photos.length}</span>`],
    ["style", `Your style <span class="tn-n">${style.refs.length}</span>`],
    ["all", `All thumbnails <span class="tn-n">${all.length}</span>`],
  ].map(([id, label]) => `<button type="button" data-tab="${id}" class="${state.tab === id ? "on" : ""}">${label}</button>`).join("");

  const grid = $("#tn-grid", root);
  grid.classList.toggle("tn-grid", state.tab !== "photos" && state.tab !== "style");
  if (state.tab === "style") {
    const keep = ["tn-style-links", "tn-style-note"].map((id) => [id, $(`#${id}`, grid)?.value]);
    grid.innerHTML = styleView();
    for (const [id, value] of keep) if (value != null && $(`#${id}`, grid)) $(`#${id}`, grid).value = value;
    return;
  }
  if (state.tab === "photos") {
    // Keep what's typed in the form across a refresh.
    const keep = ["tn-up-video", "tn-up-title", "tn-up-preset", "tn-up-own", "tn-up-about"].map((id) => [id, $(`#${id}`, grid)?.value]);
    grid.innerHTML = photosView();
    for (const [id, value] of keep) if (value != null && $(`#${id}`, grid)) $(`#${id}`, grid).value = value;
    $("#tn-up-own-wrap", grid).hidden = $("#tn-up-preset", grid).value !== "__own";
    return;
  }
  if (state.tab === "all") {
    grid.innerHTML = all.length
      ? all.map(shotCard).join("")
      : `<div class="empty">Nothing made yet. Every thumbnail (the current one, its variations and the ones replaced) lands here.</div>`;
    return;
  }
  grid.innerHTML = state.videos.length
    ? state.videos.map(tile).join("")
    : `<div class="empty">No videos yet. Import one on <b>Projects</b> and its thumbnails show up here.</div>`;
}

async function refresh(root) {
  const data = await api("/");
  Object.assign(state, data);
  if ((state.tab !== "photos" && state.tab !== "style") || !$(".tn-upload :focus, .tn-ref-note:focus", root)) render(root);
  if (state.open) {
    const t = leads().find((x) => x.id === state.open);
    if (t) fillEditor(t);
  }
  clearTimeout(poll);
  if ((state.videos.some(busy) || state.working.length || uploading) && root.isConnected) poll = setTimeout(() => refresh(root).catch(() => {}), 6000);
}

// ---------------------------------------------------------------------------
// Editor

function openModal(html) {
  closeModal();
  const back = document.createElement("div");
  back.className = "modal-backdrop tn-backdrop";
  back.innerHTML = `<div class="modal tn-modal wide" role="dialog" aria-modal="true">${html}</div>`;
  back.addEventListener("mousedown", (e) => e.target === back && closeModal());
  document.body.append(back);
  document.body.classList.add("no-scroll");
  return back.firstElementChild;
}
function closeModal() {
  state.open = null;
  $(".tn-backdrop")?.remove();
  if (!$(".modal-backdrop")) document.body.classList.remove("no-scroll");
}

/** The concept by the SOP: type, the gap it opens, the stoppers it leans on, the tone. */
function concept(t) {
  const bits = [
    t.type ? `<b>${esc(typeLabel(t.type))}</b>` : "",
    t.gap ? `<span>Viewer asks: “${esc(t.gap)}”</span>` : "",
    t.stoppers?.length ? `<span>Stoppers: ${esc(t.stoppers.join(" + "))}</span>` : "",
  ].filter(Boolean);
  return bits.length ? bits.join('<i aria-hidden="true">·</i>') : "";
}

/** The Banger checklist, box by box. */
function checklist(t) {
  if (!t.checks?.length) {
    return `<div class="tn-checks empty-checks"><span class="muted small">${esc(t.checkNote || "Not checked against the SOP yet.")}</span><button class="btn sm" data-act="check">${ICON.list} Run the checklist</button></div>`;
  }
  return `<div class="tn-checks">
    <div class="tn-checks-head">
      <b>Banger checklist · ${t.passed}/${t.checks.length}</b>
      ${t.checksStale ? `<span class="muted small">Edited since it ran</span>` : ""}
      <span class="spacer"></span>
      <button class="btn sm ghost" data-act="check">${ICON.again} Run it again</button>
    </div>
    ${t.fixed ? `<p class="small tn-fixed">${esc(t.fixed)}</p>` : ""}
    ${t.checkNote ? `<p class="muted small">${esc(t.checkNote)}</p>` : ""}
    <ul>${t.checks.map((c) => `<li class="${c.pass ? "pass" : "miss"}">${c.pass ? ICON.check : ICON.cross}<span>${esc(c.label)}${c.note ? `<small>${esc(c.note)}</small>` : ""}</span></li>`).join("")}</ul>
  </div>`;
}

function variantsStrip(t) {
  if (!(t.variants?.length > 1)) return "";
  return `<div class="tn-variants">${t.variants.map((v) => `
    <button type="button" data-variant="${esc(v.id)}" class="${v.id === t.id ? "on" : ""}" title="${esc(v.headline)}">
      <img src="${esc(v.url)}?v=${encodeURIComponent(v.updatedAt || "")}" alt="" loading="lazy" />
      <span><b>${esc(v.variant)}</b>${v.type ? ` ${esc(typeLabel(v.type))}` : ""}${v.total ? ` · ${v.passed}/${v.total}` : ""}${v.current ? " · leading" : ""}</span>
    </button>`).join("")}
  </div>`;
}

function fillEditor(t) {
  const modal = $(".tn-modal");
  if (!modal) return;
  $(".tn-preview img", modal).src = bust(t);
  $(".tn-why", modal).textContent = t.why || "";
  $(".tn-concept", modal).innerHTML = concept(t);
  $(".tn-checks-slot", modal).innerHTML = checklist(t);
  $(".tn-variants-slot", modal).innerHTML = variantsStrip(t);
  $$(".tn-strip button", modal).forEach((b) => b.classList.toggle("on", b.dataset.frame === t.frame?.file));
}

function editor(t, root) {
  state.open = t.id;
  const title = t.videoName || t.name || "Untitled";
  const modal = openModal(`
    <div class="modal-head">
      <div><h2>${esc(title)}</h2><p class="muted tn-why">${esc(t.why || "")}</p></div>
      <button class="icon-btn" data-act="close" aria-label="Close">${ICON.close}</button>
    </div>
    <p class="small tn-concept">${concept(t)}</p>
    <div class="tn-edit-grid">
      <div>
        <div class="tn-preview"><img src="${esc(bust(t))}" alt="" /></div>
        <div class="tn-variants-slot">${variantsStrip(t)}</div>
      </div>
      <div class="tn-checks-slot">${checklist(t)}</div>
    </div>
    <div class="tn-strip">
      <label class="tn-addphoto" title="Use your own photo. You can also drop photos anywhere on this window.">
        <input type="file" id="tn-edit-files" accept="image/*,.heic,.heif" multiple hidden />
        ${ICON.upload}<span>Add your photo</span>
      </label>${(t.frames || []).map((f) => `
      <button type="button" data-frame="${esc(f.file)}" class="${f.file === t.frame?.file ? "on" : ""}" title="${f.at == null ? esc(f.name || "Photo") : mmss(f.at)} · score ${Math.round(f.score * 100)}">
        <img src="${esc(f.url)}" alt="" loading="lazy" /><span>${f.at == null ? "photo" : mmss(f.at)}</span>
      </button>`).join("")}
    </div>
    <div class="tn-form">
      <label class="field"><span>Text preset</span><select id="tn-preset"><option value="">Pick words…</option>${presetOptions()}</select></label>
      <label class="field tn-headline"><span>Headline <em>2–3 short lines</em></span><input id="tn-headline" value="${esc(t.headline)}" maxlength="120" /></label>
      <label class="field"><span>Accent word</span><input id="tn-word" value="${esc(t.word || "")}" maxlength="40" /></label>
      <label class="field"><span>Under it <em>optional</em></span><input id="tn-sub" value="${esc(t.sub || "")}" maxlength="80" /></label>
      <label class="field"><span>Corner hit <em>number, money, “Day 90”</em></span><input id="tn-badge" value="${esc(t.badge || "")}" maxlength="24" placeholder="e.g. $80K/mo" /></label>
      <label class="field"><span>Layout</span><select id="tn-layout">
        <option value="">Auto (away from the face)</option>
        ${state.layouts.map((l) => `<option value="${l.id}" ${t.layout === l.id ? "selected" : ""}>${esc(l.label)}</option>`).join("")}
      </select></label>
      <label class="field"><span>Tone</span><select id="tn-tone">
        ${state.sop.tones.map((o) => `<option value="${o.id}" ${(t.tone || "bold") === o.id ? "selected" : ""}>${esc(o.label)}</option>`).join("")}
      </select></label>
      <label class="field tn-color"><span>Accent</span><input type="color" id="tn-accent" value="${esc(t.usedAccent || "#ef3340")}" /></label>
      <label class="toggle tn-logo"><input type="checkbox" id="tn-logo" ${t.logo ? "checked" : ""} /><span class="track"></span>Brand logo</label>
    </div>
    <div class="modal-actions">
      <button class="btn sm ghost" data-act="rate" data-liked="true" title="Love these words">${ICON.heart} Love it</button>
      <button class="btn sm ghost" data-act="rate" data-liked="false">Not this</button>
      <button class="btn sm ghost" data-act="keep-preset" title="Add the headline to your text presets">Save words as preset</button>
      <span class="spacer"></span>
      <button class="btn sm danger" data-act="delete">Delete</button>
      <button class="btn sm" data-act="again" title="Three fresh variations. With a text preset picked, they all use those words.">${ICON.again} New variations</button>
      <a class="btn sm" href="${esc(t.downloadUrl)}">${ICON.download} Save 1280×720</a>
      <button class="btn sm primary" data-act="save">Apply</button>
    </div>`);

  const save = async (extra = {}) => {
    const btn = $("[data-act=save]", modal);
    btn.disabled = true;
    btn.textContent = "Painting…";
    try {
      await api(`/items/${t.id}`, {
        method: "PATCH",
        body: {
          headline: $("#tn-headline", modal).value,
          word: $("#tn-word", modal).value,
          sub: $("#tn-sub", modal).value,
          badge: $("#tn-badge", modal).value,
          layout: $("#tn-layout", modal).value || null,
          tone: $("#tn-tone", modal).value,
          accent: $("#tn-accent", modal).value,
          logo: $("#tn-logo", modal).checked,
          ...extra,
        },
      });
      await refresh(root);
      toast("Thumbnail updated.");
    } catch (err) {
      toast(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Apply";
    }
  };

  $("#tn-preset", modal).addEventListener("change", (e) => {
    const words = e.target.value;
    if (!words) return;
    $("#tn-headline", modal).value = words;
    // The last word usually carries it ("Day In A LIFE"); edit Accent word to change that.
    $("#tn-word", modal).value = words.split(" ").filter((w) => w.replace(/\W/g, "").length >= 3).pop() || words.split(" ").pop();
  });

  modal.addEventListener("click", async (e) => {
    const frame = e.target.closest("[data-frame]");
    if (frame) return save({ frame: frame.dataset.frame });
    const variant = e.target.closest("[data-variant]");
    if (variant) {
      if (variant.dataset.variant === t.id) return;
      try {
        const next = await api(`/items/${variant.dataset.variant}/restore`, { method: "POST" });
        await refresh(root);
        toast(`Variation ${next.variant || ""} leads now.`);
        return editor({ ...next, videoName: title }, root);
      } catch (err) {
        return toast(err.message);
      }
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "close") return closeModal();
    if (act === "save") return save();
    if (act === "check") {
      const btn = e.target.closest("[data-act=check]");
      btn.disabled = true;
      btn.textContent = "Checking…";
      try {
        await api(`/items/${t.id}/check`, { method: "POST" });
        await refresh(root);
        toast("Checklist done.");
      } catch (err) {
        toast(err.message);
        btn.disabled = false;
      }
      return;
    }
    if (act === "keep-preset") {
      const words = $("#tn-headline", modal).value.trim();
      if (!words) return;
      const custom = [...(state.settings.presets || []), words];
      try {
        const s = await api("/settings", { method: "PATCH", body: { presets: custom } });
        state.settings = s;
        state.presets = s.all || state.presets;
        $("#tn-preset", modal).innerHTML = `<option value="">Pick words…</option>${presetOptions(words)}`;
        toast(`“${words}” saved to your text presets.`);
      } catch (err) {
        toast(err.message);
      }
      return;
    }
    if (act === "rate") {
      const liked = e.target.closest("[data-act=rate]").dataset.liked === "true";
      await api(`/items/${t.id}/rate`, { method: "POST", body: { liked } }).catch((err) => toast(err.message));
      toast(liked ? "Saved to your title taste." : "Noted. It won't write like that again.");
      return refresh(root);
    }
    if (act === "again") {
      const preset = $("#tn-preset", modal).value;
      toast(preset ? `Making three new variations with “${preset}”…` : "Making three new variations…");
      closeModal();
      api(`/items/${t.id}/again`, { method: "POST", body: { preset } }).then(() => toast("New variations ready.")).catch((err) => toast(err.message)).finally(() => refresh(root));
      return setTimeout(() => refresh(root).catch(() => {}), 1500);
    }
    if (act === "delete") {
      closeModal();
      await api(`/items/${t.id}`, { method: "DELETE" }).catch((err) => toast(err.message));
      return refresh(root);
    }
  });
  modal.addEventListener("keydown", (e) => e.key === "Enter" && e.target.matches("input:not([type=color])") && save());

  // Your own photos, into this thumbnail: choose them or drop them on the editor.
  const addOwn = async (files) => {
    const images = [...files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)).slice(0, 12);
    if (!images.length) return toast("Those aren't photos. JPEG, PNG, HEIC or WebP work.");
    const form = new FormData();
    images.forEach((f) => form.append("photos", f, f.name));
    const tile = $(".tn-addphoto span", modal);
    tile.textContent = "Adding…";
    try {
      const next = await api(`/items/${t.id}/photos`, { method: "POST", form });
      await refresh(root);
      toast(images.length === 1 ? "Your photo is on it now. Run the checklist when you're happy." : "Your photos are in the strip, and the best one is on it.");
      editor({ ...next, videoName: title }, root);
    } catch (err) {
      toast(err.message);
      tile.textContent = "Add your photo";
    }
  };
  $("#tn-edit-files", modal).addEventListener("change", (e) => addOwn(e.target.files));
  modal.addEventListener("dragover", (e) => {
    if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    modal.classList.add("over");
  });
  modal.addEventListener("dragleave", (e) => !modal.contains(e.relatedTarget) && modal.classList.remove("over"));
  modal.addEventListener("drop", (e) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    e.stopPropagation();
    modal.classList.remove("over");
    addOwn(e.dataTransfer.files);
  });
}

// ---------------------------------------------------------------------------

/** A thumbnail that isn't leading: look at it big, lead with it, save it or forget it. */
function pastThumb(t, root) {
  const modal = openModal(`
    <div class="modal-head">
      <div><h2>${esc(t.headline || "Thumbnail")}</h2><p class="muted">${esc(t.videoName || t.name || "")} · ${t.alt ? `variation ${esc(t.variant || "")}` : `replaced ${esc(when(t.replacedAt))}`}</p></div>
      <button class="icon-btn" data-act="close" aria-label="Close">${ICON.close}</button>
    </div>
    <p class="small tn-concept">${concept(t)}</p>
    <div class="tn-preview"><img src="${esc(bust(t))}" alt="" /></div>
    <div class="modal-actions">
      <span class="spacer"></span>
      <button class="btn sm danger" data-act="delete">Delete</button>
      <a class="btn sm" href="${esc(t.downloadUrl)}">${ICON.download} Save 1280×720</a>
      <button class="btn sm primary" data-act="restore">${ICON.again} ${t.alt ? "Lead with this one" : "Use this one again"}</button>
    </div>`);
  modal.addEventListener("click", async (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "close") return closeModal();
    closeModal();
    if (act === "restore") {
      await api(`/items/${t.id}/restore`, { method: "POST" }).then(() => toast("It's this video's thumbnail now.")).catch((err) => toast(err.message));
    } else if (act === "delete") {
      await api(`/items/${t.id}`, { method: "DELETE" }).catch((err) => toast(err.message));
    }
    return refresh(root);
  });
}

// ---------------------------------------------------------------------------
// Photo upload

function addPhotos(files, root) {
  const images = [...files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
  for (const f of images.slice(0, 12 - picked.length)) picked.push({ file: f, preview: URL.createObjectURL(f) });
  if (images.length > 12) toast("Twelve photos at most — the first twelve are in.");
  render(root);
}

async function makeFromPhotos(root) {
  const grid = $("#tn-grid", root);
  const preset = $("#tn-up-preset", grid).value === "__own" ? $("#tn-up-own", grid).value.trim() : $("#tn-up-preset", grid).value;
  const form = new FormData();
  picked.forEach((p) => form.append("photos", p.file, p.file.name));
  form.append("videoId", $("#tn-up-video", grid).value);
  form.append("title", $("#tn-up-title", grid).value);
  form.append("about", $("#tn-up-about", grid).value);
  form.append("preset", preset);
  const videoId = $("#tn-up-video", grid).value;
  picked.forEach((p) => URL.revokeObjectURL(p.preview));
  picked = [];
  uploading = true;
  render(root);
  refresh(root).catch(() => {});
  toast("Building three variations from your photos…");
  try {
    const t = await api("/photos", { method: "POST", form });
    uploading = false;
    await refresh(root);
    toast(videoId ? "Done. They're that video's thumbnails now." : "Done.");
    editor({ ...t, videoName: t.name }, root);
  } catch (err) {
    uploading = false;
    toast(err.message);
    await refresh(root).catch(() => {});
  }
}

export async function mountThumbnails(el) {
  el.innerHTML = `
    <div class="tn-page">
      <div class="page-head">
        <div>
          <h1>Thumbnails</h1>
          <p class="muted">Built by your YouTube Thumbnails SOP and trained on your style: every video gets three 1280×720 variations to A/B test. Each one is built on one of the five types, opens a curiosity gap the title doesn't close, and is checked at phone and sidebar size before it's done.</p>
        </div>
        <div class="head-actions tn-head">
          <label class="toggle"><input type="checkbox" id="tn-auto" /><span class="track"></span>Make them automatically</label>
          <label class="btn primary tn-upload-btn" title="Make thumbnails from your own photos. You can also drop photos anywhere on this page.">
            <input type="file" id="tn-head-files" accept="image/*,.heic,.heif" multiple hidden />${ICON.upload} Upload photos
          </label>
        </div>
      </div>
      <div class="tn-bar"><span class="muted small" id="tn-auto-note"></span><span class="spacer"></span><span class="muted small" id="tn-count"></span></div>
      <nav class="tab-strip tn-tabs" id="tn-tabs"></nav>
      <div class="tn-grid" id="tn-grid"><div class="loading">Loading…</div></div>
    </div>`;
  if (!$("link[data-thumbnails-css]")) {
    document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${API}/ui/thumbnails.css" data-thumbnails-css />`);
  }
  const root = $(".tn-page", el);

  $("#tn-auto", root).addEventListener("change", async (e) => {
    const auto = e.target.checked;
    try {
      state.settings = await api("/settings", { method: "PATCH", body: { auto } });
      toast(auto ? "Thumbnails will be made automatically." : "Automatic thumbnails are off.");
      await refresh(root);
    } catch (err) {
      toast(err.message);
    }
  });

  root.addEventListener("change", async (e) => {
    if (e.target.id === "tn-style-files") {
      pickStyle(e.target.files, root);
      e.target.value = "";
      return;
    }
    if (e.target.matches("[data-ref-note]")) {
      const id = e.target.dataset.refNote;
      style.busy = "Relearning your style…";
      render(root);
      try {
        const out = await api(`/style/refs/${id}`, { method: "PATCH", body: { note: e.target.value } });
        style.profile = out.profile;
        toast("Noted. Your style is updated.");
      } catch (err) {
        toast(err.message);
      }
      style.busy = "";
      await loadStyle().catch(() => {});
      return render(root);
    }
    if (e.target.id === "tn-files") {
      addPhotos(e.target.files, root);
      e.target.value = "";
      return;
    }
    if (e.target.id === "tn-up-preset") {
      $("#tn-up-own-wrap", root).hidden = e.target.value !== "__own";
      return;
    }
    const box = e.target.closest("[data-act=auto]");
    if (!box) return;
    const id = box.closest(".tn-card").dataset.id;
    try {
      await api(`/videos/${id}/auto`, { method: "POST", body: { auto: box.checked } });
      toast(box.checked ? "This video will get them." : "No thumbnails for this video.");
      await refresh(root);
    } catch (err) {
      toast(err.message);
    }
  });

  // Photos dropped anywhere on the page go to "From your photos", ready to make thumbnails from.
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
  root.addEventListener("dragover", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    root.classList.add("dropping");
    $("#tn-drop", root)?.classList.add("over");
  });
  root.addEventListener("dragleave", (e) => {
    if (root.contains(e.relatedTarget)) return;
    root.classList.remove("dropping");
    $("#tn-drop", root)?.classList.remove("over");
  });
  root.addEventListener("drop", (e) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    root.classList.remove("dropping");
    if (state.tab === "style") return pickStyle(e.dataTransfer.files, root);
    state.tab = "photos";
    addPhotos(e.dataTransfer.files, root);
  });
  $("#tn-head-files", root).addEventListener("change", (e) => {
    state.tab = "photos";
    addPhotos(e.target.files, root);
    e.target.value = "";
    $("#tn-upload-anchor", root)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#tn-tabs", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) (state.tab = b.dataset.tab), render(root);
  });

  root.addEventListener("click", async (e) => {
    const styleUnpick = e.target.closest("[data-style-unpick]");
    if (styleUnpick) {
      e.preventDefault();
      const [gone] = style.picked.splice(Number(styleUnpick.dataset.styleUnpick), 1);
      if (gone) URL.revokeObjectURL(gone.preview);
      return render(root);
    }
    const styleAct = e.target.closest("[data-style]")?.dataset.style;
    if (styleAct === "teach") return teach(root);
    if (styleAct === "rebuild") {
      style.busy = "Relearning your style…";
      render(root);
      await api("/style/profile", { method: "POST" }).then(() => toast("Relearned.")).catch((err) => toast(err.message));
      style.busy = "";
      await loadStyle().catch(() => {});
      return render(root);
    }
    const refDelete = e.target.closest("[data-ref-delete]");
    if (refDelete) {
      style.busy = "Relearning without it…";
      render(root);
      await api(`/style/refs/${refDelete.dataset.refDelete}`, { method: "DELETE" }).catch((err) => toast(err.message));
      style.busy = "";
      await loadStyle().catch(() => {});
      return render(root);
    }
    if (e.target.closest(".tn-ref")) return;
    const unpick = e.target.closest("[data-unpick]");
    if (unpick) {
      e.preventDefault();
      const [gone] = picked.splice(Number(unpick.dataset.unpick), 1);
      if (gone) URL.revokeObjectURL(gone.preview);
      return render(root);
    }
    if (e.target.closest("#tn-up-go")) return makeFromPhotos(root);
    const shot = e.target.closest(".tn-shotcard");
    if (shot) {
      const t = gallery().find((x) => x.id === shot.dataset.thumb);
      if (!t) return;
      return t.past ? pastThumb(t, root) : editor(t, root);
    }
    const card = e.target.closest(".tn-card");
    if (!card || e.target.closest(".toggle") || e.target.closest("a")) return;
    const v = state.videos.find((x) => x.id === card.dataset.id);
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "make") {
      toast("Making three variations. This takes a minute or two.");
      card.classList.add("working");
      api(`/videos/${v.id}/generate`, { method: "POST" }).then(() => toast("Thumbnails ready.")).catch((err) => toast(err.message)).finally(() => refresh(root));
      return setTimeout(() => refresh(root).catch(() => {}), 1500);
    }
    if (act === "open" && v?.thumbnail) return editor({ ...v.thumbnail, videoName: v.name }, root);
  });

  try {
    await loadStyle().catch(() => {});
    await refresh(root);
  } catch (err) {
    $("#tn-grid", root).innerHTML = `<div class="empty">Couldn't load thumbnails: ${esc(err.message)}</div>`;
  }
  return () => {
    clearTimeout(poll);
    closeModal();
  };
}
