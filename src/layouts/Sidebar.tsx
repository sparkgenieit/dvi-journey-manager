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
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/img/DVi-Logo1-2048x1860.png" 
            alt="DVi Logo" 
            className={cn("h-10 object-contain transition-all", collapsed && "h-8")}
          />
          {!collapsed && (
            <span className="font-bold text-lg whitespace-nowrap">DoView Holidays</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
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
                      {!collapsed && (
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
      <div className={cn(
        "border-t border-sidebar-border p-4",
        collapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "flex-col"
        )}>
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h6 className="text-sm font-semibold truncate">Admindvi</h6>
              <p className="text-xs text-muted-foreground truncate">Super Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
