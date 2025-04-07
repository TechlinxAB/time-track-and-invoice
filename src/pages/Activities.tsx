import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Activity } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/date-utils";
const Activities = () => {
  const {
    activities,
    addActivity,
    updateActivity,
    deleteActivity
  } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    hourlyRate: 0,
    isFixedPrice: false,
    fixedPrice: 0,
    accountNumber: ""
  });
  const handleOpenDialog = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        name: activity.name,
        hourlyRate: activity.hourlyRate,
        isFixedPrice: activity.isFixedPrice,
        fixedPrice: activity.fixedPrice || 0,
        accountNumber: activity.accountNumber || ""
      });
    } else {
      setEditingActivity(null);
      setFormData({
        name: "",
        hourlyRate: 0,
        isFixedPrice: false,
        fixedPrice: 0,
        accountNumber: ""
      });
    }
    setDialogOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingActivity) {
      updateActivity({
        ...editingActivity,
        ...formData
      });
    } else {
      addActivity(formData);
    }
    setDialogOpen(false);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value,
      type
    } = e.target;
    if (type === "number") {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isFixedPrice: checked
    }));
  };
  const handleDelete = (id: string) => {
    deleteActivity(id);
  };
  return <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Activities</h1>
        <Button onClick={() => handleOpenDialog()} className="bg-success hover:bg-success/90 text-success-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add Activity
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardDescription>Manage your available activities and their rates</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? <div className="text-center py-12">
              <p className="text-muted-foreground">You haven't added any activities yet</p>
              <Button variant="link" className="mt-2 text-success" onClick={() => handleOpenDialog()}>
                Add your first activity
              </Button>
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rate Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead className="w-[100px]">Activities &amp; items list</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map(activity => <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell>{activity.isFixedPrice ? 'Fixed Price' : 'Hourly'}</TableCell>
                    <TableCell>
                      {activity.isFixedPrice ? formatCurrency(activity.fixedPrice || 0) : `${formatCurrency(activity.hourlyRate)}/hour`}
                    </TableCell>
                    <TableCell>{activity.accountNumber || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(activity)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(activity.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Edit Activity" : "Add Activity"}</DialogTitle>
            <DialogDescription>
              {editingActivity ? "Update activity details" : "Add a new activity to your workspace"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Activity Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number (Kontonummer)</Label>
              <Input id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="e.g. 3000" />
              <p className="text-xs text-muted-foreground">
                Required for Fortnox integration. Usually 4 digits.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="price-type" checked={formData.isFixedPrice} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="price-type">Fixed Price</Label>
            </div>
            
            {formData.isFixedPrice ? <div className="space-y-2">
                <Label htmlFor="fixedPrice">Fixed Price (SEK) *</Label>
                <Input id="fixedPrice" name="fixedPrice" type="number" value={formData.fixedPrice} onChange={handleChange} min="0" step="1" required={formData.isFixedPrice} />
              </div> : <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (SEK) *</Label>
                <Input id="hourlyRate" name="hourlyRate" type="number" value={formData.hourlyRate} onChange={handleChange} min="0" step="1" required={!formData.isFixedPrice} />
              </div>}
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-success hover:bg-success/90 text-success-foreground">
                {editingActivity ? "Save Changes" : "Add Activity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Activities;