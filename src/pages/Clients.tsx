
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext"; // Auth context
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
import { useProfile } from "@/contexts/UserContext";
import { hasPermission } from "@/lib/permissions";

const Clients = () => {
  const { clients, loadClients } = useAppContext();
  const { user } = useAuth(); // Get the current authenticated user
  const { profile } = useProfile(); // Get the user profile with role
  const [open, setOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user has permission to modify clients
  const canModifyClients = profile && hasPermission(profile.role, 'manage_clients');

  const handleAddClient = () => {
    if (!canModifyClients) {
      toast.error("You don't have permission to add clients");
      return;
    }
    setEditClient(null);
    setOpen(true);
  };

  const handleEditClient = (client: Client) => {
    if (!canModifyClients) {
      toast.error("You don't have permission to edit clients");
      return;
    }
    setEditClient(client);
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setTimeout(() => {
      setEditClient(null);
    }, 300); // Wait for dialog animation to finish
  };

  const handleSubmit = async (formData: Omit<Client, "id">) => {
    if (!canModifyClients) {
      toast.error("You don't have permission to modify clients");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Check if user is authenticated
      if (!user) {
        toast.error("You must be logged in to perform this action");
        setIsSubmitting(false);
        return;
      }

      // Log authentication details for debugging
      console.log("Current user:", user.id);
      
      if (editClient) {
        const updatedClient = { ...editClient, ...formData };
        console.log("Updating client:", updatedClient);
        const success = await updateClient(updatedClient);
        if (success) {
          toast.success("Client updated successfully");
          await loadClients(); // Ensure we reload clients
          setOpen(false);
        } else {
          toast.error("Failed to update client");
        }
      } else {
        console.log("Creating new client with user ID:", user.id);
        const newClient = await createNewClient(formData);
        if (newClient) {
          toast.success("Client added successfully");
          await loadClients(); // Ensure we reload clients
          setOpen(false);
        } else {
          toast.error("Failed to add client");
        }
      }
    } catch (error) {
      console.error("Error creating/updating client:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setTimeout(() => {
        setEditClient(null);
        setIsSubmitting(false);
      }, 300); // Clean up state after dialog closes
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!canModifyClients) {
      toast.error("You don't have permission to delete clients");
      return;
    }
    
    setIsDeleting(true);
    try {
      if (!user) {
        toast.error("You must be logged in to perform this action");
        setIsDeleting(false);
        return;
      }
      
      const success = await deleteClient(id);
      if (success) {
        toast.success("Client deleted successfully");
        await loadClients(); // Ensure we reload clients
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
          {canModifyClients && (
            <Button onClick={handleAddClient}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      {clients && clients.length > 0 ? (
        <ClientsList
          clients={clients}
          onEdit={canModifyClients ? handleEditClient : undefined}
          onDelete={canModifyClients ? handleDeleteClient : undefined}
          onAddNew={canModifyClients ? handleAddClient : undefined}
          readOnly={!canModifyClients}
        />
      ) : (
        <NoData
          message="No clients yet"
          actionLabel={canModifyClients ? "Add your first client" : "No clients available"}
          onAction={canModifyClients ? handleAddClient : undefined}
        />
      )}

      <Dialog open={open} onOpenChange={(o) => {
        // Only allow closing if not in submitting state
        if (!isSubmitting || !o) {
          setOpen(o);
          if (!o) {
            // Add delay to ensure animation completes before clearing state
            setTimeout(() => {
              setEditClient(null);
            }, 300);
          }
        }
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh]" onInteractOutside={(e) => {
          // Prevent interaction outside while submitting
          if (isSubmitting) {
            e.preventDefault();
          }
        }}>
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
