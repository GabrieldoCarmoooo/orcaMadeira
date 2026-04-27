import { useEffect, useRef, useState } from 'react'
import { Search, Building2, MapPin, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface MadeireiraResult {
  id: string
  razao_social: string
  cidade: string
  estado: string
}

interface BuscaMadeireiraProps {
  /** Called when the user clicks "Solicitar Parceria" on a result */
  onSolicitar: (madeireiraId: string) => Promise<void>
  /** Disable the solicitar button while a request is being sent */
  disabled?: boolean
  /** ID da madeireira com parceria aprovada — exibe badge em vez de botão para essa entrada */
  madeireiraVinculadaId?: string | undefined
}

export default function BuscaMadeireira({ onSolicitar, disabled = false, madeireiraVinculadaId }: BuscaMadeireiraProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MadeireiraResult[]>([])
  const [searching, setSearching] = useState(false)
  const [solicitandoId, setSolicitandoId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search — triggers 300ms after the user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await supabase
          .from('madeireiras')
          .select('id, razao_social, cidade, estado')
          .or(`razao_social.ilike.%${term}%,cidade.ilike.%${term}%`)
          .order('razao_social')
          .limit(8)

        setResults((data ?? []) as MadeireiraResult[])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  async function handleSolicitar(madeireira: MadeireiraResult) {
    setSolicitandoId(madeireira.id)
    try {
      await onSolicitar(madeireira.id)
      setQuery('')
      setResults([])
    } finally {
      setSolicitandoId(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar por nome ou cidade da madeireira…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
        {searching && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-card shadow-tinted px-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{m.razao_social}</span>
                </div>
                {(m.cidade.trim() || m.estado.trim()) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {[m.cidade.trim(), m.estado.trim()].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              {/* Parceria aprovada: badge no lugar do botão */}
              {m.id === madeireiraVinculadaId ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="h-3 w-3" />
                  Parceria ativa
                </span>
              ) : (
                <Button
                  size="sm"
                  disabled={disabled || solicitandoId === m.id}
                  onClick={() => handleSolicitar(m)}
                  className="shrink-0"
                >
                  {solicitandoId === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Solicitar Parceria'
                  )}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Empty state — only shown after a real search with no results */}
      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Nenhuma madeireira encontrada para "{query.trim()}".
        </p>
      )}
    </div>
  )
}
