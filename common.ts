import * as path from "jsr:@std/path";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";


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
	limit: number;
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

	return Array.from(nodes).slice(0, opts.limit).map(node => {
		ensureAbsUrls(node, origin);
		return new opts.parser(node);
	});
};

export function serialize(items: AItemParser[], opts: SerializeOptions = {}) {
	const parts = [`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
	<channel>
		<title>${opts.title || ""}</title>
	   	<link>${opts.link || ""}</link>
	   	<description>${opts.description || ""}</description>`
	];
	parts.push(...items.map(item => {
		return `
		<item>
			<title>${item.title.trim()}</title>
			<pubDate>${item.date.toUTCString()}</pubDate>
			<link>${item.link.trim()}</link>
			<guid>${item.guid}</guid>
			<description><![CDATA[${item.description.trim()}]]></description>
		</item>`;
	}));
	parts.push(`
	</channel>
</rss>`);

	return parts.join("");
};

export function ensureAbsUrls(node: Element, origin: string) {
	["src", "href"].forEach(attr => {
		node.querySelectorAll(`[${attr}]`).forEach((elm: Element) => {
			elm.setAttribute(attr, new URL(elm.getAttribute(attr)!, origin).toString());
		});
	});
};

export function getXMLFilePath(modulefile: string) {
	const dir = getArgs().outDir;
	return path.join(dir, path.basename(modulefile).replace(".ts", ".xml"));
};

export function getArgs() {
	return parseArgs(Deno.args, {
		string: ["outDir", "_"],
		default: { "limit": 100, "outDir": "" }
	});
};
