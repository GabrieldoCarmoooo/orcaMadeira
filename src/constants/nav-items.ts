import type { ElementType } from 'react'
import {
  LayoutDashboard,
  FileText,
  Link2,
  User,
  Tag,
  Users,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  label: string
  href: string
  icon: ElementType
}

export const CARPINTEIRO_NAV: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.CARPINTEIRO_DASHBOARD, icon: LayoutDashboard },
  { label: 'Orçamentos', href: ROUTES.CARPINTEIRO_ORCAMENTOS, icon: FileText },
  { label: 'Vinculação', href: ROUTES.CARPINTEIRO_VINCULACAO, icon: Link2 },
  { label: 'Perfil', href: ROUTES.CARPINTEIRO_PERFIL, icon: User },
]

export const MADEIREIRA_NAV: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.MADEIREIRA_DASHBOARD, icon: LayoutDashboard },
  { label: 'Preços', href: ROUTES.MADEIREIRA_PRECOS, icon: Tag },
  { label: 'Parceiros', href: ROUTES.MADEIREIRA_PARCEIROS, icon: Users },
  { label: 'Perfil', href: ROUTES.MADEIREIRA_PERFIL, icon: User },
]
