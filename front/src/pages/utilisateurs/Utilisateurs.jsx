import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABELS = {
  commercial: 'Commercial',
  comptable: 'Comptabilité',
  dg: 'Administrateur (DG)',
}

function LigneUtilisateur({ utilisateur, onMisAJour, onSupprime, estSoiMeme }) {
  const [edition, setEdition] = useState(false)
  const [name, setName] = useState(utilisateur.name)
  const [email, setEmail] = useState(utilisateur.email)
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(utilisateur.role)
  const [actif, setActif] = useState(utilisateur.actif)
  const [enregistrement, setEnregistrement] = useState(false)
  const [error, setError] = useState(null)

  async function enregistrer(e) {
    e.preventDefault()
    setEnregistrement(true)
    setError(null)
    try {
      const res = await api.put(`/utilisateurs/${utilisateur.id}`, {
        name,
        email,
        role,
        actif,
        password: password || undefined,
      })
      onMisAJour(res.data)
      setEdition(false)
      setPassword('')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erreur lors de la modification.')
    } finally {
      setEnregistrement(false)
    }
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer ${utilisateur.name} ?`)) return
    await api.delete(`/utilisateurs/${utilisateur.id}`)
    onSupprime(utilisateur.id)
  }

  if (edition) {
    return (
      <tr className="border-t border-slate-100 bg-slate-50">
        <td colSpan={5} className="px-4 py-3">
          <form onSubmit={enregistrer} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nom</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nouveau mot de passe</label>
              <input type="password" minLength={8} placeholder="Inchangé si vide" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Rôle</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
                {Object.entries(ROLE_LABELS).map(([valeur, label]) => (
                  <option key={valeur} value={valeur}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Statut</label>
              <select value={actif ? '1' : '0'} onChange={(e) => setActif(e.target.value === '1')} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
                <option value="1">Actif</option>
                <option value="0">Désactivé</option>
              </select>
            </div>
            <div className="md:col-span-5 flex gap-3 items-center">
              <button type="submit" disabled={enregistrement} className="bg-indigo-600 text-white rounded px-3 py-1.5 text-sm hover:bg-indigo-700 disabled:opacity-50">
                Enregistrer
              </button>
              <button type="button" onClick={() => setEdition(false)} className="text-sm text-slate-500 hover:underline">
                Annuler
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2 font-medium text-slate-700">{utilisateur.name}</td>
      <td className="px-4 py-2">{utilisateur.email}</td>
      <td className="px-4 py-2">{ROLE_LABELS[utilisateur.role]}</td>
      <td className="px-4 py-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${utilisateur.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {utilisateur.actif ? 'Actif' : 'Désactivé'}
        </span>
      </td>
      <td className="px-4 py-2">
        <div className="flex justify-end gap-2">
          <button onClick={() => setEdition(true)} className="text-slate-400 hover:text-indigo-600" title="Modifier">
            <Pencil size={16} />
          </button>
          {!estSoiMeme && (
            <button onClick={supprimer} className="text-slate-400 hover:text-red-600" title="Supprimer">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function Utilisateurs() {
  const { user: utilisateurConnecte } = useAuth()
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('commercial')
  const [error, setError] = useState(null)

  function load() {
    setLoading(true)
    api.get('/utilisateurs').then((res) => setUtilisateurs(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/utilisateurs', { name, email, password, role })
      setName('')
      setEmail('')
      setPassword('')
      setRole('commercial')
      load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création.')
    }
  }

  function remplacer(utilisateurMisAJour) {
    setUtilisateurs((prev) => prev.map((u) => (u.id === utilisateurMisAJour.id ? utilisateurMisAJour : u)))
  }

  function retirer(id) {
    setUtilisateurs((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Utilisateurs</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Nom *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Mot de passe *</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
            {Object.entries(ROLE_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>{label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700">
          + Créer
        </button>
        {error && <p className="md:col-span-5 text-sm text-red-600">{error}</p>}
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <table className="w-full text-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Nom</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Rôle</th>
              <th className="text-left px-4 py-2">Statut</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <LigneUtilisateur
                key={u.id}
                utilisateur={u}
                onMisAJour={remplacer}
                onSupprime={retirer}
                estSoiMeme={u.id === utilisateurConnecte.id}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
