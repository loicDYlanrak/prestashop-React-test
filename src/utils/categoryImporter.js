export const importCategories = async (
  csvData,
  addCategoryFunction,
  shopId = 1,
) => {
  const results = {
    success: [],
    errors: [],
    idMapping: new Map(),
    nameMapping: new Map(),
  };

  const sortedData = [...csvData];

  const mainCategory = sortedData.find((cat) => cat.id === 2);
  if (mainCategory) {
    try {
      console.log(
        `Traitement de la catégorie principale: ${mainCategory.name}`,
      );
      const categoryData = {
        id_parent: 2,
        active: mainCategory.active,
        id_shop_default: mainCategory.id_shop_default,
        id_root_category: mainCategory.id_root_category,
        name: mainCategory.name,
        link_rewrite:
          mainCategory.link_rewrite ||
          mainCategory.name.toLowerCase().replace(/\s+/g, "-"),
        description: mainCategory.description || "",
      };

      const result = await addCategoryFunction(categoryData, shopId);
      console.log(`resultat add ${categoryData.name}: `, result);

      results.idMapping.set(mainCategory.id, result.category.id["#cdata"]);
      results.nameMapping.set(mainCategory.name, result.category.id["#cdata"]);
      results.success.push({
        originalId: mainCategory.id,
        newId: result.id,
        name: mainCategory.name,
      });
    } catch (err) {
      results.errors.push({
        line: mainCategory.id,
        error: err.message,
        data: mainCategory,
      });
      throw new Error(`Erreur sur catégorie principale: ${err.message}`);
    }
  }
  //   console.log("sortedData : ", sortedData);

  for (const category of sortedData) {
    if (category.id === 2) continue;

    try {
      let parentId = category.id_parent;
      //   console.log("Traitement de category", category.name);

      //   console.log(" parent id ", category.id_parent);
      //   console.log("results", results);

      if (!parentId || parentId === 0 || parentId === null) {
        if (category.name_parent && category.name_parent !== "") {
          // console.log("parentId null , mais name_parent =", category.name_parent);

          if (results.nameMapping.has(category.name_parent)) {
            // console.log("recherche de id parent pour name parent: ",results.nameMapping.has(category.name_parent));
            // console.log("parent id trouver: ", results.nameMapping.get(category.name_parent))
            parentId = results.nameMapping.get(category.name_parent);
          } else {
            throw new Error(
              `Parent non trouvé pour "${category.name}" - name_parent: "${category.name_parent}"`,
            );
          }
        } else {
          parentId = 2;
        }
      } else {
        if (parentId === 2) {
          parentId = 2;
        } else if (results.idMapping.has(parentId)) {
          parentId = results.idMapping.get(parentId);
        } else {
          throw new Error(
            `ID parent ${parentId} non trouvé pour la catégorie "${category.name}"`,
          );
        }
      }

      console.log(
        `Création de la catégorie: ${category.name} (parent_id: ${parentId})`,
      );

      const categoryData = {
        id_parent: parentId,
        active: category.active,
        id_shop_default: category.id_shop_default,
        id_root_category: category.id_root_category || 0,
        name: category.name,
        link_rewrite:
          category.link_rewrite ||
          category.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, ""),
        description: category.description || "",
      };

      const result = await addCategoryFunction(categoryData, shopId);
      console.log(`resultat add ${categoryData.name}: `, result);

      if (category.id) {
        results.idMapping.set(category.id, result.id);
      }
      results.nameMapping.set(category.name, result.id);
      results.success.push({
        originalId: category.id,
        newId: result.id,
        name: category.name,
      });
    } catch (err) {
      results.errors.push({
        name: category.name,
        originalId: category.id,
        nameParent: category.name_parent,
        error: err.message,
      });
      throw new Error(`Erreur ligne "${category.name}": ${err.message}`);
    }
  }

  return results;
};
