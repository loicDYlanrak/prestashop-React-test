import { useState } from 'react'
import './ImportExport.css'

const EXPORTS = [
  {
    id: 'products',
    label: 'Produits',
    icon: '📦',
    desc: 'Exporter tout le catalogue produits avec prix, stock et catégories.',
    fields: ['ID', 'Nom', 'Référence', 'Catégorie', 'Prix HT', 'Prix TTC', 'Quantité', 'État', 'Description'],
  },
  {
    id: 'customers',
    label: 'Clients',
    icon: '👥',
    desc: 'Exporter la liste des clients avec coordonnées et historique.',
    fields: ['ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Date d\'inscription', 'Newsletter', 'Total achats'],
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: '🛒',
    desc: 'Exporter les commandes avec détails, montants et statuts.',
    fields: ['ID', 'Référence', 'Client', 'Date', 'Montant TTC', 'État', 'Mode de paiement'],
  },
  {
    id: 'categories',
    label: 'Catégories',
    icon: '🗂️',
    desc: 'Exporter l\'arborescence des catégories.',
    fields: ['ID', 'Nom', 'Catégorie parente', 'Actif', 'Position'],
  },
]

export default function Export() {
  const [selected, setSelected] = useState('products')
  const [format, setFormat] = useState('csv')
  const [separator, setSeparator] = useState(';')
  const [encoding, setEncoding] = useState('UTF-8')
  const [selectedFields, setSelectedFields] = useState({})
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  const currentExport = EXPORTS.find(e => e.id === selected)

  const toggleField = (field) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }))
    setDone(false)
  }

  const isFieldSelected = (field) => selectedFields[field] !== false

  const handleExport = () => {
    setExporting(true)
    setDone(false)
    setTimeout(() => {
      setExporting(false)
      setDone(true)
      // Simulate CSV download
      const fields = currentExport.fields.filter(isFieldSelected)
      const csv = [fields.join(separator), `1${separator}Exemple${separator}...`].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export_${selected}_${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    }, 1400)
  }

  return (
    <div className="ie-page">
      <div className="page-header">
        <div className="breadcrumb">Catalogue &gt; <strong>Export</strong></div>
        <div className="page-header-row">
          <h1 className="page-title">Exporter des données</h1>
        </div>
      </div>

      <div className="ie-grid">
        {/* LEFT: Entity + fields */}
        <div className="panel">
          <div className="panel-header">Type de données à exporter</div>
          <div className="panel-body ie-form">
            <div className="export-cards">
              {EXPORTS.map(exp => (
                <div
                  key={exp.id}
                  className={`export-card ${selected === exp.id ? 'export-card--active' : ''}`}
                  onClick={() => { setSelected(exp.id); setSelectedFields({}); setDone(false) }}
                >
                  <span className="export-card-icon">{exp.icon}</span>
                  <div>
                    <div className="export-card-label">{exp.label}</div>
                    <div className="export-card-desc">{exp.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-header" style={{ borderTop: '1px solid #e5e8ef' }}>
            Colonnes à inclure — <em>{currentExport.label}</em>
          </div>
          <div className="panel-body ie-form">
            <div className="fields-grid">
              {currentExport.fields.map(field => (
                <label key={field} className="field-checkbox">
                  <input
                    type="checkbox"
                    checked={isFieldSelected(field)}
                    onChange={() => toggleField(field)}
                  />
                  <span>{field}</span>
                </label>
              ))}
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedFields(Object.fromEntries(currentExport.fields.map(f => [f, !currentExport.fields.every(isFieldSelected)])))}
            >
              {currentExport.fields.every(isFieldSelected) ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
        </div>

        {/* RIGHT: Format + download */}
        <div className="ie-right">
          <div className="panel">
            <div className="panel-header">Options d&apos;export</div>
            <div className="panel-body ie-form">
              <div className="form-group">
                <label>Format du fichier</label>
                <div className="format-row">
                  {['csv', 'txt'].map(f => (
                    <label key={f} className={`sep-btn ${format === f ? 'sep-btn--active' : ''}`}>
                      <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} />
                      <code>.{f}</code>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Séparateur de champs</label>
                <div className="separator-row">
                  {[';', ',', '|', '\t'].map(s => (
                    <label key={s} className={`sep-btn ${separator === s ? 'sep-btn--active' : ''}`}>
                      <input type="radio" name="sep" value={s} checked={separator === s} onChange={() => setSeparator(s)} />
                      <code>{s === '\t' ? 'Tab' : s}</code>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Encodage du fichier</label>
                <select value={encoding} onChange={e => setEncoding(e.target.value)}>
                  {['UTF-8', 'ISO-8859-1', 'Windows-1252'].map(e => <option key={e}>{e}</option>)}
                </select>
              </div>

              <div className="export-summary">
                <div className="export-summary-row">
                  <span>Entité</span><strong>{currentExport.label}</strong>
                </div>
                <div className="export-summary-row">
                  <span>Colonnes</span>
                  <strong>{currentExport.fields.filter(isFieldSelected).length} / {currentExport.fields.length}</strong>
                </div>
                <div className="export-summary-row">
                  <span>Format</span><strong>.{format} — {encoding} — «{separator === '\t' ? 'Tab' : separator}»</strong>
                </div>
              </div>

              {done && (
                <div className="alert alert--success">
                   Export généré avec succès — le téléchargement a démarré.
                </div>
              )}

              <button
                className={`btn btn-primary btn-full btn-lg ${exporting ? 'btn--loading' : ''}`}
                onClick={handleExport}
                disabled={exporting || currentExport.fields.filter(isFieldSelected).length === 0}
              >
                {exporting ? '⏳ Génération en cours...' : '⬇️ Télécharger l\'export'}
              </button>
            </div>
          </div>

          <div className="panel panel--info">
            <div className="panel-header">Aperçu du fichier</div>
            <div className="panel-body ie-form">
              <div className="csv-preview">
                <code>{currentExport.fields.filter(isFieldSelected).join(separator)}</code>
                <code style={{ color: '#9ba3b2' }}>{'...' + separator.repeat(currentExport.fields.filter(isFieldSelected).length - 1)}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}