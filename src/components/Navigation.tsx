
import { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Clock, FileText, LayoutDashboard, Users, Settings as SettingsIcon, 
  List
} from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active: boolean;
}

// Memoized NavItem component for better performance
const NavItem = memo(({ to, icon: Icon, label, collapsed, active }: NavItemProps) => {
  return (
    <li>
      <NavLink
        to={to}
        className={cn(
          "flex items-center py-2 px-3 rounded-md transition-all duration-200",
          active
            ? "bg-success/20 text-success font-medium"
            : "hover:bg-accent"
        )}
      >
        <Icon 
          size={20} 
          className={cn("flex-shrink-0", collapsed ? "mx-auto" : "mr-3")} 
        />
        {!collapsed && (
          <span className="overflow-hidden whitespace-nowrap transition-all duration-300">
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

// Memoize the entire Navigation component
const Navigation = memo(({ collapsed }: NavigationProps) => {
  const { pathname } = useLocation();

  return (
    <nav className="flex-1 py-4 overflow-y-auto">
      <ul className="space-y-1 px-2">
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
    </nav>
  );
});

Navigation.displayName = "Navigation";

export default Navigation;
