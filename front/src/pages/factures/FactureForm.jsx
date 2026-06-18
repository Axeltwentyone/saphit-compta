import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import LignesEditor, { emptyLigne } from '../../components/LignesEditor'

const MODES_REGLEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'autre', label: 'Autre' },
]

export default function FactureForm() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [produits, setProduits] = useState([])
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dateEcheance, setDateEcheance] = useState('')
  const [remarque, setRemarque] = useState('')
  const [lignes, setLignes] = useState([emptyLigne()])
  const [acompteMontant, setAcompteMontant] = useState('')
  const [acompteMode, setAcompteMode] = useState('especes')
  const [acompteDate, setAcompteDate] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data))
    api.get('/produits', { params: { actif: 1 } }).then((res) => setProduits(res.data))
  }, [])

  async function handleSave(emettre) {
    setError(null)
    setSubmitting(true)
    try {
      if (!clientId) throw new Error('Sélectionnez un client.')
      const payload = {
        client_id: Number(clientId),
        date,
        date_echeance: dateEcheance || null,
        remarque: remarque || null,
        lignes: lignes.map((l) => ({
          produit_id: l.produit_id ?? null,
          designation: l.designation,
          quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire),
          remise_pourcentage: Number(l.remise_pourcentage) || 0,
        })),
        ...(acompteMontant && {
          acompte_montant: Number(acompteMontant),
          acompte_mode_reglement: acompteMode,
          acompte_date: acompteDate || date,
        }),
      }
      const res = await api.post('/factures', payload)
      if (emettre) {
        await api.post(`/factures/${res.data.id}/emettre`)
      }
      navigate(`/factures/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Erreur lors de la création.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Nouvelle facture</h2>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          >
            <option value="">— Choisir —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">Échéance (optionnel)</label>
          <input
            type="date"
            value={dateEcheance}
            onChange={(e) => setDateEcheance(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <LignesEditor value={lignes} onChange={setLignes} produits={produits} />

      <div>
        <label className="block text-sm text-slate-600 mb-1">Remarque</label>
        <textarea
          value={remarque}
          onChange={(e) => setRemarque(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Acompte déjà versé (optionnel)</h3>
        <p className="text-xs text-slate-500 mb-3">
          À remplir si le client a déjà payé un acompte pour ce travail avant l'émission de la facture.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Montant</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={acompteMontant}
              onChange={(e) => setAcompteMontant(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Mode de règlement</label>
            <select
              value={acompteMode}
              onChange={(e) => setAcompteMode(e.target.value)}
              disabled={!acompteMontant}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm disabled:bg-slate-100"
            >
              {MODES_REGLEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Date de l'acompte</label>
            <input
              type="date"
              value={acompteDate}
              onChange={(e) => setAcompteDate(e.target.value)}
              disabled={!acompteMontant}
              placeholder={date}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSave(false)}
          className="border border-slate-300 text-slate-700 rounded px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
        >
          Enregistrer en brouillon
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSave(true)}
          className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          Émettre la facture
        </button>
      </div>
    </div>
  )
}
