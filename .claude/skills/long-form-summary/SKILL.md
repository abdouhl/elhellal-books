---
name: long-form-summary
description: Write long-form (1000–1500 word) Arabic book summaries for books.elhellal.com. Works through books already in the catalog (src/data/books.json) first, then books that only appear in the elhellal.com quotes data. Use when the user asks to write, add, expand or continue book summaries ("ملخصات", "long-form summary", "next batch of books").
argument-hint: "[N books | a book title/slug]"
---

# Long-form book summaries (books.elhellal.com)

Each summary is a Markdown file at `src/content/summaries/<slug>.md`, rendered by `src/pages/[slug].astro` under the book's catalog entry. Target: **1000–1500 words**, aim for ~1150–1350. Word count is `split(/\s+/)` over the whole file — same as the site's reading-time calculation.

Argument: a number = how many books to write (default 5); a title/slug = just that book.

## Order of work

1. **Stage 1 — books already in the catalog** (`src/data/books.json`) that lack a 1000+ word summary. This includes existing short summaries (300–800 words): expand them, keeping what is correct.
2. **Stage 2 — books from the elhellal quotes data** (`../elhellal/src/data/quotes.json`) that are not in the catalog yet. Add the catalog entry *and* the long-form file.

Within each stage, most-quoted (total likes) first. Don't reorder by what's easiest.

```bash
node .claude/skills/long-form-summary/scripts/queue.mjs stats      # progress
node .claude/skills/long-form-summary/scripts/queue.mjs next 5     # next 5 books, JSON per line
```

Stage 2 lines include `author`, `authorSlug` and `cover` taken from the quotes data — reuse them in the new catalog entry.

## Per-book workflow

### 1. Gather sources (do this before writing a word)
- `node .claude/skills/long-form-summary/scripts/wiki.mjs "<title>" <scratchpad>/<slug>.txt` — Arabic Wikipedia. **Verify the match is the book**, not a same-named person, building, or concept (e.g. "عزازيل" returns the demon, "صوفيا" returns Hagia Sophia). Try the spelling variants (with/without diacritics, "(رواية)"). Also pull the author's article.
- Use WebSearch/WebFetch for at least one more source (publisher page, Goodreads/Jarir description, a reputable review, an interview with the author). Wikipedia alone rarely supports 1000 words.
- Read the book's quotes from `quotes.json` (`authors[].books[]`); the top ones by likes show what readers responded to and can be quoted.
- Read the existing catalog entry and any existing `.md` for that slug.

**If you cannot reach ~1000 words of *supported* material, do not pad.** Add the slug to `skipped.json` (a JSON array in this skill's folder), tell the user which books were skipped and why, and move to the next book. A shorter true summary beats a longer invented one.

### 2. Write `src/content/summaries/<slug>.md`
- Arabic, Modern Standard, calm essay tone. No frontmatter, no `#` H1 (the page shows the title). Start straight with `## …`.
- 6–9 `##` sections, each a few paragraphs. Adapt to the book, but cover:
  1. Opening: what the book is, author, year, genre, why it matters (the hook)
  2. The author in brief, and where this book sits in their work
  3. Setting / historical or intellectual context
  4. Structure and plot (fiction) or argument (non-fiction) — without a full spoiler of the ending unless the book is defined by it; flag spoilers if you reveal them
  5. Characters or key concepts
  6. Themes and ideas (the analytical core — the longest section)
  7. Style, language, technique
  8. Reception, adaptations, awards, controversy (only if sourced)
  9. Reading guide: who it suits, where it's hard, what to read next
- Quote sparingly, in «guillemets», only quotes that are actually in `quotes.json` or a source you fetched. Never paraphrase a quote and present it as a quotation.
- Arabic numerals/dates in the style of the existing files (check one before writing). Use «» for titles and quotes.

**Facts rule:** every date, name, award, plot event, sales figure and adaptation must come from a source you read this session. Uncertain → omit, or attribute ("تذكر بعض المصادر…"). Where sources disagree (e.g. publication year), say so briefly and follow the catalog value. Do not fill length with generic praise or restating earlier paragraphs; add substance from the sources or stop.

### 3. Catalog entry
- **Stage 1:** leave the entry unless a fact is wrong (fix year/genre if the sources prove it). Keep `summary` a 1–2 sentence blurb, consistent with the long-form text.
- **Stage 2:** append to `src/data/books.json` with all fields:
  `slug, title, author, authorSlug, cover, year, genre, summary` (1–2 sentences), `keyIdeas` (3–5 short strings), `whoShouldRead` (1–2 sentences), `quotesSlug` (the book slug in quotes.json); add `award` only if sourced. Slug = the quotes.json book slug so the pages and the `elhellal.com/quotes/book/<slug>` link line up. Edit the JSON with Node/Edit — not BSD `sed` (it mangles Arabic).

### 4. Validate
```bash
node .claude/skills/long-form-summary/scripts/queue.mjs check <slug>   # 1000–1500 words, >=5 sections, no H1/frontmatter
bun run build                                                          # page generated for the slug
```
Fix and re-check until both pass. If over 1500, cut repetition; if under 1000, add sourced material (don't stretch sentences).

Write files with paths built by string concatenation / `path.join`; `new URL()` on Arabic slugs percent-encodes the filename on disk.

## Batching and reporting
- Work in batches of the requested size. Do all the source gathering for a batch in parallel where possible; write summaries one at a time so each gets full attention.
- After a batch: list each book with its word count, note skipped books and reasons, and any catalog fixes. Then show `queue.mjs stats`.
- **Do not commit or push** unless the user asks. When asked, stage `src/content/summaries/`, `src/data/books.json` and commit; pushing deploys to Cloudflare Pages.
