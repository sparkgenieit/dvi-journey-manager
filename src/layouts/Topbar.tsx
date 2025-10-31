import { Home, ChevronRight } from "lucide-react";

export const Topbar = () => {
  return (
    <div className="bg-white border-b border-border">
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h4 className="text-2xl font-bold text-foreground">Dashboard</h4>
        </div>
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="flex items-center">
              <Home className="h-4 w-4 text-muted-foreground" />
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-primary font-medium">Dashboard</span>
            </li>
          </ol>
        </nav>
      </div>
    </div>
  );
};
