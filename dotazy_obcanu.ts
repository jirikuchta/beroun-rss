import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
import { serialize, AItemParser, ensureAbsUrls, getXMLFileName } from "./common.ts";


const url = "https://www.mesto-beroun.cz/pro-obcany/dotazy-obcanu/odpovedi/";
const selector = "#gcm-main .editor_content.readable";


class ItemParser extends AItemParser {
	get title() {
		const { node } = this;
		const titleNodes = Array.from(node.querySelectorAll("strong:first-of-type, strong:first-of-type + strong")) as Element[];
		return titleNodes.reduce((text, node) => `${text} ${node.textContent}`, "");
	}

	get description() {
		const node = this.node.cloneNode(true) as Element;
		node.querySelector("p")?.remove(); // bez datumu
		node.querySelector("strong")?.remove(); // bez titulku
		return Array.from(node.children)
			.map((node: Element) => node.innerHTML).join("")
			.replace(/<br><br>/g, "<p></p>");
	}

	get link() {
		return url;
	}

	protected parseDate() {
		const { node } = this;
		const str = node.children[0].textContent || "";

		const parts = str.split(/\s/);
		const year = Number(parts.pop());
		const month = ["ledna", "února", "března", "dubna", "května", "června",
					   "července", "srpna", "září", "října", "listopadu", "prosince"].indexOf(parts.pop() || "");
		const date = Number(parts.pop());
		return new Date(year, month, date, 12);
	}
};

function isItemSeparator(node: Element) {
	if (node.tagName.toLowerCase() == "hr") return true;
	if (/^_{100,}$/.test(node.textContent || "")) return true;
	return false;
};

async function parse(limit?: number) {
	const src = await fetch(url).then(res => res.text());
	const doc = new DOMParser().parseFromString(src, "text/html");

	const parent = doc.querySelector(selector) as Element;
	const origin = new URL(url).origin;

	let child = parent.firstElementChild;

	// ignore all before first separator
	while (child && !isItemSeparator(child)) {
		child = child.nextElementSibling;
	}

	const items: ItemParser[] = [];
	let itemNodes: Element[] = [];

	while (child) {
		child = child.nextElementSibling;

		if (!child || isItemSeparator(child)) {
			const wrap = doc.createElement("div");
			wrap.append(...itemNodes);
			ensureAbsUrls(wrap, origin);

			items.push(new ItemParser(wrap));
			if (limit && items.length >= limit) {
				break;
			}

			itemNodes = [];
		} else {
			itemNodes.push(child);
		}
	}

	return items;
};

export default async function main() {
	const items = await parse(20);

	const data = serialize(items, {title: "Dotazy občanů", link:url});
	const fileName = getXMLFileName(import.meta.filename);
	await Deno.writeTextFile(fileName, data);

	return items;
};

if (import.meta.main) {
	main();
}
