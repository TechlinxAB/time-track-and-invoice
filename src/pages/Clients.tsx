
import { useState, useCallback, memo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Client } from "@/types";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientForm } from "@/components/clients/ClientForm";
import { usePerformanceMonitor } from "@/lib/performance-utils";

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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-success hover:bg-success/90 text-success-foreground"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>Manage your clients</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientsList 
            clients={clients}
            onEdit={handleOpenDialog}
            onDelete={deleteClient}
            onAddNew={() => handleOpenDialog()}
          />
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
