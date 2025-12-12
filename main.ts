import { DOMParser } from "jsr:@b-fuze/deno-dom";
import { ItemParser, CategoriesListItemParser, QAItemParser, FilesListItemParser } from "./parsers.ts";

const BASE_URL = "https://www.mesto-beroun.cz";
const SECTIONS = [
	{
		"url": "/mesto-a-urad/uredni-deska/",
		"parser": CategoriesListItemParser,
		"limit": 10
	},
	{
		"url": "/mesto-a-urad/povinne-informace/poskytnute-informace-podle-zakona-c-106-1999-sb",
		"parser": CategoriesListItemParser,
		"limit": 10
	},
	{
		"url": "/pro-obcany/dotazy-obcanu/odpovedi/",
		"parser": QAItemParser,
		"limit": 20
	},
	{
		"url": "/mesto-a-urad/rada-a-zastupitelstvo-mesta/usneseni/",
		"parser": FilesListItemParser,
		"limit": 10
	},
	{
		"url": "/mesto-a-urad/rada-a-zastupitelstvo-mesta/zapisy-zm-a-rm/",
		"parser": FilesListItemParser,
		"limit": 10
	},
	{
		"url": "/mesto-a-urad/rada-a-zastupitelstvo-mesta/zapisy-z-komisi-rady-mesta/",
		"parser": FilesListItemParser,
		"limit": 10
	},
	{
		"url": "/mesto-a-urad/rada-a-zastupitelstvo-mesta/zapisy-z-vyboru-zastupitelstva-mesta/",
		"parser": FilesListItemParser,
		"limit": 10
	}
];

async function parse(section: any) {
	const url = new URL(section.url, BASE_URL);

	const src = await fetch(url).then(res => res.text());
	const doc = new DOMParser().parseFromString(src, "text/html");

	let nodes: Element[];
	if (section.parser == QAItemParser) {
		nodes = parseQA(doc, section.limit);
	} else {
		nodes = Array.from(doc.querySelectorAll(section.parser.selector));
	}

	return nodes
		.slice(0, section.limit)
		.map(node => new section.parser(node, url));
};

function parseQA(doc: Document, limit: number) {
	const parent = doc.querySelector(QAItemParser.selector) as Element;

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

function serialize(items: ItemParser[]) {
	const parts = [`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
	<channel>
		<title>Beroun</title>
		<link>${BASE_URL}</link>`
	];
	parts.push(...items.map(item => {
		return `
		<item>
			<title>${item.title}</title>
			<pubDate>${item.date.toUTCString()}</pubDate>
			<link>${item.link}</link>
			<guid>${item.guid}</guid>
			<description><![CDATA[${item.description}]]></description>
		</item>`;
	}));
	parts.push(`
	</channel>
</rss>`);

	return parts.join("");
};

const items = (await Promise.all(SECTIONS.map(async section => await parse(section)))).flat();
items.sort((a, b) => b.date.getTime() - a.date.getTime());

console.log(serialize(items));
