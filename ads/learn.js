// Learning from the creator's own timeline edits (the creator, 2026-09-29: "when I go back and re-edit ads and save
// them, pay attention to how it's actually supposed to be edited and learn from it… there are certain things you are
// cutting out or not adding when it's supposed to be there").
//
// Every ad's cut is kept as it left the builder (the baseline). When the creator then changes that ad's timeline by
// hand and leaves it settled, the two are compared and every difference is written up as a lesson: words put back
// that the cut had dropped, words cut that it had kept, graphics added, removed, re-worded, moved or stretched, sounds
// and music turned up, down or out, caption words corrected. The planner reads these with the creator's typed notes on
// every edit (plan.js <creator_corrections>).
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BASELINE_DIR = path.join(ROOT, "data", "ads", "baselines");

const r1 = (n) => Math.round(n * 10) / 10;
const clock = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const clip = (s, n = 70) => (String(s || "").length > n ? `${String(s).slice(0, n - 1)}…` : String(s || ""));
const key = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** The ad's cut as the builder made it, kept before anyone touches the timeline. */
export async function saveBaseline(adId, doc) {
  await fs.mkdir(BASELINE_DIR, { recursive: true });
  await fs.writeFile(path.join(BASELINE_DIR, `${adId}.json`), JSON.stringify(doc));
}
export const readBaseline = (adId) => fs.readFile(path.join(BASELINE_DIR, `${adId}.json`), "utf8").then(JSON.parse, () => null);
export const dropBaseline = (adId) => fs.rm(path.join(BASELINE_DIR, `${adId}.json`), { force: true });

const clipsOf = (doc, kind, id = null) => (doc?.tracks || []).filter((t) => t.kind === kind && (!id || t.id === id)).flatMap((t) => t.clips || []);

/** Source-time stretches the ad plays (the video track), merged. */
function coverage(doc) {
  const spans = clipsOf(doc, "video").map((c) => [Number(c.sourceStart), Number(c.sourceEnd ?? c.sourceStart + c.duration * (c.speed || 1))]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const [a, b] of spans) {
    const last = out.at(-1);
    if (last && a <= last[1] + 0.02) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}
/** a − b over merged span lists. */
function minus(a, b) {
  const out = [];
  for (const [s, e] of a) {
    let pieces = [[s, e]];
    for (const [bs, be] of b) pieces = pieces.flatMap(([ps, pe]) => (be <= ps || bs >= pe ? [[ps, pe]] : [[ps, bs], [be, pe]].filter(([x, y]) => y - x > 0.01)));
    out.push(...pieces);
  }
  return out;
}
const wordsIn = (words, a, b) => words.filter((w) => (w.start + w.end) / 2 > a && (w.start + w.end) / 2 < b).map((w) => w.text).join(" ");

/** Ad time → source time on a document's video track. */
function toSource(doc, t) {
  const c = clipsOf(doc, "video").find((x) => t >= x.start - 0.01 && t < x.start + x.duration + 0.01);
  return c ? Number(c.sourceStart) + (t - c.start) * (c.speed || 1) : null;
}
const saidAt = (doc, words, t, span = 1.2) => {
  const s = toSource(doc, t);
  return s == null ? "" : wordsIn(words, s - 0.2, s + span);
};

const describe = (g) => {
  const bits = [g.text, g.sub, g.highlight, ...(g.items || []).slice(0, 3)].filter((x) => x && x !== "-").map((x) => clip(x, 40));
  return `${g.look}${g.fullscreen ? " (full-screen)" : ""}${bits.length ? ` "${bits.join(" / ")}"` : ""}`;
};

/** Longest common subsequence alignment of two word lists: [[a word | null, b word | null], …]. */
function align(a, b) {
  const n = a.length;
  const m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(a[i]) === key(b[j])) out.push([a[i++], b[j++]]);
    else if (L[i + 1][j] >= L[i][j + 1]) out.push([a[i++], null]);
    else out.push([null, b[j++]]);
  }
  while (i < n) out.push([a[i++], null]);
  while (j < m) out.push([null, b[j++]]);
  return out;
}

/**
 * What the creator changed by hand, as lesson lines (empty when nothing meaningful changed).
 * base / edited: ad documents; words: the project's transcript words on the source timeline.
 */
