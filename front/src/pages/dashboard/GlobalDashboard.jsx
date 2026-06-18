import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Wallet, TrendingUp, FileText, Receipt, Percent } from 'lucide-react'
import api from '../../api/client'
import StatCard from '../../components/StatCard'
import StatutBadge from '../../components/StatutBadge'
import {
  buildPropositionStats,
  buildPipeline,
  buildFactureCaStats,
  buildCaParJourFactures,
  buildPerformanceParCommercial,
  formatFcfa,
} from '../../utils/dashboardStats'

export default function GlobalDashboard() {
  const [propositions, setPropositions] = useState([])
  const [factures, setFactures] = useState([])
  const [avoirs, setAvoirs] = useState([])
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/propositions'),
      api.get('/factures'),
      api.get('/factures', { params: { type: 'avoir' } }),
      api.get('/produits', { params: { actif: 1 } }),
    ])
      .then(([propRes, factRes, avoirRes, produitsRes]) => {
        setPropositions(propRes.data)
        setFactures(factRes.data)
        setAvoirs(avoirRes.data)
        setProduits(produitsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const produitsSousSeuil = produits.filter((p) => p.sous_seuil)

  const statsPropositions = buildPropositionStats(propositions)
  const pipeline = buildPipeline(propositions)
  const { caJour, caMois, facturesEmisesCeMois } = buildFactureCaStats(factures, avoirs)
  const caParJour = buildCaParJourFactures(factures, avoirs)
  const performanceParCommercial = buildPerformanceParCommercial(propositions, factures, avoirs)

  const dernieresFactures = [...factures].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)
  const creances = factures
    .filter((f) => ['emise', 'partiellement_reglee'].includes(f.statut) && Number(f.solde_restant) > 0)
    .sort((a, b) => Number(b.solde_restant) - Number(a.solde_restant))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Wallet} color="blue" label="CA aujourd'hui" value={formatFcfa(caJour)} />
        <StatCard icon={TrendingUp} color="green" label="CA ce mois" value={formatFcfa(caMois)} />
        <StatCard icon={FileText} color="purple" label="Propositions en cours" value={statsPropositions.enCours} />
        <StatCard icon={Receipt} color="orange" label="Factures émises ce mois" value={facturesEmisesCeMois} />
        <StatCard icon={Percent} color="teal" label="Taux de conversion" value={`${statsPropositions.tauxConversion}%`} sublabel="Propositions, ce mois" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Pipeline des propositions</h2>
          <div className="space-y-2">
            {pipeline.map(({ statut, count, total }) => (
              <div key={statut} className="flex items-center justify-between text-sm">
                <StatutBadge statut={statut} />
                <span className="text-slate-600">
                  {count} · {formatFcfa(total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Évolution du CA facturé (ce mois)</h2>
          {caMois === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">
              Pas encore de factures émises ce mois-ci.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={caParJour}>
                <defs>
                  <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="jour" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" width={70} />
                <Tooltip formatter={(value) => formatFcfa(value)} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#caGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Dernières factures</h2>
          <Link to="/factures" className="text-xs text-indigo-600 hover:underline">Voir tout</Link>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Chargement…</p>
        ) : dernieresFactures.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucune facture pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left px-4 py-2">Numéro</th>
                <th className="text-left px-4 py-2">Client</th>
                <th className="text-right px-4 py-2">Total TTC</th>
                <th className="text-left px-4 py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {dernieresFactures.map((f) => (
                <tr key={f.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <Link to={`/factures/${f.id}`} className="text-indigo-600 hover:underline">{f.numero}</Link>
                  </td>
                  <td className="px-4 py-2">{f.client?.nom}</td>
                  <td className="px-4 py-2 text-right">{formatFcfa(f.total_ttc)}</td>
                  <td className="px-4 py-2"><StatutBadge statut={f.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Performance par commercial</h2>
        </div>
        {performanceParCommercial.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucune donnée pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left px-4 py-2">Commercial</th>
                <th className="text-right px-4 py-2">Propositions</th>
                <th className="text-right px-4 py-2">CA facturé</th>
              </tr>
            </thead>
            <tbody>
              {performanceParCommercial.map((c) => (
                <tr key={c.nom} className="border-t border-slate-100">
                  <td className="px-4 py-2">{c.nom}</td>
                  <td className="px-4 py-2 text-right">{c.nbPropositions}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatFcfa(c.caFacture)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Créances clients</h2>
            <Link to="/creances" className="text-xs text-indigo-600 hover:underline">Voir tout</Link>
          </div>
          {creances.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Aucune créance en cours.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2">Facture</th>
                  <th className="text-left px-4 py-2">Client</th>
                  <th className="text-right px-4 py-2">Reste dû</th>
                </tr>
              </thead>
              <tbody>
                {creances.map((f) => (
                  <tr key={f.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <Link to={`/factures/${f.id}`} className="text-indigo-600 hover:underline">{f.numero}</Link>
                    </td>
                    <td className="px-4 py-2">{f.client?.nom}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatFcfa(f.solde_restant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Stock — Articles sous seuil</h2>
            <Link to="/stock" className="text-xs text-indigo-600 hover:underline">Voir tout</Link>
          </div>
          {produitsSousSeuil.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Aucun article sous le seuil d'alerte.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {produitsSousSeuil.map((p) => (
                <li key={p.id} className="px-4 py-2 flex items-center justify-between text-sm">
                  <Link to={`/stock/${p.id}`} className="text-indigo-600 hover:underline">{p.designation}</Link>
                  <span className="text-amber-600 font-medium">{Number(p.quantite_stock)} {p.unite_mesure}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
