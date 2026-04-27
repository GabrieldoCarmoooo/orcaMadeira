import { useCallback, useEffect, useState } from 'react'
import { Users, UserX, Loader2, User, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { logError } from '@/lib/log-error'
import { Button } from '@/components/ui/button'
import CardSolicitacao, { type Solicitacao } from '@/components/madeireira/card-solicitacao'

interface ParceiroPerfil {
  id: string           // vinculacao id
  carpinteiro_id: string
  carpinteiro: {
    nome: string
    cidade: string
    estado: string
  }
  respondido_at: string | null
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function MadeireiraParceirosPage() {
  const { madeireira } = useAuthStore()
  const [pendentes, setPendentes] = useState<Solicitacao[]>([])
  const [parceiros, setParceiros] = useState<ParceiroPerfil[]>([])
  const [loading, setLoading] = useState(true)
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!madeireira) return
    setLoading(true)
    try {
      const [pendentesRes, aprovadosRes] = await Promise.all([
        supabase
          .from('vinculacoes')
          .select('id, carpinteiro_id, solicitado_at, carpinteiros(nome, cidade, estado)')
          .eq('madeireira_id', madeireira.id)
          .eq('status', 'pendente')
          .order('solicitado_at', { ascending: true }),

        supabase
          .from('vinculacoes')
          .select('id, carpinteiro_id, respondido_at, carpinteiros(nome, cidade, estado)')
          .eq('madeireira_id', madeireira.id)
          .eq('status', 'aprovada')
          .order('respondido_at', { ascending: false }),
      ])

      // Map to typed shapes
      const mapSolicitacao = (row: {
        id: string
        carpinteiro_id: string
        solicitado_at: string
        carpinteiros: { nome: string; cidade: string; estado: string } | null
      }): Solicitacao => ({
        id: row.id,
        carpinteiro_id: row.carpinteiro_id,
        solicitado_at: row.solicitado_at,
        carpinteiro: {
          nome: row.carpinteiros?.nome ?? '',
          cidade: row.carpinteiros?.cidade ?? '',
          estado: row.carpinteiros?.estado ?? '',
        },
      })

      const mapParceiro = (row: {
        id: string
        carpinteiro_id: string
        respondido_at: string | null
        carpinteiros: { nome: string; cidade: string; estado: string } | null
      }): ParceiroPerfil => ({
        id: row.id,
        carpinteiro_id: row.carpinteiro_id,
        respondido_at: row.respondido_at ?? null,
        carpinteiro: {
          nome: row.carpinteiros?.nome ?? '',
          cidade: row.carpinteiros?.cidade ?? '',
          estado: row.carpinteiros?.estado ?? '',
        },
      })

      setPendentes((pendentesRes.data ?? []).map(
        (r) => mapSolicitacao(r as Parameters<typeof mapSolicitacao>[0])
      ))
      setParceiros((aprovadosRes.data ?? []).map(
        (r) => mapParceiro(r as Parameters<typeof mapParceiro>[0])
      ))
    } finally {
      setLoading(false)
    }
  }, [madeireira])

  // Initial fetch
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Realtime subscription — fires on any vinculacao change for this madeireira
  useEffect(() => {
    if (!madeireira) return

    const channel = supabase
      .channel(`vinculacoes:madeireira:${madeireira.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vinculacoes',
          filter: `madeireira_id=eq.${madeireira.id}`,
        },
        () => fetchAll(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [madeireira, fetchAll])

  async function handleAprovar(vinculacaoId: string, carpinteiroId: string) {
    setError(null)
    try {
      // Update vinculacao status to 'aprovada'
      const { error: vError } = await supabase
        .from('vinculacoes')
        .update({ status: 'aprovada', respondido_at: new Date().toISOString() })
        .eq('id', vinculacaoId)

      if (vError) throw vError

      // Link the carpinteiro to this madeireira
      const { error: cError } = await supabase
        .from('carpinteiros')
        .update({ madeireira_id: madeireira!.id })
        .eq('id', carpinteiroId)

      if (cError) throw cError
      // Realtime will trigger fetchAll
    } catch (err) {
      logError('parceiros/handleAprovar', err)
      setError('Erro ao aprovar parceria. Tente novamente.')
    }
  }

  async function handleRejeitar(vinculacaoId: string) {
    setError(null)
    try {
      const { error: vError } = await supabase
        .from('vinculacoes')
        .update({ status: 'rejeitada', respondido_at: new Date().toISOString() })
        .eq('id', vinculacaoId)

      if (vError) throw vError
      // Realtime will trigger fetchAll
    } catch (err) {
      logError('parceiros/handleRejeitar', err)
      setError('Erro ao rejeitar solicitação. Tente novamente.')
    }
  }

  async function handleRemover(vinculacaoId: string, carpinteiroId: string) {
    setRemovendoId(vinculacaoId)
    setError(null)
    try {
      // Mark vinculacao as rejected
      const { error: vError } = await supabase
        .from('vinculacoes')
        .update({ status: 'rejeitada', respondido_at: new Date().toISOString() })
        .eq('id', vinculacaoId)

      if (vError) throw vError

      // Unlink the carpinteiro
      const { error: cError } = await supabase
        .from('carpinteiros')
        .update({ madeireira_id: null })
        .eq('id', carpinteiroId)

      if (cError) throw cError
      // Realtime will trigger fetchAll
    } catch (err) {
      logError('parceiros/handleRemover', err)
      setError('Erro ao remover parceiro. Tente novamente.')
    } finally {
      setRemovendoId(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Parceiros</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie solicitações e parceiros ativos.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* Solicitações pendentes */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">
            Solicitações pendentes
          </h2>
          {!loading && pendentes.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-destructive px-1.5 h-5 min-w-5 text-[10px] font-bold text-destructive-foreground">
              {pendentes.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
            ))}
          </div>
        ) : pendentes.length > 0 ? (
          <div className="space-y-2">
            {pendentes.map((s) => (
              <CardSolicitacao
                key={s.id}
                solicitacao={s}
                onAprovar={handleAprovar}
                onRejeitar={handleRejeitar}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-card shadow-tinted px-4 py-4">
            <Users className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
          </div>
        )}
      </section>

      {/* Parceiros ativos */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">
          Parceiros ativos
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
            ))}
          </div>
        ) : parceiros.length > 0 ? (
          <ul className="space-y-2">
            {parceiros.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-card shadow-tinted px-4 py-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">{p.carpinteiro.nome}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {p.carpinteiro.cidade}, {p.carpinteiro.estado}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removendoId === p.id}
                  onClick={() => handleRemover(p.id, p.carpinteiro_id)}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {removendoId === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserX className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Remover</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-card shadow-tinted px-4 py-4">
            <Users className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            <p className="text-sm text-muted-foreground">Nenhum parceiro ativo ainda.</p>
          </div>
        )}
      </section>
    </div>
  )
}
