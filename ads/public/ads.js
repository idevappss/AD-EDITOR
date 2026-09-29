// Ads Editor tab (#/ads, #/ads/<id>): upload raw ad footage, describe the edit, preview it, then save the video
// or open it in the timeline editor. Owned by the Ads Editor session; app.js calls mountAds(app).
const API = "/api/ads";
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const svg = (body, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  upload: svg(`<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 20h14"/>`, 28),
  wand: svg(`<path d="M4 20 15 9m0 0 3-3-2-2-3 3m2 2-2-2"/><path d="M6 4v3M4.5 5.5h3M18 15v3m-1.5-1.5h3"/>`),
  save: svg(`<path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14"/>`),
  timeline: svg(`<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 10h17M8 14h5M8 16.5h8"/>`),
  back: svg(`<path d="M15 6l-6 6 6 6"/>`, 14),
  trash: svg(`<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>`, 15),
  doc: svg(`<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5A.5.5 0 0 1 6.5 20V4a.5.5 0 0 1 .5-.5z"/><path d="M9.5 12h5M9.5 15.5h5"/>`, 14),
  stop: svg(`<rect x="7" y="7" width="10" height="10" rx="1.5"/>`, 14),
  check: svg(`<path d="M5 12.5l4.5 4.5L19 7.5"/>`, 14),
  play: svg(`<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>`, 16),
  playBig: svg(`<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>`, 22),
  close: svg(`<path d="M6 6l12 12M18 6 6 18"/>`, 18),
};
const IDEAS = [
  "Cut every retake and flub, keep only the best takes",
  "Make it punchy — under 30 seconds",
  "Pop up the key numbers big",
  "End on a CTA: Book your free call",
  "List the 3 main points as a checklist",
  "Open with the strongest hook",
];

const state = { config: null, ads: [], slides: [], selected: new Set(), poll: null, uploading: null, batch: loadBatch() };

/** The batch brief and switches, remembered in this browser (a convenience; nothing depends on it). */
function loadBatch() {
  try {
    return { prompt: "", auto: true, save: true, offer: "trial", ...JSON.parse(localStorage.getItem("ads.batch") || "{}") };
  } catch {
    return { prompt: "", auto: true, save: true };
  }
}
function saveBatch() {
  try {
    localStorage.setItem("ads.batch", JSON.stringify(state.batch));
  } catch {
    // private window or blocked storage: fine
  }
}
let root = null;

async function api(url, { method = "GET", body } = {}) {
  const res = await fetch(API + url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
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
  toast.t = setTimeout(() => (el.hidden = true), 2800);
}

const mb = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round((b || 0) / 1e6))} MB`);
const mmss = (s) => (s == null ? "–" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`);
const working = (ad) => ad.busy || ["waiting", "planning", "queued"].includes(ad.status);
const idFromHash = () => (location.hash.match(/^#\/ads\/([\w-]+)/) || [])[1] || null;

// The grid shows newest first, so position is no help when you want to say which video you mean.
// Number them by when they were uploaded instead: the first one you dropped in is 1, and it stays 1.
function adNumbers(ads) {
  const order = [...ads].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "") || a.id.localeCompare(b.id));
  return new Map(order.map((ad, i) => [ad.id, i + 1]));
}

function statusChip(ad) {
  if (ad.status === "queued" && !ad.busy) return `<span class="chip">Queued</span>`;
  if (working(ad)) return `<span class="chip live">Editing</span>`;
  if (ad.status === "error") return `<span class="chip error">Needs attention</span>`;
  if (ad.rendering) return `<span class="chip live">Saving</span>`;
  if (ad.video?.stale) return `<span class="chip st-due">Changed since last save</span>`;
  if (ad.video) return `<span class="chip done">Saved</span>`;
  if (ad.status === "ready") return `<span class="chip">Ready to review</span>`;
  if (ad.project && ad.project.status !== "ready") return `<span class="chip live">Processing</span>`;
  return `<span class="chip">Needs a brief</span>`;
}

// ---------------------------------------------------------------------------
// Colour grade: the creator's two grade templates (Assets LUTs, set on the Ads page), the built-in grades, and
// any other LUT of theirs. Dropdown values: "template:1", "grade:punchy", "lut:<id>".

const gradeSlots = (cfg) => (cfg.templates || []).filter((t) => t.title);

/** What the ad's grade dropdown shows: what it's graded with once edited, else the options it will be edited with. */
function gradeValue(ad, cfg) {
  const opts = ad.options || {};
  const slots = gradeSlots(cfg);
  const asLut = (id) => {
    const slot = slots.find((t) => t.n === opts.template && t.lut === id) || slots.find((t) => t.lut === id);
    return slot ? `template:${slot.n}` : `lut:${id}`;
  };
  if (ad.lutInUse) return ad.lutInUse === "none" ? `grade:${ad.grade && ad.grade !== "none" ? ad.grade : "none"}` : asLut(ad.lutInUse);
  if (opts.lut && opts.lut !== "none") return asLut(opts.lut);
  if (opts.template) return `template:${opts.template}`;
  if (!opts.grade || opts.grade === "auto") return slots.length ? `template:${cfg.defaultTemplate || 1}` : "grade:auto";
  return `grade:${opts.grade}`;
}

