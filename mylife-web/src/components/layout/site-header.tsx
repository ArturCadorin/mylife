'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

const pageTitles: Record<string, { title: string; emoji: string }> = {
  '/dashboard':    { title: 'Dashboard',         emoji: '🏠' },
  '/transactions': { title: 'Transações',         emoji: '💸' },
  '/accounts':     { title: 'Contas',             emoji: '🏦' },
  '/credit-cards': { title: 'Cartões de Crédito', emoji: '💳' },
  '/savings':      { title: 'Cofrinhos',          emoji: '🐷' },
  '/investments':  { title: 'Investimentos',      emoji: '📈' },
  '/wishlist':     { title: 'Lista de Desejos',   emoji: '⭐' },
  '/reports':      { title: 'Relatórios',         emoji: '📊' },
  '/settings':     { title: 'Configurações',       emoji: '⚙️' },
};

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  const page = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/'),
  )?.[1] ?? { title: 'MyFinance', emoji: '💰' };

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/70 dark:border-white/6 bg-white/80 dark:bg-card/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300" />
      <Separator orientation="vertical" className="mx-1 h-4 bg-slate-200 dark:bg-white/10" />

      <div className="flex items-center gap-2">
        <span className="text-base">{page.emoji}</span>
        <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{page.title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <span className="hidden text-sm text-slate-400 dark:text-slate-500 sm:block">{user?.name}</span>
        <Avatar className="h-7 w-7 ring-2 ring-emerald-500/30">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
