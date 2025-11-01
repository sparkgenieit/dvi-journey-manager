import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  FileText, 
  CheckCircle, 
  Wallet, 
  Building2, 
  Clock, 
  Users, 
  MapPin, 
  Map, 
  UserSquare2, 
  UserCircle, 
  FileDown, 
  Settings,
  ChevronRight,
  Lock,
  Unlock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/" },
  { title: "Create Itinerary", icon: FileText, path: "/create-itinerary" },
  { title: "Latest Itinerary", icon: FileText, path: "/latest-itinerary" },
  { title: "Confirmed Itinerary", icon: CheckCircle, path: "/confirmed-itinerary" },
  { 
    title: "Accounts", 
    icon: Wallet, 
    path: "/accounts",
    hasSubmenu: true 
  },
  { title: "Hotels", icon: Building2, path: "/hotels" },
  { title: "Daily Moment Tracker", icon: Clock, path: "/daily-moment" },
  { 
    title: "Vendor Management", 
    icon: Users, 
    path: "/vendor-management",
    hasSubmenu: true 
  },
  { 
    title: "Hotspot", 
    icon: MapPin, 
    path: "/hotspot",
    hasSubmenu: true 
  },
  { title: "Activity", icon: Map, path: "/activity" },
  { 
    title: "Locations", 
    icon: MapPin, 
    path: "/locations",
    hasSubmenu: true 
  },
  { title: "Guide", icon: UserSquare2, path: "/guide" },
  { title: "Staff", icon: Users, path: "/staff" },
  { title: "Agent", icon: UserCircle, path: "/agent" },
  { title: "Pricebook Export", icon: FileDown, path: "/pricebook-export" },
  { 
    title: "Settings", 
    icon: Settings, 
    path: "/settings",
    hasSubmenu: true 
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileToggle }: SidebarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  const isExpanded = !collapsed || isHovered || isPinned;
  
  const handleTogglePin = () => {
    setIsPinned(!isPinned);
    onToggle();
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className="flex items-center p-4 border-b border-sidebar-border relative">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/img/DVi-Logo1-2048x1860.png" 
            alt="DVi Logo" 
            className="h-10 object-contain transition-all"
          />
          {(isMobile || isExpanded) && (
            <span className="font-bold text-lg whitespace-nowrap">DoView Holidays</span>
          )}
        </div>
        
        {/* Circular Toggle Button - only show when expanded and not mobile */}
        {!isMobile && isExpanded && (
          <button
            onClick={handleTogglePin}
            className={cn(
              "absolute top-4 right-4",
              "w-8 h-8 rounded-full",
              "bg-white",
              "flex items-center justify-center",
              "shadow-md hover:shadow-lg",
              "transition-all duration-200",
            )}
          >
            {isPinned ? <Lock className="w-4 h-4 text-gray-600" /> : <Unlock className="w-4 h-4 text-gray-600" />}
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={isMobile ? () => onMobileToggle() : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                      "hover:bg-sidebar-accent",
                      isActive && "bg-gradient-to-r from-primary to-pink-500 text-primary-foreground shadow-lg"
                    )
                  }
                >
                  {({ isActive }) => (
                  <>
                      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-white")} />
                      {(isMobile || isExpanded) && (
                        <>
                          <span className={cn("flex-1 text-sm font-medium", isActive && "text-white")}>
                            {item.title}
                          </span>
                          {item.hasSubmenu && (
                            <ChevronRight className={cn("h-4 w-4", isActive && "text-white")} />
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn(
          "flex items-center gap-3",
          !isMobile && !isExpanded && "flex-col"
        )}>
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">A</span>
          </div>
          {(isMobile || isExpanded) && (
            <div className="flex-1 min-w-0">
              <h6 className="text-sm font-semibold truncate">Admindvi</h6>
              <p className="text-xs text-muted-foreground truncate">Super Admin</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={onMobileToggle}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
      className={cn(
        "hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-sidebar-border transition-all duration-300 z-50 flex-col group",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarContent isMobile={false} />
    </aside>
    </>
  );
};
