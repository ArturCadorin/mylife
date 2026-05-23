'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Dumbbell, Activity, User, Moon, Sun, LogOut, Settings,
} from 'lucide-react';
import { SolutionSwitcher } from '@/components/layout/solution-switcher';
import { useState } from 'react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

const navGroups = [
  {
    label: 'Início',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/fit/dashboard' }],
  },
  {
    label: 'Treinos',
    items: [
      { label: 'Meus Treinos', icon: Dumbbell, href: '/fit/workouts' },
    ],
  },
  {
    label: 'Corpo & Saúde',
    items: [
      { label: 'Perfil Físico', icon: User, href: '/fit/profile' },
      { label: 'Medidas', icon: Activity, href: '/fit/measurements' },
    ],
  },
];

export function FitSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);

  function toggleDark() {
    setDark((v) => !v);
    document.documentElement.classList.toggle('dark');
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'U';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SolutionSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full rounded-lg outline-none">
                <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-sidebar-accent cursor-pointer transition-colors w-full group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs font-semibold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate group-data-[collapsible=icon]:hidden text-slate-700">
                    {user?.name ?? 'Usuário'}
                  </span>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="start" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleDark}>
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {dark ? 'Modo claro' : 'Modo escuro'}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" />}>
                  <Settings className="h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
