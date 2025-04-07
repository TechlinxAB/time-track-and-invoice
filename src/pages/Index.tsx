
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { testSupabaseConnection, supabase, getConnectionDetails } from "../lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "success" | "error" | "timeout">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState(() => getConnectionDetails());
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus("checking");
        setErrorMessage(null);
        
        // Test Supabase connection on initial load
        const result = await testSupabaseConnection();
        
        if (!result.success) {
          console.warn("⚠️ Supabase connection failed:", result.error);
          
          if (result.timeout) {
            setConnectionStatus("timeout");
            setErrorMessage(`Connection timed out after ${connectionInfo.connectionTimeout/1000} seconds. Supabase might be unreachable.`);
          } else {
            setConnectionStatus("error");
            setErrorMessage(result.error || "Could not connect to Supabase");
          }
          
          toast({
            title: result.timeout ? "Connection Timeout" : "Connection Error",
            description: result.timeout 
              ? `Connection timed out after ${connectionInfo.connectionTimeout/1000} seconds. Supabase might be unreachable.`
              : "Failed to connect to the database. Please check your configuration.",
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
      } finally {
        setIsRetrying(false);
      }
    };
    
    checkConnection();
  }, [navigate, isRetrying, connectionInfo.connectionTimeout]);

  const handleRetry = () => {
    setIsRetrying(true);
  };

  const handleManualConnect = () => {
    // For local development with IP address
    const localIp = prompt("Enter your local Supabase IP address:", localStorage.getItem('supabase_local_ip') || "localhost");
    if (localIp) {
      localStorage.setItem('supabase_local_ip', localIp);
      window.location.reload();
    }
  };
  
  const handleHttpsToggle = () => {
    // Toggle the force_http_backend setting
    const current = localStorage.getItem('force_http_backend') === 'true';
    localStorage.setItem('force_http_backend', (!current).toString());
    
    // If enabling HTTP backend, disable reverse proxy
    if (!current) {
      localStorage.setItem('use_reverse_proxy', 'false');
    }
    
    toast({
      title: "Backend Protocol Changed",
      description: current 
        ? "Using same protocol for frontend and backend. Reloading..." 
        : "Using HTTP backend with HTTPS frontend. Reloading...",
    });
    
    setTimeout(() => window.location.reload(), 1500);
  };
  
  const handleReverseProxyToggle = () => {
    const current = localStorage.getItem('use_reverse_proxy') === 'true';
    localStorage.setItem('use_reverse_proxy', (!current).toString());
    
    // If enabling reverse proxy, disable HTTP backend
    if (!current) {
      localStorage.setItem('force_http_backend', 'false');
    }
    
    toast({
      title: "Reverse Proxy Setting Changed",
      description: current 
        ? "Disabled reverse proxy. Using direct connection. Reloading..." 
        : "Enabled reverse proxy for Supabase connection. Reloading...",
    });
    
    setTimeout(() => window.location.reload(), 1500);
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
      
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const checkMixedContentError = () => {
    const pageProtocol = window.location.protocol;
    const apiProtocol = connectionInfo.protocol + ':';
    
    if (pageProtocol === 'https:' && apiProtocol === 'http:' && !connectionInfo.reverseProxy) {
      return true;
    }
    return false;
  };

  const hasMixedContentIssue = checkMixedContentError();

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
              <p><strong>Force HTTP Backend:</strong> {connectionInfo.forceHttpBackend ? "Yes" : "No"}</p>
              <p><strong>Using Reverse Proxy:</strong> {connectionInfo.reverseProxy ? "Yes" : "No"}</p>
              <p><strong>Connection Timeout:</strong> {connectionInfo.connectionTimeout/1000}s</p>
              {connectionInfo.reverseProxy && <p><strong>Reverse Proxy Path:</strong> {connectionInfo.reverseProxyPath}</p>}
              {connectionInfo.localHost && <p><strong>Local Host:</strong> {connectionInfo.localHost}</p>}
              
              {hasMixedContentIssue && (
                <p className="text-red-500 font-semibold mt-2">
                  ⚠️ Protocol Mismatch: HTTPS page cannot load HTTP content
                </p>
              )}
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
                : "We couldn't connect to the database. This could be due to:"}
            </p>
            
            {hasMixedContentIssue ? (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4">
                <p className="font-bold">Mixed Content Error Detected</p>
                <p className="text-sm">Your browser is blocking insecure (HTTP) requests from a secure (HTTPS) page.</p>
                <p className="text-sm mt-2">You have two options to fix this:</p>
                <ol className="list-decimal pl-5 text-sm">
                  <li>Click "Enable HTTP Backend" (less secure but simpler)</li>
                  <li>Click "Enable Reverse Proxy" if you have configured a reverse proxy (recommended)</li>
                </ol>
              </div>
            ) : connectionStatus === "timeout" ? (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4">
                <p className="font-bold">Connection Timeout</p>
                <p className="text-sm">The connection attempt to Supabase took too long and timed out.</p>
                <p className="text-sm mt-2">Possible reasons:</p>
                <ul className="list-disc pl-5 text-sm">
                  <li>Supabase is not running</li>
                  <li>Supabase is not reachable at the configured URL/IP</li>
                  <li>Network issues or firewall blocking the connection</li>
                  <li>The host IP address is incorrect</li>
                </ul>
              </div>
            ) : (
              <ul className="list-disc pl-5 mb-4 text-sm text-gray-700">
                <li>Incorrect Supabase URL or API key</li>
                <li>Supabase service not running or unhealthy</li>
                <li>Network connectivity issues</li>
                <li>CORS or proxy configuration issues</li>
                <li>Firewall blocking the connection</li>
              </ul>
            )}
            
            <div className="mt-2 text-xs bg-gray-100 p-3 rounded text-left mb-4">
              <p><strong>Environment:</strong> {connectionInfo.environment}</p>
              <p><strong>URL:</strong> {connectionInfo.url}</p>
              <p><strong>Using Proxy:</strong> {connectionInfo.usingProxy ? "Yes" : "No"}</p>
              <p><strong>Page Protocol:</strong> {connectionInfo.pageProtocol}</p>
              <p><strong>API Protocol:</strong> {connectionInfo.protocol}:</p>
              <p><strong>Force HTTP Backend:</strong> {connectionInfo.forceHttpBackend ? "Yes" : "No"}</p>
              <p><strong>Using Reverse Proxy:</strong> {connectionInfo.reverseProxy ? "Yes" : "No"}</p>
              <p><strong>Connection Timeout:</strong> {connectionInfo.connectionTimeout/1000}s</p>
              {connectionInfo.reverseProxy && <p><strong>Reverse Proxy Path:</strong> {connectionInfo.reverseProxyPath}</p>}
              {connectionInfo.localHost && <p><strong>Local Host:</strong> {connectionInfo.localHost}</p>}
              
              {hasMixedContentIssue && (
                <p className="text-red-500 font-semibold mt-2">
                  ⚠️ Protocol Mismatch: HTTPS page trying to load HTTP content
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
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Retrying..." : "Retry Connection"}
              </Button>
              
              <Button 
                variant="outline"
                className="px-4 py-2 rounded w-full"
                onClick={handleManualConnect}
              >
                Configure Local IP
              </Button>
              
              <Button 
                variant={localStorage.getItem('force_http_backend') === 'true' ? "default" : "outline"}
                className="px-4 py-2 rounded w-full"
                onClick={handleHttpsToggle}
              >
                {localStorage.getItem('force_http_backend') === 'true' 
                  ? "Disable HTTP Backend" 
                  : "Enable HTTP Backend"}
              </Button>
              
              <Button 
                variant={localStorage.getItem('use_reverse_proxy') === 'true' ? "default" : "outline"}
                className="px-4 py-2 rounded w-full"
                onClick={handleReverseProxyToggle}
              >
                {localStorage.getItem('use_reverse_proxy') === 'true' 
                  ? "Disable Reverse Proxy" 
                  : "Enable Reverse Proxy"}
              </Button>
              
              {localStorage.getItem('use_reverse_proxy') === 'true' && (
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
