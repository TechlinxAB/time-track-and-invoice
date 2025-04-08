import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TimeTracking from "./pages/TimeTracking";
import Invoicing from "./pages/Invoicing";
import Clients from "./pages/Clients";
import Activities from "./pages/Activities";
import Settings from "./pages/Settings";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import FirstTimeSetup from "./pages/FirstTimeSetup";
import Index from "./pages/Index";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthProvider as UserProvider } from "./contexts/UserContext";
import { useAuth } from "./contexts/AuthContext";
import { useProfile } from "./contexts/UserContext";
import { hasPermission } from "./lib/permissions";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    // Show loading spinner during authentication check
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-success mb-2">TimeTracker</h1>
          <p className="text-muted-foreground mb-4">Checking authentication...</p>
          <div className="w-8 h-8 border-4 border-success/30 border-t-success rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Permission-based route component
const PermissionRoute = ({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requiredPermission: string;
}) => {
  const { profile } = useProfile();
  
  if (!profile) {
    // Still loading profile or no profile
    return (
      <div className="p-6">
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            Loading your profile information...
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!hasPermission(profile.role, requiredPermission as any)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return <>{children}</>;
};

// First time setup detection component
const FirstTimeCheck = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const checkIfFirstTime = async () => {
      try {
        // Don't check if user is already logged in
        if (user) {
          setIsFirstTime(false);
          setIsLoading(false);
          return;
        }
        
        // Query the get_user_count function
        const { data, error } = await supabase.rpc('get_user_count');
        
        if (error) {
          console.error("Error checking if first time:", error);
          setIsFirstTime(false); // Default to false on error
        } else {
          // If there are no users, it's first time
          setIsFirstTime(data === 0);
        }
      } catch (err) {
        console.error("Error in first time check:", err);
        setIsFirstTime(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkIfFirstTime();
  }, [user]);
  
  // While checking, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-success mb-2">TimeTracker</h1>
          <p className="text-muted-foreground mb-4">Checking system status...</p>
          <div className="w-8 h-8 border-4 border-success/30 border-t-success rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // If it's the first time, redirect to setup
  if (isFirstTime) {
    return <Navigate to="/setup" replace />;
  }
  
  // Otherwise, render children
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <AppProvider>
          <Routes>
            <Route path="/setup" element={<FirstTimeSetup />} />
            
            <Route path="/login" element={
              <FirstTimeCheck>
                <Login />
              </FirstTimeCheck>
            } />
            
            <Route path="/" element={
              <FirstTimeCheck>
                <Index />
              </FirstTimeCheck>
            } />
            
            {/* Change the layout to be at the root level with nested routes */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/time-tracking" element={<TimeTracking />} />
              <Route path="/invoicing" element={
                <PermissionRoute requiredPermission="manage_invoices">
                  <Invoicing />
                </PermissionRoute>
              } />
              <Route path="/clients" element={
                <PermissionRoute requiredPermission="manage_clients">
                  <Clients />
                </PermissionRoute>
              } />
              <Route path="/activities" element={
                <PermissionRoute requiredPermission="manage_activities">
                  <Activities />
                </PermissionRoute>
              } />
              <Route path="/settings" element={
                <PermissionRoute requiredPermission="manage_settings">
                  <Settings />
                </PermissionRoute>
              } />
              <Route path="/account" element={<Account />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <SonnerToaster position="top-right" />
          <Toaster />
        </AppProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
