# Plano — Implementação de TDD + CI/CD no OrçaMadeira

> **Objetivo:** garantir que NENHUM código vá para produção sem passar em todos os testes automatizados. Nada que foi desenvolvido pode quebrar.

---

## 1. Visão geral (para quem não é programador)

Hoje o projeto não tem nenhum teste. Vamos construir do zero três camadas de proteção:

```
┌─────────────────────────────────────────────────────────┐
│  1. DESENVOLVEDOR escreve código novo                   │
│                    ↓                                    │
│  2. Antes de enviar, roda testes no próprio computador  │
│                    ↓                                    │
│  3. Ao enviar pro GitHub, robô roda TODOS os testes     │
│                    ↓                                    │
│  4a. ✅ Tudo passou → libera deploy                     │
│  4b. ❌ Falhou     → BLOQUEIA, avisa o que quebrou      │
└─────────────────────────────────────────────────────────┘
```

**O "robô" é o GitHub Actions** — um serviço gratuito do próprio GitHub que roda scripts automaticamente.

---

## 2. Ferramentas que serão instaladas

| Ferramenta | Para que serve | Camada |
|---|---|---|
| **Vitest** | Motor que executa os testes | Todas |
| **@testing-library/react** | Testa telas, botões, formulários | Componente |
| **@testing-library/jest-dom** | Verificações visuais (ex: "botão aparece na tela") | Componente |
| **jsdom** | Simula um navegador falso para rodar testes de tela | Componente |
| **Playwright** | Testa o app rodando de verdade (abre navegador, clica, digita) | E2E |
| **Husky + lint-staged** | Impede commits com código quebrado no computador local | Local |
| **GitHub Actions** | Robô que roda tudo na nuvem antes do deploy | CI/CD |

---

## 3. As 3 camadas de teste (com exemplos do OrçaMadeira)

### 🧮 Camada 1 — Testes Unitários
> Testam cálculos puros e regras de negócio isoladas. São os mais rápidos e numerosos.

**Alvos no projeto:**
- `src/lib/calcular-orcamento.ts` — fórmula Materiais + Mão de Obra + Margem + Imposto.
- `src/lib/calcular-madeira.ts` (a criar) — `(esp×larg×comp) × valor_m3_venda`.
- `src/lib/validar-cpf-cnpj.ts` — validação de documentos.
- `src/lib/parse-planilha.ts` — leitura de CSV/XLSX e rejeição de linhas inválidas.
- `src/lib/schemas/*` — schemas Zod de formulários.

**Exemplo (Madeira m³):**
```ts
test('viga 5×15×1m de Cambará a R$4.200/m³ de venda = R$31,50', () => {
  const resultado = calcularValorMadeiraM3({
    espessura_cm: 5,
    largura_cm: 15,
    comprimento_m: 1,
    valor_m3_venda: 4200,
  })
  expect(resultado).toBe(31.5)
})
```

---

### 🧩 Camada 2 — Testes de Componente
> Testam telas e comportamentos de formulários/botões sem precisar subir o app inteiro.

**Alvos no projeto:**
- `src/components/orcamento/*` — etapas do fluxo de orçamento.
- `src/components/madeireira/catalogo/*` — abas do catálogo.
- `src/components/layout/*` — guards de rota, sidebar.

**Exemplo:**
```ts
test('exibe total atualizado quando carpinteiro adiciona item', async () => {
  render(<FormularioOrcamento />)
  await user.click(screen.getByRole('button', { name: /adicionar item/i }))
  expect(screen.getByTestId('total')).toHaveTextContent('R$ 31,50')
})
```

---

### 🌐 Camada 3 — Testes E2E (ponta a ponta)
> O Playwright abre um navegador de verdade, loga, clica, digita e confere o resultado.

**Fluxos críticos para cobrir:**
1. **Madeireira cadastra espécie → madeira m³ → comprimentos.**
2. **Carpinteiro vincula-se a uma madeireira** e espera aprovação.
3. **Carpinteiro cria orçamento completo** com itens do catálogo, aplica acabamento, finaliza e **gera o PDF**.
4. **Importação de planilha** CSV válida + inválida (verifica relatório de erros).

São os mais lentos, então mantemos **poucos fluxos, porém críticos** (os 4 acima).

---

## 4. Regra de TDD (Test-Driven Development)

Toda feature nova segue o ciclo **Red → Green → Refactor**:

```
1. 🔴 RED      → Escreve o teste primeiro. Roda. Ele falha (porque o código não existe).
2. 🟢 GREEN    → Escreve o MÍNIMO de código para o teste passar.
3. 🔵 REFACTOR → Melhora o código com segurança (se quebrar, o teste avisa).
```

