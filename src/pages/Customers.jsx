import { useState } from 'react'
import './Customers.css'

const INITIAL_CUSTOMERS = [
  { id: 8, firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@email.com', sales: '245,00 €', enabled: true, newsletter: true, date: '2024-01-15' },
  { id: 7, firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@email.com', sales: '1 230,00 €', enabled: true, newsletter: false, date: '2024-01-10' },
  { id: 6, firstName: 'Paul', lastName: 'Bernard', email: 'paul.bernard@email.com', sales: '89,50 €', enabled: true, newsletter: true, date: '2024-01-08' },
  { id: 5, firstName: 'Sophie', lastName: 'Leroy', email: 'sophie.leroy@email.com', sales: '0,00 €', enabled: false, newsletter: false, date: '2023-12-20' },
  { id: 4, firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau@email.com', sales: '560,00 €', enabled: true, newsletter: true, date: '2023-12-15' },
  { id: 3, firstName: 'Emma', lastName: 'Simon', email: 'emma.simon@email.com', sales: '120,00 €', enabled: true, newsletter: false, date: '2023-11-30' },
]

export default function Customers() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })
  const [editCustomer, setEditCustomer] = useState(null)

  const filtered = customers.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id) => {
    setSelected(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id])
  }

  const toggleAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id))
  }

  const toggleEnabled = (id) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))
  }

  const openNew = () => {
    setEditCustomer(null)
    setForm({ firstName: '', lastName: '', email: '' })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditCustomer(c)
    setForm({ firstName: c.firstName, lastName: c.lastName, email: c.email })
    setShowModal(true)
  }

  const save = () => {
    if (!form.email) return
    if (editCustomer) {
      setCustomers(customers.map(c => c.id === editCustomer.id ? { ...c, ...form } : c))
    } else {
      const newId = Math.max(...customers.map(c => c.id)) + 1
      const today = new Date().toISOString().split('T')[0]
      setCustomers([{ id: newId, ...form, sales: '0,00 €', enabled: true, newsletter: false, date: today }, ...customers])
    }
    setShowModal(false)
  }

  const deleteCustomer = (id) => {
    if (window.confirm('Supprimer ce client ?')) {
      setCustomers(customers.filter(c => c.id !== id))
    }
  }

  return (
    <div className="customers-page">
      <div className="page-header">
        <div className="breadcrumb">Vendre &gt; <strong>Clients</strong></div>
        <div className="page-header-row">
          <h1 className="page-title">Clients</h1>
          <button className="btn btn-primary" onClick={openNew}>
            <span>＋</span> Nouveau client
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header-row">
          <span className="panel-title">Clients ({filtered.length})</span>
        </div>

        <div className="panel-body">
          <div className="search-bar">
            <input
              className="filter-input"
              placeholder="Rechercher un client (nom, prénom, email)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '320px' }}
            />
          </div>
          <table className="ps-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                <th>ID</th>
                <th>Prénom</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Ventes</th>
                <th>Newsletter</th>
                <th>Date d&apos;inscription</th>
                <th>État</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className={selected.includes(c.id) ? 'row-selected' : ''}>
                  <td className="col-check">
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td>{c.id}</td>
                  <td>{c.firstName}</td>
                  <td>{c.lastName}</td>
                  <td className="email-cell">{c.email}</td>
                  <td>{c.sales}</td>
                  <td>
                    {c.newsletter
                      ? <span className="badge badge--success">✓ Oui</span>
                      : <span className="badge badge--neutral">Non</span>}
                  </td>
                  <td>{c.date}</td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={c.enabled} onChange={() => toggleEnabled(c.id)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td className="col-actions">
                    <div className="action-btns">
                      <button className="action-btn" title="Modifier" onClick={() => openEdit(c)}>✏️</button>
                      <button className="action-btn" title="Supprimer" onClick={() => deleteCustomer(c.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editCustomer ? 'Modifier le client' : 'Nouveau client'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom</label>
                  <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={save}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}