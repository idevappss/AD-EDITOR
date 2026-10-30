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
  chevron: svg(`<path d="m8 10 4 4 4-4"/>`, 16),
  chevR: svg(`<path d="m10 7 5 5-5 5"/>`, 14),
  plus: svg(`<path d="M12 5v14M5 12h14"/>`, 15),
  pause: svg(`<path d="M8 5.5v13M16 5.5v13" stroke-width="3"/>`, 18),
  playT: svg(`<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>`, 18),
  vol: svg(`<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/>`, 20),
  mute: svg(`<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="m16 10 4 4m0-4-4 4"/>`, 20),
  eye: svg(`<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>`, 16),
  arrow: svg(`<path d="M5 12h14m-5-5 5 5-5 5"/>`, 18),
  info: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>`, 15),
  heart: svg(`<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z"/>`, 19),
  comment: svg(`<path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 19.5l1-4A8 8 0 1 1 20 11.5z"/>`, 19),
  send: svg(`<path d="M21 4 10.5 14.5M21 4l-6.5 16-4-5.5L4 11z"/>`, 19),
  bookmark: svg(`<path d="M6.5 4h11v16l-5.5-4-5.5 4z"/>`, 19),
  dots: svg(`<circle cx="5.5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18.5" cy="12" r="1.2" fill="currentColor"/>`, 19),
  globe: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>`, 12),
  like: svg(`<path d="M7.5 10.5v9h-3v-9zM7.5 10.5 11 3.5a2 2 0 0 1 2 2v4h5.2a2 2 0 0 1 2 2.3l-1.2 6a2 2 0 0 1-2 1.7H7.5"/>`, 17),
  person: `<svg viewBox="0 0 120 120" width="120" height="120" fill="currentColor" aria-hidden="true"><circle cx="60" cy="44" r="20"/><path d="M22 112c3-24 18-38 38-38s35 14 38 38z"/></svg>`,
  ig: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igg)"/><rect x="6.5" y="6.5" width="11" height="11" rx="3.5" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.6" cy="7.4" r="1" fill="#fff"/></svg>`,
  fb: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1877f2"/><path d="M13.3 20.5v-6.6h2.2l.4-2.6h-2.6V9.7c0-.8.3-1.3 1.4-1.3h1.3V6.1c-.3 0-1.1-.1-2-.1-2 0-3.3 1.2-3.3 3.4v1.9H8.5v2.6h2.2v6.6z" fill="#fff"/></svg>`,
};
const IDEAS = [
  "Cut every retake and flub, keep only the best takes",
  "Make it punchy — under 30 seconds",
  "Pop up the key numbers big",
  "End on a CTA: Book your free call",
  "List the 3 main points as a checklist",
  "Open with the strongest hook",
];

// look: the grade just picked on an ad, shown as a still over the player until its graded preview video is ready.
const state = { config: null, ads: [], slides: [], selected: new Set(), poll: null, uploading: null, batch: null, look: null, staged: [], brand: null, pickThenCreate: false, studio: { mode: "compare", step: "pick", volume: 0.8 } };

/** The editing styles on the Create page (their edit presets live server-side in ads/styles.js). */
const STYLES = [
  {
    id: "talking-head",
    name: "Basic",
    line: "Clean cuts. White captions. A pop-in when it matters.",
    offer: "call", // how the ad ends (plan.js OFFERS): Basic ads sell a booked call
    ends: "Book your free call",
    short: "Clean cuts & captions",
    copy: "Your next chapter starts here.",
    // A real ad made in this style (ads/examples/): the After in the studio. `before` (its raw footage) plays beside it
    // once it's added; until then the Before card says it's coming.
    example: { video: `${API}/examples/talking-head.mp4`, poster: `${API}/examples/talking-head.jpg`, before: null, title: "AD 31 · Three AI Employees Your Practice Needs" },
  },
  {
    id: "premium",
    name: "Premium",
    line: "Cinematic color. Subtle motion. A polished finish.",
    offer: "trial", // Premium ads end on the ATLAS 7-day free trial
    ends: "ATLAS 7-day free trial",
    short: "Cinematic color & motion",
    copy: "Built for better.",
    example: { video: `${API}/examples/premium.mp4`, poster: `${API}/examples/premium.jpg`, before: null, title: "Stop Paying Someone To Chase" },
  },
  // Custom: no preset; the edit follows the note. A placeholder card until its own layout is designed.
  { id: "custom", name: "Custom", line: "Your idea, your way. The edit follows your note.", short: "Your creative direction", copy: "Made your way.", offer: "trial", ends: "ATLAS 7-day free trial" },
];
/** Where the ad runs decides its shape: Reels cut 9:16, the feed 4:5 (keys kept from the old platform switch). */
const PLATFORMS = {
  instagram: { name: "Reels", aspect: "9:16", hint: "Instagram & Facebook Reels" },
  facebook: { name: "Feed", aspect: "4:5", hint: "Instagram & Facebook feed" },
};
state.batch = loadBatch();

