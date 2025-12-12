import { encodeBase64 } from "jsr:@std/encoding/base64";

export abstract class ItemParser {
	static selector: string;
	protected dateSelector: string;

	protected _date: Date;
	protected linkNode: Element;

	constructor(protected node: Element, protected url: URL) {
		this.ensureAbsUrls();
		this.linkNode = node.querySelector("a")!;
	}

	get guid() {
		return encodeBase64(this.date.toUTCString() + this.title);
	}

	get title() {
		const { linkNode } = this;
		return (linkNode.textContent || "").trim();
	}

	get description() {
		return this.title;
	}

	get link() {
		const { linkNode, url } = this;
		return (linkNode.getAttribute("href") || url.href).trim();
	}

	get date() {
		return this._date || this.parseDate();
	}

	protected parseDate() {
		const { node } = this;

		try {
			const dateNode = node.querySelector(this.dateSelector)!;
			const parts = dateNode.textContent.split(/\s/);

			const year = Number(parts.pop());
			const month = Number(parts.pop()) - 1;
			const date = Number(parts.pop());

			this._date = new Date(year, month, date, 12);
		} catch (e) {
			this._date = new Date(0);
		}

		return this._date;
	}

	protected ensureAbsUrls() {
		const { node, url } = this;
		["src", "href"].forEach(attr => {
			node.querySelectorAll(`[${attr}]`).forEach((elm: Element) => {
				elm.setAttribute(attr, new URL(elm.getAttribute(attr)!, url.origin).toString());
			});
		});
	};
};

export class CategoriesListItemParser extends ItemParser {
	static selector = "#categoriesList .item";
	protected dateSelector = ".item-date-from";
};

export class FilesListItemParser extends ItemParser {
	static selector = ".files-list .file-row";
	protected dateSelector = ".date";
};

export class QAItemParser extends ItemParser {
	static selector = "#gcm-main .editor_content.readable";

	get title() {
		const { node } = this;
		const titleNodes = Array.from(node.children[1].querySelectorAll("strong:first-of-type, strong:first-of-type + strong")) as Element[];
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
		const { url } = this;
		return url.href;
	}

	protected parseDate() {
		const { node } = this;
		const str = node.children[0].textContent || "";

		const parts = str.split(/\s/);
		const year = Number(parts.pop());
		const month = ["ledna", "února", "března", "dubna", "května", "června",
					   "července", "srpna", "září", "října", "listopadu", "prosince"].indexOf(parts.pop() || "");
		const date = Number(parts.pop());

		this._date = new Date(year, month, date, 12);
		return this._date;
	}
};
