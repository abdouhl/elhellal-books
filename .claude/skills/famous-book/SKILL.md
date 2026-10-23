---
name: famous-book
description: Add a famous book across the elhellal sites in one go — its top Goodreads quotes into elhellal-quotes (translated to Arabic where needed), a long-form summary + catalog entry on books.elhellal.com, and the author's biography on biographies.elhellal.com. Use when the user names a well-known book (Arabic or translated) and asks to summarize it, add it with its quotes, or "famous book".
argument-hint: "<book title [author] | Goodreads book URL> [number of quotes, default 50]"
---

# Famous book: quotes + summary + author biography

Three repos sit side by side: this one (`elhellal-books`), `../elhellal-quotes` and `../elhellal-biographies`. Work in this order — each step depends on the one before (the summary and biography skills only accept books/authors that are in `quotes.json`).

Argument: a title (Arabic or original language, often followed by the author's name — the admin panel's list sends "<title> <author>") or a Goodreads book URL, then optionally the number of quotes (default **50**). Pass the title and author together to `fetch`; it searches Goodreads with the whole string.

## 1. Quotes from Goodreads → `../elhellal-quotes/src/data/quotes.json`

```bash
bun ../elhellal-quotes/scripts/import-goodreads-book.ts fetch "<title or URL>" --limit 50
```

It writes the plan `../elhellal-quotes/tmp/book-import.json`: the Goodreads author and book, and the book's most-liked quotes not yet stored (quotes already in `quotes.json` count towards the limit). Quotes from an Arabic edition come first with `text` already set — **keep those verbatim**. The rest have `text: ""`.

**Check the match first.** `book.titleRaw`, `author.nameRaw` and `source.bookUrl` must be the book the user meant (not a study guide, summary, box set or same-named book). If it's wrong, find the right edition with WebSearch (`site:goodreads.com/book/show <title>`) and re-run `fetch` with that URL. Prefer an Arabic edition's URL when one exists: its title comes back in Arabic and its Arabic quotes rank first.

Then fill the plan (edit the JSON with Write/Edit or Node — not BSD `sed`):
- `author.name`: the Arabic name. Already set if the author is in `quotes.json` (`author.existingSlug`) — leave it. Otherwise use the spelling Arabic publishers and Arabic Wikipedia use; `author.nameHints` (Goodreads contributors) often has it, but it can also list translators.
- `book.title`: the title of the book's best-known Arabic translation (e.g. «الخيميائي», «الجريمة والعقاب»), without subtitles or series numbers. Verify it with a search if unsure. Optionally `book.slug`; by default it's the slugified title.
- Each `quotes[].text` that is empty: translate `original` into Modern Standard Arabic — faithful, natural, no added flourish, no quote marks around it. Keep the meaning and length; don't merge, cut or "improve" quotes. If a quote is not really from this book (a Goodreads mix-up, e.g. a famous line by someone else) or is unusable (a single word, a list, mostly names), delete it from the plan rather than translate it.
- `quotes[].tags` (optional): Arabic translations of `tagsOriginal`, one or two words each; reuse tag spellings already used in `quotes.json`.

```bash
bun ../elhellal-quotes/scripts/import-goodreads-book.ts apply
```

It refuses a plan with a missing/non-Arabic name, title or quote text and lists what to fix. On success the last line is JSON with `authorSlug`, `bookSlug`, `newAuthor` and `added` — use those slugs for the next steps. If fewer quotes than asked were available, say so in the report; don't invent any.

Then record the book on the admin panel's famous-books list (`famous-books.json` in this skill's folder) — it marks a listed book as started, or adds a book that isn't listed yet:

```bash
node .claude/skills/famous-book/scripts/list.mjs record "<the title argument as given>" <bookSlug>
```

## 2. Long-form summary → `src/content/summaries/<bookSlug>.md` + `src/data/books.json`

Follow `.claude/skills/long-form-summary/SKILL.md` for **this one book** (argument: `bookSlug`). The book is now a stage-2 book (in `quotes.json`, not in the catalog), so it gets a full catalog entry with `quotesSlug: <bookSlug>`, `authorSlug: <authorSlug>` and the cover from `quotes.json`. If the book is already in `books.json`, it's stage 1: only expand/fix the summary. All of that skill's rules apply — sources before writing, no padding, `queue.mjs check`, `bun run build`. For a translated book, give the original title and year of first publication in the text, and the Arabic translation (translator, publisher) only if sourced.

If the skill decides the book can't be supported at 1000 words, stop the summary there and say so, but still do step 3.

## 3. Author biography → `../elhellal-biographies/src/data/authors.json`

Skip if `authors.json` already has an entry with slug `authorSlug` (say so in the report). Otherwise follow `../elhellal-biographies/.claude/skills/write-biography/SKILL.md` for `authorSlug`. Its validation command, run from here:

```bash
bun ../elhellal-biographies/scripts/check-biography.ts <authorSlug>
```

## 4. Sync the cross-links between the sites

```bash
bun ../elhellal-quotes/scripts/sync-book-summaries.ts
bun ../elhellal-quotes/scripts/sync-biographies.ts
bun ../elhellal-biographies/scripts/sync-summaries.ts
bun ../elhellal-quotes/scripts/check-data.ts
```

## Report

- The Goodreads book used, quotes added (how many Arabic-edition, how many translated, any dropped and why).
- Summary: word count from `queue.mjs check`, or why it was skipped.
- Biography: written (sources used, facts left out) or already existed.
- Changed files per repo. **Do not commit, push or deploy** — the admin panel does that per site.
