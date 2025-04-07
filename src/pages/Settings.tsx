
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Settings = () => {
  const [companyInfo, setCompanyInfo] = useState({
    name: "My Company",
    email: "contact@mycompany.com",
    phone: "+46 123 456 789",
    address: "123 Main Street, Stockholm, Sweden",
    taxId: "SE123456789",
  });

  const [fortnoxSettings, setFortnoxSettings] = useState({
    apiKey: "",
    accessToken: "",
    clientSecret: "",
  });

  const [appearance, setAppearance] = useState({
    primaryColor: "#22C55E", // Default green from our success color
    logo: null,
  });

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="fortnox">Fortnox Integration</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
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

        {/* Fortnox Integration Tab */}
        <TabsContent value="fortnox">
          <Card>
            <CardHeader>
              <CardTitle>Fortnox Integration</CardTitle>
              <CardDescription>
                Connect to Fortnox to automatically create invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  value={fortnoxSettings.apiKey}
                  onChange={handleFortnoxSettingsChange}
                  type="password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  name="accessToken"
                  value={fortnoxSettings.accessToken}
                  onChange={handleFortnoxSettingsChange}
                  type="password"
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

              <div className="flex flex-col gap-4 pt-4">
                <Button 
                  onClick={handleSaveSettings}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  Save API Settings
                </Button>
                <Button variant="outline">Test Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
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

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Add and manage users with access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-3">
                  User management will be implemented in the next version
                </p>
                <Button 
                  onClick={() => toast.info("This feature will be available soon!")}
                  variant="outline"
                >
                  Add User
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
