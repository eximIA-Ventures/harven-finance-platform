"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Users, Layers, TrendingUp, Calendar, Trophy, BookOpen, LayoutDashboard, UserCog, Route } from "lucide-react";

interface SidebarProps {
  evaluationId?: string;
}

export function Sidebar({ evaluationId }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(user => {
      if (user) {
        const perms = user.permissions || [];
        setIsAdmin(perms.includes("admin") || perms.includes("manage_eval") || perms.includes("manage_users"));
      }
    }).catch(() => {});
  }, []);

  // Liga nav is always visible — these are the main portal pages
  const baseId = evaluationId || "ps-hf-2026";

  const ligaNav = [
    { label: "Membros", href: `/admin/${baseId}/members`, icon: <Users size={18} /> },
    // { label: "Nucleos", href: `/admin/${baseId}/nuclei`, icon: <Layers size={18} /> },
    // { label: "Portfolio", href: `/admin/${baseId}/portfolio`, icon: <TrendingUp size={18} /> },
    { label: "Agenda", href: `/admin/${baseId}/events`, icon: <Calendar size={18} /> },
    { label: "Jornadas", href: `/admin/${baseId}/journeys`, icon: <Route size={18} /> },
    { label: "Biblioteca", href: `/admin/${baseId}/wiki`, icon: <BookOpen size={18} /> },
  ];

  const psNav = [
    { label: "Processos Seletivos", href: "/admin/ps", icon: <IconGrid /> },
  ];

  const adminNav = [
    { label: "Usuarios", href: `/admin/${baseId}/users`, icon: <IconUserCheck /> },
    { label: "Meu Perfil", href: `/admin/${baseId}/profile`, icon: <UserCog size={18} /> },
    { label: "Configuracoes", href: `/admin/${baseId}/settings`, icon: <IconSettings /> },
  ];

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    // Exact match for evaluation sub-pages to prevent multiple highlights
    return pathname === href;
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="h-[90px] flex items-center px-5 border-b border-[var(--border-color)]">
        <Link href="/admin" className="flex items-center" onClick={() => setMobileOpen(false)}>
          <img src="/logos/harven-finance-dark.png" alt="Harven Finance" className="h-[72px] sidebar-logo" />
        </Link>
        <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-dim hover:bg-bg-hover hover:text-cream md:hidden" onClick={() => setMobileOpen(false)}>
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Dashboard */}
        <NavGroup items={[{ label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={18} /> }]} pathname={pathname} isActive={isActive} onNav={() => setMobileOpen(false)} />

        {/* Liga */}
        <div className="px-3"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a4a4a]">Liga</span></div>
        <NavGroup items={ligaNav} pathname={pathname} isActive={isActive} onNav={() => setMobileOpen(false)} />

        {/* Avaliacoes — admin only */}
        {isAdmin && (
          <>
            <div className="px-3"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a4a4a]">Avaliacoes</span></div>
            <NavGroup items={psNav} pathname={pathname} isActive={isActive} onNav={() => setMobileOpen(false)} />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-4">
        <div className="mb-3 h-px bg-bg-elevated" />
        {/* Admin section — only Meu Perfil for non-admins */}
        <div className="px-3 mb-2"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a4a4a]">{isAdmin ? "Admin" : "Conta"}</span></div>
        <NavGroup items={isAdmin ? adminNav : [{ label: "Meu Perfil", href: `/admin/${baseId}/profile`, icon: <UserCog size={18} /> }]} pathname={pathname} isActive={isActive} onNav={() => setMobileOpen(false)} />
        <div className="mt-4 px-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-white/20">Harven</span>
            </div>
            <div className="mt-1">
              <img src="/logos/harven-finance-dark.png" alt="Harven Finance" className="h-3.5 opacity-30" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-dim hover:text-danger hover:bg-danger/10 transition-colors"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button className="fixed top-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-md text-dim hover:bg-bg-hover hover:text-cream md:hidden" onClick={() => setMobileOpen(true)}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      </button>
      <div className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMobileOpen(false)} />
      <aside className={`fixed left-0 top-0 z-40 h-screen w-[230px] flex flex-col bg-bg-sidebar border-r border-[var(--border-color)] transition-transform duration-300 md:relative md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>
    </>
  );
}

function NavGroup({ items, pathname, isActive, onNav }: { items: Array<{ label: string; href: string; icon: React.ReactNode }>; pathname: string; isActive: (href: string) => boolean; onNav: () => void }) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onNav}>
            <div className={`relative w-full flex items-center gap-3 rounded-lg px-3 h-9 text-[13px] transition-all duration-200 ease-out ${active ? "bg-accent/15 text-cream font-medium ring-1 ring-accent/20" : "text-[#777] hover:bg-bg-elevated hover:text-[#bbb]"}`}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-accent" />}
              <span className={active ? "text-accent" : ""}>{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function IconGrid() { return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>; }
function IconHome() { return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>; }
function IconUsers() { return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>; }
function IconDice() { return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>; }
function IconSparkle() { return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>; }
function IconTrophy() { return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768-.767-1.605-1.75.024-.144.086-.294.22-.416a2.253 2.253 0 011.872-.293c.29.094.541.291.667.567a13.036 13.036 0 003.596 4.7M18.75 4.236c.996.178 1.768-.767 1.605-1.75a1.194 1.194 0 00-.22-.416 2.253 2.253 0 00-1.872-.293 1.326 1.326 0 00-.667.567 13.036 13.036 0 01-3.596 4.7M12 2.25c-2.62 0-5.063.924-6.953 2.466" /></svg>; }
function IconUserCheck() { return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IconSettings() { return <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