/** A dropdown value as the ad's grade options. */
function gradeOptionsFrom(value) {
  const [kind, id] = value.split(/:(.*)/);
  if (kind === "template") return { template: Number(id), grade: "auto", lut: "none" };
  if (kind === "lut") return { template: null, grade: "auto", lut: id };
  return { template: null, grade: id, lut: "none" };
}

function gradeSelect(ad, cfg) {
  const slots = gradeSlots(cfg);
  const value = gradeValue(ad, cfg);
  const opt = (v, label) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(label)}</option>`;
  const inSlot = new Set(slots.map((t) => t.lut));
  const others = (cfg.luts || []).filter((l) => !inSlot.has(l.id));
  return `<select id="ad-grade">
    ${slots.length ? `<optgroup label="Your templates">${slots.map((t) => opt(`template:${t.n}`, `Template ${t.n}: ${t.title}${t.n === cfg.defaultTemplate ? " (default)" : ""}`)).join("")}</optgroup>` : ""}
    <optgroup label="Built-in grades">${slots.length ? "" : opt("grade:auto", "Auto (AI picks)")}${Object.entries(cfg.grades || {}).map(([k, label]) => opt(`grade:${k}`, label)).join("")}</optgroup>
    ${others.length ? `<optgroup label="Your other LUTs">${others.map((l) => opt(`lut:${l.id}`, l.title)).join("")}</optgroup>` : ""}
  </select>`;
}

/** Template 1 / Template 2 and which one new ads start on, on the Ads page. Saved for everyone (data/ads/settings.json). */
function gradeSettings(cfg) {
  if (!cfg.templates || !(cfg.luts || []).length) return ""; // no LUTs yet, or a server without grade templates
  const slots = cfg.templates;
  const lutSelect = (n) => {
    const current = slots.find((t) => t.n === n)?.lut || "none";
    return `<select data-grade-template="${n}"><option value="none">None</option>${cfg.luts.map((l) => `<option value="${esc(l.id)}" ${l.id === current ? "selected" : ""}>${esc(l.title)}</option>`).join("")}</select>`;
  };
  return `
      <div class="ad-grade-set">
        <label class="field"><span>Color grade: Template 1</span>${lutSelect(1)}</label>
        <label class="field"><span>Template 2</span>${lutSelect(2)}</label>
        <div class="field"><span>New ads use</span><div class="segmented">${[1, 2].map((n) => `<button data-default-template="${n}" class="${cfg.defaultTemplate === n ? "on" : ""}">Template ${n}</button>`).join("")}</div></div>
      </div>`;
}

// ---------------------------------------------------------------------------
// List view: the upload box and every ad so far.

function listView() {
  const ads = state.ads;
  const nums = adNumbers(ads);
  return `
    <div class="page-head">
      <div>
        <h1>Ads Editor</h1>
        <p class="muted">Drop in raw ad footage and say what you want. It cuts the retakes and dead air, grades it, adds motion graphics, captions and sound effects, then shows you the result.</p>
      </div>
    </div>
    ${state.config && !state.config.claude ? `<div class="banner">Claude isn't connected, so edits are a clean tighten with a few graphics. Add your key in Integrations for the full edit.</div>` : ""}
    <div class="card ad-batch">
      <label class="field"><span>Brief for these uploads <em>(optional, applies to every video you drop in)</em></span>
        <textarea id="ad-batch-prompt" rows="2" placeholder="e.g. Problem-aware ads for ATLAS. Cut every retake, pop up the numbers, end on the click button.">${esc(state.batch.prompt)}</textarea>
      </label>
      <div class="ad-toggles">
        <label class="toggle"><input type="checkbox" id="ad-batch-auto" ${state.batch.auto ? "checked" : ""} /><span class="track"></span>Edit them automatically</label>
        <label class="toggle"><input type="checkbox" id="ad-batch-save" ${state.batch.save ? "checked" : ""} ${state.batch.auto ? "" : "disabled"} /><span class="track"></span>Save the videos when done</label>
      </div>${gradeSettings(state.config || {})}
    </div>
    <label class="dropzone ad-drop" id="ad-drop">
      <input type="file" accept="video/*" multiple hidden id="ad-file" />
      ${state.uploading
        ? `<div class="ad-up"><b>Uploading ${state.uploading.total > 1 ? `${state.uploading.index} of ${state.uploading.total}: ` : ""}${esc(state.uploading.name)}</b><div class="ad-bar"><i style="width:${state.uploading.pct}%"></i></div><span class="muted small">${state.uploading.pct}%</span></div>`
        : `${ICON.upload}<b>Upload your ad footage</b><span class="muted small">Drag one or more videos here, or click to choose. Raw takes are fine.</span>`}
    </label>
    <h3 class="ad-h">Your ads ${ads.length ? `<span class="muted small">· ${ads.length} ad${ads.length === 1 ? "" : "s"}, ${mb(ads.reduce((t, a) => t + (a.sizeBytes || 0), 0))} on disk</span>` : ""}</h3>
    <div class="ad-grid">
      ${ads.length ? bulkBar(ads) : ""}
      ${ads.length
        ? ads
            .map(
              (ad) => `
        <a class="ad-card${state.selected.has(ad.id) ? " picked" : ""}" href="#/ads/${ad.id}">
          <div class="ad-thumb">${ad.video ? `<button class="ad-play" data-play="${ad.id}" title="Watch the saved video">${ICON.playBig}</button>` : ""}<span class="ad-num" title="Video ${nums.get(ad.id)} — say this number when you mean this video">${nums.get(ad.id)}</span><span class="ad-pick" data-pick="${ad.id}" role="checkbox" aria-checked="${state.selected.has(ad.id)}" title="Select">${ICON.check}</span>${ad.project ? `<img src="${esc(ad.project.poster)}" alt="" loading="lazy" onerror="this.remove()" />` : ""}</div>
          <div class="ad-card-body">
            <b>${esc(ad.name)}</b>
            <div class="ad-card-meta">${statusChip(ad)}${ad.stats ? `<span class="muted small">${mmss(ad.stats.source)} → ${mmss(ad.stats.final)}</span>` : ""}<span class="muted small">${mb(ad.sizeBytes)}</span><button class="ad-del" data-del="${ad.id}" title="Delete this ad and its video">${ICON.trash}</button></div>
          </div>
        </a>`,
            )
            .join("")
        : `<div class="empty">No ads yet. Upload footage above to make your first one.</div>`}
    </div>
    <h3 class="ad-h">Slides <span class="muted small">· your decks and product screens. Edits drop one in when the speaker talks about what it shows.</span></h3>
    <div class="ad-logo-row ad-slides">
      ${state.slides
        .map((sl) => `<div class="ad-logo ad-slide-tile" data-slide="${sl.id}"><img src="${esc(sl.url)}" alt="" loading="lazy" /><input value="${esc(sl.name)}" title="What this slide shows" /><button class="ad-logo-x" data-slide-del="${sl.id}" title="Delete this slide">×</button></div>`)
        .join("")}
      <label class="ad-logo add ad-slide-tile"><input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden id="ad-slide-file" />+ Add slides</label>
    </div>`;
}

/** Watch the saved MP4 (the file Download gives you) in a popup: the true final, no live-preview stutter. */
function watch(ad) {
  if (!ad?.video) return toast("Save this ad first, then you can watch the final video.");
  const box = document.createElement("div");
  box.className = "ad-watch";
  box.innerHTML = `<div class="ad-watch-card" role="dialog" aria-label="${esc(ad.name)}">
      <div class="ad-watch-head"><b>${esc(ad.name)}</b><button class="ad-watch-x" title="Close">${ICON.close}</button></div>
      <video src="${API}/${ad.id}/download?v=${encodeURIComponent(ad.video.at || "")}" controls autoplay playsinline></video>
      ${ad.video.stale ? `<p class="small muted">This is the last saved version. Changes since then aren't in it until you save again.</p>` : ""}
      <div class="ad-watch-foot"><a class="btn ghost sm" href="${API}/${ad.id}/download">${ICON.save}<span>Download</span></a></div>
    </div>`;
  const close = () => {
    $("video", box)?.pause();
    box.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => e.key === "Escape" && close();
  box.addEventListener("click", (e) => (e.target === box || e.target.closest(".ad-watch-x")) && close());
  document.addEventListener("keydown", onKey);
  document.body.append(box);
}

/** The two ways an ad can end (from the server, with fallbacks so the chooser always works). */
const OFFER_CHOICES = () => state.config?.offers || {
  trial: { label: "ATLAS · 7-day free trial", cta: "Start Your 7 Day Free Trial" },
  call: { label: "Book a call", cta: "Book a call" },
};
const OFFER_HINT = {
  trial: "Ends on \u201cStart your 7-day free trial\u201d \u00b7 app.atlas-ai.club",
  call: "Ends on \u201cBook your free call\u201d",
};

/**
 * Asked every time videos are dropped in: how these ads end. Resolves with "trial" / "call", or null when cancelled.
 * The last choice is preselected (remembered in this browser).
 */
function chooseOffer(count) {
  return new Promise((resolve) => {
    const offers = OFFER_CHOICES();
    let pick = offers[state.batch.offer] ? state.batch.offer : "trial";
    const box = document.createElement("div");
    box.className = "ad-watch ad-offer";
    const paint = () => {
      box.innerHTML = `<div class="ad-watch-card ad-offer-card" role="dialog" aria-label="How should these ads end?">
          <div class="ad-watch-head"><b>How should ${count === 1 ? "this ad" : `these ${count} ads`} end?</b><button class="ad-watch-x" data-offer-cancel title="Cancel">${ICON.close}</button></div>
          <div class="ad-offer-list">${Object.entries(offers).map(([k, o]) => `<button class="ad-offer-opt${k === pick ? " on" : ""}" data-offer="${k}" aria-pressed="${k === pick}"><b>${esc(o.label)}</b><span class="muted small">${esc(OFFER_HINT[k] || o.cta)}</span></button>`).join("")}</div>
          <p class="muted small">Every CTA, end card and closing line sells this one offer. You can change it per ad later.</p>
          <div class="ad-offer-foot"><button class="btn ghost" data-offer-cancel>Cancel</button><button class="btn primary" data-offer-go>${ICON.upload}<span>Upload ${count === 1 ? "video" : `${count} videos`}</span></button></div>
        </div>`;
    };
    const done = (v) => {
      box.remove();
      document.removeEventListener("keydown", onKey);
      resolve(v);
    };
    const onKey = (e) => {
      if (e.key === "Escape") done(null);
      if (e.key === "Enter") done(pick);
    };
    box.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-offer]");
      if (opt) {
        pick = opt.dataset.offer;
        paint();
        return;
      }
      if (e.target.closest("[data-offer-go]")) done(pick);
      else if (e.target === box || e.target.closest("[data-offer-cancel]")) done(null);
    });
    document.addEventListener("keydown", onKey);
    paint();
    document.body.append(box);
    $("[data-offer-go]", box)?.focus();
  });
}

/** Select all / some ads, then download (one zip) or delete them together. */
function bulkBar(ads) {
  const n = state.selected.size;
  const all = n > 0 && n === ads.length;
  const picked = ads.filter((a) => state.selected.has(a.id));
  const saved = picked.filter((a) => a.video).length;
  return `<div class="ad-bulk">
      <span class="ad-pick ad-pick-all" data-pick-all role="checkbox" aria-checked="${all}" title="${all ? "Clear selection" : "Select all"}">${ICON.check}</span>
      <span class="small">${n ? `${n} selected · ${mb(picked.reduce((t, a) => t + (a.sizeBytes || 0), 0))}` : "Select all"}</span>
      ${n ? `<button class="btn ghost sm" data-bulk="download" ${saved ? "" : "disabled"} title="${saved ? "" : "None of these have been saved as a video yet"}">Download${saved > 1 ? ` ${saved} as zip` : ""}</button>
      <button class="btn ghost sm ad-danger" data-bulk="delete">Delete ${n}</button>
      <button class="btn ghost sm" data-bulk="clear">Clear</button>` : ""}
    </div>`;
}

async function bulk(action) {
  const picked = state.ads.filter((a) => state.selected.has(a.id));
  if (action === "clear") return (state.selected.clear(), draw());
  if (action === "download") {
    const saved = picked.filter((a) => a.video);
    if (!saved.length) return toast("None of these have been saved as a video yet.");
    const a = document.createElement("a");
    a.href = saved.length === 1 ? `${API}/${saved[0].id}/download` : `${API}/download.zip?ids=${saved.map((x) => x.id).join(",")}`;
    a.download = "";
    document.body.append(a);
    a.click();
    a.remove();
    const skipped = picked.length - saved.length;
    return toast(`Downloading ${saved.length === 1 ? "1 video" : `${saved.length} videos as a zip`}${skipped ? `. ${skipped} not saved yet, skipped` : ""}.`);
  }
  if (action === "delete") {
    const total = picked.reduce((t, a) => t + (a.sizeBytes || 0), 0);
    if (!confirm(`Delete ${picked.length} ad${picked.length === 1 ? "" : "s"}?\n\nThis removes them with their videos, saved renders and backups, freeing about ${mb(total)}. It can't be undone.`)) return;
    let freed = 0;
    let failed = 0;
    for (const ad of picked) {
      try {
        freed += (await api(`/${ad.id}`, { method: "DELETE" })).freed || 0;
        state.selected.delete(ad.id);
      } catch {
        failed++;
      }
    }
    toast(`Deleted ${picked.length - failed}. Freed ${mb(freed)}.${failed ? ` ${failed} couldn't be deleted.` : ""}`);
    return refresh(true);
  }
}

