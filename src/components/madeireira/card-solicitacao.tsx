import { useState } from 'react'
import { User, MapPin, Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface Solicitacao {
  id: string
  carpinteiro_id: string
  carpinteiro: {
    nome: string
    cidade: string
    estado: string
  }
  solicitado_at: string
}

interface CardSolicitacaoProps {
  solicitacao: Solicitacao
  onAprovar: (id: string, carpinteiroId: string) => Promise<void>
  onRejeitar: (id: string) => Promise<void>
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function CardSolicitacao({ solicitacao, onAprovar, onRejeitar }: CardSolicitacaoProps) {
  const [loading, setLoading] = useState<'aprovar' | 'rejeitar' | null>(null)

  async function handleAprovar() {
    setLoading('aprovar')
    try {
      await onAprovar(solicitacao.id, solicitacao.carpinteiro_id)
    } finally {
      setLoading(null)
    }
  }

  async function handleRejeitar() {
    setLoading('rejeitar')
    try {
      await onRejeitar(solicitacao.id)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card shadow-tinted px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Info */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{solicitacao.carpinteiro.nome}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {solicitacao.carpinteiro.cidade}, {solicitacao.carpinteiro.estado}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          Solicitado em {formatDate(solicitacao.solicitado_at)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={loading !== null}
          onClick={handleRejeitar}
          className="gap-1.5"
        >
          {loading === 'rejeitar' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Rejeitar
        </Button>
        <Button
          size="sm"
          disabled={loading !== null}
          onClick={handleAprovar}
          className="gap-1.5"
        >
          {loading === 'aprovar' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Aprovar
        </Button>
      </div>
    </div>
  )
}
