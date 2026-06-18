import { useEffect, useState } from 'react'
import api from '../../api/client'

const ACTIONS = [
  { value: '', label: 'Toutes les actions' },
  { value: 'facture.modifier', label: 'Facture modifiée' },
  { value: 'facture.annuler', label: 'Facture annulée' },
  { value: 'utilisateur.creer', label: 'Utilisateur créé' },
  { value: 'utilisateur.modifier', label: 'Utilisateur modifié' },
  { value: 'parametres.modifier', label: 'Paramètres modifiés' },
]

export default function JournalAudit() {
  const [entrees, setEntrees] = useState([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .get('/audit', { params: action ? { action } : {} })
      .then((res) => setEntrees(res.data))
      .finally(() => setLoading(false))
  }, [action])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Journal d'audit</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <select value={action} onChange={(e) => setAction(e.target.value)} className="border border-slate-300 rounded px-3 py-1.5 text-sm">
          {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : entrees.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune entrée d'audit.</p>
      ) : (
        <table className="w-full text-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Action</th>
              <th className="text-left px-4 py-2">Description</th>
              <th className="text-left px-4 py-2">Utilisateur</th>
            </tr>
          </thead>
          <tbody>
            {entrees.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2 whitespace-nowrap">{new Date(e.created_at).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-2">{ACTIONS.find((a) => a.value === e.action)?.label ?? e.action}</td>
                <td className="px-4 py-2">{e.description}</td>
                <td className="px-4 py-2">{e.utilisateur?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
