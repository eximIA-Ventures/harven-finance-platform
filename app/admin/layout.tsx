"use client";

import { useParams, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/ui/toast";

const NO_SIDEBAR_PAGES = ["/admin/new"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();

  const hideSidebar = NO_SIDEBAR_PAGES.includes(pathname);

  if (hideSidebar) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="flex h-screen font-sans">
        <Sidebar evaluationId={params?.id} />
        <div className="flex flex-1 flex-col min-w-0">
          <main id="main-content" className="flex-1 overflow-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
