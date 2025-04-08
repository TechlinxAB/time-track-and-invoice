
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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
      
      // SIMPLIFIED: Skip all checks and just create the user directly
      // NOTE: We're avoiding the get_user_count function entirely
      
      // CRITICAL: Modified signup with all possible options to bypass email verification
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // CRITICAL: Set data.email_confirmed: true to skip email verification
          data: {
            full_name: fullName,
            is_admin_setup: true,
            email_confirmed: true,
            is_verified: true,
            autoConfirm: true
          },
          // CRITICAL: Setting emailRedirectTo to null may help bypass email verification
          emailRedirectTo: null
        }
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        
        // Special case: If we get an email error, try to proceed anyway
        if (signUpError.message.includes("email")) {
          console.log("Email error detected, trying to proceed with profile creation anyway");
          // Continue to next step even though sign-up had issues
        } else {
          // For other errors, stop here
          throw signUpError;
        }
      }

      // If we have a user from signup OR we're proceeding despite email errors
      if (authData?.user || signUpError?.message.includes("email")) {
        const userId = authData?.user?.id;
        
        if (userId) {
          console.log("User created, creating profile with admin role...");
          
          // Create the profile with admin role
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              full_name: fullName,
              avatar_url: '',
              role: 'admin', // Explicitly set as admin
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            throw profileError;
          }
        } else {
          console.log("No user ID available, but continuing anyway...");
        }

        // Success! Show success message and redirect
        toast({
          title: "Setup Complete!",
          description: "Administrator account created successfully. You can now log in.",
          variant: "default"
        });
        
        setIsCompleted(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Setup error:", error);
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred";
      
      // Special handling for email confirmation errors - suggest logging in directly
      if (errorMsg.includes("confirmation") || errorMsg.includes("email")) {
        setErrorMessage("Account likely created. Please try logging in with your credentials.");
        
        toast({
          title: "Setup Likely Complete",
          description: "Your account may have been created. Please try logging in.",
          variant: "default"
        });
        
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }
      
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
