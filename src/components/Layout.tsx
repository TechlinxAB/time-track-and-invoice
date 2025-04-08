
import { useState, memo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LogOut, Search } from "lucide-react";
import Navigation from "./Navigation";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/UserContext";
import { getRoleName } from "@/lib/permissions";
import { toast } from "@/hooks/use-toast";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  // Extract the page name from the current path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/dashboard') return 'Dashboard';
    
    // Remove the leading slash and split by additional slashes
    const segments = path.substring(1).split('/');
    
    // Take the first segment and format it
    return segments[0].split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "There was a problem signing out",
        variant: "destructive"
      });
    }
  };
  
  // Get user's role display name
  const roleName = profile?.role ? getRoleName(profile.role) : '';

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-border h-screen flex flex-col transition-all duration-300 ease-in-out sticky top-0 shadow-sm",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          {!collapsed && (
            <span className="font-bold text-lg overflow-hidden whitespace-nowrap transition-all duration-300 bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
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

        {/* Navigation */}
        <Navigation collapsed={collapsed} />

        {/* Footer */}
        <div className="p-4 border-t border-border mt-auto">
          <button 
            onClick={handleSignOut}
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
      <main className="flex-1 overflow-auto bg-[#f8fafc]">
        <div className="sticky top-0 z-10 bg-white border-b border-border p-4 flex justify-between items-center shadow-sm">
          <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8 h-9 bg-muted/30 border-muted focus-visible:ring-success"
              />
            </div>
            <div className="flex items-center gap-2">
              {profile && profile.role && (
                <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full">
                  {roleName}
                </span>
              )}
              <div className="h-9 w-9 rounded-full bg-success/20 flex items-center justify-center text-success font-medium">
                {profile?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default memo(Layout);