const isVideo = (f) => f.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|mkv)$/i.test(f.name);

function bindDrop() {
  const drop = $("#ad-drop", root);
  const input = $("#ad-file", root);
  input.addEventListener("change", () => input.files.length && uploadAll([...input.files].filter(isVideo)));
  drop.addEventListener("dragover", (e) => (e.preventDefault(), drop.classList.add("over")));
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("over");
    const files = [...(e.dataTransfer?.files || [])].filter(isVideo);
    if (files.length) uploadAll(files);
    else toast("Drop video files.");
  });
}

async function deleteAd(ad) {
  if (!ad) return false;
  if (!confirm(`Delete "${ad.name}"?\n\nThis removes the ad, its uploaded video, saved renders and backups, freeing about ${mb(ad.sizeBytes)}. It can't be undone.`)) return false;
  try {
    const res = await api(`/${ad.id}`, { method: "DELETE" });
    toast(`Deleted. Freed ${mb(res.freed)}.`);
    return true;
  } catch (err) {
    toast(err.message);
    return false;
  }
}

function bindList() {
  bindDrop();
  root.onclick = async (e) => {
    const play = e.target.closest("[data-play]");
    if (play) {
      e.preventDefault();
      e.stopPropagation();
      return watch(state.ads.find((a) => a.id === play.dataset.play));
    }
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      e.preventDefault();
      e.stopPropagation();
      const id = pick.dataset.pick;
      state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
      return draw();
    }
    if (e.target.closest("[data-pick-all]")) {
      const all = state.selected.size === state.ads.length;
      state.selected = all ? new Set() : new Set(state.ads.map((a) => a.id));
      return draw();
    }
    const act = e.target.closest("[data-bulk]");
    if (act) return bulk(act.dataset.bulk);
    const sdel = e.target.closest("[data-slide-del]");
    if (sdel) {
      e.preventDefault();
      if (!confirm("Delete this slide? Ads already saved keep it.")) return;
      await api(`/slides/${sdel.dataset.slideDel}`, { method: "DELETE" }).catch((err) => toast(err.message));
      return refresh(true);
    }
    const del = e.target.closest("[data-del]");
    if (!del) return;
    e.preventDefault();
    e.stopPropagation();
    if (await deleteAd(state.ads.find((a) => a.id === del.dataset.del))) await refresh(true);
  };
  $("#ad-slide-file", root).addEventListener("change", async (e) => {
    const form = new FormData();
    for (const f of e.target.files) form.append("slides", f);
    toast("Adding slides…");
    const res = await fetch(`${API}/slides`, { method: "POST", body: form });
    toast(res.ok ? "Slides added." : "Couldn't add those slides.");
    refresh(true);
  });
  root.querySelectorAll("[data-slide] input").forEach((inp) =>
    inp.addEventListener("change", () => api(`/slides/${inp.closest("[data-slide]").dataset.slide}`, { method: "PATCH", body: { name: inp.value } }).catch((err) => toast(err.message))),
  );
  $("#ad-batch-prompt", root).addEventListener("input", (e) => ((state.batch.prompt = e.target.value), saveBatch()));
  $("#ad-batch-auto", root).addEventListener("change", (e) => {
    state.batch.auto = e.target.checked;
    $("#ad-batch-save", root).disabled = !e.target.checked;
    saveBatch();
  });
  $("#ad-batch-save", root).addEventListener("change", (e) => ((state.batch.save = e.target.checked), saveBatch()));
  const saveGrades = async (body) => {
    try {
      Object.assign(state.config, await api("/settings", { method: "PUT", body }));
      $$("[data-default-template]", root).forEach((b) => b.classList.toggle("on", Number(b.dataset.defaultTemplate) === state.config.defaultTemplate));
      toast("Color grade templates saved.");
    } catch (err) {
      toast(err.message);
    }
  };
  $$("[data-grade-template]", root).forEach((sel) =>
    sel.addEventListener("change", () => saveGrades({ gradeTemplates: $$("[data-grade-template]", root).map((x) => x.value) })),
  );
  $$("[data-default-template]", root).forEach((b) => b.addEventListener("click", () => saveGrades({ defaultTemplate: Number(b.dataset.defaultTemplate) })));
}

