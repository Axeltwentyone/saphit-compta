import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

export default function ProduitForm() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [designation, setDesignation] = useState('')
  const [categorie, setCategorie] = useState('')
  const [uniteMesure, setUniteMesure] = useState('pièce')
  const [prixVente, setPrixVente] = useState('')
  const [seuilAlerte, setSeuilAlerte] = useState('0')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await api.post('/produits', {
        code,
        designation,
        categorie: categorie || null,
        unite_mesure: uniteMesure,
        prix_vente: Number(prixVente),
        seuil_alerte: Number(seuilAlerte) || 0,
      })
      navigate(`/stock/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création du produit.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Nouveau produit</h2>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

      <div>
        <label className="block text-sm text-slate-600 mb-1">Code *</label>
        <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Désignation *</label>
        <input type="text" required value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Catégorie</label>
          <input type="text" value={categorie} onChange={(e) => setCategorie(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Unité de mesure *</label>
          <input type="text" required value={uniteMesure} onChange={(e) => setUniteMesure(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Prix de vente *</label>
          <input type="number" min="0" step="0.01" required value={prixVente} onChange={(e) => setPrixVente(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Seuil d'alerte</label>
          <input type="number" min="0" step="0.01" value={seuilAlerte} onChange={(e) => setSeuilAlerte(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Le stock initial est à 0 ; utilisez "Entrée de stock" sur la fiche produit après création.
      </p>

      <button type="submit" disabled={submitting} className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50">
        Créer le produit
      </button>
    </form>
  )
}
