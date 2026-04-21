import { useCallback, useEffect, useState } from 'react'

// Hook de gerenciamento de tema (light/dark) para a UI do OrçaMadeira.
// A paleta Timber Grain já está definida em src/index.css nas seleções
// :root (light) e .dark (dark) — aqui só orquestramos qual classe aplicar.

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'orcamadeira:theme'

// Resolve o tema inicial: preferência salva > preferência do SO > light.
// Executa de forma síncrona para casar com o script de pré-hidratação do
// index.html e evitar flicker no primeiro render.
function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored

  // Sem preferência persistida → respeita o SO do usuário
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(resolveInitialTheme)

  // Sincroniza a classe .dark no <html> sempre que o tema mudar.
  // Persiste a escolha para que a pré-hidratação do index.html acerte
  // no próximo load e evite o flash de tema errado.
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')

    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const toggle = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [],
  )

  return { theme, setTheme, toggle }
}
