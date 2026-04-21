import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

// Botão de alternância de tema light/dark no header.
// Exibe o ícone do tema alvo (Moon em light, Sun em dark) para
// comunicar a ação que será tomada no clique.
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="text-primary hover:bg-primary/10 h-9 w-9"
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}
