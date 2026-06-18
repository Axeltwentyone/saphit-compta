import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Send, Trash2, FileText } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StatutBadge from '../../components/StatutBadge'
import { buildPipeline, formatFcfa } from '../../utils/dashboardStats'

const PAGE_SIZE = 10

export default function PropositionsList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isGestionnaire = user.role === 'comptable' || user.role === 'dg'

  const [propositions, setPropositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [statutFiltre, setStatutFiltre] = useState('')
  const [clientFiltre, setClientFiltre] = useState('')
  const [commercialFiltre, setCommercialFiltre] = useState('')
  const [page, setPage] = useState(1)

  function load() {
    setLoading(true)
    api
      .get('/propositions')
      .then((res) => setPropositions(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const clientsDisponibles = useMemo(() => {
    const map = new Map()
    propositions.forEach((p) => p.client && map.set(p.client.id, p.client.nom))
    return [...map.entries()]
  }, [propositions])

  const commerciauxDisponibles = useMemo(() => {
    const map = new Map()
    propositions.forEach((p) => p.commercial && map.set(p.commercial.id, p.commercial.name))
    return [...map.entries()]
  }, [propositions])

  const filtrees = propositions.filter((p) => {
    if (statutFiltre && p.statut !== statutFiltre) return false
    if (clientFiltre && String(p.client?.id) !== clientFiltre) return false
    if (commercialFiltre && String(p.commercial?.id) !== commercialFiltre) return false
    if (recherche && !`${p.numero} ${p.client?.nom}`.toLowerCase().includes(recherche.toLowerCase())) {
      return false
    }
    return true
  })

  const pipeline = buildPipeline(propositions)
  const totalGeneral = propositions.reduce((sum, p) => sum + Number(p.total_ttc), 0)

  const totalPages = Math.max(1, Math.ceil(filtrees.length / PAGE_SIZE))
  const pageBornee = Math.min(page, totalPages)
  const pagePropositions = filtrees.slice((pageBornee - 1) * PAGE_SIZE, pageBornee * PAGE_SIZE)

  function peutGerer(p) {
    return user.role === 'dg' || (p.statut === 'brouillon' && p.user_id === user.id)
  }

  async function soumettre(p) {
    await api.post(`/propositions/${p.id}/submit`)
    load()
  }

  async function supprimer(p) {
    if (!window.confirm(`Supprimer la proposition ${p.numero} ?`)) return
    await api.delete(`/propositions/${p.id}`)
    load()
  }

  async function convertir(p) {
    const res = await api.post(`/propositions/${p.id}/convertir`)
    navigate(`/factures/${res.data.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          {isGestionnaire ? 'Toutes les propositions' : 'Mes propositions'}
        </h2>
        <Link
          to="/propositions/nouvelle"
          className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700"
        >
          + Nouvelle proposition
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
          <p className="text-xs text-slate-500">Toutes</p>
          <p className="text-lg font-semibold text-slate-800">{propositions.length}</p>
          <p className="text-xs text-slate-400">{formatFcfa(totalGeneral)}</p>
        </div>
        {pipeline.map(({ statut, count, total }) => (
          <div key={statut} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
            <StatutBadge statut={statut} />
            <p className="text-lg font-semibold text-slate-800 mt-1">{count}</p>
            <p className="text-xs text-slate-400">{formatFcfa(total)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Rechercher une proposition…"
          value={recherche}
          onChange={(e) => {
            setRecherche(e.target.value)
            setPage(1)
          }}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm flex-1 min-w-[180px]"
        />
        <select
          value={statutFiltre}
          onChange={(e) => {
            setStatutFiltre(e.target.value)
            setPage(1)
          }}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="soumise">Soumise</option>
          <option value="convertie">Convertie</option>
          <option value="rejetee">Rejetée</option>
        </select>
        <select
          value={clientFiltre}
          onChange={(e) => {
            setClientFiltre(e.target.value)
            setPage(1)
          }}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">Tous les clients</option>
          {clientsDisponibles.map(([id, nom]) => (
            <option key={id} value={id}>{nom}</option>
          ))}
        </select>
        {isGestionnaire && (
          <select
            value={commercialFiltre}
            onChange={(e) => {
              setCommercialFiltre(e.target.value)
              setPage(1)
            }}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">Tous les commerciaux</option>
            {commerciauxDisponibles.map(([id, nom]) => (
              <option key={id} value={id}>{nom}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : filtrees.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune proposition ne correspond à ces critères.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2">Numéro</th>
                <th className="text-left px-4 py-2">Client</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-right px-4 py-2">Total TTC</th>
                <th className="text-left px-4 py-2">Statut</th>
                {isGestionnaire && <th className="text-left px-4 py-2">Commercial</th>}
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagePropositions.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{p.numero}</td>
                  <td className="px-4 py-2">{p.client?.nom}</td>
                  <td className="px-4 py-2">{p.date}</td>
                  <td className="px-4 py-2 text-right">{formatFcfa(p.total_ttc)}</td>
                  <td className="px-4 py-2">
                    <StatutBadge statut={p.statut} />
                  </td>
                  {isGestionnaire && <td className="px-4 py-2">{p.commercial?.name}</td>}
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/propositions/${p.id}`)}
                        className="text-slate-400 hover:text-indigo-600"
                        title="Voir"
                      >
                        <Eye size={16} />
                      </button>
                      {peutGerer(p) && p.statut === 'brouillon' && (
                        <button onClick={() => soumettre(p)} className="text-slate-400 hover:text-emerald-600" title="Soumettre">
                          <Send size={16} />
                        </button>
                      )}
                      {isGestionnaire && p.statut === 'soumise' && (
                        <button onClick={() => convertir(p)} className="text-slate-400 hover:text-indigo-600" title="Convertir en facture">
                          <FileText size={16} />
                        </button>
                      )}
                      {peutGerer(p) && (
                        <button onClick={() => supprimer(p)} className="text-slate-400 hover:text-red-600" title="Supprimer">
                          <Trash2 size={16} />
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
              <button
                disabled={pageBornee <= 1}
                onClick={() => setPage(pageBornee - 1)}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Précédent
              </button>
              <button
                disabled={pageBornee >= totalPages}
                onClick={() => setPage(pageBornee + 1)}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
