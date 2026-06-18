import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import api from '../../api/client'
import { formatFcfa } from '../../utils/dashboardStats'

export default function ProduitsList() {
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreActif, setFiltreActif] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .get('/produits', { params: filtreActif ? { actif: filtreActif } : {} })
      .then((res) => setProduits(res.data))
      .finally(() => setLoading(false))
  }, [filtreActif])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Catalogue produits</h2>
        <Link to="/stock/nouveau" className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700">
          + Nouveau produit
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <select value={filtreActif} onChange={(e) => setFiltreActif(e.target.value)} className="border border-slate-300 rounded px-3 py-1.5 text-sm">
          <option value="">Tous les produits</option>
          <option value="1">Actifs</option>
          <option value="0">Désactivés</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : produits.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun produit dans le catalogue.</p>
      ) : (
        <table className="w-full text-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Code</th>
              <th className="text-left px-4 py-2">Désignation</th>
              <th className="text-left px-4 py-2">Catégorie</th>
              <th className="text-right px-4 py-2">Prix de vente</th>
              <th className="text-right px-4 py-2">Stock</th>
              <th className="text-left px-4 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <Link to={`/stock/${p.id}`} className="text-indigo-600 hover:underline">{p.code}</Link>
                </td>
                <td className="px-4 py-2">{p.designation}</td>
                <td className="px-4 py-2">{p.categorie ?? '—'}</td>
                <td className="px-4 py-2 text-right">{formatFcfa(p.prix_vente)}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {p.sous_seuil && <AlertTriangle size={14} className="text-amber-500" />}
                    <span className={p.sous_seuil ? 'text-amber-600 font-medium' : ''}>
                      {Number(p.quantite_stock)} {p.unite_mesure}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.actif ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
