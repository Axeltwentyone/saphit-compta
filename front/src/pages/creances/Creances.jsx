import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import StatutBadge from '../../components/StatutBadge'
import { formatFcfa } from '../../utils/dashboardStats'

export default function Creances() {
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [clientFiltre, setClientFiltre] = useState('')

  useEffect(() => {
    api
      .get('/factures')
      .then((res) => setFactures(res.data))
      .finally(() => setLoading(false))
  }, [])

  const creances = factures.filter(
    (f) => ['emise', 'partiellement_reglee'].includes(f.statut) && Number(f.solde_restant) > 0,
  )

  const clientsDisponibles = useMemo(() => {
    const map = new Map()
    creances.forEach((f) => f.client && map.set(f.client.id, f.client.nom))
    return [...map.entries()]
  }, [creances])

  const filtrees = clientFiltre
    ? creances.filter((f) => String(f.client?.id) === clientFiltre)
    : creances

  const montantTotal = filtrees.reduce((sum, f) => sum + Number(f.solde_restant), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Créances clients</h2>
        <p className="text-sm text-slate-500">
          Montant total dû : <span className="font-semibold text-slate-800">{formatFcfa(montantTotal)}</span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <select
          value={clientFiltre}
          onChange={(e) => setClientFiltre(e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Tous les clients</option>
          {clientsDisponibles.map(([id, nom]) => (
            <option key={id} value={id}>{nom}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : filtrees.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune créance en cours.</p>
      ) : (
        <table className="w-full text-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Facture</th>
              <th className="text-left px-4 py-2">Client</th>
              <th className="text-left px-4 py-2">Échéance</th>
              <th className="text-right px-4 py-2">Total TTC</th>
              <th className="text-right px-4 py-2">Reste dû</th>
              <th className="text-left px-4 py-2">Statut</th>
              <th className="text-left px-4 py-2">Commercial</th>
            </tr>
          </thead>
          <tbody>
            {filtrees.map((f) => (
              <tr key={f.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <Link to={`/factures/${f.id}`} className="text-indigo-600 hover:underline">{f.numero}</Link>
                </td>
                <td className="px-4 py-2">{f.client?.nom}</td>
                <td className="px-4 py-2">{f.date_echeance ?? '—'}</td>
                <td className="px-4 py-2 text-right">{formatFcfa(f.total_ttc)}</td>
                <td className="px-4 py-2 text-right font-medium">{formatFcfa(f.solde_restant)}</td>
                <td className="px-4 py-2"><StatutBadge statut={f.statut} /></td>
                <td className="px-4 py-2">{f.commercial?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
