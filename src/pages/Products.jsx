/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import './Products.css'
import { 
  getAllEntitiesId, 
  getProduct, 
  getCategory,
  getProductStockByAttribute, 
  getTaxeValue
} from "../hooks/useFetchPrestashop.js";
import { addProduct, updateResource, uploadProductImage } from "../hooks/useMutationPrestashop.js";
import { deleteResource } from "../hooks/useDeletePrestashop.js";

export default function Products() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [searchRef, setSearchRef] = useState('')
  const [searchCat, setSearchCat] = useState('')
  const [selected, setSelected] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [currentImageProduct, setCurrentImageProduct] = useState(null)
  const [productImages, setProductImages] = useState([])
  const [form, setForm] = useState({ 
    name: '', 
    ref: '', 
    categoryId: '', 
    priceHT: '', 
    qty: '',
    description: '',
    description_short: '',
    taxRulesGroupId: ''
  })
  const [categoryNames, setCategoryNames] = useState({})
  const [categories, setCategories] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUploadLoading, setImageUploadLoading] = useState(false)

  const loadAllProducts = async () => {
    setLoading(true)
    try {
      const productIds = await getAllEntitiesId("products")
      
      if (!productIds || productIds.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      const productPromises = productIds.map(async (id) => {
        const result = await getProduct(id)
        if (result.success && result.data) {
          let quantity = 0
          let stockAvailableId = null
          const stockArray = Array.isArray(result.stockAvailables) 
              ? result.stockAvailables 
              : [result.stockAvailables]
          if (stockArray && stockArray.length > 0) {
            const mainStock = stockArray.find(s => {
              const attrId = s.id_product_attribute?.["#cdata"] || s.id_product_attribute
              return !attrId || attrId === "0" || attrId === 0
            })
            
            if (mainStock) {
              stockAvailableId = mainStock.id?.["#cdata"] || mainStock.id
              if (stockAvailableId) {
                const stockQty = await getProductStockByAttribute(id, "0")
                quantity = stockQty
              }
            }
          }
          const tax = await getTaxeValue(result.productId)
          
          // S'assurer que images est toujours un tableau
          const images = result.images_urls || []
          
          return {
            id: parseInt(result.productId),
            name: result.data.name,
            ref: result.data.reference || '-',
            categoryId: result.data.id_category_default?.toString() || '',
            priceHT: parseFloat(result.data.price) || 0,
            priceTTC: (parseFloat(result.data.price) || 0) * (1+((parseFloat(tax?.data?.tax_rate))/100)),
            qty: quantity,
            active: result.data.active === 1,
            description: result.data.description || '',
            description_short: result.data.description_short || '',
            stockAvailableId: stockAvailableId,
            taxRulesGroupId: result.data.id_tax_rules_group || '',
            images: images
          }
        }
        return null
      })

      const results = await Promise.all(productPromises)
      const validProducts = results.filter(p => p !== null)
      setProducts(validProducts)

      const uniqueCategoryIds = [...new Set(validProducts.map(p => p.categoryId).filter(id => id && id !== ''))]
      await loadCategories(uniqueCategoryIds)
      
    } catch (err) {
      console.error("Erreur chargement produits:", err)
      setErrorMessage("Erreur lors du chargement des produits")
    } finally {
      setLoading(false)
    }
  }

  const loadAllCategories = async () => {
    try {
      const categoryIds = await getAllEntitiesId("categories")
      if (categoryIds && categoryIds.length > 0) {
        const categoryPromises = categoryIds.map(async (id) => {
          const result = await getCategory(id)
          if (result.success && result.data) {
            return {
              id: parseInt(id),
              name: result.data.name
            }
          }
          return null
        })
        const results = await Promise.all(categoryPromises)
        setCategories(results.filter(c => c !== null))
      }
    } catch (err) {
      console.error("Erreur chargement catégories:", err)
    }
  }

  const loadCategories = async (categoryIds) => {
    const names = {}
    for (const id of categoryIds) {
      try {
        const result = await getCategory(id)
        if (result.success && result.data) {
          names[id] = result.data.name
        } else {
          names[id] = id
        }
      } catch (err) {
        console.error(err)
        names[id] = id
      }
    }
    setCategoryNames(prev => ({ ...prev, ...names }))
  }

  useEffect(() => {
    loadAllProducts()
    loadAllCategories()
  }, [])

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const showError = (message) => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(null), 5000)
  }

  const getCategoryName = (categoryId) => {
    return categoryNames[categoryId] || categoryId || '-'
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    p.ref.toLowerCase().includes(searchRef.toLowerCase()) &&
    getCategoryName(p.categoryId).toLowerCase().includes(searchCat.toLowerCase())
  )

  const toggleActive = async (id) => {
    const product = products.find(p => p.id === id)
    if (!product) return

    setActionLoading(true)
    try {
      const productData = {
        active: product.active ? "0" : "1"
      }
      await updateResource("product", id, productData)
      setProducts(products.map(p => p.id === id ? { ...p, active: !p.active } : p))
      showSuccess(`Produit ${product.active ? 'désactivé' : 'activé'} avec succès`)
    } catch (err) {
      console.error("Erreur:", err)
      showError("Erreur lors du changement d'état")
    } finally {
      setActionLoading(false)
    }
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
    setForm({ 
      name: '', 
      ref: '', 
      categoryId: '', 
      priceHT: '', 
      qty: '',
      description: '',
      description_short: '',
      taxRulesGroupId: ''
    })
    setImageFile(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditProduct(p)
    setForm({ 
      name: p.name, 
      ref: p.ref, 
      categoryId: p.categoryId, 
      priceHT: p.priceHT, 
      qty: p.qty,
      description: p.description || '',
      description_short: p.description_short || '',
      taxRulesGroupId: p.taxRulesGroupId || ''
    })
    setImageFile(null)
    setImagePreview(null)
    setShowModal(true)
  }

  const openImageManager = async (product) => {
    setCurrentImageProduct(product)
    try {
      const result = await getProduct(product.id)
      if (result.success && result.images_urls) {
        setProductImages(result.images_urls)
      } else {
        setProductImages([])
      }
    } catch (err) {
      console.error("Erreur chargement images:", err)
      setProductImages([])
    }
    setShowImageModal(true)
  }

  const addProductImage = async (file) => {
    if (!file || !currentImageProduct) return
    
    setImageUploadLoading(true)
    try {
      await uploadProductImage(currentImageProduct.id, file)
      showSuccess("Image ajoutée avec succès")
      
      const result = await getProduct(currentImageProduct.id)
      if (result.success && result.images_urls) {
        setProductImages(result.images_urls)
      }
      
      await loadAllProducts()
    } catch (err) {
      console.error("Erreur ajout image:", err)
      showError("Erreur lors de l'ajout de l'image")
    } finally {
      setImageUploadLoading(false)
    }
  }

  const deleteProductImage = async (imageId) => {
    if (!window.confirm("Supprimer cette image ?")) return
    
    setImageUploadLoading(true)
    try {
      await deleteResource(`images/products/${currentImageProduct.id}`, imageId)
      showSuccess("Image supprimée avec succès")
      
      const result = await getProduct(currentImageProduct.id)
      if (result.success && result.images_urls) {
        setProductImages(result.images_urls)
      }
      
      await loadAllProducts()
    } catch (err) {
      console.error("Erreur suppression image:", err)
      showError("Erreur lors de la suppression de l'image")
    } finally {
      setImageUploadLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleModalImageChange = (e) => {
    const file = e.target.files[0]
    if (file && currentImageProduct) {
      addProductImage(file)
      e.target.value = '' 
    }
  }

  const saveProduct = async () => {
    if (!form.name.trim()) {
      showError("Le nom du produit est requis")
      return
    }
    if (!form.categoryId) {
      showError("La catégorie est requise")
      return
    }

    setActionLoading(true)
    try {
      const priceValue = parseFloat(form.priceHT) || 0
      
      const productData = {
        name: form.name,
        reference: form.ref || '',
        price: priceValue.toFixed(6),
        id_category_default: parseInt(form.categoryId),
        description: form.description || form.name,
        description_short: form.description_short || form.name,
        link_rewrite: form.name.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        active: "1",
        available_for_order: "1",
        show_price: "1",
        associations: {
          categories: {
            category: [{ id: parseInt(form.categoryId) }]
          }
        }
      }

      if (form.taxRulesGroupId) {
        productData.id_tax_rules_group = parseInt(form.taxRulesGroupId)
      }

      let result
      let productId

      if (editProduct) {
        productData.id = editProduct.id
        await updateResource("product", editProduct.id, productData)
        productId = editProduct.id
        showSuccess(`Produit "${form.name}" modifié avec succès`)
      } else {
        result = await addProduct(productData)
        if (result?.product?.id) {
          productId = result.product.id["#cdata"] || result.product.id
        } else if (result?.prestashop?.product?.id) {
          productId = result.prestashop.product.id["#cdata"] || result.prestashop.product.id
        }
        showSuccess(`Produit "${form.name}" créé avec succès`)
      }

      if (imageFile && productId) {
        try {
          await uploadProductImage(productId, imageFile)
          showSuccess(`Image ajoutée au produit`)
        } catch (imgErr) {
          console.error("Erreur upload image:", imgErr)
          showError("Produit créé mais erreur lors de l'upload de l'image")
        }
      }

      setShowModal(false)
      await loadAllProducts()
      
    } catch (err) {
      console.error("Erreur:", err)
      showError(err.message || "Erreur lors de la sauvegarde")
    } finally {
      setActionLoading(false)
    }
  }

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Supprimer le produit "${name}" ?`)) return

    setActionLoading(true)
    try {
      await deleteResource("products", id)
      showSuccess(`Produit "${name}" supprimé avec succès`)
      await loadAllProducts()
    } catch (err) {
      console.error("Erreur:", err)
      showError(err.message || "Erreur lors de la suppression")
    } finally {
      setActionLoading(false)
    }
  }

  const bulkDelete = async () => {
    if (selected.length === 0) return
    if (!window.confirm(`Supprimer ${selected.length} produit(s) ?`)) return

    setActionLoading(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selected) {
      try {
        await deleteResource("products", id)
        successCount++
      } catch (err) {
        console.error(`Erreur suppression produit ${id}:`, err)
        errorCount++
      }
    }

    if (successCount > 0) {
      showSuccess(`${successCount} produit(s) supprimé(s) avec succès`)
    }
    if (errorCount > 0) {
      showError(`${errorCount} produit(s) non supprimé(s)`)
    }
    
    setSelected([])
    await loadAllProducts()
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des produits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div className="breadcrumb">Catalogue &gt; <strong>Produits</strong></div>
        <div className="page-header-row">
          <h1 className="page-title">Produits</h1>
          <div className="header-actions">
            {selected.length > 0 && (
              <button className="btn btn-danger" onClick={bulkDelete} disabled={actionLoading}>
                🗑️ Supprimer ({selected.length})
              </button>
            )}
            <button className="btn btn-primary" onClick={openNew} disabled={actionLoading}>
              <span>＋</span> Nouveau produit
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {successMessage}
          <button className="alert-close" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}
      
      {errorMessage && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {errorMessage}
          <button className="alert-close" onClick={() => setErrorMessage(null)}>×</button>
        </div>
      )}

      <div className="panel">
        <div className="panel-header-row">
          <span className="panel-title">Produits ({filtered.length})</span>
        </div>

        <div className="panel-body">
          <table className="ps-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input 
                    type="checkbox" 
                    checked={selected.length === filtered.length && filtered.length > 0} 
                    onChange={toggleAll} 
                  />
                </th>
                <th className="col-id">ID</th>
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
                <td></td>
                <td></td>
                <td><input className="filter-input" placeholder="Chercher un nom" value={search} onChange={e => setSearch(e.target.value)} /></td>
                <td><input className="filter-input" placeholder="Chercher une référence" value={searchRef} onChange={e => setSearchRef(e.target.value)} /></td>
                <td><input className="filter-input" placeholder="Chercher une catégorie" value={searchCat} onChange={e => setSearchCat(e.target.value)} /></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
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
                      <div className="product-thumb">
                        {p.images?.[0]?.url ? (
                          <img src={p.images[0].url + "?ws_key=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL"} alt={p.name} />
                        ) : (
                          <span className="no-image">📷</span>
                        )}
                      </div>
                    </td>
                    <td className="product-name">{p.name}</td>
                    <td>{p.ref}</td>
                    <td>{getCategoryName(p.categoryId)}</td>
                    <td className="col-price">{p.priceHT.toFixed(2)} €</td>
                    <td className="col-price">{p.priceTTC.toFixed(2)} €</td>
                    <td className="col-qty">{p.qty}</td>
                    <td>
                      <label className="toggle">
                        <input 
                          type="checkbox" 
                          checked={p.active} 
                          onChange={() => toggleActive(p.id)}
                          disabled={actionLoading}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td className="col-actions">
                      <div className="action-btns">
                        <button 
                          className="action-btn" 
                          title="Modifier" 
                          onClick={() => openEdit(p)}
                          disabled={actionLoading}
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn" 
                          title="Gérer les images" 
                          onClick={() => openImageManager(p)}
                          disabled={actionLoading}
                        >
                          🖼️
                        </button>
                        <button 
                          className="action-btn action-btn--danger" 
                          title="Supprimer" 
                          onClick={() => deleteProduct(p.id, p.name)}
                          disabled={actionLoading}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Produit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProduct ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom du produit *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  placeholder="Nom du produit"
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <label>Référence</label>
                <input 
                  value={form.ref} 
                  onChange={e => setForm({ ...form, ref: e.target.value })} 
                  placeholder="Référence unique"
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <label>Catégorie *</label>
                <select 
                  value={form.categoryId} 
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  disabled={actionLoading}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prix HT (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={form.priceHT} 
                    onChange={e => setForm({ ...form, priceHT: e.target.value })} 
                    placeholder="0.00"
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input 
                    type="number" 
                    value={form.qty} 
                    onChange={e => setForm({ ...form, qty: e.target.value })} 
                    placeholder="0"
                    disabled={actionLoading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description courte</label>
                <textarea 
                  value={form.description_short} 
                  onChange={e => setForm({ ...form, description_short: e.target.value })} 
                  placeholder="Description courte du produit"
                  rows="2"
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  placeholder="Description complète du produit"
                  rows="3"
                  disabled={actionLoading}
                />
              </div>
              <div className="form-group">
                <label>Image du produit</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={actionLoading}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Aperçu" />
                  </div>
                )}
                <small className="form-hint">Formats acceptés: JPG, PNG, GIF</small>
              </div>
              {editProduct && (
                <div className="form-group">
                  <label>Prix TTC (calculé automatiquement)</label>
                  <input 
                    type="text" 
                    value={(parseFloat(form.priceHT) * 1.2).toFixed(2)} 
                    disabled 
                    style={{ background: '#f3f4f6' }} 
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={actionLoading}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={saveProduct} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestion des Images */}
      {showImageModal && currentImageProduct && (
        <div className="modal-overlay" onClick={() => !imageUploadLoading && setShowImageModal(false)}>
          <div className="modal modal-image-manager" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gérer les images - {currentImageProduct.name}</h2>
              <button className="modal-close" onClick={() => setShowImageModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Zone d'upload */}
              <div className="image-upload-zone">
                <label className="upload-label">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleModalImageChange}
                    disabled={imageUploadLoading}
                    style={{ display: 'none' }}
                  />
                  <div className="upload-button">
                    <span>📸</span>
                    Ajouter une image
                  </div>
                </label>
                <small className="form-hint">Cliquez pour sélectionner une image (JPG, PNG, GIF)</small>
              </div>

              {/* Galerie d'images */}
              {productImages.length === 0 ? (
                <div className="no-images">
                  <p>Aucune image pour ce produit</p>
                </div>
              ) : (
                <div className="image-gallery">
                  {productImages.map((image, index) => (
                    <div key={image.id || index} className="image-item">
                      <div className="image-item-preview">
                        <img 
                          src={image.url + "?ws_key=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL"} 
                          alt={`${currentImageProduct.name} - ${index + 1}`}
                        />
                      </div>
                      <div className="image-item-actions">
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => deleteProductImage(image.id)}
                          disabled={imageUploadLoading}
                          title="Supprimer cette image"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {imageUploadLoading && (
                <div className="upload-loading">
                  <span className="spinner-small"></span>
                  <p>Traitement en cours...</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowImageModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}