import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Send, Trash2, FileText } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StatutBadge from '../../components/StatutBadge'
import { formatFcfa } from '../../utils/dashboardStats'

export default function PropositionDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [proposition, setProposition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get(`/propositions/${id}`)
      .then((res) => setProposition(res.data))
      .catch(() => setError('Proposition introuvable ou accès refusé.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  const peutGerer = user.role === 'dg' || (proposition.statut === 'brouillon' && proposition.user_id === user.id)
  const isGestionnaire = user.role === 'comptable' || user.role === 'dg'

  async function soumettre() {
    const res = await api.post(`/propositions/${proposition.id}/submit`)
    setProposition(res.data)
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer la proposition ${proposition.numero} ?`)) return
    await api.delete(`/propositions/${proposition.id}`)
    navigate('/propositions')
  }

  async function convertir() {
    const res = await api.post(`/propositions/${proposition.id}/convertir`)
    navigate(`/factures/${res.data.id}`)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{proposition.numero}</h2>
          <div className="mt-1"><StatutBadge statut={proposition.statut} /></div>
        </div>
        <div className="flex gap-2">
          {peutGerer && proposition.statut === 'brouillon' && (
            <button
              onClick={soumettre}
              className="flex items-center gap-1.5 bg-emerald-600 text-white rounded px-3 py-1.5 text-sm hover:bg-emerald-700"
            >
              <Send size={14} /> Soumettre
            </button>
          )}
          {isGestionnaire && proposition.statut === 'soumise' && (
            <button
              onClick={convertir}
              className="flex items-center gap-1.5 bg-indigo-600 text-white rounded px-3 py-1.5 text-sm hover:bg-indigo-700"
            >
              <FileText size={14} /> Convertir en facture
            </button>
          )}
          {peutGerer && (
            <button
              onClick={supprimer}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 rounded px-3 py-1.5 text-sm hover:bg-red-50"
            >
              <Trash2 size={14} /> Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Client</p>
          <p className="font-medium text-slate-800">{proposition.client?.nom}</p>
        </div>
        <div>
          <p className="text-slate-500">Commercial</p>
          <p className="font-medium text-slate-800">{proposition.commercial?.name}</p>
        </div>
        <div>
          <p className="text-slate-500">Date</p>
          <p className="font-medium text-slate-800">{proposition.date}</p>
        </div>
        {proposition.remarque && (
          <div className="col-span-2">
            <p className="text-slate-500">Remarque</p>
            <p className="text-slate-800">{proposition.remarque}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Désignation</th>
              <th className="text-right px-4 py-2">Qté</th>
              <th className="text-right px-4 py-2">Prix unit.</th>
              <th className="text-right px-4 py-2">Remise %</th>
              <th className="text-right px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {proposition.lignes.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{l.designation}</td>
                <td className="px-4 py-2 text-right">{l.quantite}</td>
                <td className="px-4 py-2 text-right">{formatFcfa(l.prix_unitaire)}</td>
                <td className="px-4 py-2 text-right">{l.remise_pourcentage}%</td>
                <td className="px-4 py-2 text-right font-medium">{formatFcfa(l.total_ligne)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex justify-end gap-8 text-sm">
          <span className="text-slate-500">Total HT : <strong className="text-slate-800">{formatFcfa(proposition.total_ht)}</strong></span>
          <span className="text-slate-500">TVA : <strong className="text-slate-800">{formatFcfa(proposition.total_tva)}</strong></span>
          <span className="text-slate-500">Total TTC : <strong className="text-slate-800">{formatFcfa(proposition.total_ttc)}</strong></span>
        </div>
      </div>
    </div>
  )
}
