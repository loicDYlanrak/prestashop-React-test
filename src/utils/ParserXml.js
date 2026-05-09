import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  removeNSPrefix: true,
  numberParseOptions: {
    leadingZeros: false,
    hex: true,
  },
});

export async function parsePrestashopXML(xmlData) {
  try {
    let xmlText;

    if (xmlData instanceof Response) {
      if (!xmlData.ok) throw new Error(`HTTP error! status: ${xmlData.status}`);
      xmlText = await xmlData.text();
    } else if (typeof xmlData === "string") {
      xmlText = xmlData;
    } else {
      return xmlData;
    }

    const result = parser.parse(xmlText);
    return result.prestashop || result;
  } catch (error) {
    console.error("Erreur lors du parsing XML:", error);
    throw error;
  }
}