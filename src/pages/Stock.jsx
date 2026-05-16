import { useState } from 'react'
import './Stock.css'

const INITIAL_STOCK = [
  { id: 22, image: '🖼️', name: 'Product Name',          variant: 'Taille - S',            ref: 'demo_1',  supplier: 'Fashion supplier',     active: true,  physical: 15,  reserved: 0, available: 15 },
  { id: 18, image: '📓', name: 'Carnet de notes Colibri', variant: 'Type de papier - Ligné',  ref: 'demo_10', supplier: 'Accessories supplier', active: true,  physical: 300, reserved: 0, available: 300 },
  { id: 18, image: '📓', name: 'Carnet de notes Colibri', variant: 'Type de papier - Vierge', ref: 'demo_10', supplier: 'Accessories supplier', active: true,  physical: 300, reserved: 0, available: 300 },
  { id: 18, image: '📓', name: 'Carnet de notes Colibri', variant: 'Type de papier - Quadrillé', ref: 'demo_10', supplier: 'Accessories supplier', active: true, physical: 300, reserved: 0, available: 300 },
  { id: 17, image: '📓', name: 'Carnet de notes Ours brun', variant: 'Type de papier - Ligné', ref: 'demo_9', supplier: 'Accessories supplier', active: true,  physical: 300, reserved: 0, available: 300 },
  { id: 16, image: '📓', name: 'Carnet de notes Renard',  variant: 'Type de papier - Ligné',  ref: 'demo_8',  supplier: 'Accessories supplier', active: false, physical: 0,   reserved: 0, available: 0 },
  { id: 15, image: '🖼️', name: 'Pack Mug + Affiche encadrée', variant: '',                  ref: 'demo_21', supplier: 'Fashion supplier',     active: true,  physical: 100, reserved: 2, available: 98 },
]

const MOVEMENTS = [
  { id: 1, product: 'Product Name', variant: 'Taille - S', ref: 'demo_1', qty: '+10', reason: 'Réapprovisionnement', date: '07/05/2026 10:00' },
  { id: 2, product: 'Carnet de notes Colibri', variant: 'Ligné', ref: 'demo_10', qty: '-5', reason: 'Commande #4', date: '07/05/2026 11:59' },
  { id: 3, product: 'Pack Mug + Affiche', variant: '', ref: 'demo_21', qty: '+50', reason: 'Réapprovisionnement', date: '06/05/2026 09:15' },
]

