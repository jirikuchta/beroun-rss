import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
import { serialize, AItemParser, ensureAbsUrls } from "./common.ts";


const url = "https://www.mesto-beroun.cz/pro-obcany/dotazy-obcanu/odpovedi/";
const selector = "#gcm-main .editor_content.readable";


class ItemParser extends AItemParser {
	get title() {
		const { node } = this;
		return node.children[1].textContent || "";
	}

	get description() {
		const { node } = this;
		return Array.from(node.children).slice(2).map((node: Element) => node.innerHTML).join();
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
}

function isItemSeparator(node: Element) {
	if (node.tagName.toLowerCase() == "hr") return true;
	if (/^_{100,}$/.test(node.textContent || "")) return true;
	return false;
};

async function parse() {
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
			itemNodes = [];
		} else {
			itemNodes.push(child);
		}
	}

	return items;
}

const items = await parse();
const xml = serialize(items, {title: "Dotazy občanů", link:url});

await Deno.writeTextFile("dotazy-obcanu.xml", xml);
