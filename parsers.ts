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
		return this.link;
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

	get image() {
		const { node } = this;
		return node.querySelector("img")?.getAttribute("src") || "";
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
			[node, ...node.querySelectorAll(`[${attr}]`)].forEach((elm: Element) => {
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

export class EventItemParser extends ItemParser {
	static selector = "#gcm-main .event-link";
	protected dateSelector = ".event-info-value.event-date";

	get title() {
		const { node } = this;
		return (node.querySelector(".event-name")?.textContent || "").trim();
	}

	get description() {
		const { node } = this;
		return (node.querySelector(".event-perex")?.textContent || "").trim();
	}

	get link() {
		const { node, url } = this;
		return (node.getAttribute("href") || url.href).trim();
	}
};

export class QAItemParser extends ItemParser {
	static selector = "#gcm-main .editor_content.readable";

	get guid() {
		return this.title;
	}

	get title() {
		const { node } = this;
		const selector = "strong:first-of-type, strong:first-of-type + strong";
		return Array.from(node.children[1].querySelectorAll(selector))
			.reduce((text, node) => `${text} ${node.textContent}`, "");
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
		const month = [
			"ledna", "února", "března", "dubna", "května", "června",
			"července", "srpna", "září", "října", "listopadu", "prosince"
		].indexOf(parts.pop() || "");
		const date = Number(parts.pop());

		this._date = new Date(year, month, date, 12);
		return this._date;
	}
};