export function handEdits(base, edited, words = [], { only = null } = {}) {
  const lines = [];
  const want = (part) => !only || only.includes(part);
  // 1. The cut: speech put back, speech taken out.
  const had = coverage(base);
  const now = coverage(edited);
  const first = had[0]?.[0] ?? 0;
  const last = had.at(-1)?.[1] ?? 0;
  const where = (a, b) => (b <= first + 0.05 ? " at the very start" : a >= last - 0.05 ? " at the end" : "");
  for (const [a, b] of want("cut") ? minus(now, had) : []) {
    const said = wordsIn(words, a, b);
    if (b - a >= 0.25 && said) lines.push(`Put back "${clip(said, 160)}"${where(a, b)} — my cut had dropped it, and it belongs in the ad.`);
  }
  for (const [a, b] of want("cut") ? minus(had, now) : []) {
    const said = wordsIn(words, a, b);
    if (b - a >= 0.25 && said) lines.push(`Cut "${clip(said, 160)}"${where(a, b)} — I had kept it, and it shouldn't be there.`);
    else if (b - a >= 0.6) lines.push(`Cut ${r1(b - a)} s of footage with no words${where(a, b)} that I had kept.`);
  }
  // 2. Graphics: matched by look, nearest in the footage (within 2.5 s), else by look and text. Positions are compared
  // on the footage, not the ad's clock: speech put back earlier pushes everything after it later without anything
  // having moved against the words.
  const gb = want("graphics") ? clipsOf(base, "graphic") : [];
  const ge = want("graphics") ? clipsOf(edited, "graphic") : [];
  const at = (doc, g) => toSource(doc, g.start) ?? g.start;
  const used = new Set();
  for (const g of gb) {
    const m = ge.filter((x) => !used.has(x) && x.look === g.look).sort((x, y) => Math.abs(at(edited, x) - at(base, g)) - Math.abs(at(edited, y) - at(base, g)))[0];
    if (m && (Math.abs(at(edited, m) - at(base, g)) < 2.5 || (m.text && m.text === g.text))) {
      used.add(m);
      const changes = [];
      for (const f of ["text", "sub", "highlight"]) if ((g[f] || "") !== (m[f] || "")) changes.push(`${f} "${clip(g[f], 50)}" → "${clip(m[f], 50)}"`);
      if (JSON.stringify(g.items || []) !== JSON.stringify(m.items || [])) changes.push(`items → ${clip((m.items || []).join(" | "), 120)}`);
      if (Boolean(g.fullscreen) !== Boolean(m.fullscreen)) changes.push(m.fullscreen ? "made it full-screen" : "took it off full-screen (over the speaker)");
      if ((g.tone || "") !== (m.tone || "") && m.fullscreen) changes.push(`tone ${g.tone || "dark"} → ${m.tone}`);
      const shift = at(edited, m) - at(base, g);
      if (Math.abs(shift) >= 0.5) changes.push(`moved ${shift > 0 ? "later" : "earlier"} against the speech by ${r1(Math.abs(shift))} s, from "${clip(saidAt(base, words, g.start), 50)}" onto "${clip(saidAt(edited, words, m.start), 50)}"`);
      if (Math.abs(m.duration - g.duration) >= 0.5) changes.push(`${m.duration > g.duration ? "held longer" : "shortened"} (${r1(g.duration)} → ${r1(m.duration)} s)`);
      if (changes.length) lines.push(`Changed the ${describe(g)} graphic: ${changes.join("; ")}.`);
    } else lines.push(`Removed the ${describe(g)} graphic at ${clock(g.start)} (over "${clip(saidAt(base, words, g.start), 60)}") — don't put it there.`);
  }
  for (const m of ge.filter((x) => !used.has(x))) lines.push(`Added a ${describe(m)} graphic at ${clock(m.start)}, on "${clip(saidAt(edited, words, m.start), 60)}" — it was missing; add graphics like it.`);
  if (!want("sound")) return lines;
  // 3. Sound effects and music.
  const count = (list) => list.reduce((m, c) => m.set(c.sfx, (m.get(c.sfx) || 0) + 1), new Map());
  const sb = count(clipsOf(base, "sfx"));
  const se = count(clipsOf(edited, "sfx"));
  const gone = [...sb].filter(([n, k]) => (se.get(n) || 0) < k).map(([n, k]) => `${n}${k - (se.get(n) || 0) > 1 ? ` ×${k - (se.get(n) || 0)}` : ""}`);
  const added = [...se].filter(([n, k]) => (sb.get(n) || 0) < k).map(([n, k]) => `${n}${k - (sb.get(n) || 0) > 1 ? ` ×${k - (sb.get(n) || 0)}` : ""}`);
  if (gone.length) lines.push(`Removed sound effects: ${gone.join(", ")}.`);
  if (added.length) lines.push(`Added sound effects: ${added.join(", ")}.`);
  const ratios = clipsOf(base, "sfx").map((c) => {
    const m = clipsOf(edited, "sfx").find((x) => x.sfx === c.sfx && Math.abs(x.start - c.start) < 0.6);
    return m && c.volume > 0 ? m.volume / c.volume : null;
  }).filter((x) => x != null).sort((a, b) => a - b);
  const mid = ratios.length ? ratios[Math.floor(ratios.length / 2)] : 1;
  if (ratios.length >= 2 && Math.abs(mid - 1) >= 0.2) lines.push(`Turned the sound effects ${mid < 1 ? "down" : "up"} (about ${Math.round(mid * 100)}% of my level).`);
  const mb = clipsOf(base, "audio", "music")[0];
  const me = clipsOf(edited, "audio", "music")[0];
  if (mb && !me) lines.push("Removed the background music.");
  else if (!mb && me) lines.push(`Added background music ("${clip(me.name, 40)}").`);
  else if (mb && me && mb.volume > 0 && Math.abs(me.volume / mb.volume - 1) >= 0.15) lines.push(`Music ${me.volume < mb.volume ? "down" : "up"}: ${mb.volume} → ${me.volume}.`);
  else if (mb && me && mb.sound !== me.sound) lines.push(`Swapped the music for "${clip(me.name, 40)}".`);
  // 4. Camera moves and voice effects.
  const cb = clipsOf(base, "camera").length;
  const ce = clipsOf(edited, "camera").length;
  if (ce < cb) lines.push(`Removed ${cb - ce} camera move${cb - ce > 1 ? "s" : ""} (punch/push/pull).`);
  if (ce > cb) lines.push(`Added ${ce - cb} camera move${ce - cb > 1 ? "s" : ""}.`);
  // 5. Caption words corrected (only where the cut itself didn't change: a word swapped for another).
  const capWords = (doc) => clipsOf(doc, "caption").sort((a, b) => a.start - b.start).flatMap((c) => (c.words || []).map((w) => w.text));
  const fixes = [];
  const pairs = align(capWords(base), capWords(edited));
  for (let i = 0; i < pairs.length; i++) {
    const del = [];
    const ins = [];
    while (i < pairs.length && (pairs[i][0] === null || pairs[i][1] === null)) {
      if (pairs[i][0] !== null) del.push(pairs[i][0]);
      if (pairs[i][1] !== null) ins.push(pairs[i][1]);
      i++;
    }
    if (del.length && ins.length && del.length <= 4 && ins.length <= 4) fixes.push(`"${del.join(" ")}" → "${ins.join(" ")}"`);
  }
  if (fixes.length) lines.push(`Fixed caption words: ${fixes.slice(0, 8).join(", ")}.`);
  return lines;
}

