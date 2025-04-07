import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<{
    url: string; 
    protocol: string;
    pageProtocol: string;
    usingProxy: boolean;
    reverseProxy: boolean;
    reverseProxyPath?: string | null;
  }>(() => {
    const supabaseConfig = supabase.constructor as any;
    const url = supabaseConfig?.supabaseUrl || "unknown";
    const protocol = url.split(':')[0];
    const usingProxy = url.includes(window.location.hostname);
    const reverseProxy = localStorage.getItem('use_reverse_proxy') !== 'false';
    const reverseProxyPath = localStorage.getItem('reverse_proxy_path') || '/supabase';
    
    return { 
      url, 
      protocol,
      pageProtocol: window.location.protocol,
      usingProxy,
      reverseProxy,
      reverseProxyPath
    };
  });

  useEffect(() => {
    // Force reverse proxy to true by default if not explicitly set
    if (localStorage.getItem('use_reverse_proxy') === null) {
      localStorage.setItem('use_reverse_proxy', 'true');
      window.location.reload();
    }
  }, []);

  // If user is already logged in, redirect to the dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorDetails(null);

    try {
      console.log("Starting authentication process...");
      console.log("Using Supabase URL:", connectionInfo.url);
      console.log("Using Proxy:", connectionInfo.usingProxy ? "Yes" : "No");
      console.log("Using Reverse Proxy:", connectionInfo.reverseProxy ? "Yes" : "No");
      if (connectionInfo.reverseProxy) {
        console.log("Reverse Proxy Path:", connectionInfo.reverseProxyPath);
      }
      
      let result;

      if (isSignUp) {
        console.log("Attempting signup...");
        result = await signUp(email, password);
      } else {
        console.log("Attempting login...");
        result = await signIn(email, password);
      }

      console.log("Auth result:", result);

      if (!result.success) {
        const errorMsg = result.error?.message || "Authentication failed";
        console.error("Auth error:", errorMsg);
        console.error("Full error details:", JSON.stringify(result.error, null, 2));
        setErrorDetails(JSON.stringify(result.error, null, 2));
        
        toast({
          title: "Authentication Failed",
          description: errorMsg,
          variant: "destructive"
        });
      } else if (isSignUp) {
        toast({
          title: "Account Created",
          description: "Check your email to confirm your registration.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Uncaught auth error:", error);
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      setErrorDetails(JSON.stringify(error, null, 2));
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReverseProxyToggle = () => {
    const current = localStorage.getItem('use_reverse_proxy') !== 'false';
    localStorage.setItem('use_reverse_proxy', (!current).toString());
    
    toast({
      title: "Connection Settings Changed",
      description: "Reloading application with new settings...",
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{isSignUp ? "Create Account" : "Login"}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Create a new account to get started"
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </form>
          
          {errorDetails && (
            <div className="mt-4 p-2 text-xs bg-red-50 border border-red-200 rounded overflow-auto max-h-28">
              <p className="font-semibold text-destructive">Error Details:</p>
              <pre className="whitespace-pre-wrap">{errorDetails}</pre>
            </div>
          )}
          
          <div className="mt-4">
            <Button 
              variant="link" 
              className="px-0 text-xs text-muted-foreground"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              {showAdvancedOptions ? "Hide Connection Settings" : "Show Connection Settings"}
            </Button>
          </div>
          
          {showAdvancedOptions && (
            <div className="mt-2 text-xs bg-gray-100 p-3 rounded text-left">
              <p><strong>API URL:</strong> {connectionInfo.url}</p>
              <p><strong>API Protocol:</strong> {connectionInfo.protocol}:</p>
              <p><strong>Page Protocol:</strong> {connectionInfo.pageProtocol}</p>
              <p><strong>Using Proxy:</strong> {connectionInfo.usingProxy ? "Yes" : "No"}</p>
              <p><strong>Using Reverse Proxy:</strong> {connectionInfo.reverseProxy ? "Yes" : "No"}</p>
              {connectionInfo.reverseProxy && <p><strong>Reverse Proxy Path:</strong> {connectionInfo.reverseProxyPath}</p>}
              
              <div className="flex flex-col space-y-2 mt-2">                
                <Button 
                  variant={connectionInfo.reverseProxy ? "default" : "outline"} 
                  size="sm"
                  className="text-xs"
                  onClick={handleReverseProxyToggle}
                >
                  {connectionInfo.reverseProxy ? "Disable Reverse Proxy" : "Enable Reverse Proxy"}
                </Button>
                
                {connectionInfo.reverseProxy && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={handleConfigureReverseProxy}
                  >
                    Configure Proxy Path
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            className="w-full bg-success hover:bg-success/90 text-success-foreground"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? "Processing..."
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </Button>
          <Button
            variant="link"
            className="w-full"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
