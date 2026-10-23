// Top bar: way back to the project, where you are, autosave status, undo/redo, share, export and Save (which also
// updates the clip's video file; editor.js actions.save).
import { $, I, esc, mod, tip } from "./ui.js";

export function createHeader(root, store, ctx) {
  const { project, clip } = ctx.context;
  root.innerHTML = `
    <div class="eh-left">
      <a class="ibtn" href="#/p/${project.id}" title="Back">${I.back(18)}</a>
      <nav class="eh-crumbs" aria-label="Breadcrumb">
        <a href="#/ads">My ads</a><i>${I.chevRight(13)}</i>
        <a href="#/p/${project.id}" class="eh-project">${esc(project.name)}</a><i>${I.chevRight(13)}</i>
        <span class="eh-clip" title="${esc(clip.title)}">${esc(clip.title || `Clip ${clip.rank}`)}</span>
      </nav>
      <span class="eh-save" data-save></span>
    </div>
    <div class="eh-center">
      <button class="ibtn" data-act="undo">${I.undo(17)}</button>
      <button class="ibtn" data-act="redo">${I.redo(17)}</button>
    </div>
    <div class="eh-right">
      <button class="btn-ghost" data-act="classic" title="The previous editor, with every style control">${I.classic(15)}<span>Classic editor</span></button>
      <button class="btn-ghost" data-act="share" title="Copy a link to this editor">${I.share(15)}<span>Share</span></button>
      <button class="btn-ghost" data-act="export">${I.export(15)}<span>Export</span></button>
      <button class="btn-primary eh-savebtn" data-act="save"></button>
    </div>`;

  const saveEl = $("[data-save]", root);
  const ago = (at) => {
    if (!at) return "Not saved yet";
    const s = Math.round((Date.now() - at.getTime()) / 1000);
    if (s < 10) return "Saved just now";
    if (s < 60) return `Saved ${s} seconds ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `Saved ${m} minute${m === 1 ? "" : "s"} ago`;
    return `Saved at ${at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  };
  function drawSave() {
    const { state, at, error } = store.saveState;
    saveEl.dataset.state = state;
    saveEl.title = error || "";
    saveEl.innerHTML =
      state === "saving" || state === "pending"
        ? `<span class="dot pulse"></span>Saving…`
        : state === "error"
          ? `<span class="dot bad"></span>Couldn't save · retrying`
          : `${I.cloud(15)}${ago(at)}`;
  }
  function drawHistory() {
    const undo = $('[data-act="undo"]', root);
    const redo = $('[data-act="redo"]', root);
    undo.disabled = !store.canUndo();
    redo.disabled = !store.canRedo();
    undo.title = store.canUndo() ? tip(`Undo ${store.undoLabel()}`, `${mod}Z`) : "Nothing to undo";
    redo.title = store.canRedo() ? tip(`Redo ${store.redoLabel()}`, `${mod}⇧Z`) : "Nothing to redo";
  }

  // Save: lit when the video file is behind the timeline, busy while it re-renders, "Saved" once it matches.
  const saveBtn = $('[data-act="save"]', root);
  function drawSaveBtn() {
    const r = ctx.render;
    const full = ctx.context.clip.id === "full";
    const editing = store.saveState.state !== "saved";
    const rendering = r && (r.status === "queued" || r.status === "rendering");
    // A clip never edited here and rendered before has no docRev; that's the engine's cut, same as rev 0.
    const current = !editing && (full || (r?.done && (r.done.docRev ?? 0) === store.rev));
    saveBtn.disabled = Boolean(ctx.saving || rendering || current);
    saveBtn.dataset.state = rendering ? "rendering" : ctx.saving ? "saving" : current ? "saved" : "dirty";
    saveBtn.innerHTML = rendering
      ? `<span class="dot pulse"></span><span>${r.status === "queued" ? "Waiting to update…" : `Updating video ${Math.round(r.progress || 0)}%`}</span>`
      : ctx.saving
        ? `<span class="dot pulse"></span><span>Saving…</span>`
        : current
          ? `${I.check(15)}<span>Saved</span>`
          : `${I.cloud(15)}<span>Save</span>`;
    saveBtn.title = rendering
      ? r.message || "Updating the video file with your edits"
      : current
        ? full ? "Everything is saved" : "The video file matches your timeline"
        : tip(full ? "Save your edits" : "Save your edits and update the video file", `${mod}S`);
  }

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (btn && !btn.disabled) ctx.actions[btn.dataset.act]?.();
  });

  const offs = [store.on("save", drawSave), store.on("save", drawSaveBtn), store.on("render", drawSaveBtn), store.on("history", drawHistory)];
  const clock = setInterval(drawSave, 15000);
  drawSave();
  drawSaveBtn();
  drawHistory();
  return {
    destroy() {
      offs.forEach((off) => off());
      clearInterval(clock);
    },
  };
}
