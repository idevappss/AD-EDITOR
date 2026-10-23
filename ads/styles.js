// Editing styles: the creator picks one on the Create page (2026-10-20) and every ad made from that upload follows it.
// Each is a preset over the edit: a brief for Claude (ads/plan.js), the creative direction it locks in instead of the
// usual rotation (null = none, so the edit stays minimal; left out = the usual rotation), how tight the cuts are
// (ads/build.js), and, for Premium, the film grade (Template 2, ads/index.js resolveLut). An ad without one edits
// exactly as before. The Create page shows Basic, Premium and Custom; Advanced ("dope") is kept for ads made with it.

export const EDIT_STYLES = {
  "talking-head": {
    name: "Basic",
    brief:
      "Simple and clean: the speaker, white captions in the middle, nothing else. Cut every flub, retake, restart, stumble, repeated line and bit of dead air, and anything that doesn't need to be there, so only the clean takes play; keep the whole message, in order. No graphics of any kind (no numbers, logos, checklists, CTA button, templates, slides or proof), no sound effects, no cut hits, no voice effects. The only move is a camera \"punch\" on each line where something important is said (the key claim, a number, the point the video turns on, the call to action): anchor it on that line's words so the shot pops in for the line and back out after it. About one every 5–10 seconds, never two in a row; no push, no pull.",
    direction: null,
    pace: { pauseMax: 0.3, pauseKeep: 0.1 },
    // The creator (2026-10-21): the talking-head editor is just the cut, white captions mid-frame, face tracking and a
    // pop-in when something important is said. ads/build.js drops everything else; the framing holds wide between.
    simple: true,
  },
  dope: {
    name: "Advanced",
    brief:
      "Fast and loud, built to stop the scroll: open on a hard hook in big type, bold captions, a graphic or a camera move on most beats, and a sound on every hit. Use more template moments than usual (5–7); full-screen type scenes are welcome. Never let a beat sit after it lands.",
    direction: "kinetic-type",
    pace: { pauseMax: 0.18, pauseKeep: 0.05 },
  },
  premium: {
    name: "Premium",
    brief:
      "Cinematic and polished: let the lines breathe, subtle motion only (slow push-ins and fades, no shakes or whips), few graphics and every one of them elegant, captions marked the way the master edit marks them (quotes in italics, a phrase in caps, one red box). Sound effects only where they land a reveal; the music bed does the work.",
    // The master edit the creator called perfect (motion/references/sound-study.md), 2026-10-23.
    direction: "master-edit",
    pace: { pauseMax: 0.45, pauseKeep: 0.2 },
  },
  custom: {
    name: "Custom",
    brief:
      "There is no preset look: the creator's request below is the brief. Follow it exactly for pace, captions, graphics, sound and tone; where it says nothing, fall back on the house style.",
  },
};

/** The style an ad's options name, or null. */
export const editStyleOf = (options) => EDIT_STYLES[options?.editStyle] || null;
