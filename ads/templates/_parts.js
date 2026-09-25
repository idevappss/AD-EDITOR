// Small shared pieces for the template library (not a template itself, so index.js doesn't register it).

/** The first letter or digit of a string, upper-cased: the fallback "logo" when there's no image. */
export const initial = (s, d = "A") => (String(s || "").trim().match(/[A-Za-z0-9]/) || [d])[0].toUpperCase();

/** Inside of an avatar/icon slot: the ad's logo image when there is one, else the initial. */
export const mark = (logo, letter, esc) => (logo ? `<img src="${esc(logo)}" alt="" />` : `<span>${esc(letter)}</span>`);

/** Clip items as strings. */
export const items = (c) => (Array.isArray(c.items) ? c.items : []).map((x) => String(x ?? "").trim()).filter(Boolean);

/**
 * Timeline helper (script source): count the number inside an element up from 0 (keeps prefix, suffix, decimals and
 * thousands commas). Seek-safe: a proxy tween on the timeline. Skips fractions like "3/4".
 */
export const COUNT_UP = String.raw`function countUp(sel, at, dur, ease) {
      var node = document.querySelector(sel); if (!node) return;
      var txt = node.textContent, m = txt.match(/^([^\d-]*?)(-?[\d,]*\.?\d+)(.*)$/);
      if (!m || /\d\s*\/\s*\d/.test(txt)) return;
      var raw = m[2], o = { v: 0 }, target = Number(raw.replace(/,/g, "")), dec = (raw.split(".")[1] || "").length, commas = raw.indexOf(",") >= 0;
      if (!isFinite(target)) return;
      tl.fromTo(o, { v: 0 }, { v: target, duration: dur, ease: ease || "power2.out", immediateRender: false, onUpdate: function () {
        var s = o.v.toFixed(dec); if (commas) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        node.textContent = m[1] + s + m[3];
      } }, at);
    }`;

/** macOS-style arrow cursor and a tapping hand (white, black outline). */
export const CURSOR_SVG = `<svg viewBox="0 0 24 24"><path fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round" d="M5 2.5v16.2l4.1-3.9 2.6 6 2.9-1.3-2.6-5.9h5.7z"/></svg>`;
export const HAND_SVG = `<svg viewBox="0 0 24 24"><path fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round" d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l.6-.1a1.5 1.5 0 0 1 2.9.5l1 .1a1.4 1.4 0 0 1 2.3 1V16c0 3-2.2 5.5-5.2 5.5h-1.2A5 5 0 0 1 8 19.3l-3-4.5a1.4 1.4 0 0 1 2.2-1.7L9 15z"/></svg>`;
export const CHECK_PATH = "M7 12.5l3.2 3.2L17 8.8";