/** The batch brief, style and platform, remembered in this browser (a convenience; nothing depends on it). Every
 *  upload is always edited and saved when done: those were switches once, so old saved values are overridden. */
function loadBatch() {
  try {
    const saved = { prompt: "", editStyle: "talking-head", platform: "instagram", ...JSON.parse(localStorage.getItem("ads.batch") || "{}"), auto: true, save: true };
    if (!STYLES.some((st) => st.id === saved.editStyle)) saved.editStyle = "talking-head";
    if (!PLATFORMS[saved.platform]) saved.platform = "instagram";
    return saved;
  } catch {
    return { prompt: "", editStyle: "talking-head", platform: "instagram", auto: true, save: true };
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

/** The Assets LUT a dropdown value grades with, or null for a built-in grade. */
function lutOf(value, cfg) {
  const [kind, id] = value.split(/:(.*)/);
  if (kind === "lut") return id;
  if (kind === "template") return (cfg.templates || []).find((t) => t.n === Number(id))?.lut || null;
  return null;
}

/** Where the preview is in the footage (source seconds), so the still shows the frame you're looking at. */
function previewSourceTime() {
  const player = $(".ad-stage hyperframes-player", root);
  const frame = player?.shadowRoot?.querySelector("iframe") || player?.querySelector("iframe");
  try {
    return frame?.contentDocument?.querySelector("video")?.currentTime || 0;
  } catch {
    return 0; // the player's frame isn't readable: show the opening
  }
}

/** The still of the picked grade over the player, while its preview video builds. */
function lookOverlay(ad) {
  const look = state.look?.id === ad.id ? state.look : null;
  if (!look) return "";
  return `<div class="ad-look"><img src="${esc(look.url)}" alt="" /><span class="ad-look-note"><i class="ad-spin"></i>${esc(look.name)}. The video updates in a moment.</span></div>`;
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

/** The grade templates, folded away under "Ad settings" (open or closed is remembered in this browser). */
function adSettings(cfg) {
  const inner = gradeSettings(cfg);
  if (!inner) return "";
  let open = false;
  try {
    open = localStorage.getItem("ads-settings-open") === "1";
  } catch {}
  return `<details class="ad-settings" id="ad-settings" ${open ? "open" : ""}><summary><span>Ad settings</span><small>Color grade templates</small>${ICON.chevron}</summary>${inner}</details>`;
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
// My ads (#/my-ads): every ad so far, the slides library and the grade templates.

function libraryView() {
  const ads = state.ads;
  const nums = adNumbers(ads);
  return `
    <header class="lib-head">
      <div><h1>My ads</h1><p>${ads.length ? `${ads.length} ad${ads.length === 1 ? "" : "s"} · ${mb(ads.reduce((t, a) => t + (a.sizeBytes || 0), 0))} on disk` : "Everything you create lands here."}</p></div>
      <a class="btn primary lib-new" href="#/ads">${ICON.plus} New ad</a>
    </header>
    ${state.config && !state.config.claude ? `<div class="banner">Claude isn't connected, so edits are a clean tighten with a few graphics. Add your key in Integrations for the full edit.</div>` : ""}
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
        : `<div class="empty ad-empty"><b>No ads yet</b><span>Pick a style in <a href="#/ads">Ad studio</a> to make your first one.</span></div>`}
    </div>
    <div class="ad-section-head ad-slides-head">
      <h3>Slides</h3>
      <span class="muted small">Your decks and product screens. Edits drop one in when the speaker talks about what it shows.</span>
    </div>
    <div class="ad-logo-row ad-slides">
      ${state.slides
        .map((sl) => `<div class="ad-logo ad-slide-tile" data-slide="${sl.id}"><img src="${esc(sl.url)}" alt="" loading="lazy" /><input value="${esc(sl.name)}" title="What this slide shows" /><button class="ad-logo-x" data-slide-del="${sl.id}" title="Delete this slide">×</button></div>`)
        .join("")}
      <label class="ad-logo add ad-slide-tile"><input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden id="ad-slide-file" />+ Add slides</label>
    </div>
`;
}

// ---------------------------------------------------------------------------
// Ad studio (#/ads): watch a style's before and after, pick it, then upload. Two steps share the right-hand panel
// (they slide); the stage on the left plays the chosen style's example ad.

/** A frame of the latest upload: the newest ad's footage, else the newest video in the app, else none (placeholder). */
const latestFrame = () => state.ads.find((a) => a.project?.poster)?.project.poster || state.anyFrame || null;
const brand = () => state.brand || { name: "Your brand", initials: "AD" };
/** Words wrapped for a word-by-word reveal (--i is each word's place). */
const words = (text, from = 0) => text.split(" ").map((w, i) => `<i style="--i:${from + i}">${esc(w)}</i>`).join(" ");
const styleOf = (id) => STYLES.find((x) => x.id === id) || STYLES[0];
const thumbOf = (st) => st.example?.poster || latestFrame();
const clock = (t) => (Number.isFinite(t) ? `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}` : "00:00");
const thumb = (st) => `<span class="st-thumb${thumbOf(st) ? "" : " blank"}">${thumbOf(st) ? `<img src="${esc(thumbOf(st))}" alt="" loading="lazy" />` : ""}</span>`;

function studioView() {
  const st = styleOf(state.batch.editStyle);
  const { mode, step } = state.studio;
  return `
    ${state.config && !state.config.claude ? `<div class="banner">Claude isn't connected, so edits are a clean tighten with a few graphics. Add your key in Integrations for the full edit.</div>` : ""}
    <div class="st${step === "upload" ? " step-upload" : ""}" data-mode="${mode}">
      <section class="st-stage">
        <div class="st-top">
          <header class="st-hero"><h1>See your next ad.</h1><p>Same footage. A better edit.</p></header>
          <div class="st-seg" role="tablist" aria-label="Preview">
            <span class="st-seg-thumb" aria-hidden="true"></span>
            <button type="button" role="tab" data-mode="compare" aria-selected="${mode === "compare"}">Comparison</button>
            <button type="button" role="tab" data-mode="meta" aria-selected="${mode === "meta"}">Meta preview</button>
          </div>
        </div>
        <div class="st-show${st.example ? "" : " no-video"}" id="st-show">${showcase(st)}</div>
        <div class="st-transport" id="st-transport"${st.example ? "" : " hidden"}>${transport()}</div>
      </section>
      <aside class="st-panel" aria-label="Create">
        <div class="st-slider">
          <div class="st-step st-pick"${step === "upload" ? " inert" : ""}>${pickStep()}</div>
          <div class="st-step st-up" id="st-up"${step === "upload" ? "" : " inert"}>${uploadStep()}</div>
        </div>
      </aside>
    </div>`;
}

/** The chosen style's example: Before (its raw footage, when added) beside the After in a Reels frame. */
function showcase(st) {
  const b = brand();
  const ex = st.example;
  const before = !ex
    ? ""
    : ex.before
      ? `<video class="st-v" data-role="before" src="${esc(ex.before)}" muted playsinline preload="auto"></video>`
      : `<img class="st-v dim" src="${esc(ex.poster)}" alt="" /><span class="st-soon">Raw footage<br />coming soon</span>`;
  const frame = latestFrame();
  const after = ex
    ? `<video class="st-v" data-role="after" src="${esc(ex.video)}" poster="${esc(ex.poster)}" playsinline preload="auto"></video>`
    : `${frame ? `<img class="st-v dim" src="${esc(frame)}" alt="" />` : `<span class="st-v st-blank"></span>`}
       <div class="sp-cx"><span class="sp-cx-card"><small>Your brief</small><b>${words("Made your way.")}</b><em>Tell us the pace, the captions, the feel.</em></span></div>`;
  return `
    ${ex ? `<figure class="st-card st-before"><span class="st-pill"><i class="red"></i>Before</span><div class="st-frame">${before}</div></figure>` : ""}
    <figure class="st-card st-after"><span class="st-pill"><i class="green"></i>After</span>
      <div class="st-frame reel"${ex ? ' data-act="toggle"' : ""}>${after}
        <div class="reel-top"><span class="reel-av">${esc(b.initials)}</span><span class="reel-who"><b>${esc(b.name)}</b><small>Sponsored</small></span><span class="reel-more">${ICON.dots}</span></div>
        <div class="reel-side">${ICON.heart}${ICON.comment}${ICON.send}</div>
        <div class="reel-cta">Learn more ${ICON.chevR}</div>
      </div>
    </figure>`;
}

function transport() {
  const muted = state.studio.volume === 0;
  return `
    <button type="button" class="st-play" data-act="play" aria-label="Play">${ICON.playT}</button>
    <span class="st-label">${state.studio.mode === "meta" ? "Play preview" : "Play comparison"}</span>
    <span class="st-time"><b id="st-cur">00:00</b> / <span id="st-dur">00:00</span></span>
    <input type="range" class="st-range st-seek" id="st-seek" min="0" max="1000" value="0" aria-label="Seek" style="--p:0%" />
    <button type="button" class="st-mute" data-act="mute" aria-label="${muted ? "Unmute" : "Mute"}">${muted ? ICON.mute : ICON.vol}</button>
    <input type="range" class="st-range st-vol" id="st-vol" min="0" max="100" value="${Math.round(state.studio.volume * 100)}" aria-label="Volume" style="--p:${Math.round(state.studio.volume * 100)}%" />`;
}

function pickStep() {
  const on = state.batch.editStyle;
  return `
    <h2>Choose your style</h2>
    <div class="st-list" role="radiogroup" aria-label="Editing style">
      ${STYLES.map((st) => `<button type="button" role="radio" aria-checked="${st.id === on}" class="st-row${st.id === on ? " on" : ""}" data-style="${st.id}">
        ${thumb(st)}<span class="st-txt"><b>${st.name}</b><small>${st.short}</small></span><span class="st-radio" aria-hidden="true"></span></button>`).join("")}
    </div>
    <button type="button" class="st-go" data-step="upload">Use this template ${ICON.arrow}</button>
    <p class="st-next">Next: upload your footage</p>`;
}

function uploadStep() {
  const st = styleOf(state.batch.editStyle);
  const staged = state.staged;
  return `
    <button type="button" class="st-back" data-step="pick">${ICON.back} Change style</button>
    <div class="st-chosen">${thumb(st)}<span class="st-txt"><b>${st.name}</b><small>Ends on ${st.ends}</small></span></div>
    <h2>Upload your footage</h2>
    <div class="st-formats" role="radiogroup" aria-label="Format">
      ${Object.entries(PLATFORMS).map(([k, pl]) => `<button type="button" role="radio" aria-checked="${k === state.batch.platform}" class="${k === state.batch.platform ? "on" : ""}" data-platform="${k}" title="${pl.hint}"><span class="st-shape s${pl.aspect.replace(":", "x")}"></span><b>${pl.name}</b><small>${pl.aspect}</small></button>`).join("")}
    </div>
    <div class="cr-drop${staged.length ? " has" : ""}${state.uploading ? " busy" : ""}" id="ad-drop">
      <input type="file" accept="video/*" multiple hidden id="ad-file" />
      ${state.uploading
        ? `<div class="ad-up"><b>Uploading ${state.uploading.total > 1 ? `${state.uploading.index} of ${state.uploading.total}: ` : ""}${esc(state.uploading.name)}</b><div class="ad-bar"><i style="width:${state.uploading.pct}%"></i></div><span class="muted small">${state.uploading.pct}%</span></div>`
        : staged.length
          ? `<div class="cr-chips">${staged.map((f, i) => `<div class="cr-chip"><video src="${f.url}#t=0.5" muted playsinline preload="metadata"></video><span><b>${esc(f.file.name)}</b><small>${mb(f.file.size)}</small></span><button type="button" class="cr-chip-x" data-unstage="${i}" title="Remove">${ICON.close}</button></div>`).join("")}</div>
             <label for="ad-file" class="cr-more">+ Add more</label>`
          : `<span class="cr-drop-icon">${ICON.upload}</span><b>Drop your raw footage</b><small>or <label for="ad-file" class="cr-browse">browse files</label>. Raw takes are fine.</small>`}
    </div>
    <label class="cr-note"><span>Anything we should know? <em>(optional)</em></span>
      <input id="ad-batch-prompt" autocomplete="off" placeholder="e.g. Focus on new patient sign ups, keep it under 30 seconds…" value="${esc(state.batch.prompt)}" /></label>
    <button type="button" class="cr-go" data-act="create">${staged.length > 1 ? `Create ${staged.length} ads` : "Create ad"} ${ICON.arrow}</button>`;
}

/** Repaint just the upload step (chips, progress) so the stage keeps playing. */
function renderUpload() {
  const up = $("#st-up", root);
  if (!up) return;
  up.innerHTML = uploadStep();
  bindDrop();
}

function setStep(step) {
  state.studio.step = step;
  $(".st", root)?.classList.toggle("step-upload", step === "upload");
  $(".st-pick", root)?.toggleAttribute("inert", step === "upload");
  $("#st-up", root)?.toggleAttribute("inert", step !== "upload");
  if (step === "upload") renderUpload();
}

/** Swap the stage to another style: the cards fade out, the new ones rise in, the player resets. */
function pickStyle(id) {
  if (!STYLES.some((x) => x.id === id) || id === state.batch.editStyle) return;
  state.batch.editStyle = id;
  saveBatch();
  $$(".st-row", root).forEach((r) => {
    r.classList.toggle("on", r.dataset.style === id);
    r.setAttribute("aria-checked", String(r.dataset.style === id));
  });
  const show = $("#st-show", root);
  stopPlayer();
  show.classList.add("out");
  setTimeout(() => {
    const st = styleOf(id);
    show.innerHTML = showcase(st);
    show.classList.toggle("no-video", !st.example);
    const tr = $("#st-transport", root);
    tr.hidden = !st.example;
    tr.innerHTML = transport();
    show.classList.remove("out");
    $(".st", root)?.classList.remove("is-playing");
    wirePlayer();
  }, 220);
}

let player = null;
function stopPlayer() {
  player?.after?.pause();
  player?.before?.pause();
}

/** One control bar for both videos: the After carries the sound, the Before (raw) plays along muted. */
function wirePlayer() {
  const after = $('[data-role="after"]', root);
  const before = $('[data-role="before"]', root);
  player = { after, before };
  if (!after) return;
  const btn = $(".st-play", root);
  const seek = $("#st-seek", root);
  const vol = $("#st-vol", root);
  after.volume = state.studio.volume;
  after.muted = state.studio.volume === 0;
  const paint = () => {
    const d = after.duration || 0;
    const p = d ? (after.currentTime / d) * 100 : 0;
    $("#st-cur", root).textContent = clock(after.currentTime);
    $("#st-dur", root).textContent = clock(d);
    if (!seek.matches(":active")) seek.value = Math.round(p * 10);
    seek.style.setProperty("--p", `${p}%`);
    if (before && before.duration && Math.abs(before.currentTime - Math.min(after.currentTime, before.duration)) > 0.35) before.currentTime = Math.min(after.currentTime, before.duration - 0.05);
  };
  const playing = (on) => {
    btn.innerHTML = on ? ICON.pause : ICON.playT;
    btn.setAttribute("aria-label", on ? "Pause" : "Play");
    $(".st", root)?.classList.toggle("is-playing", on);
  };
  after.onloadedmetadata = paint;
  after.ontimeupdate = paint;
  after.onplay = () => (playing(true), before?.play().catch(() => {}));
  after.onpause = () => (playing(false), before?.pause());
  after.onended = () => (playing(false), before?.pause());
  seek.oninput = () => {
    if (after.duration) after.currentTime = (seek.value / 1000) * after.duration;
    paint();
  };
  vol.oninput = () => {
    state.studio.volume = vol.value / 100;
    after.volume = state.studio.volume;
    after.muted = state.studio.volume === 0;
    vol.style.setProperty("--p", `${vol.value}%`);
    $(".st-mute", root).innerHTML = after.muted ? ICON.mute : ICON.vol;
  };
}

function togglePlay() {
  const after = player?.after;
  if (!after) return;
  if (after.paused) after.play().catch(() => {});
  else after.pause();
}

function bindStudio() {
  bindDrop();
  wirePlayer();
  root.ondragover = (e) => e.dataTransfer?.types?.includes("Files") && e.preventDefault();
  root.ondrop = (e) => {
    if (e.target.closest("#ad-drop") || !e.dataTransfer?.files?.length) return;
    e.preventDefault();
    setStep("upload");
    stage([...e.dataTransfer.files]);
  };
  root.oninput = (e) => {
    if (e.target.id === "ad-batch-prompt") (state.batch.prompt = e.target.value), saveBatch();
  };
  root.onkeydown = (e) => e.target.id === "ad-batch-prompt" && e.key === "Enter" && createAds();
  root.onclick = (e) => {
    const row = e.target.closest("[data-style]");
    if (row) return pickStyle(row.dataset.style);
    const step = e.target.closest("[data-step]");
    if (step) return setStep(step.dataset.step);
    const mode = e.target.closest(".st-seg [data-mode]");
    if (mode) {
      if (mode.dataset.mode === state.studio.mode) return;
      state.studio.mode = mode.dataset.mode;
      $(".st", root).dataset.mode = state.studio.mode;
      $$(".st-seg [data-mode]", root).forEach((m) => m.setAttribute("aria-selected", String(m.dataset.mode === state.studio.mode)));
      const label = $(".st-label", root);
      if (label) label.textContent = state.studio.mode === "meta" ? "Play preview" : "Play comparison";
      return;
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "play" || act === "toggle") return togglePlay();
    if (act === "mute") {
      const vol = $("#st-vol", root);
      vol.value = state.studio.volume === 0 ? 80 : 0;
      return vol.oninput();
    }
    if (act === "create") return createAds();
    const plat = e.target.closest("[data-platform]");
    if (plat) {
      state.batch.platform = PLATFORMS[plat.dataset.platform] ? plat.dataset.platform : "instagram";
      saveBatch();
      return renderUpload();
    }
    const unstage = e.target.closest("[data-unstage]");
    if (unstage) {
      const [gone] = state.staged.splice(Number(unstage.dataset.unstage), 1);
      if (gone) URL.revokeObjectURL(gone.url);
      return renderUpload();
    }
  };
}

/** Hold dropped or chosen videos until Create ad (or straight away when Create ad asked for them). */
function stage(files) {
  const videos = files.filter(isVideo);
  if (!videos.length) return toast("Drop video files.");
  state.staged.push(...videos.map((file) => ({ file, url: URL.createObjectURL(file) })));
  if (state.pickThenCreate) {
    state.pickThenCreate = false;
    return createAds();
  }
  renderUpload();
}

async function createAds() {
  if (state.uploading) return;
  if (!state.staged.length) {
    state.pickThenCreate = true;
    $("#ad-file", root)?.click();
    return;
  }
  const staged = state.staged;
  stopPlayer();
  await uploadAll(staged.map((f) => f.file));
  staged.forEach((f) => URL.revokeObjectURL(f.url));
  state.staged = state.staged.filter((f) => !staged.includes(f));
  state.studio.step = "pick";
  location.hash = "#/my-ads"; // watch them edit
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
  if (!drop || !input) return;
  input.addEventListener("change", () => {
    if (input.files.length) stage([...input.files]);
    else state.pickThenCreate = false;
  });
  drop.addEventListener("dragover", (e) => (e.preventDefault(), drop.classList.add("over")));
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("over");
    stage([...(e.dataTransfer?.files || [])]);
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

function bindLibrary() {
  root.ondragover = root.ondrop = root.oninput = root.onkeydown = null;
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
  $("#ad-settings", root)?.addEventListener("toggle", (e) => {
    try {
      localStorage.setItem("ads-settings-open", e.target.open ? "1" : "0");
    } catch {}
  });
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
 * Upload videos one after another. Each becomes an ad in the chosen editing style and platform format, and goes
 * straight into the edit queue with the batch note, saved when done. The style also decides the ending (its offer).
 */
async function uploadAll(files) {
  if (state.uploading || !files.length) return false;
  const { auto, save, prompt, editStyle } = state.batch;
  const offer = STYLES.find((st) => st.id === editStyle)?.offer || "trial"; // the style decides how the ad ends
  const aspect = PLATFORMS[state.batch.platform]?.aspect || "9:16";
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
      last = await api("/", { method: "POST", body: { projectId: project.id, name: file.name, aspect, options: { offer, editStyle } } });
      if (auto) await api(`/${last.id}/edit`, { method: "POST", body: { prompt, aspect, options: { grade: "auto", lut: "none", offer, editStyle }, autoSave: save } });
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
  toast(auto ? `${done} video${done === 1 ? "" : "s"} uploaded and queued for editing as ${STYLES.find((st) => st.id === editStyle)?.name || "an ad"} (${aspect})${save ? ", saved when done" : ""}.` : `${done} video${done === 1 ? "" : "s"} uploaded.`);
  return true;
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
    stage = `<hyperframes-player controls autoplay src="${esc(ad.previewUrl)}?rev=${ad.rev || 0}&grade=${esc(ad.lutInUse || "")}" width="${ad.aspect === "16:9" ? 1920 : 1080}" height="${{ "9:16": 1920, "4:5": 1350, "1:1": 1080, "16:9": 1080 }[ad.aspect] || 1920}"></hyperframes-player>${lookOverlay(ad)}`;
  } else {
    const line = busy ? ad.message || "Working…" : processing ? ad.project.message || "Getting the video ready…" : ad.status === "error" ? "" : "Describe what you want, then press Edit my ad.";
    stage = `<div class="ad-stage-empty">${ad.project ? `<img src="${esc(ad.project.poster)}" alt="" onerror="this.remove()" />` : ""}<div class="ad-stage-msg">${busy || processing ? `<i class="ad-spin"></i>` : ""}<span>${esc(line)}</span></div></div>`;
  }

  return `
    <a class="back" href="#/my-ads">${ICON.back} My ads</a>
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
          ${opts.editStyle === "talking-head"
            ? `<p class="muted small">Basic (talking head): every flub, retake and pause cut, white captions in the middle, the shot following your face, and a pop-in on the lines that matter. No graphics or sound effects; music starts off.</p>`
            : `<p class="muted small">Always applied: every retake, flub and pause cut (never the story), big numbers, a checklist of the 3 main points, the strongest hook first, and an ending that sells the offer below. Sound effects, music and captions start on.</p>
          <div class="ad-ideas">${IDEAS.map((i) => `<button class="chip chip-link" data-idea="${esc(i)}" ${busy ? "disabled" : ""}>+ ${esc(i)}</button>`).join("")}</div>`}
          <div class="field ad-logos" ${opts.editStyle === "talking-head" ? "hidden" : ""}><span>Brand logos <em>— when the brand is named, its logo pops up</em></span>
            <div class="ad-logo-row">
              ${(ad.logos || []).map((l) => `<div class="ad-logo" data-logo="${esc(l.id)}"><img src="${API}/${ad.id}/logos/${encodeURIComponent(l.file)}" alt="" /><input value="${esc(l.name)}" data-logo-name title="The brand name as it's said" /><button class="ad-logo-x" data-logo-del title="Remove">×</button></div>`).join("")}
              <label class="ad-logo add" title="Add logos (PNG with a transparent background works best)"><input type="file" accept="image/*" multiple hidden id="ad-logo-file" /><span>+</span><small>Add logo</small></label>
            </div>
          </div>
          <div class="ad-opts">
            <div class="field"><span>Format</span><div class="segmented" data-seg="aspect">${Object.entries(cfg.aspects || { "9:16": "" }).map(([k, hint]) => `<button data-aspect="${k}" class="${ad.aspect === k ? "on" : ""}" title="${esc(hint)}">${k}</button>`).join("")}</div></div>
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

  // A finished ad changes grade on the spot: only the colour changes, the edit stays as it is. A LUT shows at once
  // as a still of the current frame; the player switches when the graded preview video is ready (a few seconds).
  // Picking again before then is fine: only the last pick is applied.
  $("#ad-grade", root)?.addEventListener("change", async (e) => {
    if (ad.status !== "ready" || working(ad)) return;
    const select = e.target;
    const lut = lutOf(select.value, state.config || {});
    const pick = { id: ad.id, name: select.selectedOptions[0]?.textContent || "New grade", url: lut ? `${API}/${ad.id}/look.jpg?lut=${encodeURIComponent(lut)}&t=${previewSourceTime().toFixed(2)}` : null };
    state.look = lut ? pick : null;
    $(".ad-look", root)?.remove();
    if (lut) $(".ad-stage", root)?.insertAdjacentHTML("beforeend", lookOverlay(ad));
    try {
      await api(`/${ad.id}/grade`, { method: "POST", body: { options: gradeOptionsFrom(select.value) } });
      if (state.look && state.look !== pick) return; // a newer pick is on its way
      state.look = null;
      toast(ad.video ? "Grade changed. Save the video again to bake it in." : "Grade changed.");
      await refresh(true);
    } catch (err) {
      if (state.look === pick) state.look = null;
      $(".ad-look", root)?.remove();
      toast(err.message);
    }
  });

  root.onclick = async (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "watch") return watch(ad);
    try {
      if (act === "edit") {
        if (ad.handEdited && !confirm("You've edited this ad in the timeline. Re-editing rebuilds it from scratch (your version is backed up first). Continue?")) return;
        // No colour grade or LUT on any ad (the footage comes in already coloured): the picker is gone.
        const options = gradeOptionsFrom("grade:none");
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
const viewOf = () => (location.hash.startsWith("#/my-ads") ? "library" : idFromHash() ? "ad" : "studio");
function draw(force = true) {
  if (!root) return;
  const view = viewOf();
  if (view === "studio") {
    // Drawn once per visit so the example keeps playing; later redraws only repaint the upload step's progress.
    if (drawnKey === "studio" && $(".st", root)) return state.uploading && renderUpload();
    root.innerHTML = studioView();
    bindStudio();
    drawnKey = "studio";
    return;
  }
  if (view === "library") {
    // Already showing: swap only the cards, so a selection or a typed slide name isn't lost.
    if (drawnKey === "library" && $(".ad-grid", root)) {
      const next = document.createElement("div");
      next.innerHTML = libraryView();
      $(".ad-grid", root).replaceWith($(".ad-grid", next));
      $(".lib-head p", root).replaceWith($(".lib-head p", next));
      return;
    }
    root.innerHTML = libraryView();
    bindLibrary();
    drawnKey = "library";
    return;
  }
  const id = idFromHash();
  const ad = state.ads.find((a) => a.id === id);
  if (!ad) {
    root.innerHTML = `<a class="back" href="#/my-ads">${ICON.back} My ads</a><div class="empty">That ad isn't here any more.</div>`;
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

/** The name and initials on the example posts: the first posting account, else a neutral stand-in. */
async function loadBrand() {
  const accounts = await fetch("/api/accounts").then((r) => (r.ok ? r.json() : [])).catch(() => []);
  const a = accounts[0];
  const name = a?.name || (a?.handle ? `@${a.handle.replace(/^@/, "")}` : "") || "Your brand";
  const initials = name.replace(/^@/, "").split(/[\s._-]+/).filter(Boolean).slice(0, 3).map((w) => w[0]).join("").toUpperCase() || "AD";
  return { name, initials: initials.length === 1 ? name.replace(/^@/, "").slice(0, 2).toUpperCase() : initials };
}

async function refresh(force = false) {
  try {
    const data = await api("/");
    state.config = data;
    state.ads = data.ads;
    for (const id of state.selected) if (!state.ads.some((a) => a.id === id)) state.selected.delete(id);
    state.slides = (await api("/slides").catch(() => ({ slides: [] }))).slides;
    if (!state.brand) state.brand = await loadBrand();
    if (state.anyFrame === undefined) state.anyFrame = await fetch("/api/projects").then((r) => (r.ok ? r.json() : [])).then((list) => list.find((x) => x.poster)?.poster || null).catch(() => null);
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
