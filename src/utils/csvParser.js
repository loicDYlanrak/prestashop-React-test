const parseCSVGeneric = (csvText) => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return { headers: [], data: [], lines: [] };
  
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;

    const row = [];
    let inQuotes = false;
    let currentValue = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    row.push(currentValue.trim());

    if (row.length !== headers.length && row.length > 0) {
      continue;
    }

    const rowData = {};
    headers.forEach((header, idx) => {
      let value = row[idx] ? row[idx].replace(/^"|"$/g, "") : "";
      rowData[header] = value;
    });

    data.push({ rowData, lineNumber: i + 1 });
  }

  return { headers, data: data.map(item => item.rowData), lines, rawData: data };
};

const parseFrenchNumber = (value) => {
  if (!value || value === "") return 0;
  const cleaned = value.toString().replace(/,/g, ".");
  return parseFloat(cleaned);
};

const formatPrice = (value) => {
  const num = parseFrenchNumber(value);
  return isNaN(num) ? 0 : num;
};

// ==================== FICHIER 1 : PRODUITS ====================
export const parseFile1Products = (csvText) => {
  const { headers, data, rawData } = parseCSVGeneric(csvText);
  
  const expectedColumns = ["date_availability_produit", "nom", "reference", "prix_ttc", "Taxe", "categorie", "prix_achat"];
  const unexpectedColumns = headers.filter(col => !expectedColumns.includes(col));
  if (unexpectedColumns.length > 0) {
    throw new Error(`Ligne 1 - Colonnes non conformes: ${unexpectedColumns.join(", ")}. Colonnes attendues: ${expectedColumns.join(", ")}`);
  }
  
  const missingColumns = expectedColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Ligne 1 - Colonnes manquantes: ${missingColumns.join(", ")}`);
  }
  
  const categories = new Set();
  const taxes = new Set();
  const products = [];
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/([0-9]{4})$/;
  
  for (let idx = 0; idx < data.length; idx++) {
    const row = data[idx];
    const lineNumber = rawData[idx]?.lineNumber || idx + 2;
    const categorie = row.categorie?.trim();
    const taxe = row.Taxe?.trim();
    
    if (categorie) categories.add(categorie);
    if (taxe) taxes.add(taxe);
    
    const dateValue = row.date_availability_produit?.trim();
    if (dateValue && !dateRegex.test(dateValue)) {
      throw new Error(`Ligne ${lineNumber} (colonne "date_availability_produit") - Format de date invalide pour le produit "${row.reference}" : ${dateValue}. Le format attendu est DD/MM/YYYY`);
    }
    
    const prixTTC = formatPrice(row.prix_ttc);
    const prixAchat = formatPrice(row.prix_achat);
    
    if (prixTTC < 0) {
      throw new Error(`Ligne ${lineNumber} (colonne "prix_ttc") - Le prix TTC ne peut pas être négatif pour le produit "${row.reference}" : ${prixTTC}`);
    }
    
    if (prixAchat < 0) {
      throw new Error(`Ligne ${lineNumber} (colonne "prix_achat") - Le prix d'achat ne peut pas être négatif pour le produit "${row.reference}" : ${prixAchat}`);
    }
    
    const taxeValue = parseFrenchNumber(taxe);
    const prixHT = taxeValue > 0 ? prixTTC / (1 + taxeValue / 100) : prixTTC;
    
    products.push({
      reference: row.reference?.trim(),
      nom: row.nom?.trim(),
      date_availability: dateValue,
      prix_ttc: prixTTC,
      prix_ht: parseFloat(prixHT.toFixed(8)),
      taxe: taxeValue,
      categorie_name: categorie,
      prix_achat: prixAchat
    });
  }
  
  return {
    success: true,
    categories: Array.from(categories),
    taxes: Array.from(taxes),
    products: products,
    total_products: products.length
  };
};

