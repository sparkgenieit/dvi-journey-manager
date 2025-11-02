import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Unlock,
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
    hasSubmenu: true,
    children: [
      { title: "Accounts Manager", path: "/accounts-manager" },
      { title: "Accounts Ledger", path: "/accounts-ledger" },
    ],
  },

  { title: "Hotels", icon: Building2, path: "/hotels" },
  { title: "Daily Moment Tracker", icon: Clock, path: "/daily-moment" },
  {
    title: "Vendor Management",
    icon: Users,
    path: "/vendor-management",
    hasSubmenu: true,
  },
  {
    title: "Hotspot",
    icon: MapPin,
    path: "/hotspot",
    hasSubmenu: true,
  },
  { title: "Activity", icon: Map, path: "/activity" },
  {
    title: "Locations",
    icon: MapPin,
    path: "/locations",
    hasSubmenu: true,
  },
  { title: "Guide", icon: UserSquare2, path: "/guide" },
  { title: "Staff", icon: Users, path: "/staff" },
  { title: "Agent", icon: UserCircle, path: "/agent" },
  { title: "Pricebook Export", icon: FileDown, path: "/pricebook-export" },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
    hasSubmenu: true,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export const Sidebar = ({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileToggle,
}: SidebarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  // keep Accounts open by default
  const [openParent, setOpenParent] = useState<string | null>("Accounts");
  const location = useLocation();

  const isExpanded = !collapsed || isHovered || isPinned;

  const handleTogglePin = () => {
    setIsPinned((p) => !p);
    onToggle();
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* logo */}
      <div className="flex items-center p-4 border-b border-sidebar-border relative">
        <div className="flex items-center gap-3">
          <img
            src="/assets/img/DVi-Logo1-2048x1860.png"
            alt="DVi Logo"
            className="h-10 object-contain transition-all"
          />
          {(isMobile || isExpanded) && (
            <span className="font-bold text-lg whitespace-nowrap">
              DoView Holidays
            </span>
          )}
        </div>

        {!isMobile && isExpanded && (
          <button
            onClick={handleTogglePin}
            className={cn(
              "absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200"
            )}
          >
            {isPinned ? (
              <Lock className="w-4 h-4 text-gray-600" />
            ) : (
              <Unlock className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {/* menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // is this parent or one of its children active?
            const isParentActive =
              location.pathname === item.path ||
              (item.children &&
                item.children.some((c) =>
                  location.pathname.startsWith(c.path)
                ));

            const isOpen =
              isExpanded &&
              item.hasSubmenu &&
              (openParent === item.title || isParentActive);

            // PARENT WITH SUBMENU
            if (item.hasSubmenu && item.children) {
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenParent((prev) =>
                        prev === item.title ? null : item.title
                      )
                    }
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                      "hover:bg-sidebar-accent",
                      // parent active → soft violet, NOT gradient
                      isParentActive && "bg-[#f5e8ff] text-[#5e3a82] shadow-sm"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isParentActive && "text-[#5e3a82]"
                      )}
                    />
                    {(isMobile || isExpanded) && (
                      <>
                        <span
                          className={cn(
                            "flex-1 text-sm font-medium text-left",
                            isParentActive && "text-[#5e3a82]"
                          )}
                        >
                          {item.title}
                        </span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isParentActive && "text-[#5e3a82]",
                            isOpen && "rotate-90"
                          )}
                        />
                      </>
                    )}
                  </button>

                  {/* submenu */}
                  {isOpen && (
                    <ul className="mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            onClick={
                              isMobile ? () => onMobileToggle() : undefined
                            }
                            className={({ isActive }) =>
                              cn(
                                // indent a bit, but keep full-width
                                "ml-4 mr-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                                "hover:bg-[#f2ccff]/60",
                                // 👇 THIS is the same class as top-level active
                                isActive &&
                                  "bg-gradient-to-r from-primary to-pink-500 text-white shadow-lg"
                              )
                            }
                          >
                            {/* no dot here */}
                            <span className="text-sm font-medium">
                              {child.title}
                            </span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            // NORMAL ITEM
            return (
              <li key={item.title}>
                <NavLink
                  to={item.path}
                  onClick={isMobile ? () => onMobileToggle() : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                      "hover:bg-sidebar-accent",
                      isActive &&
                        "bg-gradient-to-r from-primary to-pink-500 text-primary-foreground shadow-lg"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isActive && "text-white"
                        )}
                      />
                      {(isMobile || isExpanded) && (
                        <span
                          className={cn(
                            "flex-1 text-sm font-medium",
                            isActive && "text-white"
                          )}
                        >
                          {item.title}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* user */}
      <div className="border-t border-sidebar-border p-4">
        <div
          className={cn(
            "flex items-center gap-3",
            !isMobile && !isExpanded && "flex-col"
          )}
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">A</span>
          </div>
          {(isMobile || isExpanded) && (
            <div className="flex-1 min-w-0">
              <h6 className="text-sm font-semibold truncate">Admindvi</h6>
              <p className="text-xs text-muted-foreground truncate">
                Super Admin
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* mobile */}
      <Sheet open={mobileOpen} onOpenChange={onMobileToggle}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* desktop */}
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
