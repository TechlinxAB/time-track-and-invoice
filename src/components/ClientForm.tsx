
import React, { useState, useEffect } from "react";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

type ClientFormProps = {
  initialValues?: Client;
  onSubmit: (client: Omit<Client, "id">) => void;
  onCancel: () => void;
};

const ClientForm: React.FC<ClientFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Omit<Client, "id">>({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    country: "Sweden", // Default
    vatNumber: "",
    organizationNumber: "",
    customerNumber: "",
    notes: "",
    invoiceAddress: "",
    paymentTerms: "30", // Default
    deliveryTerms: ""
  });

  useEffect(() => {
    if (initialValues) {
      setFormData({
        name: initialValues.name,
        company: initialValues.company || "",
        email: initialValues.email || "",
        phone: initialValues.phone || "",
        address: initialValues.address || "",
        postalCode: initialValues.postalCode || "",
        city: initialValues.city || "",
        country: initialValues.country || "Sweden",
        vatNumber: initialValues.vatNumber || "",
        organizationNumber: initialValues.organizationNumber || "",
        customerNumber: initialValues.customerNumber || "",
        notes: initialValues.notes || "",
        invoiceAddress: initialValues.invoiceAddress || "",
        paymentTerms: initialValues.paymentTerms || "30",
        deliveryTerms: initialValues.deliveryTerms || ""
      });
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name*</Label>
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
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
          />
        </div>

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
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="organizationNumber">Organization Number</Label>
          <Input
            id="organizationNumber"
            name="organizationNumber"
            value={formData.organizationNumber}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vatNumber">VAT Number</Label>
          <Input
            id="vatNumber"
            name="vatNumber"
            value={formData.vatNumber}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerNumber">Customer Number</Label>
          <Input
            id="customerNumber"
            name="customerNumber"
            value={formData.customerNumber}
            onChange={handleChange}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-success hover:bg-success/90 text-success-foreground"
        >
          {initialValues ? "Update Client" : "Add Client"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ClientForm;