export default function Stock() {
  const [tab, setTab] = useState('stock')
  const [search, setSearch] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState([])
  const [bulkQty, setBulkQty] = useState(0)
  const [edits, setEdits] = useState({})
  const [stock, setStock] = useState(INITIAL_STOCK)

  const filtered = stock.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.ref.toLowerCase().includes(q) || s.supplier.toLowerCase().includes(q)
    const matchLow = !lowStock || s.available < 10
    return matchSearch && matchLow
  })

  const toggleSelect = (i) => setSelected(sel => sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i])
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((_, i) => i))

  const applyBulk = () => {
    if (!selected.length) return
    setStock(stock.map((s, i) => {
      if (selected.includes(i)) return { ...s, physical: s.physical + parseInt(bulkQty || 0), available: s.available + parseInt(bulkQty || 0) }
      return s
    }))
    setSelected([])
    setBulkQty(0)
  }

  const applyEdit = (idx) => {
    const delta = parseInt(edits[idx] || 0)
    if (!delta) return
    setStock(stock.map((s, i) => i === idx
      ? { ...s, physical: s.physical + delta, available: s.available + delta }
      : s
    ))
    setEdits({ ...edits, [idx]: 0 })
  }

  return (
    <div className="stock-page">
      <div className="page-header">
        <div className="breadcrumb">Catalogue &gt; Gestion des stocks &gt; <strong>Stock</strong></div>
        <div className="page-header-row">
          <h1 className="page-title">Gestion des stocks</h1>
          <button className="btn btn-outline">Aide</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="stock-tabs">
        <button className={`stock-tab ${tab === 'stock' ? 'stock-tab--active' : ''}`} onClick={() => setTab('stock')}>Stock</button>
        <button className={`stock-tab ${tab === 'movements' ? 'stock-tab--active' : ''}`} onClick={() => setTab('movements')}>Mouvements</button>
      </div>

      {tab === 'stock' && (
        <>
          {/* Search */}
          <div className="stock-search-bar">
            <p className="stock-search-label">Chercher des produits (par nom, référence ou fournisseur)</p>
            <div className="stock-search-row">
              <input
                className="stock-search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearch(e.target.value)}
              />
              <button className="btn btn-dark">🔍 Rechercher</button>
            </div>
          </div>

          {/* Advanced filters toggle */}
          <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            ≡ Filtres avancés {showFilters ? '▴' : '▾'}
          </button>

          {showFilters && (
            <div className="advanced-filters">
              <div className="form-group">
                <label>Fournisseur</label>
                <input className="filter-input" placeholder="Tous les fournisseurs" />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <input className="filter-input" placeholder="Toutes les catégories" />
              </div>
              <div className="form-group">
                <label>État</label>
                <select className="filter-select"><option>Tous</option><option>Actif</option><option>Inactif</option></select>
              </div>
            </div>
          )}

          {/* Low stock + import/export icons */}
          <div className="stock-options-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} />
              <span>Afficher en premier les produits en dessous du niveau de stock bas</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon" title="Importer">☁️⬆</button>
              <button className="btn-icon" title="Exporter">☁️⬇</button>
            </div>
          </div>

          {/* Bulk edit bar */}
          <div className="panel">
            <div className="bulk-bar">
              <label className="checkbox-label" style={{ gap: 10 }}>
                <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                <span style={{ fontSize: 12, color: '#5a5f6e' }}>Editer les quantités en masse</span>
              </label>
              <input
                type="number"
                className="bulk-input"
                value={bulkQty}
                onChange={e => setBulkQty(e.target.value)}
              />
              <button
                className={`btn ${selected.length > 0 ? 'btn-primary' : 'btn-outline'}`}
                style={{ marginLeft: 'auto' }}
                onClick={applyBulk}
                disabled={!selected.length}
              >
                ✏️ Appliquer les quantités
              </button>
            </div>

            <div className="panel-body">
              <table className="ps-table">
                <thead>
                  <tr>
                    <th className="col-check" />
                    <th>ID ▼</th>
                    <th>Article ▼</th>
                    <th>Référence ▼</th>
                    <th>Fournisseurs ▼</th>
                    <th>État</th>
                    <th>Physique</th>
                    <th>Réservé</th>
                    <th>Disponible</th>
                    <th>✏️ Modifier la qté</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => (
                    <tr key={idx} className={selected.includes(idx) ? 'row-selected' : ''}>
                      <td className="col-check">
                        <input type="checkbox" checked={selected.includes(idx)} onChange={() => toggleSelect(idx)} />
                      </td>
                      <td>{s.id}</td>
                      <td>
                        <div className="stock-article">
                          <div className="product-thumb">{s.image}</div>
                          <div>
                            <div className="stock-name">{s.name}</div>
                            {s.variant && <div className="stock-variant">{s.variant}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{s.ref}</td>
                      <td>{s.supplier}</td>
                      <td>
                        {s.active
                          ? <span className="stock-check">✔</span>
                          : <span className="stock-cross">✘</span>}
                      </td>
                      <td className={s.physical < 10 ? 'qty-low' : ''}>{s.physical}</td>
                      <td>{s.reserved}</td>
                      <td className={s.available < 10 ? 'qty-low' : ''}>{s.available}</td>
                      <td>
                        <div className="qty-edit-row">
                          <input
                            type="number"
                            className="qty-input"
                            value={edits[idx] ?? 0}
                            onChange={e => setEdits({ ...edits, [idx]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && applyEdit(idx)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'movements' && (
        <div className="panel">
          <div className="panel-header">Mouvements de stock</div>
          <div className="panel-body">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Produit</th>
                  <th>Variante</th>
                  <th>Référence</th>
                  <th>Quantité</th>
                  <th>Motif</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {MOVEMENTS.map(m => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.product}</td>
                    <td>{m.variant || '—'}</td>
                    <td>{m.ref}</td>
                    <td>
                      <span className={`mvt-qty ${m.qty.startsWith('+') ? 'mvt-qty--pos' : 'mvt-qty--neg'}`}>
                        {m.qty}
                      </span>
                    </td>
                    <td>{m.reason}</td>
                    <td className="date-cell">{m.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}