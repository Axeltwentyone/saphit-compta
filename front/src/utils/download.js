import api from '../api/client'

export async function telechargerFichier(url, params, nomFichier) {
  const res = await api.get(url, { params, responseType: 'blob' })
  const objectUrl = URL.createObjectURL(res.data)
  const lien = document.createElement('a')
  lien.href = objectUrl
  lien.download = nomFichier
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  URL.revokeObjectURL(objectUrl)
}
