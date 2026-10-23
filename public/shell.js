// App shell (Design session): the top nav (sliding underline, avatar menu, phone menu), search / ⌘K, the credits
// bar and the account initials. Page content is app.js's job; this file only drives the frame around it.
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const getJson = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))));

// ---------- phone menu: the nav links drop down under the bar ----------
const setNav = (open) => {
  document.body.classList.toggle("nav-open", open);
  $("#menu-btn").setAttribute("aria-expanded", String(open));
};
$("#menu-btn").onclick = () => setNav(!document.body.classList.contains("nav-open"));
$("#scrim").onclick = () => setNav(false);
window.addEventListener("hashchange", () => setNav(false));

// ---------- the orange underline glides to the current page's link ----------
const links = $("#nt-links");
const ink = $("#nt-ink");
function moveInk() {
  const on = links.querySelector("a.on");
  if (!on || getComputedStyle(links).position === "absolute") {
    ink.style.opacity = "0";
    return;
  }
  ink.style.opacity = "1";
  ink.style.width = `${on.offsetWidth}px`;
  ink.style.transform = `translateX(${on.offsetLeft}px)`;
}
new MutationObserver(moveInk).observe(links, { subtree: true, attributes: true, attributeFilter: ["class"] });
window.addEventListener("resize", moveInk);
document.fonts?.ready.then(moveInk);

// ---------- avatar menu: the other pages, Integrations and credits ----------
const meBtn = $("#nt-me-btn");
const pop = $("#nt-pop");
const setMenu = (open) => {
  pop.hidden = !open;
  meBtn.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
};
meBtn.onclick = (e) => {
  e.stopPropagation();
  setMenu(pop.hidden);
};
document.addEventListener("click", (e) => !pop.hidden && !e.target.closest(".nt-me") && setMenu(false));
document.addEventListener("keydown", (e) => e.key === "Escape" && !pop.hidden && (setMenu(false), meBtn.focus()));
pop.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
// A page that lives in the menu marks the avatar as the current spot.
const markMe = () => meBtn.classList.toggle("on", Boolean(pop.querySelector("a.on")));
new MutationObserver(markMe).observe(pop, { subtree: true, attributes: true, attributeFilter: ["class"] });

// ---------- search ----------
const PAGES = [
  ["Ad studio", "#/ads", "Pick a style and create an ad"],
  ["My ads", "#/my-ads", "Every ad you've made"],
  ["Assets", "#/assets", "Brand kit: logos, LUTs, fonts"],
  ["Sounds", "#/sounds", "Music and sound effects"],
  ["Study", "#/study", "References and taste"],
  ["Analytics", "#/analytics", "How posts and channels are doing"],
  ["Memory", "#/memory", "Company memory"],
  ["Integrations", "/api/integrations/", "Claude key and credits"],
];
const input = $("#search-input");
$("#search").addEventListener("click", () => input.focus());
const box = $("#search-results");
let index = { at: 0, items: [] };
let active = 0;

async function loadIndex() {
  if (Date.now() - index.at < 30_000) return index.items;
  const ads = (await getJson("/api/ads/").catch(() => ({ ads: [] }))).ads || [];
  index = {
    at: Date.now(),
    items: [
      ...ads.map((a) => ({ kind: "Ad", label: a.name, sub: a.status === "ready" ? (a.video ? "Saved" : "Ready to review") : a.status, href: `#/ads/${a.id}` })),
      ...PAGES.map(([label, href, sub]) => ({ kind: "Page", label, sub, href })),
    ],
  };
  return index.items;
}

async function renderResults() {
  const q = input.value.trim().toLowerCase();
  const items = await loadIndex();
  const hits = (q ? items.filter((it) => `${it.label} ${it.sub}`.toLowerCase().includes(q)) : items).slice(0, 8);
  active = Math.min(active, Math.max(hits.length - 1, 0));
  box.innerHTML = hits.length
    ? hits
        .map((it, i) => `<a href="${esc(it.href)}" class="${i === active ? "on" : ""}"><span class="sr-kind">${it.kind}</span><span class="sr-label">${esc(it.label)}</span><span class="sr-sub">${esc(it.sub || "")}</span></a>`)
        .join("")
    : `<p class="sr-empty">Nothing matches “${esc(input.value)}”</p>`;
  box.hidden = false;
}

const closeSearch = () => {
  box.hidden = true;
  active = 0;
};
input.addEventListener("focus", renderResults);
input.addEventListener("input", () => {
  active = 0;
  renderResults();
});
input.addEventListener("keydown", (e) => {
  const links = [...box.querySelectorAll("a")];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!links.length) return;
    active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
    links.forEach((a, i) => a.classList.toggle("on", i === active));
  } else if (e.key === "Enter") {
    links[active]?.click();
  } else if (e.key === "Escape") {
    input.blur();
  }
});
box.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    input.value = "";
    input.blur();
    closeSearch();
  }
});
input.addEventListener("blur", () => setTimeout(closeSearch, 150));
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    input.focus();
    input.select();
  }
});
if (!/Mac|iPhone|iPad/.test(navigator.platform)) $(".search kbd").textContent = "Ctrl K";

// ---------- credits bar (the text itself comes from integrations' credits.js) ----------
async function refreshCredits() {
  try {
    const { credits } = (await getJson("/api/integrations/status")).claude;
    const bar = $("#credits-bar");
    const total = credits?.balance?.amountUsd;
    bar.hidden = !total;
    if (total) {
      const pct = Math.max(0, Math.min(100, (100 * credits.remainingUsd) / total));
      $("i", bar).style.width = `${pct}%`;
      bar.classList.toggle("low", Boolean(credits.low));
    }
  } catch {
    $("#credits-bar").hidden = true;
  }
}
refreshCredits();
setInterval(refreshCredits, 60_000);

// ---------- account initials (top bar) ----------
getJson("/api/accounts")
  .then((accounts) => {
    const a = accounts[0];
    const name = (a?.name || a?.handle || "").replace(/^@/, "");
    if (!name) return;
    const parts = name.split(/[\s._-]+/).filter(Boolean);
    $("#top-avatar").textContent = (parts.length > 1 ? parts.slice(0, 2).map((w) => w[0]).join("") : name.slice(0, 2)).toUpperCase();
    $("#top-avatar").title = `${a.name || a.handle} · Integrations`;
  })
  .catch(() => {});

