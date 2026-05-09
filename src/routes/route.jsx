import { createBrowserRouter } from 'react-router-dom';
import {ListProduct} from '../components/ListProduct';
import {AddProduct} from '../components/AddProduct';
import Home from '../pages/Home';
import { SearchProduct } from '../components/SearchProduct';
import { DeleteCategorie } from '../components/DeleteCategorie';
import { AddCustomer } from '../components/AddCustomer';
import { DeleteCustomer } from '../components/DeleteCustomer';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />, 
    children: [
      {
        path: "",
        element: <h1>Page d&apos;accueil</h1>,
      },
      {
        path: "products",
        element: <ListProduct />,
      },
      {
        path: "addproducts",
        element: <AddProduct />,
      },
      {
        path: "addcustomers",
        element: <AddCustomer />
      },
      {
        path: "searchproducts",
        element: <SearchProduct />,
      },
      {
        path: "deleteproducts",
        element: <DeleteCategorie />
      },
      {
        path: "deletecustomers",
        element: <DeleteCustomer />
      },
    ],
  },
]);

export default router;
