import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useFetchAllProduits,
  fetchPrestashop,
} from "../../hooks/useFetchPrestashop";
import ProductCard from "../../components/frontoffice/ProductCard";
import CategoryFilter from "../../components/frontoffice/CategoryFilter";
import "./ProductsList.css";

export default function ProductsList() {
  const itemsPerPage = 16;
  const { loading, data, errors } = useFetchAllProduits("products", {
    urlRest: `limit=0,1000`,
  });
  const [currentFilteredPage, setCurrentFilteredPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [processing, setProcessing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);

  useEffect(() => {
    // console.log("Products updated:", products);
    if (products.length > 0) {
      const prices = products.map((p) => p.price);
      // console.log("prices:", prices);

      setMinPrice(Math.trunc(Math.min(...prices) - 2));
      setMaxPrice(Math.trunc(Math.max(...prices) + 2));
      setPriceRange({
        min: Math.trunc(Math.min(...prices) - 2),
        max: Math.trunc(Math.max(...prices) + 2),
      });
    }
  }, [products]);

  const getTaxRate = useCallback(async (idTaxeRuleGroupe) => {
    if (!idTaxeRuleGroupe) return 1;

    try {
      const taxeRule = `&filter[id_tax_rules_group]=${idTaxeRuleGroupe}&filter[id_country]=8`;
      const response = await fetchPrestashop("tax_rules", {
        urlRest: taxeRule,
      });

      // const customers = await fetchPrestashop("customers");
      // console.log("customers: ", customers);

      // const customer = await fetchPrestashop(`customers/${customers.data.customers.customer[0]?.["@_id"]}`);
      // console.log("customer: ", customer);
      if (response?.data?.tax_rules?.tax_rule?.["@_id"]) {
        const idTaxeRule = response.data.tax_rules.tax_rule["@_id"];
        const response2 = await fetchPrestashop(`tax_rules/${idTaxeRule}`);

        if (response2?.data?.tax_rule?.id_tax?.["#cdata"]) {
          const idTaxe = response2.data.tax_rule.id_tax["#cdata"];
          const response3 = await fetchPrestashop(`taxes/${idTaxe}`);

          if (response3?.data?.tax?.rate?.["#cdata"]) {
            return parseFloat(response3.data.tax.rate["#cdata"]);
          }
        }
      }
      return 1;
    } catch (error) {
      console.error("Error fetching tax rate:", error);
      return 1;
    }
  }, []);

  // Fonction pour récupérer la quantité d'un produit
  const getProductQuantity = useCallback(async (stockUrl) => {
    if (!stockUrl) return 0;

    try {
      const relativeUrl = stockUrl.replace(
        "http://localhost/prestashop2/api/",
        "",
      );
      const response = await fetchPrestashop(relativeUrl);

      if (response.success && response.data?.stock_available) {
        if (response.data.stock_available.quantity) {
          return parseInt(
            response.data.stock_available.quantity["#cdata"] || 0,
          );
        } else if (response.data.stock_available["#cdata"]) {
          return parseInt(response.data.stock_available["#cdata"] || 0);
        }
      }
      return 0;
    } catch (error) {
      console.error("Error fetching quantity:", error);
      return 0;
    }
  }, []);

  const getProductBadge = (availableDate) => {
    if (!availableDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const productDate = new Date(availableDate);
    productDate.setHours(0, 0, 0, 0);

    const diffTime = productDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // console.log(`Date produit: ${availableDate}, Aujourd'hui: ${today.toISOString().split("T")[0]}, Différence: ${diffDays} jours`,);

    if (diffDays === 0) {
      // console.log(`Produit HOT - sorti aujourd'hui`);
      return "HOT";
    } else if (diffDays >= -7 && diffDays < 0) {
      // console.log(`Produit NEW - sorti il y a ${Math.abs(diffDays)} jours`);
      return "NEW";
    } else if (diffDays < -7) {
      // console.log(`Produit ancien - sorti il y a ${Math.abs(diffDays)} jours`);
      return null;
    }

    return null;
  };

  const transformProduct = useCallback(
    async (item) => {
      const productData = item.product;
      // console.log("Transforming product:", productData);
      const name = productData.name?.language?.["#cdata"] || "";

      let description = "";
      if (productData.description_short?.language) {
        description = (productData.description_short.language["#cdata"] || "")
          .replace(/<[^>]*>/g, "")
          .substring(0, 100);
      }

      // Récupération parallèle des données additionnelles
      const idTaxeRuleGroupe = productData?.id_tax_rules_group?.["#cdata"];
      const stockUrl =
        productData?.associations?.stock_availables?.stock_available?.[0]?.[
          "@_href"
        ];

      const availableDate = productData?.available_date?.["#cdata"] || null;

      const [taxRate, quantity] = await Promise.all([
        getTaxRate(idTaxeRuleGroupe),
        getProductQuantity(stockUrl),
      ]);

      // Calcul du prix
      const price = parseFloat(productData.price?.["#cdata"] || 0);
      const priceTTC = price * (1 + taxRate / 100);
      const specificPrice = parseFloat(
        productData.specific_price?.["#cdata"] || 0,
      );

      // Extraction des catégories
      let categoryIds = [];
      const categoriesData = productData.associations?.categories?.category;
      if (categoriesData) {
        if (Array.isArray(categoriesData)) {
          categoryIds = categoriesData
            .map((cat) => parseInt(cat.id?.["#cdata"]))
            .filter(Boolean);
        } else if (categoriesData?.id) {
          categoryIds = [parseInt(categoriesData.id["#cdata"])].filter(Boolean);
        }
      }

      // Construction de l'URL de l'image
      let imageUrl = "https://placehold.co/400?text=Product";
      const imagesData = productData.associations?.images?.image;
      if (imagesData) {
        const imageId = Array.isArray(imagesData)
          ? imagesData[0]?.id?.["#cdata"]
          : imagesData?.id?.["#cdata"];
        if (imageId && productData.id?.["#cdata"]) {
          imageUrl = `http://localhost/prestashop2/api/images/products/${productData.id["#cdata"]}/${imageId}?ws_key=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL`;
        }
      }

      return {
        id: parseInt(productData.id?.["#cdata"]),
        name: name,
        description: description,
        price: priceTTC,
        specificPrice: specificPrice,
        categoryId: categoryIds || [],
        availableDate: availableDate,
        badge: getProductBadge(availableDate),
        imageUrl: imageUrl,
        reference: productData.reference?.["#cdata"] || "",
        quantity: quantity || 1,
        active: productData.active?.["#cdata"] === "1",
      };
    },
    [getTaxRate, getProductQuantity],
  );

  useEffect(() => {
    const processProducts = async () => {
      if (!data || data.length === 0 || processing) return;

      setProcessing(true);

      try {
        const batchSize = 5;
        const allTransformedProducts = [];

        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map((item) => transformProduct(item)),
          );
          allTransformedProducts.push(...batchResults);

          const activeBatchProducts = allTransformedProducts.filter(
            (p) => p.active,
          );
          setProducts(activeBatchProducts);
          const uniqueCategories = [
            ...new Set(
              activeBatchProducts
                .flatMap((p) => p.categoryId || [])
                .filter(Boolean),
            ),
          ];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Error processing products:", error);
      } finally {
        setProcessing(false);
      }
    };

    processProducts();
  }, [data, transformProduct]);

  const memoizedFilteredProducts = useMemo(() => {
    let filtered = products;

    // Filtre par catégorie
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (p) => p.categoryId && p.categoryId.includes(selectedCategory),
      );
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
    }

    // Filtre par prix
    filtered = filtered.filter(
      (p) =>
        p.price >= (priceRange.min || minPrice) &&
        p.price <= (priceRange.max || maxPrice),
    );

    // Appliquer la pagination sur les résultats filtrés
    const startIndex = (currentFilteredPage - 1) * itemsPerPage;
    const paginatedFiltered = filtered.slice(
      startIndex,
      startIndex + itemsPerPage,
    );

    return {
      totalFiltered: filtered.length,
      paginatedProducts: paginatedFiltered,
    };
  }, [
    selectedCategory,
    products,
    searchTerm,
    priceRange,
    minPrice,
    maxPrice,
    currentFilteredPage,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange({ min: minPrice, max: maxPrice });
  };

  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);

  useEffect(() => {
    setDisplayedProducts(memoizedFilteredProducts.paginatedProducts);
    setTotalFilteredCount(memoizedFilteredProducts.totalFiltered);
  }, [memoizedFilteredProducts]);

  useEffect(() => {
  setCurrentFilteredPage(1);
}, [selectedCategory, searchTerm, priceRange]);

  // États de chargement améliorés
  if (loading || processing) {
    return (
      <div className="products-loading">
        <div className="spinner"></div>
        <p>
          {processing
            ? "Traitement des produits..."
            : "Chargement des produits..."}
        </p>
        {processing && products.length > 0 && (
          <div className="loading-progress">
            <p>{products.length} produits chargés</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(products.length / (data?.length || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (errors) {
    return (
      <div className="products-error">
        <p>Erreur : {errors.message || "Erreur de chargement"}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Nos Produits</h1>
        <p>Découvrez notre collection exceptionnelle</p>
      </div>

      {/* Nouveau bloc de filtres */}
      <div className="filters-section">
        {/* Recherche par nom */}
        <div className="search-filter">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filtre par prix */}
        <div className="price-filter">
          <label>Prix :</label>
          <div className="price-inputs">
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) =>
                setPriceRange({ ...priceRange, min: Number(e.target.value) })
              }
              className="price-input"
              min={minPrice}
              max={maxPrice}
            />
            <span> - </span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange({ ...priceRange, max: Number(e.target.value) })
              }
              className="price-input"
              min={minPrice}
              max={maxPrice}
            />
            <span> €</span>
          </div>
        </div>

        {/* Bouton reset */}
        <button onClick={resetFilters} className="reset-filters-btn">
          Réinitialiser
        </button>
      </div>

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        products={products}
      />

      <div className="products-grid">
        {displayedProducts.length === 0 ? (
          <div className="no-products">
            <p>Aucun produit trouvé dans cette catégorie</p>
          </div>
        ) : (
          displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
      {/* Ajouter juste avant la fermeture de </div> du products-page */}
      {totalFilteredCount > 0 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentFilteredPage((prev) => prev - 1)}
            disabled={currentFilteredPage === 1}
          >
            Précédent
          </button>

          <div className="page-numbers">
            {[...Array(Math.ceil(totalFilteredCount / itemsPerPage))].map(
              (_, index) => {
                const pageNum = index + 1;
                if (
                  pageNum === 1 ||
                  pageNum === Math.ceil(totalFilteredCount / itemsPerPage) ||
                  (pageNum >= currentFilteredPage - 2 && pageNum <= currentFilteredPage + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentFilteredPage(pageNum)}
                      className={currentFilteredPage === pageNum ? "active" : ""}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === currentFilteredPage - 3 && currentFilteredPage > 4) ||
                  (pageNum === currentFilteredPage + 3 &&
                    currentFilteredPage < Math.ceil(totalFilteredCount / itemsPerPage) - 3)
                ) {
                  return <span key={pageNum}>...</span>;
                }
                return null;
              },
            )}
          </div>

          <button
            onClick={() => setCurrentFilteredPage((prev) => prev + 1)}
            disabled={currentFilteredPage === Math.ceil(totalFilteredCount / itemsPerPage)}
          >
            Suivant
          </button>

          <span className="page-info">
            Page {currentFilteredPage} sur {Math.ceil(totalFilteredCount / itemsPerPage)}
          </span>
        </div>
      )}
    </div>
  );
}
