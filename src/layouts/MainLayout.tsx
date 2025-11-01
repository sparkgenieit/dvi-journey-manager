import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background flex">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-h-screen w-full min-w-0",
          "md:ml-20 lg:ml-20",
          !sidebarCollapsed && "md:ml-64 lg:ml-64"
        )}
      >
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-auto w-full">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-border py-4">
          <div className="px-4 sm:px-8">
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              DVI Holidays @ {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
