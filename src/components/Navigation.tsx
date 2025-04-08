
import { memo, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Clock, FileText, LayoutDashboard, Users, Settings as SettingsIcon, 
  List, Calendar, User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserContext } from "@/contexts/UserContext";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active: boolean;
}

const NavItem = memo(({ to, icon: Icon, label, collapsed, active }: NavItemProps) => {
  return (
    <li>
      <NavLink
        to={to}
        className={cn(
          "flex items-center py-2.5 px-3 rounded-lg transition-all duration-200",
          active
            ? "bg-success/15 text-success font-medium shadow-sm"
            : "hover:bg-muted/30 text-muted-foreground"
        )}
      >
        <Icon 
          size={18} 
          className={cn("flex-shrink-0", collapsed ? "mx-auto" : "mr-3")} 
        />
        {!collapsed && (
          <span className="overflow-hidden whitespace-nowrap transition-all duration-300 text-sm">
            {label}
          </span>
        )}
      </NavLink>
    </li>
  );
});

NavItem.displayName = "NavItem";

interface NavigationProps {
  collapsed: boolean;
}

const navigationItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/time-tracking", icon: Clock, label: "Time Tracking" },
  { to: "/invoicing", icon: FileText, label: "Invoicing" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/activities", icon: List, label: "Activities" },
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
];

const Navigation = memo(({ collapsed }: NavigationProps) => {
  const { pathname } = useLocation();
  const { user } = useUserContext();
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="flex-1 py-4 overflow-y-auto">
      <div className="px-3 mb-4">
        {!collapsed && (
          <NavLink to="/account" className="flex items-center gap-3 mb-2 px-3 hover:bg-muted/30 py-2 rounded-lg transition-all duration-200">
            <Avatar className="h-9 w-9 border border-border">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={user.displayName} />
              ) : (
                <AvatarFallback className="bg-success/20 text-success font-medium">
                  {user ? getInitials(user.displayName) : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.displayName || "User"}</span>
              <span className="text-xs text-muted-foreground">{user?.role || "Loading..."}</span>
            </div>
          </NavLink>
        )}
      </div>
      <div className="px-2">
        {!collapsed && (
          <h2 className="text-xs uppercase text-muted-foreground font-medium tracking-wider px-3 mb-2">
            Main Menu
          </h2>
        )}
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              active={pathname === item.to}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
});

Navigation.displayName = "Navigation";

export default Navigation;
