
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Clock, FileText, LayoutDashboard, Users, Settings as SettingsIcon, 
  List, ChevronLeft, ChevronRight, LogOut 
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/time-tracking", icon: Clock, label: "Time Tracking" },
  { to: "/invoicing", icon: FileText, label: "Invoicing" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/activities", icon: List, label: "Activities" },
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
];

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar border-r border-border h-screen transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          {!collapsed && (
            <span className="font-bold text-lg overflow-hidden whitespace-nowrap transition-all duration-300">
              TimeTracker
            </span>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full hover:bg-accent transition-all duration-200"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md transition-all duration-200",
                    pathname === item.to
                      ? "bg-success/20 text-success font-medium"
                      : "hover:bg-accent"
                  )}
                >
                  <item.icon 
                    size={20} 
                    className={cn("flex-shrink-0", collapsed ? "mx-auto" : "mr-3")} 
                  />
                  {!collapsed && (
                    <span className="overflow-hidden whitespace-nowrap transition-all duration-300">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button 
            className={cn(
              "w-full flex items-center py-2 px-3 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-all duration-200",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={20} className={collapsed ? "" : "mr-3"} />
            {!collapsed && (
              <span className="overflow-hidden whitespace-nowrap transition-all duration-300">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
