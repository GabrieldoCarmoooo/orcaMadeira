import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TonalCard } from '@/components/ui/tonal-card'
import type { PerfilFormValues } from '@/lib/schemas/perfil-carpinteiro-schema'

interface PerfilEmpresaSectionProps {
  register: UseFormRegister<PerfilFormValues>
  errors: FieldErrors<PerfilFormValues>
  isSubmitting: boolean
}

// Seção de dados cadastrais da empresa/carpinteiro — nome, documentos e localização
export function PerfilEmpresaSection({ register, errors, isSubmitting }: PerfilEmpresaSectionProps) {
  return (
    <TonalCard variant="default" asymmetric>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <User size={16} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-on-surface">Perfil do Usuário</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome completo</Label>
          <Input
            id="nome"
            placeholder="João da Silva"
            aria-invalid={!!errors.nome}
            disabled={isSubmitting}
            {...register('nome')}
          />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cpf_cnpj">CPF ou CNPJ</Label>
            <Input
              id="cpf_cnpj"
              placeholder="000.000.000-00"
              aria-invalid={!!errors.cpf_cnpj}
              disabled={isSubmitting}
              {...register('cpf_cnpj')}
            />
            {errors.cpf_cnpj && <p className="text-xs text-destructive">{errors.cpf_cnpj.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(00) 90000-0000"
              aria-invalid={!!errors.telefone}
              disabled={isSubmitting}
              {...register('telefone')}
            />
            {errors.telefone && <p className="text-xs text-destructive">{errors.telefone.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            placeholder="Rua das Madeiras, 100"
            aria-invalid={!!errors.endereco}
            disabled={isSubmitting}
            {...register('endereco')}
          />
          {errors.endereco && <p className="text-xs text-destructive">{errors.endereco.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              placeholder="São Paulo"
              aria-invalid={!!errors.cidade}
              disabled={isSubmitting}
              {...register('cidade')}
            />
            {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              placeholder="SP"
              maxLength={2}
              className="uppercase"
              aria-invalid={!!errors.estado}
              disabled={isSubmitting}
              {...register('estado', { setValueAs: (v: string) => v.toUpperCase() })}
            />
            {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
          </div>
        </div>
      </div>
    </TonalCard>
  )
}
