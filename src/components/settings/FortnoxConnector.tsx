
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FortnoxCredentials, 
  getFortnoxCredentials, 
  saveFortnoxCredentials,
  initiateFortnoxOAuth,
  handleFortnoxOAuthCallback,
  checkForOAuthCallback
} from '@/services/fortnoxService';
import { AlertCircle, CheckCircle, ArrowRight, Link } from 'lucide-react';

const FortnoxConnector = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [credentials, setCredentials] = useState<FortnoxCredentials>({
    clientId: '',
    clientSecret: '',
    connectionStatus: 'disconnected'
  });

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedCredentials = await getFortnoxCredentials();
        if (savedCredentials) {
          setCredentials(savedCredentials);
        }
      } catch (error) {
        console.error('Error loading Fortnox credentials:', error);
        toast.error('Failed to load Fortnox credentials');
      } finally {
        setIsLoading(false);
      }
    };

    loadCredentials();
    
    // Check if we're returning from an OAuth redirect
    const oauthParams = checkForOAuthCallback();
    if (oauthParams) {
      handleOAuthCallback(oauthParams.code, oauthParams.state);
    }
  }, []);
  
  // Handle OAuth callback after redirect
  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setIsConnecting(true);
      
      // Remove OAuth parameters from URL for cleaner UX
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('fortnox');
      window.history.replaceState({}, document.title, url.toString());
      
      // Get saved credentials
      const savedCreds = await getFortnoxCredentials();
      if (!savedCreds) {
        toast.error('Missing Fortnox credentials');
        return;
      }
      
      // Exchange code for token
      const redirectUri = `${window.location.origin}/settings?fortnox=callback`;
      const success = await handleFortnoxOAuthCallback(
        code,
        state,
        savedCreds.clientId,
        savedCreds.clientSecret,
        redirectUri
      );
      
      if (success) {
        toast.success('Successfully connected to Fortnox!');
        // Reload credentials to get updated connection status
        const updatedCredentials = await getFortnoxCredentials();
        if (updatedCredentials) {
          setCredentials(updatedCredentials);
        }
      } else {
        toast.error('Failed to connect to Fortnox');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('An error occurred during Fortnox connection');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!credentials.clientId || !credentials.clientSecret) {
      toast.error('Please enter both Client ID and Client Secret');
      return;
    }

    try {
      setIsSaving(true);
      await saveFortnoxCredentials(credentials);
      toast.success('Credentials saved successfully');
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectFortnox = () => {
    if (!credentials.clientId) {
      toast.error('Please enter a Client ID to connect');
      return;
    }

    setIsConnecting(true);
    // Save credentials first
    handleSaveCredentials().then(() => {
      // After saving, initiate the OAuth flow
      const redirectUri = `${window.location.origin}/settings?fortnox=callback`;
      const success = initiateFortnoxOAuth(credentials.clientId, redirectUri);
      
      if (!success) {
        setIsConnecting(false);
      }
      // If successful, we'll be redirected
    }).catch(() => {
      setIsConnecting(false);
    });
  };

  const getConnectionStatusBadge = () => {
    switch (credentials.connectionStatus) {
      case 'connected':
        return <Badge className="bg-success hover:bg-success">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Connection Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isConnecting) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-xl font-semibold">Connecting to Fortnox...</p>
            <p className="mt-2 text-muted-foreground">
              Please wait while we establish a connection with your Fortnox account.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Fortnox Integration</CardTitle>
            <CardDescription>
              Connect your Fortnox account to enable invoice export
            </CardDescription>
          </div>
          <div>{getConnectionStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client ID</Label>
          <Input
            id="clientId"
            value={credentials.clientId}
            onChange={(e) => setCredentials({...credentials, clientId: e.target.value})}
            placeholder="Enter your Fortnox Client ID"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientSecret">Client Secret</Label>
          <Input
            id="clientSecret"
            type="password"
            value={credentials.clientSecret}
            onChange={(e) => setCredentials({...credentials, clientSecret: e.target.value})}
            placeholder="Enter your Fortnox Client Secret"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
          <div className="flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">How to connect with Fortnox</p>
              <ol className="list-decimal pl-5 mt-2 text-sm">
                <li>Enter your Fortnox Client ID and Client Secret</li>
                <li>Click Save Credentials</li>
                <li>Click Connect with Fortnox</li>
                <li>Authorize in the window that opens</li>
              </ol>
            </div>
          </div>
        </div>

        {credentials.connectionStatus === 'connected' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-5 w-5" />
            <span>Your account is connected to Fortnox</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        <Button 
          variant="outline" 
          onClick={handleSaveCredentials}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? <Spinner className="mr-2" size="sm" /> : null}
          Save Credentials
        </Button>
        <Button 
          onClick={handleConnectFortnox}
          disabled={!credentials.clientId || isSaving}
          className="bg-success hover:bg-success/90 text-white w-full sm:w-auto"
        >
          <Link className="h-4 w-4 mr-2" />
          Connect with Fortnox
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FortnoxConnector;
