import { DOMParser } from "jsr:@b-fuze/deno-dom";
import * as parsers from "./parsers.ts";
import * as conf from "./config.ts";

async function parse(section: any) {
	const url = new URL(section.url, conf.BASE_URL);

	const src = await fetch(url).then(res => res.text());
	const doc = new DOMParser().parseFromString(src, "text/html");

	let nodes: Element[];
	if (section.parser == parsers.QA) {
		nodes = parseQA(doc, section.limit);
	} else {
		nodes = Array.from(doc.querySelectorAll(section.parser.selector));
	}

	return nodes
		.slice(0, section.limit)
		.map(node => new section.parser(node, url, section.titlePrefix));
};

function parseQA(doc: Document, limit: number) {
	const parent = doc.querySelector(parsers.QA.selector) as Element;

	function isSeparator(node: Element) {
		if (node.tagName.toLowerCase() == "hr") return true;
		if (/^_{100,}$/.test(node.textContent || "")) return true;
		return false;
	};

	let child = parent.firstElementChild;

	// ignore all before first separator
	while (child && !isSeparator(child)) {
		child = child.nextElementSibling;
	}

	let nodes: Element[] = [];
	let itemNodes: Element[] = [];

	while (child) {
		child = child.nextElementSibling;

		if (!child || isSeparator(child)) {
			const wrap = doc.createElement("div");
			wrap.append(...itemNodes);

			nodes.push(wrap);
			if (nodes.length >= limit) { break; }

			itemNodes = [];
		} else {
			itemNodes.push(child);
		}
	}

	return nodes;
};

function serialize(items: parsers.Base[]) {
	const parts = [`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
	<channel>
		<title>Město Beroun</title>
		<link>${conf.BASE_URL}</link>
		<description>Neoficiální RSS feed oficiálních stránek města Beroun.</description>`
	];
	parts.push(...items.map(item => {
		return `
		<item>
			<title>${item.title}</title>
			<pubDate>${item.date.toUTCString().split(/\s/).slice(0, 4).join(" ")}</pubDate>
			<link>${item.link}</link>
			<guid${!item.permalink ? ' isPermalink="false"' : ''}>${item.guid}</guid>
			${item.description ? '<description><![CDATA['+item.description+']]></description>' : ''}
			${item.image ? '<enclosure url="'+encodeURI(item.image)+'" type="image/jpeg"></enclosure>' : ''}
		</item>`;
	}));
	parts.push(`
	</channel>
</rss>`);

	return parts.join("").replace(/^\s*[\r\n]/gm,"");
};

const parts = conf.SECTIONS.map(section => parse(section));
const items = (await Promise.all(parts)).flat();

console.log(serialize(items));
