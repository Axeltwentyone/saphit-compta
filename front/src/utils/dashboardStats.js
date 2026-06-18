function sameDay(dateStr, ref) {
  return dateStr?.slice(0, 10) === ref.toISOString().slice(0, 10)
}

function sameMonth(dateStr, ref) {
  const d = new Date(dateStr)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function buildPropositionStats(propositions, now = new Date()) {
  const convertie = propositions.filter((p) => p.statut === 'convertie')
  const ceMois = propositions.filter((p) => sameMonth(p.date, now))
  const convertieCeMois = ceMois.filter((p) => p.statut === 'convertie')

  const caJour = convertie
    .filter((p) => sameDay(p.date, now))
    .reduce((sum, p) => sum + Number(p.total_ttc), 0)

  const caMois = convertieCeMois.reduce((sum, p) => sum + Number(p.total_ttc), 0)

  const enCours = propositions.filter((p) => p.statut === 'brouillon' || p.statut === 'soumise').length

  const tauxConversion = ceMois.length > 0 ? Math.round((convertieCeMois.length / ceMois.length) * 100) : 0

  return {
    caJour,
    caMois,
    enCours,
    convertieCeMois: convertieCeMois.length,
    tauxConversion,
  }
}

export function buildPipeline(propositions) {
  const statuts = ['brouillon', 'soumise', 'convertie', 'rejetee']
  return statuts.map((statut) => {
    const items = propositions.filter((p) => p.statut === statut)
    return {
      statut,
      count: items.length,
      total: items.reduce((sum, p) => sum + Number(p.total_ttc), 0),
    }
  })
}

export function buildCaParJour(propositions, now = new Date()) {
  const convertieCeMois = propositions.filter(
    (p) => p.statut === 'convertie' && sameMonth(p.date, now),
  )

  const totauxParJour = {}
  for (const p of convertieCeMois) {
    const jour = p.date.slice(8, 10)
    totauxParJour[jour] = (totauxParJour[jour] ?? 0) + Number(p.total_ttc)
  }

  const nbJours = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Array.from({ length: nbJours }, (_, i) => {
    const jour = String(i + 1).padStart(2, '0')
    return { jour, total: totauxParJour[jour] ?? 0 }
  })
}

export function buildTopClients(propositions, limite = 5) {
  const totauxParClient = new Map()

  for (const p of propositions) {
    if (p.statut !== 'convertie' || !p.client) continue
    const cle = p.client.id
    const existant = totauxParClient.get(cle) ?? { nom: p.client.nom, total: 0 }
    existant.total += Number(p.total_ttc)
    totauxParClient.set(cle, existant)
  }

  return [...totauxParClient.values()].sort((a, b) => b.total - a.total).slice(0, limite)
}

const STATUTS_FACTURE_RECONNUS = ['emise', 'partiellement_reglee', 'soldee']

export function buildFactureCaStats(factures, avoirs, now = new Date()) {
  const facturesValides = factures.filter((f) => STATUTS_FACTURE_RECONNUS.includes(f.statut))
  const avoirsValides = avoirs.filter((a) => a.statut !== 'annulee')

  const netDuJour =
    facturesValides.filter((f) => sameDay(f.date, now)).reduce((sum, f) => sum + Number(f.total_ttc), 0) -
    avoirsValides.filter((a) => sameDay(a.date, now)).reduce((sum, a) => sum + Number(a.total_ttc), 0)

  const netDuMois =
    facturesValides.filter((f) => sameMonth(f.date, now)).reduce((sum, f) => sum + Number(f.total_ttc), 0) -
    avoirsValides.filter((a) => sameMonth(a.date, now)).reduce((sum, a) => sum + Number(a.total_ttc), 0)

  const facturesEmisesCeMois = facturesValides.filter((f) => sameMonth(f.date, now)).length

  return { caJour: netDuJour, caMois: netDuMois, facturesEmisesCeMois }
}

export function buildCaParJourFactures(factures, avoirs, now = new Date()) {
  const facturesCeMois = factures.filter(
    (f) => STATUTS_FACTURE_RECONNUS.includes(f.statut) && sameMonth(f.date, now),
  )
  const avoirsCeMois = avoirs.filter((a) => a.statut !== 'annulee' && sameMonth(a.date, now))

  const totauxParJour = {}
  for (const f of facturesCeMois) {
    const jour = f.date.slice(8, 10)
    totauxParJour[jour] = (totauxParJour[jour] ?? 0) + Number(f.total_ttc)
  }
  for (const a of avoirsCeMois) {
    const jour = a.date.slice(8, 10)
    totauxParJour[jour] = (totauxParJour[jour] ?? 0) - Number(a.total_ttc)
  }

  const nbJours = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Array.from({ length: nbJours }, (_, i) => {
    const jour = String(i + 1).padStart(2, '0')
    return { jour, total: totauxParJour[jour] ?? 0 }
  })
}

export function buildPerformanceParCommercial(propositions, factures, avoirs) {
  const parCommercial = new Map()

  function entree(id, nom) {
    if (!parCommercial.has(id)) {
      parCommercial.set(id, { nom, nbPropositions: 0, caFacture: 0 })
    }
    return parCommercial.get(id)
  }

  for (const p of propositions) {
    if (!p.commercial) continue
    entree(p.commercial.id, p.commercial.name).nbPropositions += 1
  }

  for (const f of factures) {
    if (!STATUTS_FACTURE_RECONNUS.includes(f.statut) || !f.commercial) continue
    entree(f.commercial.id, f.commercial.name).caFacture += Number(f.total_ttc)
  }

  for (const a of avoirs) {
    if (a.statut === 'annulee' || !a.commercial) continue
    const existant = parCommercial.get(a.commercial.id)
    if (existant) existant.caFacture -= Number(a.total_ttc)
  }

  return [...parCommercial.values()].sort((a, b) => b.caFacture - a.caFacture)
}

let devise = 'FCFA'

export function setDevise(nouvelleDevise) {
  devise = nouvelleDevise
}

export function formatFcfa(montant) {
  return `${Number(montant).toLocaleString('fr-FR', { minimumFractionDigits: 0 })} ${devise}`
}
