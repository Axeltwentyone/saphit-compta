import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { telechargerFichier } from '../../utils/download'

function CarteRapport({ titre, description, onCsv, onPdf }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700">{titre}</h3>
      <p className="text-sm text-slate-500 mt-1 mb-4">{description}</p>
      <div className="flex gap-3">
        <button onClick={onCsv} className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm hover:bg-slate-50">
          <FileSpreadsheet size={14} /> CSV
        </button>
        <button onClick={onPdf} className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm hover:bg-slate-50">
          <FileText size={14} /> PDF
        </button>
      </div>
    </div>
  )
}

export default function Rapports() {
  const [dateJournal, setDateJournal] = useState(() => new Date().toISOString().slice(0, 10))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Rapports exportables</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CarteRapport
          titre="Relevé des créances clients"
          description="Toutes les factures émises ou partiellement réglées avec un solde restant dû."
          onCsv={() => telechargerFichier('/rapports/creances/csv', {}, 'creances.csv')}
          onPdf={() => telechargerFichier('/rapports/creances/pdf', {}, 'creances.pdf')}
        />
        <CarteRapport
          titre="État du stock"
          description="Catalogue des produits actifs : stock actuel, seuil d'alerte, valeur du stock."
          onCsv={() => telechargerFichier('/rapports/stock/csv', {}, 'stock.csv')}
          onPdf={() => telechargerFichier('/rapports/stock/pdf', {}, 'stock.pdf')}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700">Journal des ventes</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Toutes les factures émises à la date sélectionnée.</p>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateJournal}
            onChange={(e) => setDateJournal(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => telechargerFichier('/rapports/journal-ventes/csv', { date: dateJournal }, `journal-ventes-${dateJournal}.csv`)}
            className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            <FileSpreadsheet size={14} /> CSV
          </button>
          <button
            onClick={() => telechargerFichier('/rapports/journal-ventes/pdf', { date: dateJournal }, `journal-ventes-${dateJournal}.pdf`)}
            className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>
    </div>
  )
}