/** Send one file to /api/projects (transcribe only), reporting progress. Resolves with the new project. */
function sendFile(file, onPct) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("video", file);
    form.append("autoPick", "false"); // transcribe only: the Ads Editor does the cutting
    form.append("notes", "Ads Editor");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/projects");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && onPct(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 300 || !res.id) reject(new Error(res.error || "Upload failed."));
      else resolve(res);
    };
    xhr.onerror = () => reject(new Error("Upload failed. Is the app still running?"));
    xhr.send(form);
  });
}

/**
 * Upload videos one after another. Each becomes an ad; with "Edit them automatically" on, each goes straight into
 * the edit queue with the batch brief (and is saved when done, if asked). One video with auto-edit off opens its page.
 */
async function uploadAll(files) {
  if (state.uploading || !files.length) return;
  const offer = await chooseOffer(files.length);
  if (!offer) return;
  state.batch.offer = offer;
  saveBatch();
  const { auto, save, prompt } = state.batch;
  let last = null;
  let done = 0;
  for (const [i, file] of files.entries()) {
    state.uploading = { name: file.name, pct: 0, index: i + 1, total: files.length };
    draw();
    try {
      const project = await sendFile(file, (pct) => {
        state.uploading.pct = pct;
        const bar = $(".ad-bar i", root);
        if (bar) {
          bar.style.width = `${pct}%`;
          bar.parentNode.nextElementSibling.textContent = `${pct}%`;
        }
      });
      last = await api("/", { method: "POST", body: { projectId: project.id, name: file.name, aspect: "9:16", options: { offer } } });
      if (auto) await api(`/${last.id}/edit`, { method: "POST", body: { prompt, aspect: "9:16", options: { grade: "auto", lut: "none", offer }, autoSave: save } });
      done++;
    } catch (err) {
      toast(`${file.name}: ${err.message}`);
    }
  }
  state.uploading = null;
  if (!auto && files.length === 1 && last) {
    location.hash = `#/ads/${last.id}`;
    return;
  }
  toast(auto ? `${done} video${done === 1 ? "" : "s"} uploaded and queued for editing${save ? " (they'll be saved when done)" : ""}.` : `${done} video${done === 1 ? "" : "s"} uploaded.`);
  await refresh(true);
}

