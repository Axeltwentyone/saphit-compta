import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import LignesEditor, { emptyLigne } from '../../components/LignesEditor'

export default function PropositionForm() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [produits, setProduits] = useState([])
  const [clientId, setClientId] = useState('')
  const [newClientNom, setNewClientNom] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [remarque, setRemarque] = useState('')
  const [lignes, setLignes] = useState([emptyLigne()])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/clients').then((res) => setClients(res.data))
    api.get('/produits', { params: { actif: 1 } }).then((res) => setProduits(res.data))
  }, [])

  async function resolveClientId() {
    if (clientId) return Number(clientId)
    if (!newClientNom.trim()) throw new Error('Sélectionnez ou créez un client.')
    const res = await api.post('/clients', { nom: newClientNom.trim() })
    return res.data.id
  }

  async function handleSave(submit) {
    setError(null)
    setSubmitting(true)
    try {
      const finalClientId = await resolveClientId()
      const payload = {
        client_id: finalClientId,
        date,
        remarque: remarque || null,
        lignes: lignes.map((l) => ({
          produit_id: l.produit_id ?? null,
          designation: l.designation,
          quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire),
          remise_pourcentage: Number(l.remise_pourcentage) || 0,
        })),
      }
      const res = await api.post('/propositions', payload)
      if (submit) {
        await api.post(`/propositions/${res.data.id}/submit`)
      }
      navigate('/propositions')
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Erreur lors de la création.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">
        Nouvelle proposition commerciale
      </h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Client existant</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          >
            <option value="">— Choisir —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1">
            Ou nouveau client
          </label>
          <input
            type="text"
            value={newClientNom}
            onChange={(e) => setNewClientNom(e.target.value)}
            disabled={!!clientId}
            placeholder="Nom du client"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm disabled:bg-slate-100"
          />
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
          Soumettre à la comptabilité
        </button>
      </div>
    </div>
  )
}
