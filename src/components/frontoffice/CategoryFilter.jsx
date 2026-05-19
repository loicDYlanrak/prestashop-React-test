/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useFetchAllCategories } from "../../hooks/useFetchPrestashop";
import "./CategoryFilter.css";

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  products,
}) {
  const { data } = useFetchAllCategories("categories");
  const [categoriesData, setCategoriesData] = useState([]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const transformed = data
      .map((item) => {
        const cat = item.category;
        const rawId = cat?.id?.["#cdata"];
        if (rawId === "1" || rawId === "2") return null;
        const name = cat?.name?.language?.["#cdata"] || "";

        return {
          id: parseInt(rawId, 10),
          name: name,
        };
      })
      .filter(Boolean);
      // console.log("Transformed categories:", transformed);
    setCategoriesData(transformed);
  }, [data]);

  const getCategoryCount = (categoryId) => {
    // console.log(`Products :`, products);
    return products.filter(
      (p) => p.categoryId && p.categoryId.includes(categoryId),
    ).length;
  };

  return (
    <div className="category-filter">
      <div className="filter-container">
        <button
          className={`filter-chip ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => onCategoryChange("all")}
        >
          Tous les produits
          <span className="count">{products.length}</span>
        </button>

        {categoriesData.map((category) => (
          <button
            key={category.id}
            className={`filter-chip ${selectedCategory === category.id ? "active" : ""}`}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
            <span className="count">{getCategoryCount(category.id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
