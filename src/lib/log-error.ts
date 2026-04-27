// Ponto central de logging de erros — use esta função em todos os catch blocks
// em vez de console.error direto. Facilita futura integração com Sentry ou outro
// serviço de observabilidade sem alterar cada call site.
export function logError(scope: string, err: unknown): void {
  console.error(`[${scope}]`, err)
}
