
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase, saveApiKey, testSupabaseConnection } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Login = () => {
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('supabase_anon_key') || "");
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "success" | "error">("untested");
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    // Check API key on load
    if (!apiKey) {
      setConnectionStatus("error");
    }
  }, [apiKey]);

  // If user is already logged in, redirect to the dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorDetails(null);

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Supabase API key below",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("Starting authentication process...");
      
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
  
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    setIsTestingConnection(true);
    
    // Test connection before saving
    saveApiKey(apiKey);
    
    // Give a little time for the page to reload
    toast({
      title: "API Key Saved",
      description: "Reloading with new API key...",
    });
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    
    try {
      const result = await testSupabaseConnection();
      
      if (result.success) {
        setConnectionStatus("success");
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Supabase",
        });
      } else {
        setConnectionStatus("error");
        if (result.missingApiKey) {
          setErrorDetails("Invalid or missing API key. Please check your API key and try again.");
        } else if (result.timeout) {
          setErrorDetails(`Connection timed out. The Supabase server might be unreachable.`);
        } else {
          setErrorDetails(`Failed to connect: ${result.error}`);
        }
        
        toast({
          title: "Connection Failed",
          description: result.missingApiKey ? "Invalid API key" : "Could not connect to Supabase",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorDetails(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: "Connection Test Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
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
          {/* API Key Section - Always visible */}
          <div className="mb-6 border p-4 rounded-md bg-muted/30">
            <h3 className="text-sm font-medium mb-2">Supabase API Key</h3>
            <div className="space-y-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Supabase anon key"
                className="text-xs"
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSaveApiKey}
                  size="sm"
                  className="text-xs flex-1"
                  disabled={isTestingConnection || !apiKey.trim()}
                >
                  {isTestingConnection ? "Saving..." : "Save & Test API Key"}
                </Button>
                <Button
                  onClick={testConnection}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={isTestingConnection || !apiKey.trim()}
                >
                  Test
                </Button>
              </div>
              {connectionStatus === "success" && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-xs text-green-800">
                    Successfully connected to Supabase
                  </AlertDescription>
                </Alert>
              )}
              {connectionStatus === "error" && (
                <Alert variant="destructive" className="bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {errorDetails || "Could not connect to Supabase. Please check your API key."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          
          {/* Login Form */}
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
          
          {errorDetails && errorDetails.includes("AuthUnknownError") && (
            <Alert variant="destructive" className="mt-4 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Authentication error: Cannot connect to Supabase. Please check your API key and ensure it's correct.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            className="w-full bg-success hover:bg-success/90 text-success-foreground"
            onClick={handleSubmit}
            disabled={isLoading || !apiKey.trim() || connectionStatus === "error"}
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
