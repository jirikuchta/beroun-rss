import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
import { encodeBase64 } from "jsr:@std/encoding/base64";


export abstract class AItemParser {
	readonly date: Date;

	constructor(protected node: Element) {
		this.date = this.parseDate();
	}

	get guid() {
		return encodeBase64(this.date.toUTCString() + this.title);
	}

	abstract get title(): string;
	abstract get description(): string;
	abstract get link(): string;
	protected abstract parseDate(): Date;
};

export interface ParseOptions {
	url: string;
	selector: string;
	parser: new (node: Element) => AItemParser;
};

export interface SerializeOptions {
	title?: string;
	description?: string;
	link?: string;
};

export async function parse(opts: ParseOptions) {
	const src = await fetch(opts.url).then(res => res.text());
	const doc = new DOMParser().parseFromString(src, "text/html");

	const nodes = doc.querySelectorAll(opts.selector);
	const origin = new URL(opts.url).origin;

	return Array.from(nodes).map(node => {
		ensureAbsUrls(node, origin);
		return new opts.parser(node);
	});
};

export function serialize(items: AItemParser[], opts: SerializeOptions = {}) {
	const parts = [`<?xml version="1.0" encoding="utf-8"?><rss version="2.0"><channel><title>${opts.title || ""}</title><link>${opts.link || ""}</link><description>${opts.description || ""}</description>`];
	parts.push(...items.map(item => {
		return `\n<item>
			<title>${item.title}</title>
			<pubDate>${item.date.toUTCString()}</pubDate>
			<link>${item.link}</link>
			<guid>${item.guid}</guid>
			<description><![CDATA[${item.description}]]></description>
		</item>`;
	}));
	parts.push("</channel></rss>");

	return parts.join("");
};

export function ensureAbsUrls(node: Element, origin: string) {
	["src", "href"].forEach(attr => {
		node.querySelectorAll(`[${attr}]`).forEach((elm: Element) => {
			elm.setAttribute(attr, new URL(elm.getAttribute(attr)!, origin).toString());
		});
	});
};