// ---------------------------------------------------------------------------
// One ad: preview on the left, the brief and the actions on the right.

function adView(ad) {
  const cfg = state.config || {};
  const num = adNumbers(state.ads).get(ad.id);
  const opts = ad.options || {};
  const processing = ad.project && ad.project.status !== "ready" && ad.project.status !== "error";
  const busy = working(ad);
  const ready = ad.status === "ready" && !busy;
  const [aw, ah] = (ad.aspect || "9:16").split(":").map(Number);
  const s = ad.stats;

  let stage;
  if (ready && ad.previewUrl) {
    stage = `<hyperframes-player controls autoplay src="${esc(ad.previewUrl)}?rev=${ad.rev || 0}" width="${ad.aspect === "16:9" ? 1920 : 1080}" height="${{ "9:16": 1920, "4:5": 1350, "1:1": 1080, "16:9": 1080 }[ad.aspect] || 1920}"></hyperframes-player>`;
  } else {
    const line = busy ? ad.message || "Working…" : processing ? ad.project.message || "Getting the video ready…" : ad.status === "error" ? "" : "Describe what you want, then press Edit my ad.";
    stage = `<div class="ad-stage-empty">${ad.project ? `<img src="${esc(ad.project.poster)}" alt="" onerror="this.remove()" />` : ""}<div class="ad-stage-msg">${busy || processing ? `<i class="ad-spin"></i>` : ""}<span>${esc(line)}</span></div></div>`;
  }

  return `
    <a class="back" href="#/ads">${ICON.back} All ads</a>
    <div class="page-head ad-head">
      <div>
        <div class="ad-title-row">${num ? `<span class="ad-num head" title="Video ${num}">${num}</span>` : ""}<h1 contenteditable="plaintext-only" spellcheck="false" id="ad-name" title="Rename">${esc(ad.name)}</h1></div>
        <p class="muted">${ad.project?.duration ? `${mmss(ad.project.duration)} of footage` : "Uploading footage"}${processing ? ` · ${esc(ad.project.message || "processing")}` : ""}</p>
      </div>
      <div class="head-actions">${statusChip(ad)}<button class="btn ghost sm" data-act="delete" title="Delete this ad and its video">${ICON.trash}</button></div>
    </div>
    <div class="ad-work">
      <div class="ad-stage" style="--ar:${aw}/${ah}">${stage}</div>
      <div class="ad-side">
        ${ad.status === "error" && !busy ? `<div class="banner ad-error">${esc(ad.error || "Something went wrong.")}</div>` : ""}
        ${ready && ad.summary ? `<div class="card ad-summary"><p>${esc(ad.summary)}</p>${ad.notice ? `<p class="muted small">${esc(ad.notice)}</p>` : ""}
          ${s ? `<div class="ad-stats"><span><b>${mmss(s.source)} → ${mmss(s.final)}</b>length</span><span><b>${s.pieces}</b>cuts</span><span><b>${s.graphics}</b>graphics</span><span><b>${s.sfx}</b>sound FX</span>${s.emphasis ? `<span><b>${s.emphasis}</b>big words</span>` : ""}</div>` : ""}
        </div>` : ""}
        ${ready ? `
        <div class="ad-actions">
          ${ad.video && !ad.rendering && ad.video.stale
            ? `<button class="btn primary" data-act="save">${ICON.save} Save the latest version</button><a class="btn" href="${esc(ad.video.download)}">Download older save</a><button class="btn" data-act="watch">${ICON.play} Watch saved</button>`
            : ad.video && !ad.rendering
            ? `<a class="btn primary" href="${esc(ad.video.download)}">${ICON.save} Download video</a><button class="btn" data-act="watch">${ICON.play} Watch final video</button><button class="btn" data-act="save">Save again</button>`
            : ad.rendering
              ? `<div class="ad-render"><div class="ad-bar"><i style="width:${ad.render?.progress || 3}%"></i></div><span class="muted small">${esc(ad.render?.message || "Saving…")}</span><button class="btn ghost sm" data-act="cancel">${ICON.stop} Stop</button></div>`
              : `<button class="btn primary" data-act="save">${ICON.save} Save video</button>`}
          <a class="btn" href="${esc(ad.editorUrl)}">${ICON.timeline} Open in timeline</a>
        </div>
        ${ad.transcript ? `<div class="ad-transcript"><span class="muted small">Transcript</span><a class="btn ghost sm" href="${esc(ad.transcript.txt)}" download>${ICON.doc} Text (.txt)</a><a class="btn ghost sm" href="${esc(ad.transcript.srt)}" download>${ICON.doc} Subtitles (.srt)</a></div>` : ""}
        ${ad.render?.status === "error" ? `<p class="small ad-warn">Saving failed: ${esc(ad.render.error || ad.render.message)}</p>` : ""}` : ""}

        <div class="card ad-brief">
          <label class="field"><span>${ready ? "Want changes? Describe the new edit" : "What should this ad do?"}</span>
            <textarea id="ad-prompt" rows="5" placeholder="e.g. Problem-aware ad for chiropractors. Cut all the retakes, keep it under 35s, pop up the numbers, end with 'Book a free strategy call'." ${busy ? "disabled" : ""}>${esc(ad.prompt || "")}</textarea>
          </label>
          <p class="muted small">Always applied: cut every retake, under 30 s, big numbers, a checklist of the 3 main points, the strongest hook first, and an ending that sells the offer below. Sound effects, music and captions start on.</p>
          <div class="ad-ideas">${IDEAS.map((i) => `<button class="chip chip-link" data-idea="${esc(i)}" ${busy ? "disabled" : ""}>+ ${esc(i)}</button>`).join("")}</div>
          <div class="field ad-logos"><span>Brand logos <em>— when the brand is named, its logo pops up</em></span>
            <div class="ad-logo-row">
              ${(ad.logos || []).map((l) => `<div class="ad-logo" data-logo="${esc(l.id)}"><img src="${API}/${ad.id}/logos/${encodeURIComponent(l.file)}" alt="" /><input value="${esc(l.name)}" data-logo-name title="The brand name as it's said" /><button class="ad-logo-x" data-logo-del title="Remove">×</button></div>`).join("")}
              <label class="ad-logo add" title="Add logos (PNG with a transparent background works best)"><input type="file" accept="image/*" multiple hidden id="ad-logo-file" /><span>+</span><small>Add logo</small></label>
            </div>
          </div>
          <div class="ad-opts">
            <div class="field"><span>Format</span><div class="segmented" data-seg="aspect">${Object.entries(cfg.aspects || { "9:16": "" }).map(([k, hint]) => `<button data-aspect="${k}" class="${ad.aspect === k ? "on" : ""}" title="${esc(hint)}">${k}</button>`).join("")}</div></div>
            <label class="field"><span>Color grade</span>${gradeSelect(ad, cfg)}</label>
            <label class="field"><span>Ending</span><select id="ad-offer">${Object.entries(OFFER_CHOICES()).map(([k, o]) => `<option value="${k}" ${(opts.offer || "trial") === k ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select></label>
          </div>
          <div class="ad-toggles">
            <label class="toggle"><input type="checkbox" data-opt="sfx" ${opts.sfx !== false ? "checked" : ""} /><span class="track"></span>Sound effects</label>
            <label class="toggle"><input type="checkbox" data-opt="music" ${opts.music === true ? "checked" : ""} /><span class="track"></span>Music bed</label>
            <label class="toggle"><input type="checkbox" data-opt="captions" ${opts.captions === true ? "checked" : ""} /><span class="track"></span>Captions</label>
          </div>
          ${busy
            ? `<button class="btn" data-act="stop">${ICON.stop} Stop</button>`
            : `<button class="btn primary lg" data-act="edit" ${processing && !ad.project ? "disabled" : ""}>${ICON.wand} ${ready ? "Re-edit my ad" : "Edit my ad"}</button>
               ${ready ? `<p class="muted small">Re-editing rebuilds the whole timeline, replacing changes you made in the timeline editor.</p>` : processing ? `<p class="muted small">You can start now. It'll begin as soon as the video is transcribed.</p>` : ""}`}
        </div>
      </div>
    </div>`;
}

function bindAd(ad) {
  const prompt = $("#ad-prompt", root);
  let aspect = ad.aspect;
  $$("[data-idea]", root).forEach((b) =>
    b.addEventListener("click", () => {
      const text = b.dataset.idea;
      prompt.value = prompt.value.trim() ? `${prompt.value.trim().replace(/[.]?$/, ".")} ${text}.` : `${text}.`;
      prompt.focus();
    }),
  );
  $$("[data-aspect]", root).forEach((b) =>
    b.addEventListener("click", () => {
      aspect = b.dataset.aspect;
      $$("[data-aspect]", root).forEach((x) => x.classList.toggle("on", x === b));
    }),
  );
  const name = $("#ad-name", root);
  name?.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), name.blur()));
  name?.addEventListener("blur", async () => {
    const value = name.textContent.trim();
    if (value && value !== ad.name) await api(`/${ad.id}`, { method: "PATCH", body: { name: value } }).catch((err) => toast(err.message));
  });

  $("#ad-logo-file", root)?.addEventListener("change", async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    const form = new FormData();
    files.forEach((f) => form.append("logos", f));
    try {
      const res = await fetch(`${API}/${ad.id}/logos`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast(`${files.length} logo${files.length === 1 ? "" : "s"} added. Name each the way it's said in the video.`);
      await refresh(true);
    } catch (err) {
      toast(err.message);
    }
  });
  $$("[data-logo-name]", root).forEach((input) =>
    input.addEventListener("change", () => api(`/${ad.id}/logos/${input.closest("[data-logo]").dataset.logo}`, { method: "PATCH", body: { name: input.value } }).catch((err) => toast(err.message))),
  );
  $$("[data-logo-del]", root).forEach((b) =>
    b.addEventListener("click", async (e) => {
      e.preventDefault();
      await api(`/${ad.id}/logos/${b.closest("[data-logo]").dataset.logo}`, { method: "DELETE" }).catch((err) => toast(err.message));
      await refresh(true);
    }),
  );

  // A finished ad changes grade on the spot: only the colour changes, the edit stays as it is.
  $("#ad-grade", root)?.addEventListener("change", async (e) => {
    if (ad.status !== "ready" || working(ad)) return;
    const select = e.target;
    select.disabled = true;
    toast("Changing the color grade…");
    try {
      await api(`/${ad.id}/grade`, { method: "POST", body: { options: gradeOptionsFrom(select.value) } });
      toast(ad.video ? "Grade changed. Save the video again to bake it in." : "Grade changed.");
      await refresh(true);
    } catch (err) {
      toast(err.message);
      select.disabled = false;
    }
  });

  root.onclick = async (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "watch") return watch(ad);
    try {
      if (act === "edit") {
        if (ad.handEdited && !confirm("You've edited this ad in the timeline. Re-editing rebuilds it from scratch (your version is backed up first). Continue?")) return;
        const options = gradeOptionsFrom($("#ad-grade", root).value);
        $$("[data-opt]", root).forEach((t) => (options[t.dataset.opt] = t.checked));
        options.offer = $("#ad-offer", root)?.value || "trial";
        await api(`/${ad.id}/edit`, { method: "POST", body: { prompt: prompt.value, aspect, options } });
        toast("Editing your ad…");
      }
      if (act === "stop") await api(`/${ad.id}/stop`, { method: "POST" });
      if (act === "save") {
        await api(`/${ad.id}/save`, { method: "POST" });
        toast("Saving the video. This takes a minute or two.");
      }
      if (act === "cancel") await api(`/${ad.id}/cancel`, { method: "POST" });
      if (act === "delete") {
        if (await deleteAd(ad)) location.hash = "#/ads";
        return;
      }
      await refresh(true);
    } catch (err) {
      toast(err.message);
    }
  };
}

