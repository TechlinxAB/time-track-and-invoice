
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
    customerNumber: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Sweden", // Default to Sweden
    invoiceAddress: "",
    paymentTerms: "30", // Store as string to match the Client type
    deliveryTerms: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        organizationNumber: client.organizationNumber || "",
        customerNumber: client.customerNumber || "",
        address: client.address || "",
        city: client.city || "",
        postalCode: client.postalCode || "",
        country: client.country || "Sweden",
        invoiceAddress: client.invoiceAddress || "",
        paymentTerms: client.paymentTerms || "30",
        deliveryTerms: client.deliveryTerms || "",
      });
    } else {
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        organizationNumber: "",
        customerNumber: "",
        address: "",
        city: "",
        postalCode: "",
        country: "Sweden",
        invoiceAddress: "",
        paymentTerms: "30",
        deliveryTerms: "",
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="customerNumber">Customer Number</Label>
            <Input 
              id="customerNumber"
              name="customerNumber"
              value={formData.customerNumber}
              onChange={handleChange}
              placeholder="Optional, assigned by Fortnox"
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
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input 
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input 
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input 
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input 
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="invoiceAddress">
            Invoice Address (if different from address)
          </Label>
          <Input 
            id="invoiceAddress"
            name="invoiceAddress"
            value={formData.invoiceAddress}
            onChange={handleChange}
            placeholder="Leave blank to use main address"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
            <Input 
              id="paymentTerms"
              name="paymentTerms"
              type="number"
              value={formData.paymentTerms}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliveryTerms">Delivery Terms</Label>
            <Input 
              id="deliveryTerms"
              name="deliveryTerms"
              value={formData.deliveryTerms}
              onChange={handleChange}
            />
          </div>
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
