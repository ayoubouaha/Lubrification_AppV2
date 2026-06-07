import type { ComponentType } from 'react';
import { LayoutDashboard } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  to?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  children?: SidebarItem[];
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
];

export const resolveSidebarTo = (to: string, currentCraneId: string) => {
  return to.replace(':craneId', currentCraneId);
};
