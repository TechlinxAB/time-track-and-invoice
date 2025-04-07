
import { Routes, Route } from "react-router-dom";
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
import Index from "./pages/Index";
import { AppProvider } from "./contexts/AppContext";
import { useAuth } from "./contexts/AuthContext";
import { Navigate } from "react-router-dom";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    // Could add a loading spinner here
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Index />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="time-tracking" element={<TimeTracking />} />
          <Route path="invoicing" element={<Invoicing />} />
          <Route path="clients" element={<Clients />} />
          <Route path="activities" element={<Activities />} />
          <Route path="settings" element={<Settings />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

export default App;
