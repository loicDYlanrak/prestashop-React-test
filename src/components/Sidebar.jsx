import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";

const menuItems = [
  {
    section: "BIENVENUE",
    items: [{ label: "Accueil", path: "/admin/dashboard"}],
  },
  {
    section: "VENDRE",
    items: [
      { label: "Tableau de bord", path: "/admin/orders-dashboard" },
      { label: "Statistiques de vente", path: "/admin/stat-vente" },
      { label: "Reinitialiser", path: "/admin/reset-data" },
      { label: "Importer Fichier", path: "/admin/import-data" },
      { label: "Commandes", path: "/admin/orders" },
      { label: "Ajouter Stock", path: "/admin/stock" },
      // {
      //   label: "Catalogue",
      //   children: [
      //     { label: "Produits", path: "/admin/products" },
      //     { label: "Catégories", path: "/admin/categories" },
      //     { label: "Attributs & caractéristiques", path: "/admin/attributes" },
      //     { label: "Marques et fournisseurs", path: "/admin/brands" },
      //     { label: "Stock", path: "/admin/stock" },
      //   ],
      // },
      // { label: "Clients", path: "/admin/customers", icon: "👥" },
      // { label: "Import", path: "/admin/import" },
      // { label: "Export", path: "/admin/export" },
    ],
  },
  {
    section: "PERSONNALISER",
    items: [],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">
          {!collapsed && (
            <>
              <strong></strong>
              <span className="sidebar-version"> </span>
            </>
          )}
        </span>
      </div>
      <div className="collaspsee-side-bouton">
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "›" : "‹‹"}
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((group) => (
          <div key={group.section} className="sidebar-group">
            {!collapsed && (
              <div className="sidebar-section-title">{group.section}</div>
            )}
            {group.items.map((item) => {
              if (item.children) {
                const isActive = item.children.some((c) =>
                  location.pathname.startsWith(c.path),
                );
                return (
                  <div key={item.label}>
                    <button
                      className={`sidebar-item sidebar-item--parent ${isActive ? "active" : ""} ${catalogOpen ? "open" : ""}`}
                      onClick={() => setCatalogOpen(!catalogOpen)}
                    >
                      <span className="sidebar-item-icon">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="sidebar-item-label">
                            {item.label}
                          </span>
                          <span className="sidebar-item-arrow">
                            {catalogOpen ? "▲" : "▼"}
                          </span>
                        </>
                      )}
                    </button>
                    {catalogOpen && !collapsed && (
                      <div className="sidebar-submenu">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `sidebar-subitem ${isActive ? "active" : ""}`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? "active" : ""}`
                  }
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  {!collapsed && (
                    <span className="sidebar-item-label">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
