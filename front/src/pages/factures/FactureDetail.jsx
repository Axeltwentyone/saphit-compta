import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Send, Ban, RotateCcw, Plus, Printer } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StatutBadge from '../../components/StatutBadge'
import LignesEditor, { emptyLigne } from '../../components/LignesEditor'
import { formatFcfa } from '../../utils/dashboardStats'

const MODES_REGLEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'autre', label: 'Autre' },
]

export default function FactureDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [facture, setFacture] = useState(null)
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formPaiementOuvert, setFormPaiementOuvert] = useState(false)
  const [montant, setMontant] = useState('')
  const [modeReglement, setModeReglement] = useState('especes')
  const [datePaiement, setDatePaiement] = useState(() => new Date().toISOString().slice(0, 10))

  const [formAvoirOuvert, setFormAvoirOuvert] = useState(false)
  const [lignesAvoir, setLignesAvoir] = useState([emptyLigne()])

  function load() {
    setLoading(true)
    api
      .get(`/factures/${id}`)
      .then((res) => setFacture(res.data))
      .catch(() => setError('Facture introuvable ou accès refusé.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])
  useEffect(() => {
    api.get('/produits', { params: { actif: 1 } }).then((res) => setProduits(res.data))
  }, [])

  if (loading) return <p className="text-sm text-slate-500">Chargement…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  const peutGerer =
    user.role === 'dg' ||
    (['brouillon', 'emise'].includes(facture.statut) && Number(facture.solde_restant) === Number(facture.total_ttc))

  async function emettre() {
    const res = await api.post(`/factures/${facture.id}/emettre`)
    setFacture(res.data)
  }

  async function annuler() {
    if (!window.confirm(`Annuler la facture ${facture.numero} ?`)) return
    const res = await api.post(`/factures/${facture.id}/annuler`)
    setFacture(res.data)
  }

  async function enregistrerPaiement(e) {
    e.preventDefault()
    await api.post('/paiements', {
      client_id: facture.client_id,
      facture_id: facture.id,
      montant: Number(montant),
      mode_reglement: modeReglement,
      date: datePaiement,
    })
    setFormPaiementOuvert(false)
    setMontant('')
    load()
  }

  async function emettreAvoir(e) {
    e.preventDefault()
    await api.post(`/factures/${facture.id}/avoir`, {
      date: new Date().toISOString().slice(0, 10),
      lignes: lignesAvoir.map((l) => ({
        produit_id: l.produit_id ?? null,
        designation: l.designation,
        quantite: Number(l.quantite),
        prix_unitaire: Number(l.prix_unitaire),
        remise_pourcentage: Number(l.remise_pourcentage) || 0,
      })),
    })
    setFormAvoirOuvert(false)
    load()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{facture.numero}</h2>
          <div className="mt-1"><StatutBadge statut={facture.statut} /></div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/factures/${facture.id}/imprimer`}
            target="_blank"
            className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            <Printer size={14} /> Imprimer
          </Link>
          {peutGerer && facture.statut === 'brouillon' && (
            <button onClick={emettre} className="flex items-center gap-1.5 bg-emerald-600 text-white rounded px-3 py-1.5 text-sm hover:bg-emerald-700">
              <Send size={14} /> Émettre
            </button>
          )}
          {facture.type === 'facture' && facture.statut !== 'annulee' && (
            <button onClick={() => setFormAvoirOuvert((o) => !o)} className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm hover:bg-slate-50">
              <RotateCcw size={14} /> Émettre un avoir
            </button>
          )}
          {peutGerer && facture.statut !== 'annulee' && (
            <button onClick={annuler} className="flex items-center gap-1.5 border border-red-200 text-red-600 rounded px-3 py-1.5 text-sm hover:bg-red-50">
              <Ban size={14} /> Annuler
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Client</p>
          <p className="font-medium text-slate-800">{facture.client?.nom}</p>
        </div>
        <div>
          <p className="text-slate-500">Commercial</p>
          <p className="font-medium text-slate-800">{facture.commercial?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Date</p>
          <p className="font-medium text-slate-800">{facture.date}</p>
        </div>
        <div>
          <p className="text-slate-500">Échéance</p>
          <p className="font-medium text-slate-800">{facture.date_echeance ?? '—'}</p>
        </div>
        {facture.origine_facture_id && (
          <div className="col-span-2">
            <p className="text-slate-500">Avoir lié à la facture</p>
            <Link to={`/factures/${facture.origine_facture_id}`} className="text-indigo-600 hover:underline">
              {facture.origine_facture?.numero ?? `#${facture.origine_facture_id}`}
            </Link>
          </div>
        )}
        {facture.remarque && (
          <div className="col-span-2">
            <p className="text-slate-500">Remarque</p>
            <p className="text-slate-800">{facture.remarque}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Désignation</th>
              <th className="text-right px-4 py-2">Qté</th>
              <th className="text-right px-4 py-2">Prix unit.</th>
              <th className="text-right px-4 py-2">Remise %</th>
              <th className="text-right px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{l.designation}</td>
                <td className="px-4 py-2 text-right">{l.quantite}</td>
                <td className="px-4 py-2 text-right">{formatFcfa(l.prix_unitaire)}</td>
                <td className="px-4 py-2 text-right">{l.remise_pourcentage}%</td>
                <td className="px-4 py-2 text-right font-medium">{formatFcfa(l.total_ligne)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap justify-end gap-6 text-sm">
          <span className="text-slate-500">Total HT : <strong className="text-slate-800">{formatFcfa(facture.total_ht)}</strong></span>
          <span className="text-slate-500">TVA : <strong className="text-slate-800">{formatFcfa(facture.total_tva)}</strong></span>
          <span className="text-slate-500">Total TTC : <strong className="text-slate-800">{formatFcfa(facture.total_ttc)}</strong></span>
          {facture.type === 'facture' && (
            <span className="text-slate-500">Solde dû : <strong className="text-slate-800">{formatFcfa(facture.solde_restant)}</strong></span>
          )}
        </div>
      </div>

      {formAvoirOuvert && (
        <form onSubmit={emettreAvoir} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Émettre un avoir</h3>
          <LignesEditor value={lignesAvoir} onChange={setLignesAvoir} produits={produits} />
          <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700">
            Confirmer l'avoir
          </button>
        </form>
      )}

      {facture.avoirs?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Avoirs émis</h3>
          <ul className="space-y-1 text-sm">
            {facture.avoirs.map((a) => (
              <li key={a.id} className="flex justify-between">
                <Link to={`/factures/${a.id}`} className="text-indigo-600 hover:underline">{a.numero}</Link>
                <span>{formatFcfa(a.total_ttc)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {facture.type === 'facture' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Paiements</h3>
            {Number(facture.solde_restant) > 0 && (
              <button onClick={() => setFormPaiementOuvert((o) => !o)} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                <Plus size={14} /> Enregistrer un paiement
              </button>
            )}
          </div>

          {formPaiementOuvert && (
            <form onSubmit={enregistrerPaiement} className="grid grid-cols-4 gap-3 mb-4 items-end">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Montant</label>
                <input type="number" min="0.01" step="0.01" required value={montant} onChange={(e) => setMontant(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Mode</label>
                <select value={modeReglement} onChange={(e) => setModeReglement(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
                  {MODES_REGLEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date</label>
                <input type="date" required value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <button type="submit" className="bg-indigo-600 text-white rounded px-3 py-1.5 text-sm hover:bg-indigo-700">
                Enregistrer
              </button>
            </form>
          )}

          {facture.paiements.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun paiement enregistré.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-1">Date</th>
                  <th className="text-left py-1">Mode</th>
                  <th className="text-right py-1">Montant</th>
                </tr>
              </thead>
              <tbody>
                {facture.paiements.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="py-1">{p.date}</td>
                    <td className="py-1">{MODES_REGLEMENT.find((m) => m.value === p.mode_reglement)?.label}</td>
                    <td className="py-1 text-right">{formatFcfa(p.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
