// What the company knows, for the picker: who HBA is, the team and clients by name, the offer, the current numbers
// and the named frameworks — from the Memory session's brain (memory/, #/memory). It means a clip about "Dr. AJ's
// seven months at $100k" or "the buy-back-your-time order" is recognised as one of HBA's own stories, not a stray
// name. Odell's voice and the title bank are left out here; this session already carries those.
const MAX_CHARS = 24_000;
// Sections 1-4, 6 and 10 of COMPANY.md: what HBA is, the people, the offer, the numbers, the frameworks, direction.
// Section 5 (audience pools) is skipped — lib/audience.js already learns that from the creator's own calls.
const PICKING = "preset=picking&sections=1,2,3,4,6,10&parts=company,excerpts&format=text";

/**
 * The company context for a transcript, as a prompt block. Asked for by topic so the matching excerpts are about
 * this video. Empty when Memory isn't reachable — picking then runs exactly as it did before.
 */
export async function companyMemory(segments = [], { origin = `http://localhost:${process.env.PORT || 5173}` } = {}) {
  const topic = segments.slice(0, 40).map((s) => s.text).join(" ").slice(0, 400);
  if (!topic) return "";
  try {
    const res = await fetch(`${origin}/api/memory/context?q=${encodeURIComponent(topic)}&${PICKING}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return "";
    const text = (await res.text()).slice(0, MAX_CHARS);
    return text.trim() ? `<company_memory>\n${text}\n</company_memory>` : "";
  } catch {
    return "";
  }
}
