
import { useState } from "react";
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
      console.log("Using Supabase URL:", (supabase as any).supabaseUrl);
      
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
