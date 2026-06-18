import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Pencil, Power } from 'lucide-react'
import api from '../../api/client'
import { formatFcfa } from '../../utils/dashboardStats'

const TYPE_LABELS = {
  entree: 'Entrée',
  sortie: 'Sortie',
  correction: 'Correction',
}

export default function ProduitDetail() {
  const { id } = useParams()
  const [produit, setProduit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editionOuverte, setEditionOuverte] = useState(false)
  const [designation, setDesignation] = useState('')
  const [categorie, setCategorie] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [seuilAlerte, setSeuilAlerte] = useState('')

  const [formEntreeOuvert, setFormEntreeOuvert] = useState(false)
  const [quantiteEntree, setQuantiteEntree] = useState('')
  const [motifEntree, setMotifEntree] = useState('')

  const [formCorrectionOuvert, setFormCorrectionOuvert] = useState(false)
  const [quantitePhysique, setQuantitePhysique] = useState('')
  const [motifCorrection, setMotifCorrection] = useState('')

  function load() {
    setLoading(true)
    api
      .get(`/produits/${id}`)
      .then((res) => {
        setProduit(res.data)
        setDesignation(res.data.designation)
        setCategorie(res.data.categorie ?? '')
        setPrixVente(res.data.prix_vente)
        setSeuilAlerte(res.data.seuil_alerte)
      })
      .catch(() => setError('Produit introuvable ou accès refusé.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  async function enregistrerModifications(e) {
    e.preventDefault()
    const res = await api.put(`/produits/${produit.id}`, {
      code: produit.code,
      designation,
      categorie: categorie || null,
      unite_mesure: produit.unite_mesure,
      prix_vente: Number(prixVente),
      seuil_alerte: Number(seuilAlerte) || 0,
      actif: produit.actif,
    })
    setProduit(res.data)
    setEditionOuverte(false)
  }

  async function toggleActif() {
    const res = await api.put(`/produits/${produit.id}`, {
      code: produit.code,
      designation: produit.designation,
      categorie: produit.categorie,
      unite_mesure: produit.unite_mesure,
      prix_vente: produit.prix_vente,
      seuil_alerte: produit.seuil_alerte,
      actif: !produit.actif,
    })
    setProduit(res.data)
  }

  async function enregistrerEntree(e) {
    e.preventDefault()
    await api.post(`/produits/${produit.id}/entree`, {
      quantite: Number(quantiteEntree),
      motif: motifEntree || null,
      date: new Date().toISOString().slice(0, 10),
    })
    setFormEntreeOuvert(false)
    setQuantiteEntree('')
    setMotifEntree('')
    load()
  }

  async function enregistrerCorrection(e) {
    e.preventDefault()
    await api.post(`/produits/${produit.id}/correction`, {
      quantite_physique: Number(quantitePhysique),
      motif: motifCorrection,
      date: new Date().toISOString().slice(0, 10),
    })
    setFormCorrectionOuvert(false)
    setQuantitePhysique('')
    setMotifCorrection('')
    load()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{produit.designation}</h2>
          <p className="text-sm text-slate-500">{produit.code}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditionOuverte((o) => !o)} className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm hover:bg-slate-50">
            <Pencil size={14} /> Modifier
          </button>
          <button onClick={toggleActif} className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm hover:bg-slate-50">
            <Power size={14} /> {produit.actif ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>

      {editionOuverte && (
        <form onSubmit={enregistrerModifications} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Désignation</label>
            <input type="text" required value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Catégorie</label>
            <input type="text" value={categorie} onChange={(e) => setCategorie(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Prix de vente</label>
            <input type="number" min="0" step="0.01" required value={prixVente} onChange={(e) => setPrixVente(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Seuil d'alerte</label>
            <input type="number" min="0" step="0.01" value={seuilAlerte} onChange={(e) => setSeuilAlerte(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="col-span-2 bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700">
            Enregistrer
          </button>
        </form>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Stock actuel</p>
          <p className={`text-xl font-semibold ${produit.sous_seuil ? 'text-amber-600' : 'text-slate-800'}`}>
            {Number(produit.quantite_stock)} {produit.unite_mesure}
          </p>
          {produit.sous_seuil && <p className="text-xs text-amber-600 mt-1">Sous le seuil d'alerte ({Number(produit.seuil_alerte)})</p>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Prix de vente</p>
          <p className="text-xl font-semibold text-slate-800">{formatFcfa(produit.prix_vente)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Valeur du stock</p>
          <p className="text-xl font-semibold text-slate-800">{formatFcfa(produit.quantite_stock * produit.prix_vente)}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setFormEntreeOuvert((o) => !o)} className="text-sm text-indigo-600 hover:underline">
          + Entrée de stock
        </button>
        <button onClick={() => setFormCorrectionOuvert((o) => !o)} className="text-sm text-indigo-600 hover:underline">
          + Correction d'inventaire
        </button>
      </div>

      {formEntreeOuvert && (
        <form onSubmit={enregistrerEntree} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Quantité reçue</label>
            <input type="number" min="0.01" step="0.01" required value={quantiteEntree} onChange={(e) => setQuantiteEntree(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Motif (optionnel)</label>
            <input type="text" value={motifEntree} onChange={(e) => setMotifEntree(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <button type="submit" className="bg-indigo-600 text-white rounded px-3 py-1.5 text-sm hover:bg-indigo-700">
            Enregistrer l'entrée
          </button>
        </form>
      )}

      {formCorrectionOuvert && (
        <form onSubmit={enregistrerCorrection} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Stock théorique</label>
            <p className="px-2 py-1.5 text-sm text-slate-600">{Number(produit.quantite_stock)} {produit.unite_mesure}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Stock physique constaté *</label>
            <input type="number" min="0" step="0.01" required value={quantitePhysique} onChange={(e) => setQuantitePhysique(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Motif *</label>
            <input type="text" required placeholder="Perte, casse, vol…" value={motifCorrection} onChange={(e) => setMotifCorrection(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <button type="submit" className="col-span-3 bg-indigo-600 text-white rounded px-3 py-1.5 text-sm hover:bg-indigo-700">
            Confirmer la correction
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Historique des mouvements</h3>
        </div>
        {produit.mouvements.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucun mouvement enregistré.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-right px-4 py-2">Quantité</th>
                <th className="text-left px-4 py-2">Motif</th>
                <th className="text-left px-4 py-2">Saisi par</th>
              </tr>
            </thead>
            <tbody>
              {produit.mouvements.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{m.date}</td>
                  <td className="px-4 py-2">{TYPE_LABELS[m.type]}</td>
                  <td className={`px-4 py-2 text-right font-medium ${Number(m.quantite) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {Number(m.quantite) > 0 ? '+' : ''}{Number(m.quantite)}
                  </td>
                  <td className="px-4 py-2">{m.motif ?? (m.facture_id ? `Facture #${m.facture_id}` : '—')}</td>
                  <td className="px-4 py-2">{m.utilisateur?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
