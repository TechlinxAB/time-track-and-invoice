
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientForm } from "@/components/clients/ClientForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader
} from "@/components/ui/dialog";
import { createNewClient, updateClient, deleteClient } from "@/lib/supabase";
import { toast } from "sonner";
import { NoData } from "@/components/common/NoData";
import { ScrollArea } from "@/components/ui/scroll-area";

const Clients = () => {
  const { clients, loadClients } = useAppContext();
  const [open, setOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddClient = () => {
    setEditClient(null);
    setOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditClient(client);
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setEditClient(null);
  };

  const handleSubmit = async (formData: Omit<Client, "id">) => {
    setIsSubmitting(true);
    try {
      if (editClient) {
        const updatedClient = { ...editClient, ...formData };
        const success = await updateClient(updatedClient);
        if (success) {
          toast.success("Client updated successfully");
          loadClients();
          setOpen(false);
        } else {
          toast.error("Failed to update client");
        }
      } else {
        const newClient = await createNewClient(formData);
        if (newClient) {
          toast.success("Client added successfully");
          loadClients();
          setOpen(false);
        } else {
          toast.error("Failed to add client");
        }
      }
    } catch (error) {
      console.error("Error creating/updating client:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setEditClient(null);
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    setIsDeleting(true);
    try {
      const success = await deleteClient(id);
      if (success) {
        toast.success("Client deleted successfully");
        loadClients();
      } else {
        toast.error("Failed to delete client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
        <div>
          <Button onClick={handleAddClient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {clients && clients.length > 0 ? (
        <ClientsList
          clients={clients}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onAddNew={handleAddClient}
        />
      ) : (
        <NoData
          message="No clients yet"
          actionLabel="Add your first client"
          onAction={handleAddClient}
        />
      )}

      <Dialog open={open} onOpenChange={(o) => {
        // Only allow closing if not in submitting state
        if (!isSubmitting || !o) {
          setOpen(o);
          if (!o) {
            setEditClient(null);
          }
        }
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editClient ? "Edit Client" : "Add Client"}</DialogTitle>
            <DialogDescription>
              {editClient ? "Update client details" : "Add a new client to your workspace"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)] overflow-y-auto pr-4">
            <ClientForm
              client={editClient}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
