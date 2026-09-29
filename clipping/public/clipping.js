// Clipping tab (#/clipping): one video in, its winning moment out five ways — four 9:16 caption styles and one
// clean 4:5, each on its own song. app.js imports this and calls mountClipping(app). See clipping/index.js.
const API = "/api/clipping";
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const mmss = (s) => (s == null ? "" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`);

const svg = (body, size = 15) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  upload: svg(`<path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>`, 20),
  scissors: svg(`<circle cx="6" cy="6.5" r="2.5"/><circle cx="6" cy="17.5" r="2.5"/><path d="M8.2 7.8 20 17M8.2 16.2 20 7"/>`, 16),
  download: svg(`<path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14"/>`),
  music: svg(`<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>`, 13),
  shuffle: svg(`<path d="M16 4h4v4M4 20 20 4M20 16v4h-4M15 15l5 5M4 4l5 5"/>`, 14),
  again: svg(`<path d="M19 12a7 7 0 1 1-2.2-5.1"/><path d="M19.5 4v4h-4"/>`, 14),
  edit: svg(`<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>`, 14),
  close: svg(`<path d="M6 6l12 12M18 6 6 18"/>`),
  play: `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>`,
};
const BUSY = ["queued", "downloading", "probing", "preparing", "transcribing", "analyzing"];
const RENDER_BUSY = ["queued", "rendering"];

const state = { versions: [], tracks: 0, jobs: [] };
let poll = null;

