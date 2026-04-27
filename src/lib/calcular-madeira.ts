// Funções puras de precificação de madeira m³.
// Sem dependências de estado global — testáveis isoladamente.
// Regras de negócio detalhadas no CLAUDE.md (seção "Catálogo — regras de cálculo").

/**
 * Calcula o preço de venda por m³ de uma espécie a partir do custo e da margem de lucro.
 * Fórmula: valor_m3_venda = custo_m3 × (1 + margem_lucro_pct / 100)
 *
 * Exemplo: Cambará — custo R$ 3.500, margem 20% → venda R$ 4.200/m³
 */
export function calcularValorVendaM3(custo: number, margemPct: number): number {
  return custo * (1 + margemPct / 100)
}

/**
 * Calcula o valor unitário de uma peça de madeira m³ a partir das suas dimensões
 * e do valor de venda por m³ da espécie.
 *
 * Fórmula: valor = (espessura_cm / 100) × (largura_cm / 100) × comprimento_m × valor_m3_venda
 *
 * Exemplo: Viga 5×15 Cambará, 1m — (0,05 × 0,15 × 1 × 4.200) = R$ 31,50
 * As divisões por 100 convertem cm → m para obter o volume em m³.
 */
export function calcularValorMadeiraM3(
  espCm: number,
  largCm: number,
  compM: number,
  valorVendaM3: number,
): number {
  return (espCm / 100) * (largCm / 100) * compM * valorVendaM3
}

/**
 * Aplica um serviço de acabamento (acréscimo percentual) ao preço base de um item.
 * O snapshot do percentual é gravado no item do orçamento no momento da confirmação,
 * garantindo que alterações futuras no serviço não afetam orçamentos finalizados.
 *
 * Fórmula: preco_final = preco_base × (1 + percentual / 100)
 *
 * Exemplo: Lixamento +10% sobre R$ 31,50 → R$ 34,65
 */
export function aplicarAcabamento(preco: number, percentual: number): number {
  return preco * (1 + percentual / 100)
}

/**
 * Calcula o preço final de uma linha de madeira m³, integrando espécie, dimensões e acabamento opcional.
 * Consolida calcularValorVendaM3 + calcularValorMadeiraM3 + aplicarAcabamento em uma única chamada,
 * eliminando o risco de divergência quando a fórmula é reimplementada inline em componentes.
 *
 * Retorna 0 quando a espécie não está disponível (produto sem vínculo de espécie no catálogo).
 */
export function calcularPrecoLinhaMadeiraM3(
  especie: { custo_m3: number; margem_lucro_pct: number } | null | undefined,
  dims: { espessura_cm: number; largura_cm: number; comprimento_m: number },
  acabamento?: { percentual_acrescimo: number } | null,
): number {
  if (!especie) return 0
  const valorM3 = calcularValorVendaM3(especie.custo_m3, especie.margem_lucro_pct)
  const precoBase = calcularValorMadeiraM3(dims.espessura_cm, dims.largura_cm, dims.comprimento_m, valorM3)
  return acabamento ? aplicarAcabamento(precoBase, acabamento.percentual_acrescimo) : precoBase
}
