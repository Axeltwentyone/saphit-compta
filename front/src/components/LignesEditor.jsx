function emptyLigne() {
  return { produit_id: null, designation: '', quantite: 1, prix_unitaire: 0, remise_pourcentage: 0 }
}

export default function LignesEditor({ value, onChange, produits = [] }) {
  function updateLigne(index, field, val) {
    onChange(value.map((l, i) => (i === index ? { ...l, [field]: val } : l)))
  }

  function selectionnerProduit(index, produitId) {
    if (!produitId) {
      updateLigne(index, 'produit_id', null)
      return
    }
    const produit = produits.find((p) => String(p.id) === produitId)
    onChange(
      value.map((l, i) =>
        i === index
          ? {
              ...l,
              produit_id: produit.id,
              designation: produit.designation,
              prix_unitaire: produit.prix_vente,
            }
          : l,
      ),
    )
  }

  function addLigne() {
    onChange([...value, emptyLigne()])
  }

  function removeLigne(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  const totalHt = value.reduce((sum, l) => {
    const qte = Number(l.quantite) || 0
    const prix = Number(l.prix_unitaire) || 0
    const remise = Number(l.remise_pourcentage) || 0
    return sum + qte * prix * (1 - remise / 100)
  }, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm text-slate-600">Lignes</label>
        <button type="button" onClick={addLigne} className="text-sm text-indigo-600 hover:underline">
          + Ajouter une ligne
        </button>
      </div>

      <table className="w-full text-sm border border-slate-200 rounded overflow-hidden">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {produits.length > 0 && <th className="text-left px-3 py-2 w-40">Produit</th>}
            <th className="text-left px-3 py-2">Désignation</th>
            <th className="text-right px-3 py-2 w-24">Qté</th>
            <th className="text-right px-3 py-2 w-32">Prix unit.</th>
            <th className="text-right px-3 py-2 w-24">Remise %</th>
            <th className="text-right px-3 py-2 w-32">Total</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {value.map((l, i) => {
            const total =
              (Number(l.quantite) || 0) *
              (Number(l.prix_unitaire) || 0) *
              (1 - (Number(l.remise_pourcentage) || 0) / 100)
            return (
              <tr key={i} className="border-t border-slate-200">
                {produits.length > 0 && (
                  <td className="px-2 py-1">
                    <select
                      value={l.produit_id ?? ''}
                      onChange={(e) => selectionnerProduit(i, e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1"
                    >
                      <option value="">— Texte libre —</option>
                      {produits.map((p) => (
                        <option key={p.id} value={p.id}>{p.designation}</option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="px-2 py-1">
                  <input
                    type="text"
                    required
                    value={l.designation}
                    onChange={(e) => updateLigne(i, 'designation', e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={l.quantite}
                    onChange={(e) => updateLigne(i, 'quantite', e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-right"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.prix_unitaire}
                    onChange={(e) => updateLigne(i, 'prix_unitaire', e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-right"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={l.remise_pourcentage}
                    onChange={(e) => updateLigne(i, 'remise_pourcentage', e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-right"
                  />
                </td>
                <td className="px-3 py-1 text-right font-medium text-slate-700">
                  {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-center">
                  {value.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLigne(i)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex justify-end mt-2">
        <p className="text-base font-semibold text-slate-800">
          Total HT : {totalHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA
        </p>
      </div>
    </div>
  )
}

export { emptyLigne }
