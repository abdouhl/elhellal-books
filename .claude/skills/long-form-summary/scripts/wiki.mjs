#!/usr/bin/env node
// Fetch Arabic Wikipedia plain text for a title (follows redirects, tries a few spelling variants).
//   node wiki.mjs "<title>" [outfile]
// Prints: matched title, length, and whether it looks like a disambiguation page.
// ALWAYS eyeball the first lines: short titles often match the wrong article (e.g. a building or a person).
import fs from "node:fs";

const title = process.argv[2];
const out = process.argv[3];
const variants = [title, title.replace(/[ًٌٍَُِّْ]/g, ""), title.replace(/^ال/, ""), title + " (رواية)", title + " (كتاب)", title + " (مجموعة قصصية)"];

async function get(t) {
  const u = "https://ar.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=" + encodeURIComponent(t);
  const r = await (await fetch(u, { headers: { "user-agent": "elhellal-books/1.0" } })).json();
  const p = Object.values(r.query.pages)[0];
  return p.missing !== undefined ? null : { title: p.title, text: p.extract || "" };
}

for (const v of [...new Set(variants)]) {
  const r = await get(v);
  if (!r || !r.text) continue;
  const disamb = /قد يقصد به|may refer to|صفحة توضيح/.test(r.text.slice(0, 300));
  console.log(`MATCH "${r.title}" (query: ${v}) — ${r.text.length} chars${disamb ? " — DISAMBIGUATION, skip" : ""}`);
  console.log(r.text.slice(0, 300).replace(/\n+/g, " ⏎ "));
  if (out) fs.writeFileSync(out, r.text);
  process.exit(0);
}
console.log("NO MATCH");
process.exit(1);
