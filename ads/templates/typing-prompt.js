// AI prompt: a chat composer where the prompt types itself in, the caret blinks, send pulses and a reply chip pops.
export default {
  id: "typing-prompt",
  name: "AI prompt",
  job: "product",
  use: "The speaker says what you'd ask the AI / tell it to do (\"just ask it…\", \"tell it what you want\").",
  fields: 'text = the prompt as typed, up to ~70 characters; sub = the assistant name (e.g. "ATLAS"); items = [a 2–5 word reply chip, optional].',
  position: "top",
  anchor: null,
  minLen: 2.4,
  sfx: [["click", 0.2, 0.3], ["pop", -1, 0.45]],
  data: (c) => ({ chars: String(c.text || "").length, reply: (c.items || [])[0] || "" }),
  css: ({ px, tall }) => `
      .tp-prompt { width: ${tall ? 86 : 50}%; padding: ${px(26)}px; border-radius: ${px(36)}px; color: #F5EFE8; background: linear-gradient(180deg, rgba(50,40,35,.82), rgba(28,22,19,.86)); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 36%, transparent), 0 0 ${px(60)}px color-mix(in srgb, var(--ac) 16%, transparent), 0 ${px(26)}px ${px(70)}px rgba(0,0,0,.35); }
      .tp-prompt-top { display: flex; align-items: center; gap: ${px(12)}px; margin-bottom: ${px(16)}px; font-family: "SF Mono", Menlo, monospace; font-weight: 500; font-size: ${px(22)}px; letter-spacing: .2em; text-transform: uppercase; color: var(--ac); }
      .tp-prompt-top i { width: ${px(14)}px; height: ${px(14)}px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(12)}px var(--ac); }
      .tp-prompt-box { display: flex; align-items: flex-end; gap: ${px(16)}px; padding: ${px(22)}px ${px(22)}px ${px(22)}px ${px(26)}px; border-radius: ${px(26)}px; background: rgba(245,239,232,.06); box-shadow: inset 0 0 0 1px rgba(245,239,232,.1); }
      .tp-prompt-text { flex: 1; min-height: ${px(84)}px; font-weight: 600; font-size: ${px(36)}px; line-height: 1.3; }
      .tp-prompt-text span { visibility: hidden; }
      .tp-caret { display: inline-block; width: ${px(4)}px; height: 1.05em; margin-left: ${px(2)}px; vertical-align: -0.15em; background: var(--ac); }
      .tp-send { flex: none; display: grid; place-items: center; width: ${px(70)}px; height: ${px(70)}px; border-radius: 50%; background: var(--ac); color: #1C1310; box-shadow: 0 0 ${px(24)}px color-mix(in srgb, var(--ac) 55%, transparent); }
      .tp-send svg { width: 55%; height: 55%; }
      .tp-reply { display: inline-flex; margin-top: ${px(16)}px; padding: ${px(12)}px ${px(22)}px; border-radius: 999px; background: rgba(245,239,232,.08); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ac) 40%, transparent); font-weight: 600; font-size: ${px(28)}px; color: #F5EFE8; }`,
  html: ({ id, c, esc }) => `<div class="tp-prompt" id="${id}-card"><div class="tp-prompt-top"><i></i>${esc(c.sub || "ATLAS")}</div><div class="tp-prompt-box"><div class="tp-prompt-text">${[...String(c.text || "")].map((ch, i) => `<span id="${id}-c${i}">${ch === " " ? " " : esc(ch)}</span>`).join("")}<i class="tp-caret" id="${id}-caret"></i></div><span class="tp-send" id="${id}-send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></span></div>${(c.items || [])[0] ? `<div class="tp-reply" id="${id}-reply">${esc(c.items[0])}</div>` : ""}</div>`,
  script: `
    floatIn(el + "-card", t0, { y: 70 });
    var n = c.data.chars || 0, typeStart = t0 + 0.45, typeLen = Math.max(0.6, Math.min(n / 16, len - 1.6));
    for (var k = 0; k < n; k++) tl.set(el + "-c" + k, { visibility: "visible" }, typeStart + (k / Math.max(1, n)) * typeLen);
    for (var b = t0; b < out; b += 0.5) tl.set(el + "-caret", { opacity: Math.round((b - t0) / 0.5) % 2 ? 0 : 1 }, b);
    var sent = typeStart + typeLen + 0.15;
    tl.fromTo(el + "-send", { scale: 1 }, { scale: 0.82, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, sent);
    if (c.data.reply) tl.fromTo(el + "-reply", { autoAlpha: 0, y: 20, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(2)", immediateRender: false }, sent + 0.25);
    else tl.set(el + "-reply", { autoAlpha: 0 }, t0);`,
};
