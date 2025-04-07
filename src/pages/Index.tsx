
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { testSupabaseConnection } from "../lib/supabase";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkConnection = async () => {
      // Test Supabase connection on initial load
      const result = await testSupabaseConnection();
      
      if (!result.success) {
        console.warn("⚠️ Supabase connection failed:", result.error);
      }
      
      // Redirect to dashboard
      navigate("/dashboard");
    };
    
    checkConnection();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-success mb-2">TimeTracker</h1>
        <p className="text-muted-foreground mb-4">Loading your workspace...</p>
        <div className="w-8 h-8 border-4 border-success/30 border-t-success rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default Index;
