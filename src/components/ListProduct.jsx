import { useEffect } from "react";
import {
  // useFetchAllProduits,
  fetchPrestashop,
  getTaxeValue,
} from "../hooks/useFetchPrestashop.js";

export function ListProduct() {
  // const { loading, data, errors } = useFetchAllOrders('orders');
  // const { loading, data, errors } = useFetchAllCarriers('carriers');
  // const { loading, data, errors } = useFetchAllCustomers('customers');
  // const { loading, data, errors } = useFetchAllProduits("products");
  // const { loading, data, errors } = useFetchAllCategories('categories');

  useEffect(() => {
    const fetchData = async () => {
      const id_customer = 105;
      const responseCarts = await fetchPrestashop("carts", {
        urlRest: `filter[id_customer]=[${id_customer}]`,
      });
      const cartsData = responseCarts.data?.carts?.cart;
      const cartsArray = Array.isArray(cartsData)
        ? cartsData
        : cartsData
          ? [cartsData]
          : [];
      const idsCarts = cartsArray.map((cart) => cart.id?.["#cdata"] || cart["@_id"]);

      const idsCartWihtoutOrder = [];
      for (const idCart of idsCarts) {
        const responseOrders = await fetchPrestashop("orders", {
          urlRest: `filter[id_cart]=[${idCart}]`,
        });
        const ordersData = responseOrders.data?.orders?.order;
        const ordersArray = Array.isArray(ordersData)
          ? ordersData
          : ordersData
            ? [ordersData]
            : [];
        if (ordersArray.length === 0) {
          idsCartWihtoutOrder.push(idCart);
        }
      }

      // const lastCartIdWithoutOrder = idsCartWihtoutOrder[idsCartWihtoutOrder.length - 1];
      const lastCartDetailsResponse = await fetchPrestashop(`tax_rules/1`);
      const lastCartDetails = lastCartDetailsResponse.data;

      console.log("Détails du dernier panier sans commande:", lastCartDetails);

      // const taxesProducts = await getTaxeValue("1727")
      // console.log(taxesProducts)

      // const id_order = 87; // par exemple 
      // const responseStockMouvements = await fetchPrestashop("stock_movements", {
      //   urlRest: `filter[id_order]=[${id_order}]`,
      // });
      // const stockMvtData = responseStockMouvements.data?.stock_mvts?.stock_mvt;
      // const stockMvtArray = Array.isArray(stockMvtData)
      //   ? stockMvtData
      //   : stockMvtData
      //     ? [stockMvtData]
      //     : [];

      // const idsStockMouvements = stockMvtArray.map(
      //   (mvt) => mvt.id?.["#cdata"] || mvt["@_id"], 
      // );
      // console.log("IDs des mouvements de stock:", idsStockMouvements);
      
      
      // const mouvementstockId = responseStockMouvements.data?.stock_mvt.id?.["#cdata"];
      // console.log("Movement stock ID:", mouvementstockId);

      //console.log("Données reçues dans useEffect :", data);
      // const productID = data?.[0]?.product.id?.["#cdata"];
      // if (data && productID) {
      // console.log("Données reçues :", data);
      // const response = await fetchPrestashop(`products/${productID}`);
      // console.log("Response from fetchPrestashop:", response);
      // const specificData = await fetchPrestashop("specific_prices");
      // console.log("Specific prices response:", specificData);

      // const specificPricesDetails = await Promise.all(
      //   specificData.data?.specific_prices?.specific_price?.map(
      //     async (specificPrice) => {
      //       const specificPriceId = specificPrice?.["@_id"];
      //       const specificPriceResponse = await fetchPrestashop(
      //         `specific_prices/${specificPriceId}`,
      //       );
      //       return specificPriceResponse.data;
      //     },
      //   ),
      // );
      // console.log("Specific prices details:", specificPricesDetails);

      // const specificPricesWithDetails =
      //   specificData.data?.specific_prices?.specific_price?.map(
      //     (specificPrice) => {
      //       const specificPriceDetail = specificPricesDetails.find(
      //         (detail) =>
      //           detail.specific_price?.id?.["#cdata"] ==
      //           specificPrice?.["@_id"],
      //       );
      //       return {
      //         id_product:
      //           specificPriceDetail?.specific_price?.id_product?.["#cdata"],
      //         price: specificPriceDetail?.specific_price?.price?.["#cdata"],
      //         reduction:
      //           specificPriceDetail?.specific_price?.reduction?.["#cdata"],
      //         reduction_type:
      //           specificPriceDetail?.specific_price?.reduction_type?.[
      //             "#cdata"
      //           ],
      //       };
      //     },
      //   );
      // console.log("Specific prices with details:", specificPricesWithDetails);

      // const combinationsData =
      //   response.data?.product?.associations?.combinations?.combination;
      // console.log("Combinations data:", combinationsData);
      // const combinationsId = combinationsData?.map(
      //   (combo) => combo.id?.["#cdata"],
      // );
      // console.log("Combinations IDs:", combinationsId);

      // const combinationsDetails = await Promise.all(
      //   combinationsId?.map(async (id) => {
      //     const comboResponse = await fetchPrestashop(`combinations/${id}`);
      //     return comboResponse.data;
      //   }),
      // );
      // console.log("Combinations details:", combinationsDetails);

      // const combinationsWithDetails = combinationsData?.map((combo) => {
      //   const comboDetail = combinationsDetails.find(
      //     (detail) =>
      //       detail.combination.id?.["#cdata"] === combo.id?.["#cdata"],
      //   );
      //   console.log(
      //     `Combo detail for combination ID ${combo.id?.["#cdata"]}:`,
      //     comboDetail,
      //   );
      // let optionValueIds = [];
      // const productOptionValues =
      //   comboDetail?.combination?.associations?.product_option_values
      //     ?.product_option_value;
      // if (productOptionValues) {
      //   if (Array.isArray(productOptionValues)) {
      //     optionValueIds = productOptionValues
      //       .map((value) => value?.id?.["#cdata"])
      //       .filter(Boolean);
      //   } else {
      //     optionValueIds = [productOptionValues?.id?.["#cdata"]].filter(
      //       Boolean,
      //     );
      //   }
      // }
      // const productId = comboDetail?.combination?.id_product?.["#cdata"];
      // const price = comboDetail?.combination?.price?.["#cdata"];
      //   console.log(
      //     `Option values for combination ID ${combo.id?.["#cdata"]}:`,
      //     optionValueIds,
      //   );
      //   return {
      //     id: combo.id?.["#cdata"],
      //     id_product: productId,
      //     price: price,
      //     optionValueIds: optionValueIds,
      //   };
      // });
      // console.log("Combinations with details:", combinationsWithDetails);
      // const allOptionValueIds = combinationsWithDetails.flatMap(
      //   (combo) => combo.optionValueIds || [],
      // );
      // const uniqueOptionValueIds = [...new Set(allOptionValueIds)];
      // console.log("Option value IDs (uniques):", uniqueOptionValueIds);

      // const optionValuesDetails = await Promise.all(
      //   uniqueOptionValueIds.map(async (id) => {
      //     const optionValueResponse = await fetchPrestashop(
      //       `product_option_values/${id}`,
      //     );
      //     return optionValueResponse.data;
      //   }),
      // );
      // console.log("Option values details:", optionValuesDetails);
      // const optionsProductValues = optionValuesDetails.map((optionValue) => {
      //   optionValue.product_option_value.id_attribute_group?.["#cdata"];
      //   return {
      //     id: optionValue.product_option_value.id?.["#cdata"],
      //     name: optionValue.product_option_value.name?.language?.["#cdata"],
      //     groupId:
      //       optionValue.product_option_value.id_attribute_group?.["#cdata"],
      //   };
      // });
      // console.log("Product IDs option values:", optionsProductValues);
      // const optionsProductsDetails = await Promise.all(
      //   optionsProductValues.map(async (optionValue) => {
      //     const optionResponse = await fetchPrestashop(
      //       `product_options/${optionValue.groupId}`,
      //     );
      //     return optionResponse.data;
      //   }),
      // );
      // console.log("Products details from option values:", optionsProductsDetails);
      // const optionsDetails = optionsProductsDetails.map((product) => {
      //   const option = product.product_option;
      //   return {
      //     id: option.id?.["#cdata"],
      //     name: option.name?.language?.["#cdata"],
      //   };
      // });
      // console.log("Options details:", optionsDetails);

      // const optionsWithValues = optionsProductValues.map((optionValue) => {
      //   const optionDetail = optionsDetails.find(
      //     (option) => option.id === optionValue.groupId,
      //   );
      //   return {
      //     ...optionValue,
      //     groupName: optionDetail ? optionDetail.name : "Unknown Group",
      //   };
      // });
      // console.log("Options with group names:", optionsWithValues);

      // const stocksData =
      //   response.data?.product?.associations?.stock_availables
      //     ?.stock_available;
      // console.log("Stocks data:", stocksData);
      // const stocks = stocksData?.map((stock) => ({
      //   id: stock.id?.["#cdata"],
      //   attributeId: stock.id_product_attribute?.["#cdata"],
      //   quantity: stock.quantity?.["#cdata"],
      // }));
      // console.log("Stocks:", stocks);
      // const stocksDetails = await Promise.all(
      //   stocks.map(async (stock) => {
      //     const stockResponse = await fetchPrestashop(
      //       `stock_availables/${stock.id}`,
      //     );
      //     return stockResponse.data;
      //   }),
      // );
      // console.log("Stocks details:", stocksDetails);
      // stocks.map((stock) => {
      //   const stockDetail = stocksDetails.find(
      //     (detail) => detail.stock_available.id?.["#cdata"] === stock.id,
      //   );
      //   stock.quantity =
      //     stockDetail?.stock_available?.quantity?.["#cdata"] ||
      //     stock.quantity;
      // });
      // console.log("Stocks with details:", stocks);

      // const StocksCombinations = combinationsWithDetails.map((combo) => {
      //   const stock = stocks.find((s) => s.attributeId === combo.id);
      //   return {
      //     ...combo,
      //     quantity: stock ? stock.quantity : null,
      //   };
      // });
      // console.log("Stocks with combinations:", StocksCombinations);

      // const stocksOptions = StocksCombinations.flatMap((combo) => {
      //   return (combo.optionValueIds || []).map((optionValueId) => {
      //     const optionValue = optionsWithValues.find(
      //       (option) => option.id === optionValueId,
      //     );
      //     return {
      //       ...combo,
      //       optionValueId: optionValueId,
      //       optionName: optionValue ? optionValue.name : "Unknown Option",
      //       groupName: optionValue ? optionValue.groupName : "Unknown Group",
      //     };
      //   });
      // });
      // console.log("Stocks with combinations and options:", stocksOptions);
    };
    fetchData();
  }, []);
  return (
    <div>
      {/* {loading && <div>Chargement...</div>} */}
      {/* {errors && <div>Erreur: {errors.toString()}</div>} */}

      {/* {data && ( */}
        {/* <ul> */}
          {/* {console.log("Donnéesfialeeeeees :", data)} */}
          {/* {console.log("data :", data.categories.category[0]['@_href'].replace("http://localhost/prestashop2/api/", ""))} */}
          {/* <p>Données reçues ({parsedData.products.product.length} categories)</p> */}

          {/* {parsedData.products.product.map((item, index) => (
                        <li key={index}>ID Produit : {item.id || index}</li>
                    ))} */}
        {/* </ul */}
      {/* )} */}
    </div>
  );
}
