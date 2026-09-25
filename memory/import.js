// Bulk-add transcript files to Memory from the command line (same parsing as the page's upload).
//   node memory/import.js ~/Downloads/om-*.txt [--kind=vlog] [--tags=a,b]
import fs from "node:fs/promises";
import path from "node:path";
import { addTranscript, parseName, toPlainText } from "./index.js";

const args = process.argv.slice(2);
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const files = args.filter((a) => !a.startsWith("--"));
if (!files.length) {
  console.log("Usage: node memory/import.js <files…> [--kind=youtube|vlog|zoom|mastermind|podcast|sales|ad|other] [--tags=a,b]");
  process.exit(1);
}
for (const file of files) {
  const name = path.basename(file);
  const { title, date } = parseName(name);
  const version = name.match(/[-_ ]v(\d+)[-_ .]/i)?.[1];
  const text = toPlainText(await fs.readFile(file, "utf8"), name);
  const r = await addTranscript({ text, title: version ? `${title} (v${version})` : title, date, source: name, kind: opt("kind"), tags: opt("tags") });
  console.log(`${r.duplicate ? "= already saved" : "+ added"}  ${r.item.title}  [${r.item.kind}, ${r.item.words} words]`);
}
