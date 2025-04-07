
import { useState, useEffect } from "react";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ClientFormProps = {
  client: Client | null;
  onSubmit: (formData: Omit<Client, "id">) => void;
  onCancel: () => void;
};

export const ClientForm = ({ client, onSubmit, onCancel }: ClientFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    organizationNumber: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        organizationNumber: client.organizationNumber || "",
      });
    } else {
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        organizationNumber: "",
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{client ? "Edit Client" : "Add Client"}</DialogTitle>
        <DialogDescription>
          {client ? "Update client details" : "Add a new client to your workspace"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Client Name *</Label>
          <Input 
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input 
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationNumber">Organization Number</Label>
          <Input 
            id="organizationNumber"
            name="organizationNumber"
            value={formData.organizationNumber}
            onChange={handleChange}
            placeholder="XXXXXXXXXX"
          />
          <p className="text-xs text-muted-foreground">
            Required for Fortnox integration
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input 
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        
        <DialogFooter className="pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            {client ? "Save Changes" : "Add Client"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
