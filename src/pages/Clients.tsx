import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { UserPlus, Users } from "lucide-react";
import { Client } from "@/types";
import {
  fetchClients,
  createNewClient,
  updateClient,
  deleteClient,
} from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import ClientForm from "@/components/ClientForm";
import ClientsList from "@/components/ClientsList";
import NoData from "@/components/NoData";
import { usePermissions } from "@/hooks/use-permissions";

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { isManager } = usePermissions();

  useEffect(() => {
    fetchClientsData();
  }, []);

  const fetchClientsData = async () => {
    setIsLoading(true);
    const fetchedClients = await fetchClients();
    setClients(fetchedClients);
    setIsLoading(false);
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setIsAddClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsAddClientModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client?"
    );
    if (!confirmDelete) return;

    const success = await deleteClient(id);
    if (success) {
      toast({
        title: "Client Deleted",
        description: "The client has been successfully deleted.",
      });
      fetchClientsData();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete the client.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitClient = async (clientData: Client) => {
    setIsLoading(true);
    try {
      let result;
      if (editingClient) {
        // Update existing client
        result = await updateClient({ ...editingClient, ...clientData });
      } else {
        // Create new client
        result = await createNewClient(clientData);
      }

      if (result) {
        toast({
          title: editingClient ? "Client Updated" : "Client Added",
          description: `Client ${
            editingClient ? "updated" : "added"
          } successfully.`,
        });
        setIsAddClientModalOpen(false);
        fetchClientsData();
      } else {
        toast({
          title: "Error",
          description: `Failed to ${editingClient ? "update" : "add"} client.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client information and projects
          </p>
        </div>
        {isManager && (
          <Button onClick={handleAddClient} className="bg-success hover:bg-success/90">
            <UserPlus size={16} className="mr-2" /> Add Client
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : clients.length === 0 ? (
        <NoData
          title="No clients found"
          description="You haven't added any clients yet. Add your first client to get started!"
          buttonText={isManager ? "Add Client" : undefined}
          onButtonClick={isManager ? handleAddClient : undefined}
          icon={Users}
        />
      ) : (
        <ClientsList
          clients={clients}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onAddNew={handleAddClient}
        />
      )}

      {/* Client form modal for adding/editing */}
      <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Update the client's information"
                : "Fill in the details to add a new client"}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            initialValues={editingClient || undefined}
            onSubmit={handleSubmitClient}
            onCancel={() => setIsAddClientModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
