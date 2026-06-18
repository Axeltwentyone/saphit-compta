import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Send, Ban, Printer } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StatutBadge from '../../components/StatutBadge'
import { formatFcfa } from '../../utils/dashboardStats'

const PAGE_SIZE = 10

export default function FacturesList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [statutFiltre, setStatutFiltre] = useState('')
  const [clientFiltre, setClientFiltre] = useState('')
  const [page, setPage] = useState(1)

  function load() {
    setLoading(true)
    api
      .get('/factures')
      .then((res) => setFactures(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const clientsDisponibles = useMemo(() => {
    const map = new Map()
    factures.forEach((f) => f.client && map.set(f.client.id, f.client.nom))
    return [...map.entries()]
  }, [factures])

  const filtrees = factures.filter((f) => {
    if (statutFiltre && f.statut !== statutFiltre) return false
    if (clientFiltre && String(f.client?.id) !== clientFiltre) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtrees.length / PAGE_SIZE))
  const pageBornee = Math.min(page, totalPages)
  const pageFactures = filtrees.slice((pageBornee - 1) * PAGE_SIZE, pageBornee * PAGE_SIZE)

  function peutGerer(f) {
    return (
      user.role === 'dg' ||
      (['brouillon', 'emise'].includes(f.statut) && Number(f.solde_restant) === Number(f.total_ttc))
    )
  }

  async function emettre(f) {
    await api.post(`/factures/${f.id}/emettre`)
    load()
  }

  async function annuler(f) {
    if (!window.confirm(`Annuler la facture ${f.numero} ?`)) return
    await api.post(`/factures/${f.id}/annuler`)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Factures</h2>
        <Link
          to="/factures/nouvelle"
          className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700"
        >
          + Nouvelle facture
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap gap-3">
        <select
          value={statutFiltre}
          onChange={(e) => { setStatutFiltre(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="emise">Émise</option>
          <option value="partiellement_reglee">Partiellement réglée</option>
          <option value="soldee">Soldée</option>
          <option value="annulee">Annulée</option>
        </select>
        <select
          value={clientFiltre}
          onChange={(e) => { setClientFiltre(e.target.value); setPage(1) }}
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
        <p className="text-sm text-slate-500">Aucune facture ne correspond à ces critères.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2">Numéro</th>
                <th className="text-left px-4 py-2">Client</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-right px-4 py-2">Total TTC</th>
                <th className="text-right px-4 py-2">Solde dû</th>
                <th className="text-left px-4 py-2">Statut</th>
                <th className="text-left px-4 py-2">Commercial</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageFactures.map((f) => (
                <tr key={f.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{f.numero}</td>
                  <td className="px-4 py-2">{f.client?.nom}</td>
                  <td className="px-4 py-2">{f.date}</td>
                  <td className="px-4 py-2 text-right">{formatFcfa(f.total_ttc)}</td>
                  <td className="px-4 py-2 text-right">{formatFcfa(f.solde_restant)}</td>
                  <td className="px-4 py-2"><StatutBadge statut={f.statut} /></td>
                  <td className="px-4 py-2">{f.commercial?.name ?? '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/factures/${f.id}`)} className="text-slate-400 hover:text-indigo-600" title="Voir">
                        <Eye size={16} />
                      </button>
                      <Link to={`/factures/${f.id}/imprimer`} target="_blank" className="text-slate-400 hover:text-indigo-600" title="Imprimer">
                        <Printer size={16} />
                      </Link>
                      {peutGerer(f) && f.statut === 'brouillon' && (
                        <button onClick={() => emettre(f)} className="text-slate-400 hover:text-emerald-600" title="Émettre">
                          <Send size={16} />
                        </button>
                      )}
                      {peutGerer(f) && f.statut !== 'annulee' && (
                        <button onClick={() => annuler(f)} className="text-slate-400 hover:text-red-600" title="Annuler">
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>
              Affichage {(pageBornee - 1) * PAGE_SIZE + 1} à {Math.min(pageBornee * PAGE_SIZE, filtrees.length)} sur {filtrees.length}
            </span>
            <div className="flex gap-1">
              <button disabled={pageBornee <= 1} onClick={() => setPage(pageBornee - 1)} className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                Précédent
              </button>
              <button disabled={pageBornee >= totalPages} onClick={() => setPage(pageBornee + 1)} className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
