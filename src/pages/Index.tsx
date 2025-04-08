
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { testSupabaseConnection, getConnectionDetails } from "../lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { ConnectionDetails, ConnectionTestResult } from "@/types";

const Index = () => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "success" | "error" | "timeout">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionDetails>(() => getConnectionDetails());
  const [isRetrying, setIsRetrying] = useState(false);
  const [successPath, setSuccessPath] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus("checking");
        setErrorMessage(null);
        setSuccessPath(null);
        
        const result = await testSupabaseConnection() as ConnectionTestResult;
        
        if (!result.success) {
          console.warn("⚠️ Supabase connection failed:", result.error);
          
          if (result.timeout) {
            setConnectionStatus("timeout");
            setErrorMessage(`Connection timed out after ${connectionInfo.connectionTimeout/1000} seconds. Supabase might be unreachable.`);
          } else {
            setConnectionStatus("error");
            setErrorMessage(result.error || "Could not connect to Supabase");
          }
          
          return;
        }
        
        setConnectionStatus("success");
        setTimeout(() => navigate("/dashboard"), 1000);
      } catch (error) {
        console.error("Error checking connection:", error);
        setConnectionStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setIsRetrying(false);
      }
    };
    
    checkConnection();
  }, [navigate, isRetrying, connectionInfo.connectionTimeout]);

  const handleRetry = () => {
    setIsRetrying(true);
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
              <p><strong>Page Protocol:</strong> {connectionInfo.pageProtocol}</p>
              <p><strong>API Protocol:</strong> {connectionInfo.protocol}:</p>
              <p><strong>Connection Timeout:</strong> {connectionInfo.connectionTimeout/1000}s</p>
            </div>
          </>
        )}
        
        {connectionStatus === "success" && (
          <>
            <p className="text-muted-foreground mb-4">
              Connection successful! Loading your workspace...
            </p>
            <div className="w-8 h-8 border-4 border-success/30 border-t-success rounded-full animate-spin mx-auto"></div>
          </>
        )}
        
        {(connectionStatus === "error" || connectionStatus === "timeout") && (
          <div className="text-left">
            <p className="text-red-600 font-semibold mb-2">
              {connectionStatus === "timeout" ? "Connection Timed Out" : "Connection Failed"}
            </p>
            <p className="text-muted-foreground mb-3">
              {connectionStatus === "timeout" 
                ? `Connection attempt timed out after ${connectionInfo.connectionTimeout/1000} seconds. Supabase might be unreachable.`
                : `We couldn't connect to ${connectionInfo.url}.`}
            </p>
            
            <div className="mt-2 text-xs bg-gray-100 p-3 rounded text-left mb-4">
              <p><strong>Environment:</strong> {connectionInfo.environment}</p>
              <p><strong>URL:</strong> {connectionInfo.url}</p>
              <p><strong>Page Protocol:</strong> {connectionInfo.pageProtocol}</p>
              <p><strong>API Protocol:</strong> {connectionInfo.protocol}:</p>
              <p><strong>Connection Timeout:</strong> {connectionInfo.connectionTimeout/1000}s</p>
            </div>
            
            {errorMessage && (
              <div className="p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32 mb-4">
                {errorMessage}
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              <Button 
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 w-full"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Retrying..." : "Retry Connection"}
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
