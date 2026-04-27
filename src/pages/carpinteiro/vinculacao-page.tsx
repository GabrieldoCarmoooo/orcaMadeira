import { useState } from 'react'
import { Link2, CheckCircle2, Clock, XCircle, Building2, MapPin } from 'lucide-react'
import { useVinculacao } from '@/hooks/useVinculacao'
import { logError } from '@/lib/log-error'
import BuscaMadeireira from '@/components/carpinteiro/busca-madeireira'
import { Button } from '@/components/ui/button'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function CarpinteiroVinculacaoPage() {
  const { vinculacao, loading, solicitarVinculacao, cancelarSolicitacao } = useVinculacao()
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSolicitar(madeireiraId: string) {
    setError(null)
    try {
      await solicitarVinculacao(madeireiraId)
    } catch (err) {
      logError('vinculacao/handleSolicitar', err)
      setError('Não foi possível enviar a solicitação. Tente novamente.')
    }
  }

  async function handleCancelar() {
    setCancelando(true)
    setError(null)
    try {
      await cancelarSolicitacao()
    } catch (err) {
      logError('vinculacao/handleCancelar', err)
      setError('Não foi possível cancelar a solicitação. Tente novamente.')
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Vinculação com madeireira</h1>
        <p className="text-sm text-muted-foreground">
          Vincule-se a uma madeireira para acessar preços e criar orçamentos.
        </p>
      </div>

      {/* Status atual */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">
          Status atual
        </h2>

        {loading ? (
          <div className="rounded-xl bg-card shadow-tinted p-5 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : vinculacao ? (
          <div className="rounded-xl bg-card shadow-tinted p-5 space-y-4">
            {/* Status badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {vinculacao.status === 'aprovada' && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  )}
                  {vinculacao.status === 'pendente' && (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  {vinculacao.status === 'rejeitada' && (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <span
                    className={
                      vinculacao.status === 'aprovada'
                        ? 'text-sm font-semibold text-green-700 dark:text-green-400'
                        : vinculacao.status === 'pendente'
                          ? 'text-sm font-semibold text-amber-600 dark:text-amber-400'
                          : 'text-sm font-semibold text-destructive'
                    }
                  >
                    {vinculacao.status === 'aprovada' && 'Vinculado'}
                    {vinculacao.status === 'pendente' && 'Solicitação pendente'}
                    {vinculacao.status === 'rejeitada' && 'Solicitação rejeitada'}
                  </span>
                </div>

                {/* Madeireira info */}
                <div className="flex items-center gap-1.5 text-sm">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{vinculacao.madeireira.razao_social}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {vinculacao.madeireira.cidade}, {vinculacao.madeireira.estado}
                </div>
              </div>

              {/* Cancel button — only for pending requests */}
              {vinculacao.status === 'pendente' && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={cancelando}
                  onClick={handleCancelar}
                  className="shrink-0"
                >
                  {cancelando ? 'Cancelando…' : 'Cancelar'}
                </Button>
              )}
            </div>

            {/* Pending hint */}
            {vinculacao.status === 'pendente' && (
              <p className="text-xs text-muted-foreground border-t pt-3">
                Aguarde a madeireira aprovar sua solicitação. O status atualiza automaticamente.
              </p>
            )}
          </div>
        ) : (
          /* No active vinculacao */
          <div className="flex items-center gap-3 rounded-xl bg-card shadow-tinted px-4 py-4">
            <Link2 className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Você ainda não tem uma madeireira vinculada.
            </p>
          </div>
        )}
      </section>

      {/* Search section — always visible (allows changing madeireira) */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">
            {vinculacao?.status === 'pendente' ? 'Solicitar outra madeireira' : 'Buscar madeireira'}
          </h2>
          {vinculacao?.status === 'pendente' && (
            <p className="text-xs text-muted-foreground">
              Ao solicitar outra, a solicitação atual será cancelada automaticamente.
            </p>
          )}
        </div>

        {/* Passa o id da parceira aprovada para exibir badge na busca */}
        <BuscaMadeireira
          onSolicitar={handleSolicitar}
          disabled={vinculacao?.status === 'aprovada'}
          madeireiraVinculadaId={vinculacao?.status === 'aprovada' ? vinculacao.madeireira_id : undefined}
        />

        {vinculacao?.status === 'aprovada' && (
          <p className="text-xs text-muted-foreground text-center">
            Já existe uma vinculação aprovada. Cancele-a antes de solicitar outra.
          </p>
        )}
      </section>

      {/* Error feedback */}
      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
