
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { testSupabaseConnection, getConnectionDetails } from "../lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, Network } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "success" | "error" | "timeout">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState(() => getConnectionDetails());
  const [isRetrying, setIsRetrying] = useState(false);
  const [isProxyError, setIsProxyError] = useState(false);
  const [isInternalOnly, setIsInternalOnly] = useState(false);
  const [isAutoSwitching, setIsAutoSwitching] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus("checking");
        setErrorMessage(null);
        setIsProxyError(false);
        setIsInternalOnly(false);
        setIsAutoSwitching(false);
        
        const result = await testSupabaseConnection();
        
        if (!result.success) {
          console.warn("⚠️ Supabase connection failed:", result.error);
          
          if (result.timeout) {
            setConnectionStatus("timeout");
            setErrorMessage(`Connection timed out after ${connectionInfo.connectionTimeout/1000} seconds. Supabase might be unreachable.`);
          } else {
            setConnectionStatus("error");
            setErrorMessage(result.error || "Could not connect to Supabase");
            
            // Handle auto-switching
            if (result.autoSwitchToDirectUrl) {
              setIsAutoSwitching(true);
              setTimeout(() => {
                localStorage.setItem('use_reverse_proxy', 'false');
                window.location.reload();
              }, 2000);
            } else if (result.suggestReverseProxy) {
              setIsProxyError(true);
            }
          }
          
          return;
        }
        
        setConnectionStatus("success");
        navigate("/dashboard");
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
  
  const handleReverseProxyToggle = () => {
    const current = localStorage.getItem('use_reverse_proxy') !== 'false';
    localStorage.setItem('use_reverse_proxy', (!current).toString());
    localStorage.removeItem('tried_direct');
    
    toast({
      title: "Connection Settings Changed",
      description: `${!current ? "Enabling" : "Disabling"} reverse proxy and reloading application...`,
    });
    
    setTimeout(() => window.location.reload(), 1000);
  };
  
  const handleConfigureReverseProxy = () => {
    const path = prompt(
      "Enter your reverse proxy path (e.g. /supabase):", 
      localStorage.getItem('reverse_proxy_path') || "/supabase"
    );
    
    if (path) {
      localStorage.setItem('reverse_proxy_path', path);
      
      toast({
        title: "Reverse Proxy Path Updated",
        description: `Path set to: ${path}. Reloading...`,
      });
      
      setTimeout(() => window.location.reload(), 1000);
    }
  };
  
  const handleSwitchToDirectUrl = () => {
    localStorage.setItem('use_reverse_proxy', 'false');
    localStorage.removeItem('tried_direct');
    
    toast({
      title: "Switching to Direct URL",
      description: "Connecting directly to https://supabase.techlinx.se...",
    });
    
    setTimeout(() => window.location.reload(), 1000);
  };
  
  const handleSwitchToReverseProxy = () => {
    localStorage.setItem('use_reverse_proxy', 'true');
    localStorage.removeItem('tried_direct');
    
    toast({
      title: "Switching to Reverse Proxy",
      description: "Using reverse proxy for connection...",
    });
    
    setTimeout(() => window.location.reload(), 1000);
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
              <p><strong>Page Protocol:</strong> {connectionInfo.pageProtocol}</p>
              <p><strong>API Protocol:</strong> {connectionInfo.protocol}:</p>
              <p><strong>Using Reverse Proxy:</strong> {connectionInfo.reverseProxy ? "Yes" : "No"}</p>
              {connectionInfo.reverseProxy && <p><strong>Reverse Proxy Path:</strong> {connectionInfo.reverseProxyPath}</p>}
              <p><strong>Connection Timeout:</strong> {connectionInfo.connectionTimeout/1000}s</p>
              <p><strong>Direct Supabase URL:</strong> {connectionInfo.directUrl}</p>
            </div>
          </>
        )}
        
        {connectionStatus === "success" && (
          <>
            <p className="text-muted-foreground mb-4">Connection successful! Loading your workspace...</p>
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
            
            {isAutoSwitching && (
              <Alert className="mb-4 border-blue-500 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <span className="font-semibold block">Automatically switching connection method</span>
                  Trying direct connection to Supabase instead of reverse proxy...
                </AlertDescription>
              </Alert>
            )}
            
            {isProxyError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Direct connection failed. Try using the reverse proxy instead.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mt-2 text-xs bg-gray-100 p-3 rounded text-left mb-4">
              <p><strong>Environment:</strong> {connectionInfo.environment}</p>
              <p><strong>URL:</strong> {connectionInfo.url}</p>
              <p><strong>Using Proxy:</strong> {connectionInfo.usingProxy ? "Yes" : "No"}</p>
              <p><strong>Page Protocol:</strong> {connectionInfo.pageProtocol}</p>
              <p><strong>API Protocol:</strong> {connectionInfo.protocol}:</p>
              <p><strong>Using Reverse Proxy:</strong> {connectionInfo.reverseProxy ? "Yes" : "No"}</p>
              {connectionInfo.reverseProxy && <p><strong>Reverse Proxy Path:</strong> {connectionInfo.reverseProxyPath}</p>}
              <p><strong>Connection Timeout:</strong> {connectionInfo.connectionTimeout/1000}s</p>
              <p><strong>Direct Supabase URL:</strong> {connectionInfo.directUrl}</p>
              {connectionInfo.nginxPath && (
                <p className="mt-2 text-orange-700">
                  <strong>Nginx Error Log:</strong> {connectionInfo.nginxPath}
                </p>
              )}
            </div>
            
            {errorMessage && (
              <div className="p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32 mb-4">
                {errorMessage}
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              {!isAutoSwitching && (
                <Button 
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 w-full"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? "Retrying..." : "Retry Connection"}
                </Button>
              )}
              
              {isProxyError && !connectionInfo.reverseProxy && (
                <Button 
                  variant="default"
                  className="px-4 py-2 rounded w-full"
                  onClick={handleSwitchToReverseProxy}
                >
                  Try Reverse Proxy Instead
                </Button>
              )}
              
              {isProxyError && connectionInfo.reverseProxy && (
                <Button 
                  variant="destructive"
                  className="px-4 py-2 rounded w-full"
                  onClick={handleSwitchToDirectUrl}
                >
                  Use Direct URL Instead
                </Button>
              )}
              
              <Button 
                variant={connectionInfo.reverseProxy ? "outline" : "default"}
                className="px-4 py-2 rounded w-full"
                onClick={handleReverseProxyToggle}
              >
                {connectionInfo.reverseProxy
                  ? "Disable Reverse Proxy" 
                  : "Enable Reverse Proxy"}
              </Button>
              
              {connectionInfo.reverseProxy && (
                <Button 
                  variant="outline"
                  className="px-4 py-2 rounded w-full"
                  onClick={handleConfigureReverseProxy}
                >
                  Configure Proxy Path
                </Button>
              )}
              
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
