import { useEffect, useState } from 'react'
import api from '../../api/client'
import { formatFcfa } from '../../utils/dashboardStats'

const MODES_REGLEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'autre', label: 'Autre' },
]

function LigneAvance({ avance, onAffectee }) {
  const [facturesClient, setFacturesClient] = useState(null)
  const [factureChoisie, setFactureChoisie] = useState('')

  function ouvrirAffectation() {
    if (facturesClient) {
      setFacturesClient(null)
      return
    }
    api.get('/factures', { params: { client_id: avance.client_id } }).then((res) => {
      setFacturesClient(res.data.filter((f) => Number(f.solde_restant) > 0))
    })
  }

  async function affecter() {
    if (!factureChoisie) return
    await api.patch(`/paiements/${avance.id}/affecter`, { facture_id: Number(factureChoisie) })
    onAffectee()
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2">{avance.date}</td>
      <td className="px-4 py-2">{avance.client?.nom}</td>
      <td className="px-4 py-2">{MODES_REGLEMENT.find((m) => m.value === avance.mode_reglement)?.label}</td>
      <td className="px-4 py-2 text-right">{formatFcfa(avance.montant)}</td>
      <td className="px-4 py-2 text-right">
        {facturesClient === null ? (
          <button onClick={ouvrirAffectation} className="text-sm text-indigo-600 hover:underline">
            Affecter
          </button>
        ) : (
          <div className="flex justify-end gap-2">
            <select
              value={factureChoisie}
              onChange={(e) => setFactureChoisie(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-sm"
            >
              <option value="">— Facture —</option>
              {facturesClient.map((f) => (
                <option key={f.id} value={f.id}>{f.numero} ({formatFcfa(f.solde_restant)} dû)</option>
              ))}
            </select>
            <button onClick={affecter} className="text-sm bg-indigo-600 text-white rounded px-2 py-1 hover:bg-indigo-700">
              OK
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function Avances() {
  const [avances, setAvances] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState('')
  const [montant, setMontant] = useState('')
  const [modeReglement, setModeReglement] = useState('especes')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState(null)

  function load() {
    setLoading(true)
    api
      .get('/paiements', { params: { non_affecte: 1 } })
      .then((res) => setAvances(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/clients').then((res) => setClients(res.data))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/paiements', {
        client_id: Number(clientId),
        montant: Number(montant),
        mode_reglement: modeReglement,
        date,
      })
      setClientId('')
      setMontant('')
      load()
    } catch (err) {
      setError(err.response?.data?.message ?? "Erreur lors de l'enregistrement.")
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Avances</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-600 mb-1">Client *</label>
          <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
            <option value="">— Choisir —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Montant *</label>
          <input type="number" min="0.01" step="0.01" required value={montant} onChange={(e) => setMontant(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Mode</label>
          <select value={modeReglement} onChange={(e) => setModeReglement(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
            {MODES_REGLEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700">
          + Enregistrer
        </button>
        {error && <p className="md:col-span-5 text-sm text-red-600">{error}</p>}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Avances en attente d'affectation</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : avances.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune avance non affectée.</p>
        ) : (
          <table className="w-full text-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Client</th>
                <th className="text-left px-4 py-2">Mode</th>
                <th className="text-right px-4 py-2">Montant</th>
                <th className="text-right px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {avances.map((a) => (
                <LigneAvance key={a.id} avance={a} onAffectee={load} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
