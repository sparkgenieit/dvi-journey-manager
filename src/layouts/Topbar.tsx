import { Home, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export const Topbar = ({ onMobileMenuToggle }: TopbarProps) => {
  const location = useLocation();

  // derive title from current route
  const getPageTitle = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/hotels")) return "Hotel";
        if (path.includes("/latest-itinerary")) return "Latest Itenary";

    
    if (path.includes("/accounts-ledger")) return "Accounts Ledger";
    if (path.includes("/accounts")) return "Accounts";
    if (path.includes("/vendors")) return "Vendor Management";
    if (path.includes("/drivers")) return "Drivers";
    if (path.includes("/vehicles")) return "Vehicles";
    if (path.includes("/guide")) return "Guide";
    if (path.includes("/activity")) return "Activity";
    if (path.includes("/locations")) return "Locations";
    return "Dashboard";
  };

  const pageTitle = getPageTitle();

  return (
    <div className="bg-white border-b border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* ✅ Dynamic Page Title */}
        <div>
          <h4 className="text-xl sm:text-2xl font-bold text-foreground">
            {pageTitle}
          </h4>
        </div>

        {/* ✅ Dynamic Breadcrumb */}
        <nav aria-label="breadcrumb" className="w-full sm:w-auto">
          <ol className="flex items-center gap-2 text-sm">
            <li className="flex items-center">
              <Home className="h-4 w-4 text-muted-foreground" />
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-primary font-medium">{pageTitle}</span>
            </li>
          </ol>
        </nav>
      </div>
    </div>
  );
};
