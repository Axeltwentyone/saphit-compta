import { useEffect, useState } from 'react'
import api from '../../api/client'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [adresse, setAdresse] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    setLoading(true)
    api
      .get('/clients')
      .then((res) => setClients(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.post('/clients', { nom, telephone: telephone || null, email: email || null, adresse: adresse || null })
      setNom('')
      setTelephone('')
      setEmail('')
      setAdresse('')
      load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création du client.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
      >
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-600 mb-1">Nom *</label>
          <input
            type="text"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Téléphone</label>
          <input
            type="text"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          + Ajouter
        </button>
        {error && <p className="md:col-span-5 text-sm text-red-600">{error}</p>}
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun client pour le moment.</p>
      ) : (
        <table className="w-full text-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Nom</th>
              <th className="text-left px-4 py-2">Téléphone</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Adresse</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-700">{c.nom}</td>
                <td className="px-4 py-2">{c.telephone ?? '—'}</td>
                <td className="px-4 py-2">{c.email ?? '—'}</td>
                <td className="px-4 py-2">{c.adresse ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
