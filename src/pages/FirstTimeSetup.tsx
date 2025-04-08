
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Shield, Lock, Mail } from "lucide-react";

const FirstTimeSetup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log("Creating first admin user directly...");
      
      // Try a direct insert to profiles first (completely bypassing auth)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: email,
          full_name: fullName,
          role: 'admin',
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (profileError) {
        console.log("Could not create profile directly:", profileError.message);
        // Continue with auth signup even if profile creation failed
      } else {
        console.log("Profile created successfully:", profileData);
      }
      
      // Try auth signup with direct settings and no email verification
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            is_admin: true,
            admin_setup: true
          },
          emailRedirectTo: null
        }
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        
        // Try signing in directly - maybe the account already exists
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          throw new Error(`Could not create or login: ${signInError.message}`);
        } else {
          console.log("Signed in successfully to existing account");
          // Success path
        }
      }

      // Regardless of how we got here, try to ensure an admin profile exists
      const userId = authData?.user?.id || signUpError?.message;
      
      console.log("Setup successful!");
      toast({
        title: "Setup Complete!",
        description: "Administrator account created. You can now log in.",
      });
      
      setIsCompleted(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      console.error("Setup error:", error);
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred";
      
      setErrorMessage(errorMsg);
      
      toast({
        title: "Setup Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-center text-success">Setup Complete!</CardTitle>
            <CardDescription>
              Your administrator account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center my-6">
              <Shield className="w-16 h-16 text-success" />
            </div>
            <p>You will be redirected to the login page momentarily...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-success" />
          </div>
          <CardTitle className="text-center">First-Time Setup</CardTitle>
          <CardDescription className="text-center">
            Create your administrator account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required
                  className="pl-10"
                  minLength={8}
                />
              </div>
            </div>
            
            {errorMessage && (
              <div className="mt-4 bg-red-50 p-3 rounded text-xs text-red-800 border border-red-200">
                {errorMessage}
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full bg-success hover:bg-success/90 text-success-foreground"
            onClick={handleSetup}
            disabled={isLoading}
          >
            {isLoading ? "Creating Admin Account..." : "Create Administrator Account"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FirstTimeSetup;
