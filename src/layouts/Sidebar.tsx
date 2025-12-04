// FILE: src/layouts/Sidebar.tsx

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

  // ─────────────────────────────────────────────
  // Vendor Management submenu (Vendor / Driver / Vehicle Availability Chart)
  // ─────────────────────────────────────────────
  {
    title: "Vendor Management",
    icon: Users,
    path: "/vendor-management",
    hasSubmenu: true,
    children: [
      { title: "Vendor", path: "/vendor" },
      { title: "Driver", path: "/drivers" },
      { title: "Vehicle Availability Chart", path: "/vehicle-availability" },
    ],
  },

  // ─────────────────────────────────────────────
  // Hotspot submenu (New Hotspot / Parking Charge)
  // ─────────────────────────────────────────────
  {
    title: "Hotspot",
    icon: MapPin,
    path: "/hotspots",
    hasSubmenu: true,
    children: [
      { title: "New Hotspot", path: "/hotspots" },
      { title: "Parking Charge", path: "/parking-charge-bulk-import" },
    ],
  },

  { title: "Activity", icon: Map, path: "/activities" },
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
  // keep Vendor Management open by default (like PHP sidebar)
  const [openParent, setOpenParent] = useState<string | null>("Vendor Management");
  const location = useLocation();

  const isExpanded = !collapsed || isHovered || isPinned;

  const handleTogglePin = () => {
    setIsPinned((p) => !p);
    onToggle();
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* header / logo */}
      <div className="relative flex items-center gap-0 px-2 py-2 border-b border-sidebar-border">
        {/* left: logo + text */}
        <div className="flex items-center gap-0 min-w-0">
          <img
            src="/assets/img/DVi-Logo1-2048x1860.png"
            alt="DVi Logo"
            className="h-10 object-contain"
          />
          {(isMobile || isExpanded) && (
            <span className="font-bold text-lg whitespace-nowrap leading-tight app-brand-text">
              DoView Holidays
            </span>
          )}
        </div>

        {/* right: lock/pin absolutely at right */}
        {!isMobile && isExpanded && (
          <button
            onClick={handleTogglePin}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow hover:shadow-md transition"
          >
            {isPinned ? (
              <Lock className="w-4 h-4 text-gray-700" />
            ) : (
              <Unlock className="w-4 h-4 text-gray-700" />
            )}
          </button>
        )}
      </div>

      {/* menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isParentActive =
              location.pathname === item.path ||
              (item.children &&
                item.children.some((c) => location.pathname.startsWith(c.path)));

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
                      "w-full flex items-center gap-3 rounded-lg transition-all relative",
                      "px-3 py-2.5",
                      "hover:bg-[#f5e8ff]",
                      isParentActive && "bg-[#f5e8ff] text-[#5e3a82] shadow-sm"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isParentActive && "text-[#5e3a82]"
                      )}
                    />
                    {(isMobile || isExpanded) && (
                      <>
                        <span
                          className={cn(
                            "flex-1 text-sm text-left font-medium",
                            isParentActive && "text-[#5e3a82]"
                          )}
                        >
                          {item.title}
                        </span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-90"
                          )}
                        />
                      </>
                    )}
                  </button>

                  {isOpen && (
                    <ul className="mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            onClick={isMobile ? () => onMobileToggle() : undefined}
                            className={({ isActive }) =>
                              cn(
                                "ml-5 mr-2 flex items-center gap-2 rounded-lg px-3 py-2 transition-all",
                                "hover:bg-[#f2ccff]/50",
                                isActive &&
                                  "bg-gradient-to-r from-primary to-pink-500 text-white shadow"
                              )
                            }
                          >
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
                      "flex items-center gap-3 rounded-lg transition-all",
                      "px-3 py-2.5",
                      "hover:bg-[#f5e8ff]",
                      isActive &&
                        "bg-gradient-to-r from-primary to-pink-500 text-white shadow"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive && "text-white"
                        )}
                      />
                      {(isMobile || isExpanded) && (
                        <span
                          className={cn(
                            "flex-1 text-sm text-left font-medium truncate",
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

      {/* bottom user */}
      <div className="border-t border-sidebar-border p-4">
        <div
          className={cn(
            "flex items-center gap-3",
            !isMobile && !isExpanded && "flex-col items-start"
          )}
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-pink-500 flex items-center justify-center">
            <span className="text-white font-medium text-sm">A</span>
          </div>
          {(isMobile || isExpanded) && (
            <div className="flex-1 min-w-0">
              <h6 className="text-sm font-semibold leading-tight">Admindvi</h6>
              <p className="text-xs text-muted-foreground leading-tight">
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
          "hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-sidebar-border transition-all duration-300 z-50 flex-col",
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
