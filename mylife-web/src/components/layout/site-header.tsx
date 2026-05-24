'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { UserProfilePopover } from '@/components/layout/user-profile-popover';

const pageTitles: Record<string, { title: string; emoji: string }> = {
  '/finance/dashboard':    { title: 'Dashboard',         emoji: '🏠' },
  '/finance/transactions': { title: 'Transações',         emoji: '💸' },
  '/finance/accounts':     { title: 'Contas',             emoji: '🏦' },
  '/finance/credit-cards': { title: 'Cartões de Crédito', emoji: '💳' },
  '/finance/savings':      { title: 'Cofrinhos',          emoji: '🐷' },
  '/finance/investments':  { title: 'Investimentos',      emoji: '📈' },
  '/finance/wishlist':     { title: 'Lista de Desejos',   emoji: '⭐' },
  '/finance/reports':      { title: 'Relatórios',         emoji: '📊' },
  '/settings':             { title: 'Configurações',       emoji: '⚙️' },
  '/fit/dashboard':        { title: 'Dashboard Fit',       emoji: '🏋️' },
  '/fit/workouts':         { title: 'Meus Treinos',        emoji: '💪' },
  '/fit/profile':          { title: 'Perfil Físico',       emoji: '🧬' },
  '/fit/measurements':     { title: 'Medidas Corporais',   emoji: '📏' },
};

export function SiteHeader() {
  const pathname = usePathname();

  const page = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/'),
  )?.[1] ?? { title: 'MyFinance', emoji: '💰' };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/70 dark:border-white/6 bg-white/80 dark:bg-card/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300" />
      <Separator orientation="vertical" className="mx-1 h-4 bg-slate-200 dark:bg-white/10" />

      <div className="flex items-center gap-2">
        <span className="text-base">{page.emoji}</span>
        <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{page.title}</h1>
      </div>

      <div className="ml-auto">
        <UserProfilePopover />
      </div>
    </header>
  );
}