// ==================== FICHIER 2 : COMBINAISONS ====================
export const parseFile2Combinations = (csvText) => {
  const { headers, data, rawData } = parseCSVGeneric(csvText);
  
  const expectedColumns = ["reference", "specificité", "karazany", "stock_initial", "prix_vente_ttc"];
  const unexpectedColumns = headers.filter(col => !expectedColumns.includes(col));
  if (unexpectedColumns.length > 0) {
    throw new Error(`Ligne 1 - Fichier 2 - Colonnes non conformes: ${unexpectedColumns.join(", ")}. Colonnes attendues: ${expectedColumns.join(", ")}`);
  }
  
  const missingColumns = expectedColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Ligne 1 - Fichier 2 - Colonnes manquantes: ${missingColumns.join(", ")}`);
  }
  
  const productOptions = new Set();
  const productOptionValues = new Map();
  const productCombinations = new Map();
  const productStocks = new Map();
  
  for (let idx = 0; idx < data.length; idx++) {
    const row = data[idx];
    const lineNumber = rawData[idx]?.lineNumber || idx + 2;
    const reference = row.reference?.trim();
    const specificite = row["specificité"]?.trim();
    const karazany = row.karazany?.trim();
    const stock = parseInt(row.stock_initial) || 0;
    const prixTTC = formatPrice(row.prix_vente_ttc);
    
    if (prixTTC < 0) {
      throw new Error(`Ligne ${lineNumber} (colonne "prix_vente_ttc") - Fichier 2 - Le prix de vente TTC ne peut pas être négatif pour la référence "${reference}"`);
    }
    
    if (stock < 0) {
      throw new Error(`Ligne ${lineNumber} (colonne "stock_initial") - Fichier 2 - Le stock initial ne peut pas être négatif pour la référence "${reference}"`);
    }
    
    if (!reference) continue;
    
    if (specificite) {
      productOptions.add(specificite);
      
      if (!productOptionValues.has(specificite)) {
        productOptionValues.set(specificite, new Set());
      }
      if (karazany) {
        productOptionValues.get(specificite).add(karazany);
      }
      
      if (!productCombinations.has(reference)) {
        productCombinations.set(reference, []);
      }
      if (karazany) {
        productCombinations.get(reference).push({
          attribute: specificite,
          value: karazany,
          price_ttc: prixTTC
        });
      }
    }
    
    if (!productStocks.has(reference)) {
      productStocks.set(reference, []);
    }
    
    if (specificite && karazany) {
      productStocks.get(reference).push({
        attribute: specificite,
        value: karazany,
        stock: stock
      });
    } else if (!specificite && !karazany) {
      productStocks.get(reference).push({
        attribute: null,
        value: null,
        stock: stock
      });
    }
  }
  
  const optionsValues = {};
  for (const [option, values] of productOptionValues) {
    optionsValues[option] = Array.from(values);
  }
  
  return {
    success: true,
    product_options: Array.from(productOptions),
    product_option_values: optionsValues,
    product_combinations: Object.fromEntries(productCombinations),
    product_stocks: Object.fromEntries(productStocks)
  };
};
// ==================== FICHIER 3 : CLIENTS ET COMMANDES ====================
// Fonction pour parser le panier au format: [("T_01";3;"ngoza"), ("C_03";1;"")]
const parseCartString = (cartStr) => {
  if (!cartStr || cartStr === "") return [];
  
  try {
    // Nettoyer la chaîne
    let cleanStr = cartStr.trim();
    // Enlever les crochets extérieurs
    if (cleanStr.startsWith("[") && cleanStr.endsWith("]")) {
      cleanStr = cleanStr.slice(1, -1);
    }
    
    const items = [];
    // Séparer les éléments par "),("
    const parts = cleanStr.split(/\),\(/);
    
    for (const part of parts) {
      // Nettoyer les parenthèses
      let itemStr = part.replace(/^\(|\)$/g, "");
      
      // Séparer par point-virgule
      const fields = itemStr.split(";");
      if (fields.length >= 2) {
        const reference = fields[0].replace(/^"|"$/g, "");
        const quantity = parseInt(fields[1]) || 0;
        let attribute = "";
        if (fields[2]) {
          attribute = fields[2].replace(/^"|"$/g, "");
        }
        
        items.push({
          reference: reference,
          quantity: quantity,
          attribute: attribute || null
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error("Erreur parsing panier:", error);
    return [];
  }
};

export const parseFile3Customers = (csvText) => {
  const { headers, data, rawData } = parseCSVGeneric(csvText);
  
  const expectedColumns = ["date", "nom", "email", "pwd", "adresse", "achat", "etat"];
  const unexpectedColumns = headers.filter(col => !expectedColumns.includes(col));
  if (unexpectedColumns.length > 0) {
    throw new Error(`Ligne 1 - Fichier 3 - Colonnes non conformes: ${unexpectedColumns.join(", ")}. Colonnes attendues: ${expectedColumns.join(", ")}`);
  }
  
  const missingColumns = expectedColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Ligne 1 - Fichier 3 - Colonnes manquantes: ${missingColumns.join(", ")}`);
  }
  
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/([0-9]{4})$/;
  
  const addresses = new Set();
  const customers = new Map();
  const carts = [];
  const orders = [];
  
  for (let idx = 0; idx < data.length; idx++) {
    const row = data[idx];
    const lineNumber = rawData[idx]?.lineNumber || idx + 2;
    const nom = row.nom?.trim();
    const email = row.email?.trim();
    const pwd = row.pwd?.trim();
    const adresse = row.adresse?.trim();
    const achat = row.achat?.trim();
    const etat = row.etat?.trim();
    const date = row.date?.trim();
    
    if (date && !dateRegex.test(date)) {
      throw new Error(`Ligne ${lineNumber} (colonne "date") - Fichier 3 - Format de date invalide pour le client "${email}" : ${date}. Le format attendu est DD/MM/YYYY`);
    }
    
    if (adresse) addresses.add(adresse);
    
    if (email && !customers.has(email)) {
      customers.set(email, {
        nom: nom,
        email: email,
        mot_de_passe: pwd,
        adresse: adresse
      });
    }
    
    const cartItems = parseCartString(achat);
    
    for (const item of cartItems) {
      if (item.quantity < 0) {
        throw new Error(`Ligne ${lineNumber} (colonne "achat") - Fichier 3 - Quantité négative dans le panier du client "${email}" pour la référence "${item.reference}"`);
      }
    }
    
    const cartData = {
      client_nom: nom,
      client_email: email,
      date: date,
      panier: cartItems.map(item => ({
        product_reference: item.reference,
        attribute_name: item.attribute,
        quantity: item.quantity
      }))
    };
    
    carts.push(cartData);
    
    if (etat && etat !== "") {
      orders.push({
        client_nom: nom,
        client_email: email,
        date: date,
        etat: etat,
        panier: cartItems.map(item => ({
          product_reference: item.reference,
          attribute_name: item.attribute,
          quantity: item.quantity
        }))
      });
    }
  }
  
  return {
    success: true,
    addresses: Array.from(addresses),
    customers: Array.from(customers.values()),
    carts: carts,
    orders: orders,
    total_customers: customers.size,
    total_carts: carts.length,
    total_orders: orders.length
  };
};

