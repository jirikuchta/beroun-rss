import { DOMParser } from "jsr:@b-fuze/deno-dom";
import * as parsers from "./parsers.ts";

const BASE_URL = "https://www.mesto-beroun.cz";
const SECTIONS = [
	{
		"url": "/pro-obcany/aktualne/aktuality/",
		"limit": 5,
		"parser": parsers.Event
	},
	{
		"url": "/pro-obcany/skolstvi/aktuality/",
		"limit": 5,
		"parser": parsers.Event
	},
	{
		"url": "/pro-obcany/kultura-sport-a-cestovni-ruch/aktuality/",
		"limit": 5,
		"parser": parsers.Event
	},
	{
		"url": "/mesto-a-urad/uredni-deska/",
		"limit": 10,
		"parser": parsers.CategoriesList
	},
	{
		"url": "/mesto-a-urad/povinne-informace/poskytnute-informace-podle-zakona-c-106-1999-sb",
		"limit": 10,
		"parser": parsers.CategoriesList
	},
	{
		"url": "/mesto-a-urad/vyhlasky-a-narizeni/",
		"limit": 5,
		"parser": parsers.CategoriesList
	},
	{
		"url": "/pro-obcany/dotazy-obcanu/odpovedi/",
		"limit": 20,
		"parser": parsers.QA
	},
	{
		"url": "/mesto-a-urad/rada-a-zastupitelstvo-mesta/usneseni/",
		"limit": 5,
		"parser": parsers.FilesList
	},
	{
		"url": "/mesto-a-urad/rada-a-zastupitelstvo-mesta/zapisy-zm-a-rm/",
		"limit": 5,
		"parser": parsers.FilesList
	},
	{
		"url": "/mesto-a-urad/rada-a-zastupitelstvo-mesta/zapisy-z-komisi-rady-mesta/",
		"limit": 5,
		"parser": parsers.FilesList
	},
	{
		"url": "/mesto-a-urad/rada-a-zastupitelstvo-mesta/zapisy-z-vyboru-zastupitelstva-mesta/",
		"limit": 5,
		"parser": parsers.FilesList
	},
	{
		"url": "/pro-obcany/aktualne/radnicni-list-a-videozpravodaj/radnicni-list/",
		"limit": 1,
		"parser": parsers.RadnicniList
	},
	{
		"url": "/pro-obcany/aktualne/radnicni-list-a-videozpravodaj/berounsky-videozpravodaj/",
		"limit": 1,
		"parser": parsers.EventGallery
	},
	{
		"url": "https://smlouvy.gov.cz/vyhledavani?subject_idnum=00233129",
		"limit": 10,
		"parser": parsers.Contracts
	}
];

async function parse(section: any) {
	const url = new URL(section.url, BASE_URL);

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
		<title>Beroun</title>
		<link>${BASE_URL}</link>`
	];
	parts.push(...items.map(item => {
		return `
		<item>
			<title>${item.title}</title>
			<pubDate>${item.date.toUTCString()}</pubDate>
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

const items = (await Promise.all(SECTIONS.map(async section => await parse(section)))).flat();
items.sort((a, b) => b.date.getTime() - a.date.getTime());

console.log(serialize(items));
