import { Element } from "jsr:@b-fuze/deno-dom";
import { parse, serialize, AItemParser, getXMLFileName } from "./common.ts";

const url = "https://www.mesto-beroun.cz/mesto-a-urad/uredni-deska/";
const selector = "#gcm-main .official-desk-list .item";


class ItemParser extends AItemParser {
	protected linkNode: Element;

	constructor(protected override node: Element) {
		super(node);
		this.linkNode = node.querySelector("a.item-href")!;
	}

	get title() {
		const { linkNode } = this;
		return linkNode.textContent || "";
	}

	get description() {
		return this.title;
	}

	get link() {
		const { linkNode } = this;
		return linkNode.href || "";
	}

	protected parseDate() {
		const { node } = this;
		const dateFrom = node.querySelector(".item-date-from")!;
		const parts = dateFrom.textContent.split(/\s/);

		const year = Number(parts.pop());
		const month = Number(parts.pop()) - 1;
		const date = Number(parts.pop());

		return new Date(year, month, date, 12);
	}
}

export default async function main() {
	const items = await parse({url, selector, parser: ItemParser});

	const data = serialize(items, {title: "Úřední deska", link:url});
	const fileName = getXMLFileName(import.meta.filename);
	await Deno.writeTextFile(fileName, data);

	return items;
};

if (import.meta.main) {
	main();
}