// ==================== FICHIER ZIP : IMAGES ====================
// Cette fonction est à utiliser côté serveur ou avec JSZip dans le navigateur
export const parseZipImages = async (zipFile) => {
  // Note: Cette fonction nécessite l'installation de JSZip
  // npm install jszip
  const JSZip = (await import("jszip")).default;
  
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);
    
    const images = {};
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    
    for (const [filename, file] of Object.entries(contents.files)) {
      if (file.dir) continue;
      
      const extension = filename.substring(filename.lastIndexOf(".")).toLowerCase();
      if (allowedExtensions.includes(extension)) {
        // Extraire le nom du produit à partir du nom du fichier (sans extension)
        const productRef = filename.substring(0, filename.lastIndexOf("."));
        
        // Obtenir l'image en base64 pour l'affichage
        const base64 = await file.async("base64");
        const mimeType = extension === ".png" ? "image/png" : 
                        extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" :
                        extension === ".gif" ? "image/gif" : "image/webp";
        
        if (!images[productRef]) {
          images[productRef] = [];
        }
        
        images[productRef].push({
          filename: filename,
          mime_type: mimeType,
          data_base64: `data:${mimeType};base64,${base64}`,
          size: file._data?.uncompressedSize || 0
        });
      }
    }
    
    return {
      success: true,
      images: images,
      total_images: Object.keys(images).length,
      product_with_images: Object.keys(images)
    };
  } catch (error) {
    console.error("Erreur lors du dézipage:", error);
    return {
      success: false,
      error: error.message,
      images: {},
      total_images: 0,
      product_with_images: []
    };
  }
};

// ==================== FONCTION PRINCIPALE POUR TRAITER TOUS LES FICHIERS ====================
export const processAllFiles = async (file1, file2, file3, zipFile) => {
  const results = {
    file1: null,
    file2: null,
    file3: null,
    zip: null,
    global_success: false
  };
  
  try {
    // Lire le fichier 1
    const file1Text = await file1.text();
    results.file1 = parseFile1Products(file1Text);
    
    // Lire le fichier 2
    const file2Text = await file2.text();
    results.file2 = parseFile2Combinations(file2Text);
    
    // Lire le fichier 3
    const file3Text = await file3.text();
    results.file3 = parseFile3Customers(file3Text);
    
    // Traiter le ZIP
    results.zip = await parseZipImages(zipFile);
    
    results.global_success = results.file1.success && 
                            results.file2.success && 
                            results.file3.success && 
                            results.zip.success;
                            
  } catch (error) {
    console.error("Erreur lors du traitement:", error);
    results.global_error = error.message;
  }
  
  return results;
};

export { parseCSVGeneric };