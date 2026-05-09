import { XMLBuilder } from "fast-xml-parser";

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  format: true,
  indentBy: "  ",
  suppressEmptyNode: false,
  suppressBooleanAttributes: false,
});

/**
 * Convertit un objet en XML PrestaShop avec support des langues
 * @param {object} data - Les données à convertir
 * @param {string} rootTag - Tag racine (défaut: "prestashop")
 * @param {boolean} useLanguageWrapper - Ajoute le wrapper <language id="1"> autour des champs multilingues
 * @param {number} languageId - L'ID de langue à utiliser (défaut: 1)
 */
export function convertToPrestashopXML(
  data,
  rootTag = "prestashop",
  useLanguageWrapper = true,
  languageId = 1,
  fieldWithLangue = [],
) {
  try {
    const wrapLanguageFields = (obj) => {
      if (obj === null || typeof obj !== "object") return obj;

      if (Array.isArray(obj)) {
        return obj.map((item) => wrapLanguageFields(item));
      }

      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (useLanguageWrapper && fieldWithLangue.includes(key)) {
          if (typeof value === "object" && value.language) {
            result[key] = value;
          } else if (typeof value === "string" || typeof value === "number") {
            result[key] = {
              language: {
                "@_id": languageId,
                "#cdata": String(value)
              }
            };
          } else {
            result[key] = value;
          }
        } 
        else if (typeof value === "string" || typeof value === "number") {
          result[key] = { "#cdata": String(value) };
        }
        else if (typeof value === "object") {
          result[key] = wrapLanguageFields(value);
        } 
        else {
          result[key] = value;
        }
      }
      return result;
    };

    let processedData = JSON.parse(JSON.stringify(data));
    
    if (processedData[rootTag]) {
      for (const key in processedData[rootTag]) {
        if (processedData[rootTag][key] && typeof processedData[rootTag][key] === 'object') {
          processedData[rootTag][key] = wrapLanguageFields(processedData[rootTag][key]);
        }
      }
    } else {
      processedData = wrapLanguageFields(processedData);
    }

    if (!processedData[rootTag]) {
      processedData = { [rootTag]: processedData };
    }
    
    if (!processedData[rootTag]["@_xmlns:xlink"]) {
      processedData[rootTag]["@_xmlns:xlink"] = "http://www.w3.org/1999/xlink";
    }

    let xmlContent = builder.build(processedData);
    xmlContent = cleanXmlTags(xmlContent);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
    
  } catch (error) {
    console.error("Erreur lors de la conversion en XML:", error);
    throw error;
  }
}
function cleanXmlTags(xml) {
  const simpleTags = [
    'id_parent', 'active', 'id_shop_default', 'id_root_category',
    'position', 'is_root_category', 'date_add', 'date_upd',
    'id_manufacturer', 'id_supplier', 'id_brand', 'id_category_default',
    'new', 'id_default_combination', 'id_tax_rules_group', 'type',
    'reference', 'supplier_reference', 'ean13', 'state',
    'product_type', 'price', 'unit_price', 'id_default_group', 'id_lang',
    'passwd', 'lastname', 'firstname', 'email', 'id_gender', 'active',
    'id'
  ];

  simpleTags.forEach(tag => {
    const regex = new RegExp(`<${tag}>\\s*(<\\!\\[CDATA\\[.*?\\]\\]>)\\s*</${tag}>`, 'gs');
    xml = xml.replace(regex, `<${tag}>$1</${tag}>`);
  });

  const multiLangTags = [
    'name', 'link_rewrite', 'description', 'description_short', 
    'meta_title', 'meta_description', 'meta_keywords'
  ];

  multiLangTags.forEach(tag => {
    const regex = new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'gs');
    
    xml = xml.replace(regex, (match, content) => {
      const cleanedContent = content.replace(/>\s+</g, '><').trim();
      return `<${tag}>${cleanedContent}</${tag}>`;
    });
  });

  return xml;
}