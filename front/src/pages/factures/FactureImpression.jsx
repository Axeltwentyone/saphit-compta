import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Printer } from 'lucide-react'
import api from '../../api/client'
import { formatFcfa } from '../../utils/dashboardStats'
import { montantEnLettres } from '../../utils/montantEnLettres'

const STATUT_STYLES = {
  brouillon: 'bg-slate-100 text-slate-700 border-slate-200',
  emise: 'bg-blue-50 text-blue-700 border-blue-200',
  partiellement_reglee: 'bg-amber-50 text-amber-700 border-amber-200',
  soldee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  annulee: 'bg-red-50 text-red-700 border-red-200',
}

const STATUT_LABELS = {
  brouillon: 'Brouillon',
  emise: 'Émise',
  partiellement_reglee: 'Partiellement réglée',
  soldee: 'Soldée',
  annulee: 'Annulée',
}

const MODES_REGLEMENT = {
  especes: 'Espèces',
  virement: 'Virement bancaire',
  cheque: 'Chèque',
  mobile_money: 'Mobile money',
  autre: 'Autre',
}

export default function FactureImpression() {
  const { id } = useParams()
  const [facture, setFacture] = useState(null)
  const [parametres, setParametres] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.get(`/factures/${id}`), api.get('/parametres')])
      .then(([factureRes, parametresRes]) => {
        setFacture(factureRes.data)
        setParametres(parametresRes.data)
      })
      .catch(() => setError('Facture introuvable ou accès refusé.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="p-8 text-sm text-slate-500">Chargement…</p>
  if (error) return <p className="p-8 text-sm text-red-600">{error}</p>

  const totalPaye = facture.paiements.reduce((sum, p) => sum + Number(p.montant), 0)
  const tauxTva = Number(facture.total_ht) > 0 ? Math.round((Number(facture.total_tva) / Number(facture.total_ht)) * 100) : Number(parametres.tva_taux)
  const qrContenu = `FACTURE:${facture.numero}\nMONTANT:${facture.total_ttc} ${parametres.devise}\nDATE:${facture.date}`

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <Link to={`/factures/${facture.id}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Retour à la facture
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700"
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-sm print:shadow-none my-6 print:my-0 p-10 text-sm text-slate-800">
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
              S
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">SAPHIR</p>
              <p className="text-xs text-slate-500">Gestion Commerciale &amp; Comptable</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 tracking-wide">
              PROFORMA
              {!['brouillon', 'annulee'].includes(facture.statut) && (
                <span className="text-base font-semibold text-emerald-600"> (VALIDÉ)</span>
              )}
            </p>
            <p className="inline-block mt-1 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded">
              {facture.numero}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between py-4 text-xs text-slate-600">
          <div className="space-y-0.5">
            {parametres.raison_sociale && <p className="font-medium text-slate-800">{parametres.raison_sociale}</p>}
            {parametres.adresse && <p>{parametres.adresse}</p>}
            {parametres.telephone && <p>Tél. : {parametres.telephone}</p>}
          </div>
          <div className="text-right space-y-0.5">
            <p>Date de facture : <span className="font-medium text-slate-800">{facture.date}</span></p>
            {facture.date_echeance && (
              <p>Date d'échéance : <span className="font-medium text-slate-800">{facture.date_echeance}</span></p>
            )}
            {facture.commercial && (
              <p>Commercial : <span className="font-medium text-slate-800">{facture.commercial.name}</span></p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">FACTURÉ À</p>
            <p className="font-medium text-slate-800">{facture.client?.nom}</p>
            {facture.client?.telephone && <p className="text-xs text-slate-600">{facture.client.telephone}</p>}
            {facture.client?.email && <p className="text-xs text-slate-600">{facture.client.email}</p>}
            {facture.client?.adresse && <p className="text-xs text-slate-600">{facture.client.adresse}</p>}
          </div>

          <div className={`border rounded-lg p-3 ${STATUT_STYLES[facture.statut]}`}>
            <p className="text-xs font-semibold mb-1">STATUT</p>
            <p className="font-semibold mb-2">{STATUT_LABELS[facture.statut]}</p>
            <p className="text-xs">Montant TTC</p>
            <p className="font-bold text-base mb-2">{formatFcfa(facture.total_ttc)}</p>
            {facture.type === 'facture' && (
              <div className="flex justify-between text-xs">
                <span>Payé : {formatFcfa(totalPaye)}</span>
                <span>Reste : {formatFcfa(facture.solde_restant)}</span>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center text-center">
            <QRCodeSVG value={qrContenu} size={80} />
            <p className="text-[10px] text-slate-400 mt-1">Aperçu de la facture</p>
          </div>
        </div>

        <table className="w-full text-xs border border-slate-200 rounded overflow-hidden mb-4">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2 w-8">#</th>
              <th className="text-left px-3 py-2">Désignation</th>
              <th className="text-right px-3 py-2">Qté</th>
              <th className="text-right px-3 py-2">Prix unit.</th>
              <th className="text-right px-3 py-2">Remise %</th>
              <th className="text-right px-3 py-2">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes.map((l, i) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2">{l.designation}</td>
                <td className="px-3 py-2 text-right">{l.quantite}</td>
                <td className="px-3 py-2 text-right">{formatFcfa(l.prix_unitaire)}</td>
                <td className="px-3 py-2 text-right">{l.remise_pourcentage}</td>
                <td className="px-3 py-2 text-right font-medium">{formatFcfa(l.total_ligne)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-start justify-between gap-6 mb-4">
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Arrêtée la présente facture à la somme de :</p>
            <p className="border border-slate-200 rounded px-3 py-2 text-xs font-medium bg-slate-50">
              {montantEnLettres(facture.total_ttc, parametres.devise)}
            </p>
          </div>
          <table className="text-xs w-64">
            <tbody>
              <tr>
                <td className="py-1 text-slate-500">Total HT</td>
                <td className="py-1 text-right font-medium">{formatFcfa(facture.total_ht)}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">TVA ({tauxTva}%)</td>
                <td className="py-1 text-right font-medium">{formatFcfa(facture.total_tva)}</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="py-1.5 font-semibold text-slate-800">TOTAL TTC</td>
                <td className="py-1.5 text-right font-bold text-base text-indigo-700">{formatFcfa(facture.total_ttc)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {facture.paiements.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">HISTORIQUE DES PAIEMENTS</p>
            <table className="w-full text-xs border border-slate-200 rounded overflow-hidden">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-1.5">Date</th>
                  <th className="text-left px-3 py-1.5">Mode de paiement</th>
                  <th className="text-right px-3 py-1.5">Montant</th>
                </tr>
              </thead>
              <tbody>
                {facture.paiements.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-1.5">{p.date}</td>
                    <td className="px-3 py-1.5">{MODES_REGLEMENT[p.mode_reglement]}</td>
                    <td className="px-3 py-1.5 text-right">{formatFcfa(p.montant)}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 font-semibold">
                  <td className="px-3 py-1.5" colSpan={2}>Total payé</td>
                  <td className="px-3 py-1.5 text-right">{formatFcfa(totalPaye)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">CONDITIONS DE RÈGLEMENT</p>
            <ul className="text-xs text-slate-600 list-disc pl-4 space-y-0.5">
              <li>Règlement à 30 jours fin de mois.</li>
              <li>En cas de retard, des pénalités pourront être appliquées.</li>
            </ul>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-xs font-semibold text-slate-500 mb-1">CACHET &amp; SIGNATURE</p>
            <div className="border border-dashed border-slate-300 rounded w-40 h-20" />
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 mt-6 pt-3 border-t border-slate-200">
          <p>Merci pour votre confiance !</p>
          <p>{parametres.raison_sociale ?? 'SAPHIR'} — Ce document est une facture originale.</p>
        </div>
      </div>
    </div>
  )
}
