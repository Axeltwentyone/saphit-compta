import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { formatFcfa } from '../../utils/dashboardStats'

const MODES_REGLEMENT = {
  especes: 'Espèces',
  virement: 'Virement',
  cheque: 'Chèque',
  mobile_money: 'Mobile money',
  autre: 'Autre',
}

export default function Paiements() {
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/paiements')
      .then((res) => setPaiements(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Historique des paiements</h2>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : paiements.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
      ) : (
        <table className="w-full text-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Client</th>
              <th className="text-left px-4 py-2">Facture</th>
              <th className="text-left px-4 py-2">Mode</th>
              <th className="text-left px-4 py-2">Saisi par</th>
              <th className="text-right px-4 py-2">Montant</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.date}</td>
                <td className="px-4 py-2">{p.client?.nom}</td>
                <td className="px-4 py-2">
                  {p.facture ? (
                    <Link to={`/factures/${p.facture.id}`} className="text-indigo-600 hover:underline">{p.facture.numero}</Link>
                  ) : (
                    <span className="text-slate-400">Non affecté</span>
                  )}
                </td>
                <td className="px-4 py-2">{MODES_REGLEMENT[p.mode_reglement]}</td>
                <td className="px-4 py-2">{p.utilisateur?.name}</td>
                <td className="px-4 py-2 text-right">{formatFcfa(p.montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
