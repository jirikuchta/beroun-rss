import dotazy_obcanu from "./dotazy_obcanu.ts";
import uredni_deska from "./uredni_deska.ts";
import poskytnute_informace from "./poskytnute_informace.ts";
import { getArgs, serialize, getXMLFilePath } from "./common.ts";

const args = getArgs();

const items = (await Promise.all([
	dotazy_obcanu(args.limit),
	uredni_deska(args.limit),
	poskytnute_informace(args.limit)
])).flat();

items.sort((a, b) => b.date.getTime() - a.date.getTime());

const data = serialize(items, {title: "Beroun", link:"https://mesto-beroun.cz"});
const outFile = getXMLFilePath(import.meta.filename);

await Deno.writeTextFile(outFile, data);
