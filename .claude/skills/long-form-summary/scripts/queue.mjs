#!/usr/bin/env node
// Work queue + validator for long-form summaries.
//   node queue.mjs next [N]     next N books to write (default 5), catalog first, then quotes
//   node queue.mjs check <slug> validate src/content/summaries/<slug>.md
//   node queue.mjs stats        counts per stage
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "../../../..");
const MIN = 1000, MAX = 1500;
const booksPath = path.join(ROOT, "src/data/books.json");
const sumDir = path.join(ROOT, "src/content/summaries");
const quotesPath = path.resolve(ROOT, "../elhellal/src/data/quotes.json");

const books = JSON.parse(fs.readFileSync(booksPath, "utf8"));
const words = (t) => t.split(/\s+/).filter(Boolean).length; // same counting as src/pages/[slug].astro
const sumPath = (slug) => path.join(sumDir, slug + ".md");
const wc = (slug) => (fs.existsSync(sumPath(slug)) ? words(fs.readFileSync(sumPath(slug), "utf8")) : 0);

// quote books, keyed by slug, with total likes
const quoteBooks = new Map();
if (fs.existsSync(quotesPath)) {
  const { authors } = JSON.parse(fs.readFileSync(quotesPath, "utf8"));
  for (const a of authors)
    for (const b of a.books ?? []) {
      const likes = b.quotes.reduce((s, q) => s + (q.likes || 0), 0);
      quoteBooks.set(b.slug, { slug: b.slug, title: b.title, cover: b.cover, author: a.name, authorSlug: a.slug, likes, quotes: b.quotes.length });
    }
} else console.error("warning: elhellal quotes.json not found at " + quotesPath);

const cmd = process.argv[2] ?? "next";

if (cmd === "check") {
  const slug = process.argv[3];
  const f = sumPath(slug);
  if (!fs.existsSync(f)) { console.log("MISSING " + f); process.exit(1); }
  const t = fs.readFileSync(f, "utf8");
  const n = words(t), h2 = (t.match(/^## /gm) || []).length;
  const problems = [];
  if (n < MIN || n > MAX) problems.push(`words ${n} outside ${MIN}-${MAX}`);
  if (h2 < 5) problems.push(`only ${h2} "##" sections (need >= 5)`);
  if (/^---/.test(t)) problems.push("has frontmatter (summaries start directly with ##)");
  if (/^# /m.test(t)) problems.push('has an H1 (the page renders the title; use "##")');
  if (!books.some((b) => b.slug === slug)) problems.push("slug not in books.json");
  console.log(`${slug}: ${n} words, ${h2} sections` + (problems.length ? "\nFAIL: " + problems.join("; ") : "\nOK"));
  process.exit(problems.length ? 1 : 0);
}

// Stage 1: catalog books lacking a 1000+ word summary. Most-quoted first.
const stage1 = books
  .filter((b) => wc(b.slug) < MIN)
  .map((b) => ({ stage: 1, slug: b.slug, title: b.title, author: b.author, words: wc(b.slug), likes: quoteBooks.get(b.quotesSlug || b.slug)?.likes ?? 0 }))
  .sort((a, b) => b.likes - a.likes);

// Stage 2: quote books not in the catalog. Most-liked first.
const inCatalog = new Set(books.flatMap((b) => [b.slug, b.quotesSlug].filter(Boolean)));
const stage2 = [...quoteBooks.values()]
  .filter((q) => !inCatalog.has(q.slug))
  .map((q) => ({ stage: 2, slug: q.slug, title: q.title, author: q.author, authorSlug: q.authorSlug, cover: q.cover, words: 0, likes: q.likes }))
  .sort((a, b) => b.likes - a.likes);

// Books already reported unusable (no source text) are listed in skipped.json so the queue moves on.
const skipFile = path.join(path.dirname(new URL(import.meta.url).pathname), "../skipped.json");
const skipped = new Set(fs.existsSync(skipFile) ? JSON.parse(fs.readFileSync(skipFile, "utf8")) : []);
const queue = [...stage1, ...stage2].filter((b) => !skipped.has(b.slug));

if (cmd === "stats") {
  console.log(`catalog: ${books.length} books, ${books.length - stage1.length} with a ${MIN}+ word summary`);
  console.log(`stage 1 remaining: ${stage1.length}   stage 2 remaining: ${stage2.length}   skipped: ${skipped.size}`);
} else {
  const n = Number(process.argv[3] ?? 5);
  for (const b of queue.slice(0, n)) console.log(JSON.stringify(b));
}