async function api(url, { method = "GET", body } = {}) {
  const res = await fetch(url.startsWith("/api/") ? url : API + url, {
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

// ---------------------------------------------------------------------------

const ratio = (aspect) => String(aspect || "9:16").replace(":", " / ");

function versionCard(job, v) {
  const r = v.render;
  const rendering = r && RENDER_BUSY.includes(r.status);
  const failed = r?.status === "error";
  const well = v.file
    ? `<video src="${esc(v.file)}?v=${encodeURIComponent(v.renderedAt || "")}" controls playsinline preload="metadata"></video>`
    : `<div class="cl-blank">${rendering ? `<b>${r.status === "queued" ? "Waiting to render" : `Rendering ${Math.round(r.progress || 0)}%`}</b><span>${esc(r.message || "")}</span>` : failed ? `<b>Render failed</b><span>${esc(r.error || r.message || "")}</span>` : `<b>Not rendered yet</b>`}</div>`;
  return `<article class="cl-version ${rendering ? "working" : ""}" data-version="${esc(v.id)}" data-job="${esc(job.id)}">
    <div class="cl-well" style="aspect-ratio:${ratio(v.aspect)}">${well}${rendering ? `<i class="cl-bar" style="width:${Math.max(3, r.progress || 0)}%"></i>` : ""}</div>
    <div class="cl-vbody">
      <div class="cl-vhead"><b>${esc(v.label)}</b><span class="chip">${esc(v.aspect)}</span></div>
      <div class="cl-vnote">${esc(v.note)}</div>
      <div class="cl-sound" title="Song under this version">${ICON.music}<span>${esc(v.sound?.name || "No music")}</span></div>
      <div class="cl-vactions">
        ${v.file ? `<a class="btn sm" href="${esc(v.file)}" download>${ICON.download} Save</a>` : ""}
        <button class="btn sm ghost" data-act="sound" title="Put a different song under this version" ${rendering ? "disabled" : ""}>${ICON.shuffle} Sound</button>
        ${failed || (!rendering && !v.file) ? `<button class="btn sm ghost" data-act="render">${ICON.again} Render</button>` : ""}
        <a class="btn sm ghost" href="#/edit/${esc(job.id)}/${esc(v.id)}" title="Open in the clip editor">${ICON.edit}</a>
      </div>
    </div>
  </article>`;
}

function jobCard(job) {
  const processing = BUSY.includes(job.status);
  const moment = job.moments.find((m) => m.id === job.momentId) || null;
  const chip = processing
    ? `<span class="chip live">Processing</span>`
    : job.status === "error"
      ? `<span class="chip error">Failed</span>`
      : job.status === "stopped"
        ? `<span class="chip">Stopped</span>`
        : `<span class="chip done">Ready</span>`;

  let body;
  if (processing) {
    body = `<div class="cl-wait"><i class="cl-spin"></i><span>${esc(job.message || "Working…")}</span></div>
      <p class="cl-hint">Once the engine finds the winning moment, its five versions start rendering on their own. You can leave this page.</p>`;
  } else if (job.status === "error" || job.status === "stopped") {
    body = `<p class="cl-hint">${esc(job.error || job.message || "")} Open the video in <a href="#/p/${esc(job.id)}">Projects</a> to retry it.</p>`;
  } else if (!job.moments.length) {
    body = `<p class="cl-hint">No standout talking moment was found in this video.</p>`;
  } else {
    const picker = `<select data-act="moment" aria-label="Moment to clip">
      ${job.moments
        .map((m, i) => `<option value="${esc(m.id)}" ${m.id === (moment?.id || job.moments[0].id) ? "selected" : ""}>${i === 0 ? "★ " : ""}#${m.rank ?? i + 1} · ${esc(m.title)}${m.score != null ? ` · ${m.score}` : ""} · ${mmss(m.start)}–${mmss(m.end)}</option>`)
        .join("")}
    </select>`;
    body = `
      <div class="cl-moment">
        <div class="cl-mtext">
          <small>${moment ? (moment.id === job.moments[0].id ? "Winning moment" : "Chosen moment") : "Winning moment"}</small>
          <b>${esc((moment || job.moments[0]).title)}</b>
          <span>${mmss((moment || job.moments[0]).start)}–${mmss((moment || job.moments[0]).end)}${(moment || job.moments[0]).score != null ? ` · score ${(moment || job.moments[0]).score}` : ""}</span>
        </div>
        <div class="cl-mpick field">${picker}</div>
        <button class="btn sm ${job.versions.length ? "" : "primary"}" data-act="make">${ICON.scissors} ${job.versions.length ? "Remake 5 versions" : "Make 5 versions"}</button>
      </div>
      ${job.warning ? `<p class="cl-hint">${esc(job.warning)}</p>` : ""}
      ${job.versions.length ? `<div class="cl-versions">${job.versions.map((v) => versionCard(job, v)).join("")}</div>` : `<div class="cl-wait"><i class="cl-spin"></i><span>Setting up the five versions…</span></div>`}`;
  }

  const done = job.versions.filter((v) => v.file).length;
  return `<section class="card cl-job" data-job="${esc(job.id)}">
    <header class="cl-jhead">
      <img class="cl-poster" src="${esc(job.poster)}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="cl-jtitle"><b>${esc(job.name)}</b><span>${job.duration ? mmss(job.duration) : ""}${job.versions.length ? ` · ${done} of ${job.versions.length} versions ready` : ""}</span></div>
      ${chip}
      <a class="btn sm ghost" href="#/p/${esc(job.id)}">Open project</a>
      <button class="icon-btn" data-act="remove" title="Remove from Clipping (the project stays)">${ICON.close}</button>
    </header>
    ${body}
  </section>`;
}

function render(root) {
  $("#cl-recipe", root).innerHTML = state.versions
    .map((v, i) => `<span class="cl-step"><i>${i + 1}</i>${esc(v.label)} <em>${esc(v.aspect)}</em></span>`)
    .join("");
  $("#cl-tracks", root).textContent = state.tracks >= 5 ? `${state.tracks} songs in rotation` : state.tracks ? `Only ${state.tracks} instrumental songs — add more in Sounds so every version gets its own` : "No instrumental songs yet — add some in Sounds";
  $("#cl-jobs", root).innerHTML = state.jobs.length
    ? state.jobs.map(jobCard).join("")
    : `<div class="empty">Paste a link or drop a video above. Its winning moment comes back five ways, ready for five pages.</div>`;
}

const busy = (job) => BUSY.includes(job.status) || (job.status === "ready" && job.moments.length && !job.versions.length && job.auto) || job.versions.some((v) => v.render && RENDER_BUSY.includes(v.render.status));

async function refresh(root) {
  Object.assign(state, await api("/"));
  // Don't wipe a video the viewer is watching: skip a redraw when nothing changed.
  const key = JSON.stringify(state);
  if (key !== refresh.last) {
    const playing = $$("video", root).some((v) => !v.paused);
    if (!playing || !refresh.last) render(root);
    if (!playing) refresh.last = key;
  }
  clearTimeout(poll);
  if (root.isConnected) poll = setTimeout(() => refresh(root).catch(() => {}), state.jobs.some(busy) ? 3000 : 15000);
}

// ---------------------------------------------------------------------------
// Input: one video file or one link, imported as a normal project and handed to Clipping.

function bindInput(root) {
  const form = $("#cl-form", root);
  const input = $("#cl-file", root);
  const zone = $("#cl-drop", root);
  const link = $("#cl-link", root);
  const go = $("#cl-go", root);
  const progress = $("#cl-progress", root);
  let file = null;

  const sync = () => {
    go.disabled = !file && !/^https?:\/\/\S+\.\S+/i.test(link.value.trim());
    $("#cl-drop-label", root).innerHTML = file ? `<b>${esc(file.name)}</b><small>${(file.size / 1e6).toFixed(1)} MB · click to change</small>` : `<b>Drop a video, or click to browse</b><small>or paste a link</small>`;
    zone.classList.toggle("has-file", Boolean(file));
  };
  const choose = (list) => {
    const f = [...(list || [])].find((x) => x.type.startsWith("video/") || /\.(mov|mkv|mp4|webm|m4v|avi)$/i.test(x.name));
    if (!f) return toast("Pick a video file");
    file = f;
    link.value = "";
    sync();
  };
  input.onchange = () => choose(input.files);
  zone.ondragover = (e) => {
    e.preventDefault();
    zone.classList.add("over");
  };
  zone.ondragleave = () => zone.classList.remove("over");
  zone.ondrop = (e) => {
    e.preventDefault();
    zone.classList.remove("over");
    choose(e.dataTransfer.files);
  };
  link.oninput = () => {
    if (link.value.trim()) file = null;
    sync();
  };

  const status = (text, pct = null) => {
    progress.hidden = false;
    $("span", progress).textContent = text;
    $("i", progress).style.width = pct == null ? "100%" : `${pct}%`;
    progress.classList.toggle("indeterminate", pct == null);
  };
  const done = () => {
    progress.hidden = true;
    file = null;
    link.value = "";
    input.value = "";
    sync();
  };

  const uploadFile = (f) =>
    new Promise((resolve, reject) => {
      const data = new FormData();
      data.append("video", f);
      data.append("language", "en");
      data.append("captionQuality", "standard");
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/projects");
      xhr.upload.onprogress = (ev) => ev.total && status(`Uploading ${Math.round((100 * ev.loaded) / ev.total)}%`, (100 * ev.loaded) / ev.total);
      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 300) reject(new Error(res.error || "Upload failed"));
        else resolve(res);
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(data);
    });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const url = link.value.trim();
    if (!file && !url) return;
    go.disabled = true;
    try {
      const project = file ? await uploadFile(file) : (status("Fetching video…"), await api("/api/projects/import", { method: "POST", body: { url, language: "en", captionQuality: "standard" } }));
      await api("/jobs", { method: "POST", body: { projectId: project.id } });
      done();
      toast("Clipping started — the five versions render once the winning moment is found");
      refresh.last = null;
      await refresh(root);
    } catch (err) {
      toast(err.message);
      progress.hidden = true;
      sync();
    }
  };
  sync();
}

// ---------------------------------------------------------------------------

export async function mountClipping(el) {
  el.innerHTML = `
    <div class="cl-page">
      <div class="page-head">
        <div>
          <h1>Clipping</h1>
          <p class="muted">Put a video in. The engine finds the winning moment and cuts it five ways, one for each page: four 9:16 versions with different caption styles and one clean 4:5 with no captions. Every version gets its own song.</p>
        </div>
      </div>

      <form id="cl-form" class="card cl-input">
        <label id="cl-drop" class="cl-drop">
          <input id="cl-file" type="file" accept="video/*,.mov,.mkv,.m4v" hidden />
          <span class="cl-dz-icon">${ICON.upload}</span>
          <span id="cl-drop-label" class="cl-dz-copy"></span>
        </label>
        <div class="cl-linkrow">
          <input id="cl-link" type="url" inputmode="url" autocomplete="off" placeholder="Paste a YouTube, TikTok or Instagram link" />
          <button id="cl-go" class="btn primary" disabled>${ICON.scissors} Clip it</button>
        </div>
        <div id="cl-progress" class="cl-progress" hidden><div class="cl-pbar"><i></i></div><span></span></div>
        <div class="cl-recipe-row">
          <div id="cl-recipe" class="cl-recipe"></div>
          <span id="cl-tracks" class="cl-tracks">${ICON.music}</span>
        </div>
      </form>

      <div id="cl-jobs" class="cl-jobs"><div class="loading">Loading…</div></div>
    </div>`;
  if (!$("link[data-clipping-css]")) document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${API}/ui/clipping.css" data-clipping-css />`);
  const root = $(".cl-page", el);
  bindInput(root);

  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.tagName === "SELECT") return;
    const jobId = btn.closest("[data-job]")?.dataset.job;
    const versionId = btn.closest("[data-version]")?.dataset.version;
    const act = btn.dataset.act;
    try {
      if (act === "make") {
        const momentId = $("select[data-act=moment]", btn.closest(".cl-job"))?.value;
        btn.disabled = true;
        await api(`/jobs/${jobId}/versions`, { method: "POST", body: { momentId } });
        toast("Five versions queued to render");
      } else if (act === "sound") {
        btn.disabled = true;
        await api(`/jobs/${jobId}/versions/${versionId}/sound`, { method: "POST" });
        toast("New song — rendering this version again");
      } else if (act === "render") {
        btn.disabled = true;
        await api(`/jobs/${jobId}/versions/${versionId}/render`, { method: "POST" });
      } else if (act === "remove") {
        if (!confirm("Remove this video from Clipping? The project and its renders stay in Projects.")) return;
        await api(`/jobs/${jobId}`, { method: "DELETE" });
      } else return;
      refresh.last = null;
      await refresh(root);
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
    }
  });

  refresh.last = null;
  await refresh(root).catch((err) => {
    $("#cl-jobs", root).innerHTML = `<div class="empty">${esc(err.message)}</div>`;
  });
}
