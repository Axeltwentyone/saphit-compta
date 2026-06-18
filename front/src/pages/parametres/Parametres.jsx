import { useEffect, useState } from 'react'
import api from '../../api/client'
import { setDevise } from '../../utils/dashboardStats'

export default function Parametres() {
  const [devise, setDeviseLocale] = useState('FCFA')
  const [tvaTaux, setTvaTaux] = useState('0')
  const [raisonSociale, setRaisonSociale] = useState('')
  const [adresse, setAdresse] = useState('')
  const [telephone, setTelephone] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/parametres').then((res) => {
      setDeviseLocale(res.data.devise)
      setTvaTaux(res.data.tva_taux)
      setRaisonSociale(res.data.raison_sociale ?? '')
      setAdresse(res.data.adresse ?? '')
      setTelephone(res.data.telephone ?? '')
    }).finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const res = await api.put('/parametres', {
        devise,
        tva_taux: Number(tvaTaux),
        raison_sociale: raisonSociale || null,
        adresse: adresse || null,
        telephone: telephone || null,
      })
      setDevise(res.data.devise)
      setMessage('Paramètres enregistrés.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Paramètres</h2>

      {message && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded">{message}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Devise *</label>
          <input type="text" required value={devise} onChange={(e) => setDeviseLocale(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Taux de TVA (%) *</label>
          <input type="number" min="0" max="100" step="0.01" required value={tvaTaux} onChange={(e) => setTvaTaux(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Raison sociale</label>
        <input type="text" value={raisonSociale} onChange={(e) => setRaisonSociale(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Adresse</label>
        <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Téléphone</label>
        <input type="text" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
      </div>

      <p className="text-xs text-slate-500">
        Le nouveau taux de TVA s'applique aux prochaines propositions et factures ; les documents déjà émis ne sont pas recalculés.
      </p>

      <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700">
        Enregistrer
      </button>
    </form>
  )
}
