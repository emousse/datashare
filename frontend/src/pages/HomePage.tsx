import { useEffect, useState } from 'react'
import { fetchApiStatus, type ApiStatus } from '../api/health'

const STATUS_LABEL: Record<ApiStatus, string> = {
  loading: 'Vérification de l’API…',
  up: 'API connectée',
  down: 'API injoignable',
}

/** Page d'accueil provisoire : vérifie la liaison front → back. */
export default function HomePage() {
  const [status, setStatus] = useState<ApiStatus>('loading')

  useEffect(() => {
    const controller = new AbortController()
    fetchApiStatus(controller.signal)
      .then(setStatus)
      .catch(() => {
        /* requête annulée au démontage du composant */
      })
    return () => controller.abort()
  }, [])

  return (
    <main>
      <h1>DataShare</h1>
      <p>Tu veux partager un fichier ?</p>
      <p role="status" data-status={status}>
        {STATUS_LABEL[status]}
      </p>
    </main>
  )
}
