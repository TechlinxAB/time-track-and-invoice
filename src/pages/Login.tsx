
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Mail, Lock } from "lucide-react";

const Login = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFirstTimeCheck, setIsFirstTimeCheck] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    // Check if this is the first time setup
    const checkFirstTimeSetup = async () => {
      try {
        console.log("Checking for first time setup...");
        
        // Check the profiles table directly first as it's more reliable
        try {
          const { count, error: profileError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          
          if (!profileError) {
            if (count === 0) {
              console.log("First time setup needed - no profiles found");
              setIsFirstTime(true);
              navigate("/setup");
              return;
            }
            
            // If we have profiles, no need to check the RPC
            console.log("Profiles found, no first-time setup needed");
            setIsFirstTime(false);
            setIsFirstTimeCheck(false);
            return;
          } else {
            console.warn("Error checking profiles table:", profileError);
            // If error checking profiles, try using regular queries
            try {
              const { data: profileData, error: listError } = await supabase
                .from('profiles')
                .select('id')
                .limit(1);
                
              if (!listError) {
                if (!profileData || profileData.length === 0) {
                  console.log("First time setup needed - no profiles found via list");
                  setIsFirstTime(true);
                  navigate("/setup");
                  return;
                }
                
                // If we have at least one profile, no need for first-time setup
                console.log("At least one profile found, no first-time setup needed");
                setIsFirstTime(false);
                setIsFirstTimeCheck(false);
                return;
              }
            } catch (err) {
              console.warn("Error listing profiles:", err);
            }
          }
        } catch (err) {
          console.warn("Error checking profiles:", err);
        }
        
        // Fall back to RPC if needed - this is now a last resort
        try {
          const { data, error } = await supabase.rpc('get_user_count');
          
          if (!error && data === 0) {
            console.log("First time setup needed - no users found via RPC");
            setIsFirstTime(true);
            navigate("/setup");
            return;
          }
          
          if (!error) {
            console.log(`User count: ${data}, no first-time setup needed`);
            setIsFirstTime(false);
            setIsFirstTimeCheck(false);
            return;
          }
        } catch (err) {
          console.warn("Error using get_user_count RPC:", err);
        }
        
        // If we get here with no conclusive result, we need to make a decision
        // Default to NOT first time for safety - better to show login than lose access
        console.log("Inconclusive checks - defaulting to not first time setup");
        setIsFirstTime(false);
        
      } catch (e) {
        console.error("Error checking first time setup:", e);
        setIsFirstTime(false);
      } finally {
        setIsFirstTimeCheck(false);
      }
    };
    
    checkFirstTimeSetup();
  }, [navigate]);

  // If user is already logged in, redirect to the dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  // If still checking first-time status, show loading
  if (isFirstTimeCheck) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">TimeTracker</h2>
          <p className="text-muted-foreground mb-4">Checking system status...</p>
          <div className="w-6 h-6 border-4 border-success/30 border-t-success rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // If this is first time setup, redirect to setup
  if (isFirstTime) {
    return <Navigate to="/setup" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log("Starting authentication process...");
      
      await signIn(email, password);
      
      console.log("Authentication complete");
    } catch (error) {
      console.error("Uncaught auth error:", error);
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      setErrorMessage(errorMsg);
      
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
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10"
                />
              </div>
            </div>
            
            {errorMessage && (
              <div className="mt-4 bg-red-50 p-3 rounded text-xs text-red-800">
                {errorMessage}
              </div>
            )}
            
            <Button
              className="w-full bg-success hover:bg-success/90 text-success-foreground mt-4"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
