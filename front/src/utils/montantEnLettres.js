const UNITES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
const DIX_DIX_NEUF = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

function direDizaine(n) {
  if (n < 10) return UNITES[n]
  if (n < 20) return DIX_DIX_NEUF[n - 10]

  const d = Math.floor(n / 10)
  const u = n % 10

  if (d === 7 || d === 9) {
    if (u === 1 && d === 7) return 'soixante et onze'
    return `${DIZAINES[d]}-${DIX_DIX_NEUF[u]}`
  }
  if (u === 0) return d === 8 ? 'quatre-vingts' : DIZAINES[d]
  if (u === 1 && d !== 8) return `${DIZAINES[d]} et un`
  return `${DIZAINES[d]}-${UNITES[u]}`
}

function direCentaine(n, pluralisable = true) {
  const c = Math.floor(n / 100)
  const reste = n % 100
  let mots = ''
  if (c > 0) {
    mots += c === 1 ? 'cent' : `${UNITES[c]} cent`
    if (reste === 0 && c > 1 && pluralisable) mots += 's'
  }
  if (reste > 0) mots += (mots ? ' ' : '') + direDizaine(reste)
  return mots
}

export function nombreEnLettres(nombre) {
  const n = Math.round(nombre)
  if (n === 0) return 'zéro'

  const milliards = Math.floor(n / 1_000_000_000)
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000)
  const milliers = Math.floor((n % 1_000_000) / 1000)
  const reste = n % 1000

  const parties = []
  if (milliards > 0) parties.push(`${milliards === 1 ? 'un' : direCentaine(milliards)} milliard${milliards > 1 ? 's' : ''}`)
  if (millions > 0) parties.push(`${millions === 1 ? 'un' : direCentaine(millions)} million${millions > 1 ? 's' : ''}`)
  if (milliers > 0) parties.push(milliers === 1 ? 'mille' : `${direCentaine(milliers, false)} mille`)
  if (reste > 0) parties.push(direCentaine(reste))

  return parties.join(' ').trim()
}

export function montantEnLettres(montant, devise = 'FCFA') {
  const libelleDevise = devise === 'FCFA' ? 'FRANCS CFA' : devise
  return `${nombreEnLettres(montant).toUpperCase()} ${libelleDevise} EXACTS`
}
