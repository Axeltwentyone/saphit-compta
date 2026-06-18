import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, FileText, Clock, TrendingUp } from 'lucide-react'
import api from '../../api/client'
import StatCard from '../../components/StatCard'
import StatutBadge from '../../components/StatutBadge'
import { buildPropositionStats, formatFcfa } from '../../utils/dashboardStats'

export default function CommercialDashboard() {
  const [propositions, setPropositions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/propositions')
      .then((res) => setPropositions(res.data))
      .finally(() => setLoading(false))
  }, [])

  const stats = buildPropositionStats(propositions)
  const dernieres = [...propositions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Vue d'ensemble de mes propositions</p>
        <Link
          to="/propositions/nouvelle"
          className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700"
        >
          + Nouvelle proposition
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} color="blue" label="CA aujourd'hui" value={formatFcfa(stats.caJour)} />
        <StatCard icon={TrendingUp} color="green" label="CA ce mois" value={formatFcfa(stats.caMois)} />
        <StatCard icon={Clock} color="orange" label="Propositions en cours" value={stats.enCours} />
        <StatCard icon={FileText} color="purple" label="Converties ce mois" value={stats.convertieCeMois} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Mes dernières propositions</h2>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Chargement…</p>
        ) : dernieres.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aucune proposition pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left px-4 py-2">Numéro</th>
                <th className="text-left px-4 py-2">Client</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-right px-4 py-2">Total TTC</th>
                <th className="text-left px-4 py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {dernieres.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{p.numero}</td>
                  <td className="px-4 py-2">{p.client?.nom}</td>
                  <td className="px-4 py-2">{p.date}</td>
                  <td className="px-4 py-2 text-right">{formatFcfa(p.total_ttc)}</td>
                  <td className="px-4 py-2">
                    <StatutBadge statut={p.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-slate-100">
          <Link to="/propositions" className="text-sm text-indigo-600 hover:underline">
            Voir toutes mes propositions →
          </Link>
        </div>
      </div>
    </div>
  )
}
