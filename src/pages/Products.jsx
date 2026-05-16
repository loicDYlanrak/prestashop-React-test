import { useState, useEffect } from 'react'
import './Products.css'
import { useFetchAllProduits } from "../hooks/useFetchPrestashop.js";

export default function Products() {
  const { loading, data, errors } = useFetchAllProduits('products');
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [searchRef, setSearchRef] = useState('')
  const [searchCat, setSearchCat] = useState('')
  const [selected, setSelected] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({ name: '', ref: '', category: '', priceHT: '', qty: '' })
  const [categoryNames, setCategoryNames] = useState({})
  const [uniqueCategoryIds, setUniqueCategoryIds] = useState([])

  useEffect(() => {
    if (data && data.length > 0) {
      const transformedProducts = data.map(item => {
        const productData = item.product;
        
        const extractValue = (obj) => {
          if (!obj) return '';
          if (obj['#cdata']) return obj['#cdata'];
          if (obj.language && obj.language['#cdata']) return obj.language['#cdata'];
          return '';
        };

        let name = '';
        if (productData.name && productData.name.language) {
          name = productData.name.language['#cdata'] || '';
        }

        const reference = extractValue(productData.reference) || '-';

        let defaultCategory = '';
        if (productData.id_category_default) {
          defaultCategory = productData.id_category_default['#cdata'] || '';
        }

        let priceHT = 0;
        if (productData.price) {
          priceHT = parseFloat(productData.price['#cdata']) || 0;
        }

        let quantity = 0;
        if (productData.quantity) {
          quantity = parseInt(productData.quantity['#cdata']) || 0;
        } else if (productData.associations?.stock_availables?.stock_available) {
          const stockAvailable = productData.associations.stock_availables.stock_available;
          if (Array.isArray(stockAvailable) && stockAvailable.length > 0) {
            quantity = parseInt(stockAvailable[0]?.quantity?.['#cdata'] || 0);
          } else if (stockAvailable && stockAvailable.quantity) {
            quantity = parseInt(stockAvailable.quantity['#cdata'] || 0);
          }
        }

        const active = productData.active?.['#cdata'] === '1';
        let image = productData.associations.images.image['@_href']
        if (productData.associations.images.image[0]) {
          image = productData.associations.images.image[0]['@_href']
        }        
        image += "?ws_key=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL"
        
        return {
          id: parseInt(productData.id['#cdata']),
          image: image,
          name: name,
          ref: reference,
          categoryId: defaultCategory,
          priceHT: priceHT,
          priceTTC: priceHT * 1.2,
          qty: quantity,
          active: active,
          description: extractValue(productData.description?.language) || '',
          description_short: extractValue(productData.description_short?.language) || '',
          date_add: productData.date_add?.['#cdata'],
          date_upd: productData.date_upd?.['#cdata']
        };
      });

      setProducts(transformedProducts);

      const ids = [...new Set(transformedProducts.map(p => p.categoryId).filter(id => id && id !== ''))];
      setUniqueCategoryIds(ids);
    }
  }, [data]);

  useEffect(() => {
    uniqueCategoryIds.forEach(categoryId => {
      fetchCategoryName(categoryId);
    });
  }, [uniqueCategoryIds]);

  const fetchCategoryName = async (categoryId) => {
    try {
      const apiKey = "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL";
      const baseUrl = "http://localhost/prestashop2/api";
      const url = `${baseUrl}/categories/${categoryId}?ws_key=${apiKey}&display=[id,name]`;
      
      const response = await fetch(url);
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const nameNode = xmlDoc.querySelector("category name language");
      
      let categoryName = categoryId;
      if (nameNode && nameNode.textContent) {
        categoryName = nameNode.textContent;
      }
      
      setCategoryNames(prev => ({
        ...prev,
        [categoryId]: categoryName
      }));
    } catch (error) {
      console.error(`Erreur chargement catégorie ${categoryId}:`, error);
      setCategoryNames(prev => ({
        ...prev,
        [categoryId]: categoryId
      }));
    }
  };

  const getCategoryName = (categoryId) => {
    return categoryNames[categoryId] || categoryId;
  };

  const getCategoryEmoji = (categoryId) => {
    const emojiMap = {
      '2': '📓',
      '3': '☕',
      '4': '🎨',
      '5': '👕',
    };
    return emojiMap[categoryId] || '📦';
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    p.ref.toLowerCase().includes(searchRef.toLowerCase()) &&
    getCategoryName(p.categoryId).toLowerCase().includes(searchCat.toLowerCase())
  )

  const toggleActive = (id) => {
    setProducts(products.map(p => p.id === id ? { ...p, active: !p.active } : p))
  }

  const toggleSelect = (id) => {
    setSelected(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id])
  }

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([])
    else setSelected(filtered.map(p => p.id))
  }

  const openNew = () => {
    setEditProduct(null)
    setForm({ name: '', ref: '', category: '', priceHT: '', qty: '' })
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditProduct(p)
    setForm({ 
      name: p.name, 
      ref: p.ref, 
      category: p.categoryId, 
      priceHT: p.priceHT, 
      qty: p.qty 
    })
    setShowModal(true)
  }

  const saveProduct = () => {
    if (!form.name) return
    if (editProduct) {
      setProducts(products.map(p => p.id === editProduct.id
        ? { ...p, 
            name: form.name,
            ref: form.ref,
            categoryId: form.category,
            priceHT: parseFloat(form.priceHT), 
            priceTTC: parseFloat(form.priceHT) * 1.2, 
            qty: parseInt(form.qty) 
          }
        : p))
    } else {
      const newId = Math.max(...products.map(p => p.id), 0) + 1
      setProducts([{ 
        id: newId, 
        image: getCategoryEmoji(form.category), 
        name: form.name,
        ref: form.ref,
        categoryId: form.category,
        priceHT: parseFloat(form.priceHT) || 0, 
        priceTTC: (parseFloat(form.priceHT) || 0) * 1.2, 
        qty: parseInt(form.qty) || 0, 
        active: true 
      }, ...products])
    }
    setShowModal(false)
  }

  const deleteProduct = (id) => {
    if (window.confirm('Supprimer ce produit ?')) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (errors) {
    return (
      <div className="products-page">
        <div className="error-container">
          <p>Erreur lors du chargement des produits : {errors.message || 'Erreur inconnue'}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="breadcrumb">Catalogue &gt; <strong>Produits</strong></div>
        <div className="page-header-row">
          <h1 className="page-title">Produits</h1>
          <button className="btn btn-primary" onClick={openNew}>
            <span>＋</span> Nouveau produit
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header-row">
          <span className="panel-title">Produits ({filtered.length})</span>
          <div className="filter-bar">
            <button className="btn btn-outline dropdown-btn">
              Filtrer par catégories <span>▾</span>
            </button>
          </div>
        </div>

        <div className="panel-body">
          <table className="ps-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                <th className="col-id">ID ▼</th>
                <th className="col-img">Image</th>
                <th>Nom</th>
                <th>Référence</th>
                <th>Catégorie</th>
                <th className="col-price">Montant HT</th>
                <th className="col-price">Montant TTC</th>
                <th className="col-qty">Quantité</th>
                <th>État</th>
                <th className="col-actions">Actions</th>
              </tr>
              <tr className="filter-row">
                <td className="col-check"></td>
                <td>
                  <div className="filter-minmax">
                    <input placeholder="Min ID" />
                    <input placeholder="Max ID" />
                  </div>
                </td>
                <td></td>
                <td><input className="filter-input" placeholder="Chercher un nom" value={search} onChange={e => setSearch(e.target.value)} /></td>
                <td><input className="filter-input" placeholder="Chercher une référence" value={searchRef} onChange={e => setSearchRef(e.target.value)} /></td>
                <td><input className="filter-input" placeholder="Chercher une catégorie" value={searchCat} onChange={e => setSearchCat(e.target.value)} /></td>
                <td>
                  <div className="filter-minmax">
                    <input placeholder="Prix min" />
                    <input placeholder="Prix max" />
                  </div>
                </td>
                <td></td>
                <td>
                  <div className="filter-minmax">
                    <input placeholder="Qté min" />
                    <input placeholder="Qté max" />
                  </div>
                </td>
                <td>
                  <select className="filter-select">
                    <option>Tous</option>
                    <option>Actif</option>
                    <option>Inactif</option>
                  </select>
                </td>
                <td>
                  <button className="btn btn-search">🔍 Rechercher</button>
                </td>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className={selected.includes(p.id) ? 'row-selected' : ''}>
                    <td className="col-check">
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td className="col-id">{p.id}</td>
                    <td>
                      <div className="product-thumb"><img src={p.image} alt={p.name} /></div>
                    </td>
                    <td className="product-name">{p.name}</td>
                    <td>{p.ref}</td>
                    <td>{getCategoryName(p.categoryId)}</td>
                    <td className="col-price">{p.priceHT.toFixed(2)} €</td>
                    <td className="col-price">{p.priceTTC.toFixed(2)} €</td>
                    <td className="col-qty">{p.qty}</td>
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={p.active} onChange={() => toggleActive(p.id)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td className="col-actions">
                      <div className="action-btns">
                        <button className="action-btn" title="Modifier" onClick={() => openEdit(p)}>✏️</button>
                        <button className="action-btn action-btn--more" title="Supprimer" onClick={() => deleteProduct(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProduct ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom du produit *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit" />
              </div>
              <div className="form-group">
                <label>Référence</label>
                <input value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} placeholder="Référence unique" />
              </div>
              <div className="form-group">
                <label>Catégorie (ID)</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="ID de la catégorie" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prix HT (€)</label>
                  <input type="number" step="0.01" value={form.priceHT} onChange={e => setForm({ ...form, priceHT: e.target.value })} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} placeholder="0" />
                </div>
              </div>
              {editProduct && (
                <div className="form-group">
                  <label>Prix TTC (calculé automatiquement)</label>
                  <input type="text" value={(parseFloat(form.priceHT) * 1.2).toFixed(2)} disabled style={{ background: '#f3f4f6' }} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveProduct}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}