import { useFetchAllCustomers } from "../hooks/useFetchPrestashop.js";

export function ListProduct() {

    // const { loading, data, errors } = useFetchAllOrders('orders');
    // const { loading, data, errors } = useFetchAllCarriers('carriers');
    const { loading, data, errors } = useFetchAllCustomers('customers');
    // const { loading, data, errors } = useFetchAllProduits('products');
    // const { loading, data, errors } = useFetchAllCategories('categories');
    return (
        <div>
            {loading && <div>Chargement...</div>}
            {errors && <div>Erreur: {errors.toString()}</div>}
            
            {data && (
                <ul>
                    {/* {console.log("Données finales :", data)} */}
                    {/* {console.log("data :", data.categories.category[0]['@_href'].replace("http://localhost/prestashop/api/", ""))} */}
                    {/* <p>Données reçues ({parsedData.products.product.length} categories)</p> */}
                    
                    {/* {parsedData.products.product.map((item, index) => (
                        <li key={index}>ID Produit : {item.id || index}</li>
                    ))} */}
                </ul>
            )}
        </div>
    );
}