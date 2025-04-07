
import { useState, memo } from "react";
import { Link, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Navigation from "./Navigation";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar border-r border-border h-screen flex flex-col transition-all duration-300 ease-in-out sticky top-0",
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
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation - now using our optimized component */}
        <Navigation collapsed={collapsed} />

        {/* Footer - This will now stay at the bottom */}
        <div className="p-4 border-t border-border mt-auto">
          <button 
            className={cn(
              "w-full flex items-center py-2 px-3 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-all duration-200",
              collapsed && "justify-center"
            )}
            aria-label="Sign out"
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

export default memo(Layout);
