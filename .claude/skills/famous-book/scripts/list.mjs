#!/usr/bin/env node
// The famous-books list shown in the admin panel (../famous-books.json).
//   node list.mjs record "<title or URL as given>" <bookSlug>   mark a listed book done, or add a new one
//   node list.mjs                                               print the list with its slugs
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const listPath = path.join(HERE, "../famous-books.json");
const quotesPath = path.resolve(HERE, "../../../../../elhellal-quotes/src/data/quotes.json");

// Same folding as the admin panel's matcher: no diacritics/tatweel, one alef, ة→ه, ى→ي, letters and digits only.
export const norm = (s) => String(s ?? "").normalize("NFKC")
  .replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

const list = JSON.parse(fs.readFileSync(listPath, "utf8"));
const [cmd, query, slug] = process.argv.slice(2);

if (cmd === "record") {
  if (!query || !slug) { console.error('usage: node list.mjs record "<title or URL>" <bookSlug>'); process.exit(2); }
  const { authors } = JSON.parse(fs.readFileSync(quotesPath, "utf8"));
  const author = authors.find((a) => a.books.some((b) => b.slug === slug));
  if (!author) { console.error(`${slug} is not a book in quotes.json — run the import first`); process.exit(1); }
  const book = author.books.find((b) => b.slug === slug);
  const keys = new Set([norm(query), norm(book.title), norm(slug)]);
  let entry = list.find((e) => e.slug === slug) ?? list.find((e) => keys.has(norm(e.title)) || keys.has(norm(`${e.title} ${e.author}`)));
  if (!entry) list.push((entry = { title: book.title, author: author.name }));
  Object.assign(entry, { slug, authorSlug: author.slug, addedAt: new Date().toISOString().slice(0, 10) });
  fs.writeFileSync(listPath, JSON.stringify(list, null, 2) + "\n");
  console.log(`recorded «${entry.title}» → ${slug} (${list.length} books on the list)`);
} else {
  for (const e of list) console.log(`${e.slug ? "✓" : "·"} ${e.title} — ${e.author}${e.slug ? ` (${e.slug})` : ""}`);
}
