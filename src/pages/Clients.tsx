
import { useState, useCallback, memo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Users, UserPlus, SearchX } from "lucide-react";
import { Client } from "@/types";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientForm } from "@/components/clients/ClientForm";
import { usePerformanceMonitor } from "@/lib/performance-utils";
import { NoData } from "@/components/common/NoData";

const Clients = memo(() => {
  usePerformanceMonitor("ClientsPage");
  const { clients, addClient, updateClient, deleteClient } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleOpenDialog = useCallback((client?: Client) => {
    setEditingClient(client || null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleSubmit = useCallback((formData: Omit<Client, "id">) => {
    if (editingClient) {
      updateClient({
        ...editingClient,
        ...formData
      });
    } else {
      addClient(formData);
    }
    
    setDialogOpen(false);
  }, [editingClient, addClient, updateClient]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-success/10 text-success">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-success to-success/70 bg-clip-text text-transparent">
              Clients
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your clients and their information
            </p>
          </div>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-success hover:bg-success/90 text-success-foreground shadow-sm transition-all hover:shadow-md"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add New Client
        </Button>
      </div>
      
      {/* Main content */}
      <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-muted/20 border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-xl">Client List</CardTitle>
              <CardDescription>View and manage all your clients</CardDescription>
            </div>
            {clients.length > 0 && (
              <div className="text-sm text-muted-foreground bg-background/80 px-3 py-1.5 rounded-md">
                {clients.length} {clients.length === 1 ? 'client' : 'clients'} total
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {clients.length === 0 ? (
            <NoData 
              message="No clients added yet" 
              actionLabel="Add Your First Client" 
              onAction={() => handleOpenDialog()}
              icon={<SearchX className="h-10 w-10 text-muted-foreground" />} 
            />
          ) : (
            <ClientsList 
              clients={clients}
              onEdit={handleOpenDialog}
              onDelete={deleteClient}
              onAddNew={() => handleOpenDialog()}
            />
          )}
        </CardContent>
        {clients.length > 0 && (
          <CardFooter className="bg-muted/10 text-sm text-muted-foreground py-3 border-t flex justify-between items-center">
            <span>
              {clients.length} {clients.length === 1 ? 'client' : 'clients'} in total
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleOpenDialog()}
              className="border-success text-success hover:bg-success/10"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Client
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Client dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <ClientForm 
            client={editingClient}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
});

Clients.displayName = "Clients";

export default Clients;