/** Which footage an ad plays, where: captions made for one cut are wrong for another. */
export const videoSignature = (doc) => clipsOf(doc, "video").sort((a, b) => a.start - b.start).map((c) => `${Number(c.sourceStart).toFixed(2)}-${Number(c.sourceEnd).toFixed(2)}@${Number(c.start).toFixed(2)}`).join(" ");

/** Caption words the creator corrected by hand (base → edited): [{ from: [keys], to: [texts] }]. */
export function captionFixes(base, edited) {
  const words = (doc) => clipsOf(doc, "caption").sort((a, b) => a.start - b.start).flatMap((c) => (c.words || []).map((w) => w.text));
  const pairs = align(words(base), words(edited));
  const out = [];
  for (let i = 0; i < pairs.length; i++) {
    const del = [];
    const ins = [];
    while (i < pairs.length && (pairs[i][0] === null || pairs[i][1] === null)) {
      if (pairs[i][0] !== null) del.push(pairs[i][0]);
      if (pairs[i][1] !== null) ins.push(pairs[i][1]);
      i++;
    }
    if (del.length && ins.length && del.length <= 4 && ins.length <= 4) out.push({ from: del.map(key), to: ins });
  }
  return out;
}

/** The creator's caption corrections applied to freshly made caption clips (within each clip). */
export function applyCaptionFixes(clips, fixes) {
  if (!fixes.length) return clips;
  for (const c of clips) {
    let ws = c.words || [];
    for (const f of fixes) {
      for (let i = 0; i + f.from.length <= ws.length; i++) {
        if (!f.from.every((k, j) => key(ws[i + j].text) === k)) continue;
        const s = ws[i].s;
        const e = ws[i + f.from.length - 1].e;
        const step = (e - s) / f.to.length;
        ws = [...ws.slice(0, i), ...f.to.map((t, j) => ({ ...ws[i], text: t, s: s + j * step, e: s + (j + 1) * step })), ...ws.slice(i + f.from.length)];
        i += f.to.length - 1;
      }
    }
    c.words = ws;
    if (c.text != null) c.text = ws.map((w) => w.text).join(" ");
  }
  return clips;
}