**Aplicação no projeto:**
- Cada ISSUE em `ISSUES-catalogo-produtos.md` deve iniciar pelo arquivo de teste (`*.test.ts`).
- O skill `/execute` será ajustado para exigir que o teste exista **antes** do código de implementação.

---

## 5. Regra de bloqueio de deploy

Isso é o coração do seu pedido: **nada sobe se algum teste falhar.**

### Local (Husky pre-push)
Quando o desenvolvedor digita `git push`:
1. Husky intercepta.
2. Roda `npm run test:unit` + `npm run lint` + `npm run build`.
3. Se qualquer um falhar → **cancela o push automaticamente**.

### Nuvem (GitHub Actions)
Quando chega no GitHub:
1. Abre uma Pull Request ou faz push na `main`.
2. GitHub Actions dispara o workflow `.github/workflows/ci.yml`.
3. Roda em sequência:
   - ✅ Lint (ESLint)
   - ✅ Type-check (TypeScript)
   - ✅ Testes unitários (Vitest)
   - ✅ Testes de componente (Vitest + Testing Library)
   - ✅ Build de produção (Vite)
   - ✅ Testes E2E (Playwright)
4. **Branch protection rule:** GitHub impede merge na `main` se qualquer passo acima falhar.
5. Só após ✅ em todos, o deploy acontece.

---

## 6. Estrutura de arquivos a criar

```
app/
├── .github/
│   └── workflows/
│       └── ci.yml                      ← robô do GitHub Actions
├── .husky/
│   ├── pre-commit                      ← roda lint nos arquivos alterados
│   └── pre-push                        ← roda testes antes de enviar
├── e2e/
│   ├── orcamento-completo.spec.ts      ← E2E: criar orçamento
│   ├── catalogo-madeireira.spec.ts     ← E2E: cadastrar catálogo
│   ├── vinculacao.spec.ts              ← E2E: vinculação carpinteiro-madeireira
│   └── importar-planilha.spec.ts       ← E2E: importação CSV/XLSX
├── src/
│   ├── lib/
│   │   ├── calcular-orcamento.ts
│   │   ├── calcular-orcamento.test.ts  ← NOVO
│   │   ├── calcular-madeira.ts         ← NOVO (já planejado no catálogo)
│   │   ├── calcular-madeira.test.ts    ← NOVO
│   │   ├── validar-cpf-cnpj.test.ts    ← NOVO
│   │   └── parse-planilha.test.ts      ← NOVO
│   ├── components/
│   │   └── orcamento/
│   │       ├── FormularioOrcamento.tsx
│   │       └── FormularioOrcamento.test.tsx  ← NOVO
│   └── test/
│       ├── setup.ts                    ← configuração global do Vitest
│       └── utils.tsx                   ← helpers (render com providers)
├── vitest.config.ts                    ← NOVO
├── playwright.config.ts                ← NOVO
└── package.json                        ← scripts atualizados
```

---

