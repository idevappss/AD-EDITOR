// The motion graphics library: the one place every editor gets its motion graphics, scene transitions, camera moves
// and sound effects from (the creator, 2026-10-01: "pull all the motion graphics from all the ads editor, the youtube
// editor, clips editor and make sure its stored in here… it can pull from wherever whenever it's editing a video").
//
//   templates/   the template kit (the Atlas kit first), one file per graphic, plus the shared motion code (_parts.js)
//   render.js    the renderer: draws graphic, sfx and camera clips onto any HyperFrames composition
//   sounds.js    the sound effects (sfx/) with their timing and mix rules
//   references/  the motion language: the Atlas kit, the Motion Graphics Director playbook, the studies behind the kit
//
// Users: the Ads Editor (ads/), the clip editor and its AI director (editor/), Dope clips (edits/, lib/dope.js).
// See README.md for how to add a graphic or a sound.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLATES } from "./templates/index.js";
import { TRANSITIONS } from "./render.js";

/** The motion language every graphic follows (the Atlas kit + the Motion Graphics Director rules), for planners to read. */
export const KIT_REFERENCE = path.join(path.dirname(fileURLToPath(import.meta.url)), "references", "atlas-motion-kit.md");

export { KIT, TEMPLATES, templateSfx, isScene, templateCatalog, soften, FLOAT_IN, templateSample, kitCatalog } from "./templates/index.js";
export { KIT_CSS, KIT_JS, ATLAS } from "./templates/_parts.js";
export {
  LOOKS, ICONS, POSITIONS, TRANSITIONS, CAMERA_MOVES, GRADES, injectAdLayers, adFraming, framingProgram, graphicClips, sfxClips,
  statCount, listTimes, CTA_CLICK, parseStat,
} from "./render.js";
export { SFX, SFX_DIR, sfxFile, PEAK, AMBIENT_SFX, BUILDUPS, BANNED_SFX, SFX_GAIN, SCENE_SOUND, SFX_ROLE, ROLE_LEVEL, BED_LEVEL, peakAlign, templateHits, soundClips } from "./sounds.js";
export { LIBRARY, PACK_DIR, libraryOf, syncLibrary } from "./library.js";

/** A full-screen scene's ground. */
export const SCENE_TONES = ["dark", "accent", "paper"];
/** How a full-screen scene comes in outside ads (the glitch cut is kept for ads). */
export const SCENE_TRANSITIONS = TRANSITIONS.filter((t) => t !== "glitch");

const ids = (keep) => Object.values(TEMPLATES).filter(keep).map((t) => t.id);
/** Regular clips (clip editor + its AI director): everything but the Ads Editor's offer closes. A clip's own CTA is a follow or a comment. */
export const CLIP_TEMPLATES = ids((t) => t.job !== "cta" || ["sonar-cta", "comment-pill", "profile-follow"].includes(t.id));
/** Dope clips: no call-to-action cards at all. */
export const DOPE_TEMPLATES = ids((t) => t.job !== "cta");
