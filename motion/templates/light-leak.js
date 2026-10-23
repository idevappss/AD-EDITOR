// Light leak: an orange-to-white burn sweeps across the whole frame for ~0.45 s: a transition between ideas.
export default {
  id: "light-leak",
  name: "Light-leak flash",
  job: "transition",
  use: "A section change or a reveal moment (\"here's the thing…\", \"introducing…\"). At most twice per ad, never over a graphic.",
  fields: "no text.",
  position: "center",
  anchor: null,
  minLen: 0.5,
  sfx: [["whoosh-cinematic", 0.2, 0.3]],
  data: () => ({}),
  css: () => `
      .tp-leak { position: absolute; inset: -10% -40%; background: radial-gradient(ellipse at 35% 50%, rgba(255,138,61,.95), rgba(255,217,184,.85) 30%, rgba(255,255,255,.9) 52%, rgba(255,255,255,0) 72%); mix-blend-mode: screen; pointer-events: none; }
      .ag-look-light-leak { top: 0 !important; bottom: 0 !important; height: auto !important; }`,
  html: ({ id }) => `<div class="tp-leak" id="${id}-leak"></div>`,
  script: `
    tl.fromTo(el + "-leak", { xPercent: -60, opacity: 0 }, { xPercent: 60, opacity: 1, duration: 0.45, ease: "power2.inOut", immediateRender: false }, t0);
    tl.to(el + "-leak", { opacity: 0, duration: 0.12, ease: "power1.in" }, t0 + 0.35);`,
};
