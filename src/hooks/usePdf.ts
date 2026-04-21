import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { Orcamento, ItemOrcamento } from '@/types/orcamento'
import { useAuthStore } from '@/stores/useAuthStore'

interface UsePdfReturn {
  loading: boolean
  exportar: (orcamento: Orcamento, itens: ItemOrcamento[], mostrarDetalhes?: boolean) => Promise<void>
}

/** Fetches an image URL and returns a base64 data URI to avoid CORS issues in PDF. */
async function fetchLogoBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url)
    if (!response.ok) return undefined
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(undefined)
      reader.readAsDataURL(blob)
    })
  } catch {
    return undefined
  }
}

export function usePdf(): UsePdfReturn {
  const [loading, setLoading] = useState(false)
  const carpinteiro = useAuthStore((s) => s.carpinteiro)

  async function exportar(orcamento: Orcamento, itens: ItemOrcamento[], mostrarDetalhes = true): Promise<void> {
    if (!carpinteiro) return
    setLoading(true)
    try {
      // Fetch logo as base64 before generating to avoid CORS issues inside the PDF renderer
      const logoBase64 = carpinteiro.logo_url
        ? await fetchLogoBase64(carpinteiro.logo_url)
        : undefined

      // Lazy-load the PDF document to avoid bundling @react-pdf/renderer in the main chunk
      const { OrcamentoPdfDocument } = await import('@/components/orcamento/pdf-document')

      const element = OrcamentoPdfDocument({ orcamento, itens, carpinteiro, logoBase64, mostrarDetalhes })
      const blob = await pdf(element).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const clienteSlug = orcamento.cliente_nome
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      link.href = url
      link.download = `orcamento-${orcamento.id.slice(0, 8)}-${clienteSlug}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return { loading, exportar }
}
