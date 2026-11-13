// Puts one in-article ad (books-mid-summary) inside long summaries, just before the
// 4th "##" section: about 40% in, after real content, where most readers still are.
// Summaries with fewer than 6 sections keep only the end-of-summary unit.
const SLOT = "6635749932";

const el = (tagName, properties, children = []) => ({ type: "element", tagName, properties, children });

export default function rehypeMidAd() {
    return (tree) => {
        const h2 = tree.children.filter((n) => n.type === "element" && n.tagName === "h2");
        if (h2.length < 6) return;
        tree.children.splice(
            tree.children.indexOf(h2[3]),
            0,
            el("div", { className: ["ad-unit", "prose-ad"], ariaLabel: "إعلان" }, [
                el("span", { className: ["ad-unit-label"] }, [{ type: "text", value: "إعلان" }]),
                el("ins", {
                    className: ["adsbygoogle"],
                    style: "display:block; text-align:center;",
                    dataAdClient: "ca-pub-3610150616518651",
                    dataAdSlot: SLOT,
                    dataAdFormat: "fluid",
                    dataAdLayout: "in-article",
                }),
            ]),
        );
    };
}
