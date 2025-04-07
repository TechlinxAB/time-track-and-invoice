
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
  initiateFortnoxOAuth 
} from '@/services/fortnoxService';
import { AlertCircle, CheckCircle } from 'lucide-react';

const FortnoxConnector = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
  }, []);

  const handleSaveCredentials = async () => {
    if (!credentials.clientId || !credentials.clientSecret) {
      toast.error('Please enter both Client ID and Client Secret');
      return;
    }

    try {
      setIsSaving(true);
      await saveFortnoxCredentials(credentials);
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

    // Save credentials first
    handleSaveCredentials().then(() => {
      // After saving, initiate the OAuth flow
      const redirectUri = `${window.location.origin}/settings?fortnox=callback`;
      initiateFortnoxOAuth(credentials.clientId, redirectUri);
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
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleSaveCredentials}
          disabled={isSaving}
        >
          {isSaving ? <Spinner className="mr-2" size="sm" /> : null}
          Save Credentials
        </Button>
        <Button 
          onClick={handleConnectFortnox}
          disabled={!credentials.clientId || isSaving}
          className="bg-success hover:bg-success/90 text-white"
        >
          Connect with Fortnox
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FortnoxConnector;
