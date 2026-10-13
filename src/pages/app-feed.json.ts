// The elhellal.com app's Explore tab (src/pages/explore.astro there) reads
// this: every book summary, one featured a day. CORS in public/_headers.
import books from "../data/books.json";

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")}…` : s);

export function GET() {
    const items = books.map((b) => ({
        title: b.title,
        meta: b.author,
        text: clip(b.summary, 180),
        image: b.cover,
        url: `https://books.elhellal.com/${encodeURIComponent(b.slug)}/`,
    }));
    return Response.json({ v: 1, site: "books", title: "ملخصات الكتب", url: "https://books.elhellal.com/", items });
}
