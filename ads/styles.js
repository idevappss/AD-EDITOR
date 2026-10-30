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
      "Cinematic and polished, and alive with motion the way the creator's reference reels are: a motion graphic or scene every 3–5 seconds while the speaker talks, so a 40-second ad carries 8–12 of them. Reach for count-up numbers on every figure, big words behind or beside the speaker on the key ideas, checklists, flows and diagrams of the steps, product and app screens, and the name title early. Make 3–5 of them full-screen scenes (this overrides any 'at most two scenes' or '3–5 template moments' above), cut into with a blur or a whip. The framing stays wide and calm (the build handles the slow push): add camera punch-ins only on the 3–5 lines that matter most, at least 6 seconds apart, and no shakes, flashes or glitches on the speaker. Captions marked the way the master edit marks them (quotes in italics, a phrase in caps, one red box). The music bed carries the sound; the build adds a whip on each scene cut and a riser building into the big scenes.",
    // The master edit the creator called perfect (motion/references/sound-study.md), 2026-10-23.
    direction: "master-edit",
    pace: { pauseMax: 0.45, pauseKeep: 0.2 },
    // The creator's reference reels (2026-10-28, motion/references/reel-study.md 11 + 12): the shot stays wide with the
    // whole head in frame, drifts slowly in and eases into the planned punch-ins (motion/render.js "cinematic"), and
    // the captions are small (a third smaller than the 0.8 default).
    framing: "cinematic",
    captionScale: 0.45,
    // A riser builds into every full-screen scene (ads/build.js), not just the first: the reels' "build up" sound.
    buildUps: true,
  },
  custom: {
    name: "Custom",
    brief:
      "There is no preset look: the creator's request below is the brief. Follow it exactly for pace, captions, graphics, sound and tone; where it says nothing, fall back on the house style.",
  },
};

/** The style an ad's options name, or null. */
export const editStyleOf = (options) => EDIT_STYLES[options?.editStyle] || null;
