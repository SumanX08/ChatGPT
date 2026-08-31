"use client";

import { AppSidebar } from "@/features/conversation/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function ChatShell({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}