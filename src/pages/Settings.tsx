import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";
import { testSupabaseConnection } from "@/lib/supabase";
import { 
  saveFortnoxCredentials, 
  getFortnoxCredentials,
  FortnoxCredentials
} from "@/services/fortnoxService";
import UserManagement from "@/components/settings/UserManagement";
import { usePermissions } from "@/hooks/use-permissions";

const Settings = () => {
  const { can } = usePermissions();
  const [companyInfo, setCompanyInfo] = useState({
    name: "My Company",
    email: "contact@mycompany.com",
    phone: "+46 123 456 789",
    address: "123 Main Street, Stockholm, Sweden",
    taxId: "SE123456789",
  });

  const [fortnoxSettings, setFortnoxSettings] = useState<FortnoxCredentials>({
    clientId: "",
    clientSecret: "",
    accessToken: "",
    refreshToken: "",
  });

  const [appearance, setAppearance] = useState({
    primaryColor: "#22C55E", // Default green from our success color
    logo: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean;
    connected: boolean;
    error?: string;
  }>({ checked: false, connected: false });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Check Supabase connection first
      const connection = await testSupabaseConnection();
      setConnectionStatus({ checked: true, connected: connection.success, error: connection.error });
      
      if (connection.success) {
        // Load Fortnox credentials if connected
        const credentials = await getFortnoxCredentials();
        if (credentials) {
          setFortnoxSettings(credentials);
        }
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleFortnoxSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFortnoxSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };
  
  const handleSaveFortnoxSettings = async () => {
    setIsLoading(true);
    const success = await saveFortnoxCredentials(fortnoxSettings);
    setIsLoading(false);
    
    if (success) {
      toast.success("Fortnox settings saved successfully");
    }
  };
  
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    
    try {
      const connection = await testSupabaseConnection();
      setConnectionStatus({ 
        checked: true, 
        connected: connection.success, 
        error: connection.error 
      });
      
      if (connection.success) {
        toast.success("Connection to Supabase successful");
      } else {
        toast.error(`Connection failed: ${connection.error}`);
      }
      
      setIsTestingConnection(false);
    } catch (error) {
      toast.error("Failed to test connection");
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      {connectionStatus.checked && !connectionStatus.connected && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to connect to the Supabase database. Please check your environment variables and ensure your Supabase instance is running.
            {connectionStatus.error && (
              <div className="mt-2 text-sm">
                Error: {connectionStatus.error}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="fortnox">Fortnox Integration</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Set your company details that will appear on invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="name"
                    value={companyInfo.name}
                    onChange={handleCompanyInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input
                    id="taxId"
                    name="taxId"
                    value={companyInfo.taxId}
                    onChange={handleCompanyInfoChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={companyInfo.email}
                    onChange={handleCompanyInfoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={companyInfo.phone}
                    onChange={handleCompanyInfoChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={companyInfo.address}
                  onChange={handleCompanyInfoChange}
                />
              </div>

              <Button 
                onClick={handleSaveSettings}
                className="bg-success hover:bg-success/90 text-success-foreground mt-4"
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fortnox">
          <Card>
            <CardHeader>
              <CardTitle>Fortnox Integration</CardTitle>
              <CardDescription>
                Connect to Fortnox to automatically create invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <>
                  {!connectionStatus.connected && (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Database connection is required to save Fortnox credentials. Test the connection first.
                      </AlertDescription>
                    </Alert>
                  )}
                
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      name="clientId"
                      value={fortnoxSettings.clientId}
                      onChange={handleFortnoxSettingsChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      name="clientSecret"
                      value={fortnoxSettings.clientSecret}
                      onChange={handleFortnoxSettingsChange}
                      type="password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessToken">Access Token (Optional)</Label>
                    <Input
                      id="accessToken"
                      name="accessToken"
                      value={fortnoxSettings.accessToken || ""}
                      onChange={handleFortnoxSettingsChange}
                      type="password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refreshToken">Refresh Token (Optional)</Label>
                    <Input
                      id="refreshToken"
                      name="refreshToken"
                      value={fortnoxSettings.refreshToken || ""}
                      onChange={handleFortnoxSettingsChange}
                      type="password"
                    />
                  </div>

                  <div className="flex flex-col gap-4 pt-4">
                    <Button 
                      onClick={handleSaveFortnoxSettings}
                      className="bg-success hover:bg-success/90 text-success-foreground"
                      disabled={isLoading || !connectionStatus.connected}
                    >
                      {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                      Save API Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? <Spinner size="sm" className="mr-2" /> : null}
                      Test Database Connection
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    id="primaryColor"
                    value={appearance.primaryColor}
                    onChange={(e) => 
                      setAppearance(prev => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={appearance.primaryColor}
                    onChange={(e) => 
                      setAppearance(prev => ({ ...prev, primaryColor: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Upload Logo</Label>
                <Input 
                  id="logo"
                  type="file" 
                  accept="image/*"
                />
              </div>

              <Button 
                onClick={handleSaveSettings}
                className="bg-success hover:bg-success/90 text-success-foreground mt-4"
              >
                Save Appearance
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