// ---------------------------------------------------------------------------

let drawnKey = "";
function draw(force = true) {
  if (!root) return;
  const id = idFromHash();
  if (!id) {
    // Already showing the list: swap only the cards and the upload box, so the brief being typed isn't lost.
    if (drawnKey === "list" && $(".ad-grid", root)) {
      const next = document.createElement("div");
      next.innerHTML = listView();
      $(".ad-grid", root).replaceWith($(".ad-grid", next));
      const drop = $("#ad-drop", root);
      const fresh = $("#ad-drop", next);
      if (drop.innerHTML !== fresh.innerHTML && !$("input:focus", drop)) {
        drop.replaceWith(fresh);
        bindDrop();
      }
      return;
    }
    root.innerHTML = listView();
    bindList();
    drawnKey = "list";
    return;
  }
  const ad = state.ads.find((a) => a.id === id);
  if (!ad) {
    root.innerHTML = `<a class="back" href="#/ads">${ICON.back} All ads</a><div class="empty">That ad isn't here any more.</div>`;
    return;
  }
  // Redraw only when something visible changed, so typing in the brief and the playing preview aren't reset.
  const key = JSON.stringify([ad.status, ad.message, ad.error, ad.rev, ad.busy, ad.rendering, ad.render?.progress, ad.render?.status, ad.video?.at, ad.project?.status, ad.project?.message, ad.name, (ad.logos || []).length]);
  if (!force && key === drawnKey) return;
  const typed = $("#ad-prompt", root)?.value;
  const focused = document.activeElement?.id === "ad-prompt";
  root.innerHTML = adView(ad);
  drawnKey = key;
  if (typed != null && focused) {
    const box = $("#ad-prompt", root);
    box.value = typed;
    box.focus();
  }
  bindAd(ad);
}

