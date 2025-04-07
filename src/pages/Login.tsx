
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { user, signIn, signUp } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<{
    url: string; 
    protocol: string;
    pageProtocol: string;
    usingProxy: boolean;
    localHost?: string;
  }>(() => {
    const supabaseConfig = supabase.constructor as any;
    const url = supabaseConfig?.supabaseUrl || "http://localhost:8000";
    const protocol = url.split(':')[0];
    const usingProxy = url === window.location.origin;
    const localHost = localStorage.getItem('supabase_local_ip') || 'localhost';
    return { 
      url, 
      protocol,
      pageProtocol: window.location.protocol,
      usingProxy,
      localHost
    };
  });
  
  const hasMixedContentIssue = 
    connectionInfo.pageProtocol === 'https:' && 
    connectionInfo.protocol === 'http';

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
        
        if (result.error && 'status' in result.error && result.error.status === 502) {
          toast({
            title: "Backend Connection Error (502)",
            description: "Cannot connect to authentication server. Please verify the backend is running.",
            variant: "destructive"
          });
        } else if (hasMixedContentIssue) {
          toast({
            title: "Mixed Content Error",
            description: "HTTPS pages cannot load content from HTTP sources. Try using the same protocol for both.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Authentication Failed",
            description: errorMsg,
            variant: "destructive"
          });
        }
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
  
  const handleConfigureLocalDb = () => {
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
    toast({
      title: "Protocol Changed",
      description: `Connection protocol switched to ${newProtocol.toUpperCase()}. Reloading...`,
    });
    setTimeout(() => window.location.reload(), 1500);
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
          
          <div className="mt-4 text-xs bg-gray-100 p-3 rounded text-left">
            <p><strong>API URL:</strong> {connectionInfo.url}</p>
            <p><strong>API Protocol:</strong> {connectionInfo.protocol}:</p>
            <p><strong>Page Protocol:</strong> {connectionInfo.pageProtocol}</p>
            <p><strong>Connecting Directly:</strong> {connectionInfo.usingProxy ? "Yes" : "No"}</p>
            <p><strong>Local Database Host:</strong> {connectionInfo.localHost}</p>
            
            {hasMixedContentIssue && (
              <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400 text-amber-800">
                <p className="font-semibold">Mixed Content Issue Detected</p>
                <p>Your HTTPS page cannot load content from HTTP source</p>
              </div>
            )}
            
            <div className="flex space-x-2 mt-2">
              <button 
                onClick={handleConfigureLocalDb} 
                className="text-xs text-blue-600 hover:underline"
              >
                Change Local IP
              </button>
              <button 
                onClick={handleHttpsToggle} 
                className="text-xs text-blue-600 hover:underline"
              >
                Switch to {localStorage.getItem('supabase_protocol') === 'https' ? 'HTTP' : 'HTTPS'}
              </button>
            </div>
          </div>
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