## 7. Scripts que serão adicionados ao `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run lint && npm run test:unit && npm run build && npm run test:e2e",
    "typecheck": "tsc --noEmit",
    "prepare": "husky"
  }
}
```

---

## 8. Fases de implementação (ordem de execução)

### Fase 1 — Fundação (≈ 1h)
1. Instalar Vitest + Testing Library + jsdom + Playwright + Husky.
2. Criar `vitest.config.ts` e `playwright.config.ts`.
3. Criar `src/test/setup.ts` (mocks globais do Supabase para testes unitários).
4. Adicionar scripts no `package.json`.

### Fase 2 — Testes das regras de negócio críticas (≈ 2h)
5. `calcular-orcamento.test.ts` — cobre a fórmula principal (materiais, mão de obra fixo/hora, margem, imposto).
6. `calcular-madeira.test.ts` — cobre `(esp×larg×comp) × valor_m3_venda`, incluindo o caso exemplo do CLAUDE.md (5×15×1m Cambará = R$31,50).
7. `validar-cpf-cnpj.test.ts` — cobre CPFs/CNPJs válidos, inválidos, com máscara, sem máscara.
8. `parse-planilha.test.ts` — cobre colunas obrigatórias, rejeição de preços negativos, campos vazios, limite 10MB.

### Fase 3 — Testes de componente prioritários (≈ 3h)
9. Formulário de orçamento (`FormularioOrcamento.test.tsx`) — exibe total, valida campos.
10. Formulários do catálogo — Espécies, Madeiras m³, Outros Produtos, Acabamentos.
11. Guards de rota (`components/layout/*.test.tsx`).

### Fase 4 — CI/CD na nuvem (≈ 1h)
12. Criar `.github/workflows/ci.yml` com os 6 passos (lint, typecheck, unit, component, build, E2E).
13. Configurar **branch protection rule** na `main` pelo GitHub (exige CI verde para merge).
14. Criar o **badge de status** no README para sinalizar saúde do projeto.

### Fase 5 — Hooks locais (≈ 30min)
15. Instalar Husky e configurar `pre-commit` (lint-staged) e `pre-push` (roda `test:unit` + `typecheck`).

### Fase 6 — E2E dos 4 fluxos críticos (≈ 4h)
16. Playwright config com base-url do ambiente de teste.
17. Os 4 fluxos E2E listados na Camada 3.

### Fase 7 — Documentação e integração com skills (≈ 30min)
18. Atualizar `CLAUDE.md` com a nova regra: **ISSUE só é considerada pronta após teste escrito + verde**.
19. Atualizar o skill `/execute` para forçar o ciclo Red → Green → Refactor.
20. Criar `docs/testes.md` para o time de desenvolvimento.

**Tempo total estimado:** ~12h de trabalho de implementação.

---

## 9. Critérios de sucesso (como vamos saber que funcionou)

- [ ] `npm run test:unit` roda e mostra ✅ nos testes das 4 funções críticas do `lib/`.
- [ ] `npm run test:e2e` abre o Playwright e executa os 4 fluxos sem falha.
- [ ] Ao tentar fazer `git push` com um teste quebrado, o Husky **cancela** o push.
- [ ] Ao abrir um PR no GitHub, o CI roda sozinho e mostra ✅ ou ❌ com detalhes.
- [ ] Na configuração do GitHub, aparece a regra "Require status checks to pass before merging" ativa na `main`.
- [ ] Novas features começam pelo arquivo `.test.ts` (regra de TDD).

---

## 10. Decisões travadas ✅

1. **Supabase nos testes E2E:** **MOCK** — todas as chamadas ao Supabase serão simuladas (sem banco real).
   - *Implicação:* usaremos `vi.mock('@/lib/supabase')` em testes unitários e **MSW (Mock Service Worker)** para interceptar requisições em testes de componente e E2E.
   - *Cuidado extra:* como não existe banco real validando, os testes E2E só validam o **frontend + fluxo de UX**. Schemas SQL e políticas RLS continuam sendo garantidos por revisão manual e pelo ambiente de staging.

2. **Cobertura mínima (thresholds):**
   - **`src/lib/**` — 90%** (regras de negócio críticas: orçamento, madeira m³, CPF/CNPJ, parse de planilha).
   - **`src/components/**` — 60%** (telas e formulários).
   - Se qualquer métrica ficar abaixo, o CI **reprova** automaticamente.
   - Configuração fica em `vitest.config.ts` na seção `coverage.thresholds`.

3. **Deploy:** **Vercel.**
   - O CI (GitHub Actions) executa todos os testes primeiro.
   - Só após tudo verde ✅, dispara o deploy na Vercel via action oficial (`amondnet/vercel-action` ou integração nativa).
   - Branch `main` → produção. Branches de feature → preview deploy automático (também só após testes verdes).
   - Segredos da Vercel (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) serão configurados em GitHub Settings → Secrets.

---

## 11. Ajustes no plano por causa das decisões

### Ferramentas adicionais
Acrescente na lista da seção 2:

| Ferramenta | Para que serve | Motivo |
|---|---|---|
| **MSW (Mock Service Worker)** | Intercepta chamadas HTTP (Supabase) em testes | Decisão 1 — mock |
| **@vitest/coverage-v8** | Medidor de cobertura de testes | Decisão 2 — thresholds 90/60 |
| **amondnet/vercel-action** | Action oficial de deploy na Vercel | Decisão 3 — Vercel |

### Novo arquivo a criar
```
src/test/
├── setup.ts
├── utils.tsx
└── mocks/
    ├── server.ts          ← servidor MSW
    ├── handlers.ts        ← respostas simuladas do Supabase
    └── supabase-client.ts ← mock do cliente supabase-js
```

### Workflow do GitHub Actions — pipeline final

```yaml
# .github/workflows/ci.yml (esqueleto)
jobs:
  test:
    steps:
      - checkout
      - setup-node (npm cache)
      - npm ci
      - npm run lint
      - npm run typecheck
      - npm run test:unit -- --coverage   # reprova se < 90% em lib, < 60% em components
      - npm run build
      - npm run test:e2e                   # Playwright + MSW

  deploy:
    needs: test                            # só roda se todos os testes passaram
    if: github.ref == 'refs/heads/main'
    steps:
      - amondnet/vercel-action (production)

  preview:
    needs: test
    if: github.event_name == 'pull_request'
    steps:
      - amondnet/vercel-action (preview)
```

---

## 12. Próximo passo

Plano pronto e decisões travadas. A implementação ficará **aguardando comando explícito** do usuário para iniciar pela Fase 1.

> **Comando de execução:** quando quiser começar, basta dizer *"executar Plano-TDD Fase 1"* (ou todas as fases em sequência).
