
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { testSupabaseConnection, supabase, getConnectionDetails } from "../lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "success" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState(() => getConnectionDetails());

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test Supabase connection on initial load
        const result = await testSupabaseConnection();
        
        if (!result.success) {
          console.warn("⚠️ Supabase connection failed:", result.error);
          setConnectionStatus("error");
          setErrorMessage(result.error || "Could not connect to Supabase");
          
          toast({
            title: "Connection Error",
            description: "Failed to connect to the database. Please check your configuration.",
            variant: "destructive",
          });
          
          return;
        }
        
        setConnectionStatus("success");
        // Redirect to dashboard only if connection is successful
        navigate("/dashboard");
      } catch (error) {
        console.error("Error checking connection:", error);
        setConnectionStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
        
        toast({
          title: "Connection Error",
          description: "An unexpected error occurred while checking connection.",
          variant: "destructive",
        });
      }
    };
    
    checkConnection();
  }, [navigate]);

  const handleManualConnect = () => {
    // For local development with IP address
    const localIp = prompt("Enter your local Supabase IP address:", localStorage.getItem('supabase_local_ip') || "localhost");
    if (localIp) {
      localStorage.setItem('supabase_local_ip', localIp);
      window.location.reload();
    }
  };
  
  const handleHttpsToggle = () => {
    // Store user preference for protocol
    const currentProtocol = localStorage.getItem('supabase_protocol') || 'http';
    const newProtocol = currentProtocol === 'http' ? 'https' : 'http';
    localStorage.setItem('supabase_protocol', newProtocol);
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center max-w-md p-6 rounded-lg shadow-sm bg-white">
        <h1 className="text-2xl font-bold text-success mb-2">TimeTracker</h1>
        
        {connectionStatus === "checking" && (
          <>
            <p className="text-muted-foreground mb-4">Connecting to database...</p>
            <div className="w-8 h-8 border-4 border-success/30 border-t-success rounded-full animate-spin mx-auto"></div>
            <div className="mt-4 text-xs bg-gray-100 p-3 rounded text-left">
              <p><strong>Environment:</strong> {connectionInfo.environment}</p>
              <p><strong>URL:</strong> {connectionInfo.url}</p>
              <p><strong>Using Proxy:</strong> {connectionInfo.usingProxy ? "Yes" : "No"}</p>
              {connectionInfo.localHost && <p><strong>Local Host:</strong> {connectionInfo.localHost}</p>}
            </div>
          </>
        )}
        
        {connectionStatus === "success" && (
          <>
            <p className="text-muted-foreground mb-4">Connection successful! Loading your workspace...</p>
            <div className="w-8 h-8 border-4 border-success/30 border-t-success rounded-full animate-spin mx-auto"></div>
          </>
        )}
        
        {connectionStatus === "error" && (
          <div className="text-left">
            <p className="text-red-600 font-semibold mb-2">Connection Failed</p>
            <p className="text-muted-foreground mb-3">
              We couldn't connect to the database. This could be due to:
            </p>
            <ul className="list-disc pl-5 mb-4 text-sm text-gray-700">
              <li>Incorrect Supabase URL or API key</li>
              <li>Mixed content issues (HTTP vs HTTPS)</li>
              <li>Supabase service not running or unhealthy</li>
              <li>Network connectivity issues</li>
              <li>CORS or proxy configuration issues</li>
            </ul>
            
            <div className="mt-2 text-xs bg-gray-100 p-3 rounded text-left mb-4">
              <p><strong>Environment:</strong> {connectionInfo.environment}</p>
              <p><strong>URL:</strong> {connectionInfo.url}</p>
              <p><strong>Using Proxy:</strong> {connectionInfo.usingProxy ? "Yes" : "No"}</p>
              {connectionInfo.localHost && <p><strong>Local Host:</strong> {connectionInfo.localHost}</p>}
              
              {errorMessage && errorMessage.includes("Mixed Content") && (
                <p className="text-red-500 font-semibold mt-2">
                  Mixed Content Error: Your browser is blocking HTTP requests from an HTTPS page
                </p>
              )}
            </div>
            
            {errorMessage && (
              <div className="p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32 mb-4">
                {errorMessage}
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              <Button 
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 w-full"
                onClick={() => window.location.reload()}
              >
                Retry Connection
              </Button>
              
              <Button 
                variant="outline"
                className="px-4 py-2 rounded w-full"
                onClick={handleManualConnect}
              >
                Configure Local IP
              </Button>
              
              <Button 
                variant="outline"
                className="px-4 py-2 rounded w-full"
                onClick={handleHttpsToggle}
              >
                Toggle HTTP/HTTPS Protocol
              </Button>
              
              <Button 
                variant="ghost"
                className="px-4 py-2 rounded w-full text-muted-foreground"
                onClick={() => navigate("/login")}
              >
                Continue to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
