
import { useState, useCallback, memo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
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
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-success/10 text-success">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-success to-success/70 bg-clip-text text-transparent">Clients</h1>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-success hover:bg-success/90 text-success-foreground shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>
      
      <Card className="border-t-4 border-t-success shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-2xl">Client List</CardTitle>
          <CardDescription>Manage your clients and their information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ClientsList 
            clients={clients}
            onEdit={handleOpenDialog}
            onDelete={deleteClient}
            onAddNew={() => handleOpenDialog()}
          />
        </CardContent>
        <CardFooter className="bg-muted/20 text-sm text-muted-foreground py-3">
          {clients.length > 0 ? 
            `${clients.length} client${clients.length === 1 ? '' : 's'} in total` : 
            'No clients added yet'}
        </CardFooter>
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
