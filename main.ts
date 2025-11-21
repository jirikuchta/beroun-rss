import dotazy_obcanu from "./dotazy_obcanu.ts";
import uredni_deska from "./uredni_deska.ts";
import { serialize, getXMLFileName } from "./common.ts";

const items = (await Promise.all([dotazy_obcanu(), uredni_deska()])).flat();
items.sort((a, b) => b.date.getTime() - a.date.getTime());

const data = serialize(items, {title: "Beroun", link:"https://mesto-beroun.cz"});
const fileName = getXMLFileName(import.meta.filename);

await Deno.writeTextFile(fileName, data);
