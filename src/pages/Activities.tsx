import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockActivities } from "@/data/mockData";
import { Activity } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const Activities = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("services");
  const [isLoading, setIsLoading] = useState(false);
  
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    name: "",
    hourlyRate: 0,
    isFixedPrice: false,
    fixedPrice: 0,
    type: "service" as const,
  });

  const loadActivities = async () => {
    if (!user) {
      console.log("No authenticated user, skipping activities load");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error loading activities:', error.message);
        toast.error("Failed to load activities");
        return;
      }
      
      console.log(`Loaded ${data?.length || 0} activities`);
      
      const mappedActivities = data.map(item => ({
        id: item.id,
        name: item.name,
        hourlyRate: item.hourly_rate || 0,
        isFixedPrice: item.is_fixed_price || false,
        fixedPrice: item.fixed_price || 0,
        type: item.type || "service",
        accountNumber: item.account_number,
        vatPercentage: item.vat_percentage,
        articleNumber: item.article_number
      }));
      
      setActivities(mappedActivities);
    } catch (err) {
      console.error("Error loading activities:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadActivities();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      setNewActivity({
        ...newActivity,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === "number") {
      setNewActivity({
        ...newActivity,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setNewActivity({
        ...newActivity,
        [name]: value,
      });
    }
  };
  
  const handleTypeChange = (type: "service" | "product") => {
    setNewActivity({
      ...newActivity,
      type,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to add activities");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          name: newActivity.name || "Untitled Activity",
          hourly_rate: newActivity.hourlyRate || 0,
          is_fixed_price: newActivity.isFixedPrice || false,
          fixed_price: newActivity.fixedPrice || 0,
          type: newActivity.type || "service",
          account_number: newActivity.accountNumber,
          vat_percentage: newActivity.vatPercentage || 25,
          article_number: newActivity.articleNumber
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error adding activity:", error.message);
        toast.error("Failed to add activity");
        return;
      }
      
      console.log("Activity added successfully:", data);
      
      const newActivityItem: Activity = {
        id: data.id,
        name: data.name,
        hourlyRate: data.hourly_rate || 0,
        isFixedPrice: data.is_fixed_price || false,
        fixedPrice: data.fixed_price || 0,
        type: data.type || "service",
        accountNumber: data.account_number,
        vatPercentage: data.vat_percentage,
        articleNumber: data.article_number
      };
      
      setActivities([...activities, newActivityItem]);
      
      setNewActivity({
        name: "",
        hourlyRate: 0,
        isFixedPrice: false,
        fixedPrice: 0,
        type: "service",
      });
      
      toast.success("Activity added successfully");
      setDialogOpen(false);
    } catch (err) {
      console.error("Error adding activity:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => 
    (activeTab === "services" && activity.type === "service") || 
    (activeTab === "products" && activity.type === "product")
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Activities & Products</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-success hover:bg-success/90">
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Activity or Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="service"
                      name="type"
                      checked={newActivity.type === "service"}
                      onChange={() => handleTypeChange("service")}
                      className="rounded text-success focus:ring-success"
                    />
                    <Label htmlFor="service">Service</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="product"
                      name="type"
                      checked={newActivity.type === "product"}
                      onChange={() => handleTypeChange("product")}
                      className="rounded text-success focus:ring-success"
                    />
                    <Label htmlFor="product">Product</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newActivity.name}
                  onChange={handleChange}
                  placeholder="Activity name"
                  required
                />
              </div>
              
              {newActivity.type === "service" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFixedPrice"
                      name="isFixedPrice"
                      checked={newActivity.isFixedPrice}
                      onCheckedChange={(checked) => 
                        setNewActivity({...newActivity, isFixedPrice: checked})
                      }
                    />
                    <Label htmlFor="isFixedPrice">Fixed Price</Label>
                  </div>
                  
                  {newActivity.isFixedPrice ? (
                    <div className="space-y-2">
                      <Label htmlFor="fixedPrice">Fixed Price (SEK)</Label>
                      <Input
                        id="fixedPrice"
                        name="fixedPrice"
                        type="number"
                        value={newActivity.fixedPrice}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (SEK)</Label>
                      <Input
                        id="hourlyRate"
                        name="hourlyRate"
                        type="number"
                        value={newActivity.hourlyRate}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {newActivity.type === "product" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fixedPrice">Price per Unit (SEK)</Label>
                    <Input
                      id="fixedPrice"
                      name="fixedPrice"
                      type="number"
                      value={newActivity.fixedPrice}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  value={newActivity.accountNumber || ""}
                  onChange={handleChange}
                  placeholder="3000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vatPercentage">VAT %</Label>
                <Input
                  id="vatPercentage"
                  name="vatPercentage"
                  type="number"
                  value={newActivity.vatPercentage || 25}
                  onChange={handleChange}
                  placeholder="25"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="articleNumber">Article Number</Label>
                <Input
                  id="articleNumber"
                  name="articleNumber"
                  value={newActivity.articleNumber || ""}
                  onChange={handleChange}
                  placeholder="ABC123"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-success hover:bg-success/90"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Activity"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <Tabs defaultValue="services" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading activities...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Account</TableHead>
                  <TableHead className="text-right">VAT %</TableHead>
                  <TableHead className="text-right">Article #</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell>
                        {activity.type === "service" ? "Service" : "Product"}
                      </TableCell>
                      <TableCell className="text-right">
                        {activity.isFixedPrice
                          ? `${activity.fixedPrice} SEK`
                          : `${activity.hourlyRate} SEK/h`}
                      </TableCell>
                      <TableCell className="text-right">
                        {activity.accountNumber || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {activity.vatPercentage || 25}%
                      </TableCell>
                      <TableCell className="text-right">
                        {activity.articleNumber || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No {activeTab === "services" ? "services" : "products"} found. Add your first one!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Activities;
