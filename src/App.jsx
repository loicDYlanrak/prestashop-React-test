/* eslint-disable react/prop-types */
// import { RouterProvider } from 'react-router-dom';
// import router from './routes/route';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import FrontLayout from "./components/frontoffice/FrontLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Import from "./pages/Import";
import Export from "./pages/Export";
import Orders from "./pages/Orders";
import Stock from "./pages/Stock";
import { AddCategorie } from "./components/AddCategorie";
import { ErrorBoundary } from "react-error-boundary";
import DeleteEntity from "./pages/DeleteEntity";
import { DeleteCategorie } from "./components/DeleteCategorie";
import ResetData from "./pages/ResetData";
import ImportData from "./pages/ImportData";
import ProductsList from "./pages/frontoffice/ProductsList";
import ProductDetail from "./pages/frontoffice/ProductDetail";
import { CartProvider } from "./context/CartContext";
import UserSelectionPage from "./pages/frontoffice/UserSelectionPage";
import CartPage from "./pages/frontoffice/CartPage";
import { ListProduct } from "./components/ListProduct";
import OrderSummary from "./pages/frontoffice/OrderSummary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ color: "red", padding: "20px" }}>
      <h2>Quelque chose s&apos;est mal passé :</h2>

      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Réessayer</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
      {/* <RouterProvider router={router} /> */}
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/list-products" element={<ListProduct />} />
              <Route path="/select-user" element={<UserSelectionPage />} />
              <Route path="/" element={<FrontLayout />}>
                <Route index element={<Navigate to="/select-user" replace />} />
                <Route path="/orders" element={<OrderSummary />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="products" element={<ProductsList />} />
                <Route path="product/:id" element={<ProductDetail />} />
              </Route>
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/register" element={<Register />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route path="reset-data" element={<ResetData />} />
                <Route path="import-data" element={<ImportData />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
                <Route path="customers" element={<Customers />} />
                <Route path="import" element={<Import />} />
                <Route path="export" element={<Export />} />
                <Route path="orders" element={<Orders />} />
                <Route path="stock" element={<Stock />} />
                <Route path="addCategorie" element={<AddCategorie />} />
                <Route path="deleteCategorie" element={<DeleteCategorie />} />
                <Route path="deleteEntity" element={<DeleteEntity />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
