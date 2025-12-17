import * as parsers from "./parsers.ts";

export const BASE_URL = "https://www.mesto-beroun.cz";
export const SECTIONS = [
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
		"parser": parsers.UredniDeska
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
		"url": "/pro-obcany/aktualne/fotogalerie-a-videa/fotogalerie/",
		"limit": 5,
		"parser": parsers.PhotoGallery
	},
	{
		"url": "https://smlouvy.gov.cz/vyhledavani?subject_idnum=00233129",
		"limit": 10,
		"parser": parsers.Contracts
	}
];
