import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type { MadeiraM3, ComprimentoMadeiraM3, EspecieMadeira } from '@/types/produto'
import type { MadeiraM3Input } from '@/lib/schemas/madeira-m3-schema'

interface UseMadeirasM3Return {
  madeiras: MadeiraM3[]
  isLoading: boolean
  create: (input: MadeiraM3Input) => Promise<void>
  update: (id: string, input: MadeiraM3Input) => Promise<void>
  remove: (id: string) => Promise<void>
}

// Tipo interno de retorno do SELECT com relações aninhadas via Supabase PostgREST
interface MadeiraM3Row {
  id: string
  madeireira_id: string
  especie_id: string
  nome: string
  espessura_cm: number
  largura_cm: number
  comprimento_m: number
  disponivel: boolean
  created_at: string
  updated_at: string
  especie: EspecieMadeira | null
  comprimentos: ComprimentoMadeiraM3[]
}

// Hook de CRUD para madeiras m³ da madeireira logada.
// O create/update é transacional no cliente: primeiro opera em `madeiras_m3`,
// depois sincroniza `comprimentos_madeira_m3`. Em caso de erro na segunda etapa,
// relança o erro para o chamador tratar — o banco mantém consistência via RLS e constraints.
export function useMadeirasM3(): UseMadeirasM3Return {
  const { madeireira } = useAuthStore()
  const [madeiras, setMadeiras] = useState<MadeiraM3[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Busca todas as madeiras m³ da madeireira, incluindo espécie e comprimentos disponíveis.
  // O JOIN via string PostgREST (`especie:especie_id(*)`) retorna a espécie aninhada.
  const fetchMadeiras = useCallback(async () => {
    if (!madeireira) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('madeiras_m3')
        .select(`
          *,
          especie:especie_id(*),
          comprimentos:comprimentos_madeira_m3(*)
        `)
        .eq('madeireira_id', madeireira.id)
        .order('nome')

      if (error) throw error

      // Mapeia o retorno do PostgREST para o tipo MadeiraM3 com relações opcionais
      const rows = (data as MadeiraM3Row[]) ?? []
      setMadeiras(
        rows.map((row) => ({
          ...row,
          especie: row.especie ?? undefined,
          comprimentos: row.comprimentos ?? [],
        })),
      )
    } finally {
      setIsLoading(false)
    }
  }, [madeireira])

  useEffect(() => {
    fetchMadeiras()
  }, [fetchMadeiras])

  // Cria nova madeira m³ e insere seus comprimentos em sequência.
  // A inserção dos comprimentos depende do `id` gerado pela madeira, por isso é sequencial.
  const create = useCallback(
    async (input: MadeiraM3Input) => {
      if (!madeireira) throw new Error('Madeireira não autenticada')

      // Passo 1: inserir a madeira e obter o id gerado pelo banco
      const { data: madeira, error: madeirError } = await supabase
        .from('madeiras_m3')
        .insert({
          madeireira_id: madeireira.id,
          especie_id: input.especie_id,
          nome: input.nome,
          espessura_cm: input.espessura_cm,
          largura_cm: input.largura_cm,
          comprimento_m: input.comprimento_m,
        })
        .select('id')
        .single()

      if (madeirError) throw madeirError

      // Passo 2: inserir os comprimentos vinculados ao id recém-criado
      if (input.comprimentos && input.comprimentos.length > 0) {
        const comprimentosRows = input.comprimentos.map((c) => ({
          madeira_m3_id: madeira.id,
          comprimento_m: c.comprimento_m,
          disponivel: c.disponivel,
        }))

        const { error: compError } = await supabase
          .from('comprimentos_madeira_m3')
          .insert(comprimentosRows)

        if (compError) throw compError
      }

      await fetchMadeiras()
    },
    [madeireira, fetchMadeiras],
  )

  // Atualiza dados da madeira m³ e sincroniza a lista de comprimentos.
  // Estratégia de sincronização de comprimentos:
  //   1. Upsert dos comprimentos presentes no input (pelo valor `comprimento_m`, unique index)
  //   2. Deletar os comprimentos que existiam no banco mas foram removidos do input
  const update = useCallback(
    async (id: string, input: MadeiraM3Input) => {
      // Passo 1: atualizar os campos da madeira
      const { error: madeirError } = await supabase
        .from('madeiras_m3')
        .update({
          especie_id: input.especie_id,
          nome: input.nome,
          espessura_cm: input.espessura_cm,
          largura_cm: input.largura_cm,
          comprimento_m: input.comprimento_m,
        })
        .eq('id', id)

      if (madeirError) throw madeirError

      // Passo 2: sincronizar comprimentos — upsert dos novos/atualizados
      const novosComprimentos = input.comprimentos ?? []

      if (novosComprimentos.length > 0) {
        const upsertRows = novosComprimentos.map((c) => ({
          madeira_m3_id: id,
          comprimento_m: c.comprimento_m,
          disponivel: c.disponivel,
        }))

        // `onConflict` usa o unique index (madeira_m3_id, comprimento_m) para upsert
        const { error: upsertError } = await supabase
          .from('comprimentos_madeira_m3')
          .upsert(upsertRows, { onConflict: 'madeira_m3_id,comprimento_m' })

        if (upsertError) throw upsertError
      }

      // Passo 3: buscar comprimentos atuais no banco para identificar os removidos
      const { data: existentes, error: fetchError } = await supabase
        .from('comprimentos_madeira_m3')
        .select('id, comprimento_m')
        .eq('madeira_m3_id', id)

      if (fetchError) throw fetchError

      // Identifica os comprimentos que foram removidos do input pelo valor `comprimento_m`
      const valoresNoInput = new Set(novosComprimentos.map((c) => c.comprimento_m))
      const idsParaDeletar = (existentes ?? [])
        .filter((e) => !valoresNoInput.has(e.comprimento_m))
        .map((e) => e.id)

      if (idsParaDeletar.length > 0) {
        const { error: deleteError } = await supabase
          .from('comprimentos_madeira_m3')
          .delete()
          .in('id', idsParaDeletar)

        if (deleteError) throw deleteError
      }

      await fetchMadeiras()
    },
    [fetchMadeiras],
  )

  // Remove a madeira pelo id — o CASCADE no banco apaga os comprimentos filhos
  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('madeiras_m3')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchMadeiras()
    },
    [fetchMadeiras],
  )

  return { madeiras, isLoading, create, update, remove }
}
