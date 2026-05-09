import { NavLink, Outlet } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <NavLink to="/products">Product</NavLink>
      </div>
      <h1> Accueil</h1>
      <p>Bienvenue sur mon application React avec Vite !</p>
      <Outlet/>
    </div>
  );
}