async function refresh(force = false) {
  try {
    const data = await api("/");
    state.config = data;
    state.ads = data.ads;
    for (const id of state.selected) if (!state.ads.some((a) => a.id === id)) state.selected.delete(id);
    state.slides = (await api("/slides").catch(() => ({ slides: [] }))).slides;
  } catch (err) {
    if (root) root.innerHTML = `<div class="empty">Couldn't load the Ads Editor: ${esc(err.message)}</div>`;
    return;
  }
  if (state.uploading && !force) return; // keep the progress bar steady
  draw(force);
}

export async function mountAds(el) {
  if (!$("link[data-ads-css]")) document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${API}/ui/ads.css" data-ads-css />`);
  if (!customElements.get("hyperframes-player")) {
    await new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "/vendor/hyperframes-player.js";
      s.onload = s.onerror = resolve;
      document.head.append(s);
    });
  }
  el.innerHTML = `<div class="ad-page"></div>`;
  root = $(".ad-page", el);
  clearInterval(state.poll);
  await refresh(true);
  const mine = root;
  state.poll = setInterval(() => {
    if (!document.body.contains(mine)) return clearInterval(state.poll);
    const busy = state.ads.some((a) => working(a) || a.rendering || (a.project && !["ready", "error", "stopped"].includes(a.project.status)));
    if (busy || !state.config) refresh(false);
  }, 2000);
  return () => clearInterval(state.poll);
}
