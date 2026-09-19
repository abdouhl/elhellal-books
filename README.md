# books.elhellal.com

ملخصات كتب عربية — a lightweight companion site to [elhellal.com](https://elhellal.com), summarizing notable Arabic books that already have quote pages on the main site.

## Stack

Astro 5 + Cloudflare adapter, same `@new-ui/foundations` design tokens as elhellal.com. No framework/JS needed — this is a static content site.

## Develop

```bash
bun install
bun run dev
```

## Content

All books live in `src/data/books.json`. Each entry:

```json
{
  "slug": "url-safe-slug",
  "title": "...",
  "author": "...",
  "authorSlug": "matches the author slug on elhellal.com/quotes",
  "cover": "cover image url",
  "year": 2012,
  "genre": "...",
  "award": "optional",
  "summary": "1 paragraph overview",
  "keyIdeas": ["3-5 bullet points"],
  "whoShouldRead": "1-2 sentences",
  "quotesSlug": "matches the book slug on elhellal.com/quotes/book/<slug> for cross-linking"
}
```

Seeded with 8 books that already have the most quotes on elhellal.com (award-winners / widely-known titles chosen deliberately, to keep summaries factually solid). Add more by appending entries — no build step required, `[slug].astro` picks them up automatically via `getStaticPaths`.

## Deploying to books.elhellal.com

This isn't deployed yet. To go live:

1. `bun run build` then either `wrangler pages deploy dist` (first run will ask you to create/pick a Cloudflare Pages project), or connect this repo to Cloudflare Pages via Git.
2. In the Cloudflare dashboard, add `books.elhellal.com` as a custom domain on that Pages project. Since `elhellal.com`'s DNS already lives in the same Cloudflare account, this just needs a CNAME added there — Cloudflare offers to create it automatically when you add the custom domain.
3. Push this repo to GitHub if you want Git-based deploys (currently local-only, `git init` has been run but there's no remote).
