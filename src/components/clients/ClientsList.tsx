
import { memo } from "react";
import { Client } from "@/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { NoData } from "@/components/common/NoData";
import { usePerformanceMonitor } from "@/lib/performance-utils";

type ClientsListProps = {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
};

export const ClientsList = memo(({ clients, onEdit, onDelete, onAddNew }: ClientsListProps) => {
  usePerformanceMonitor("ClientsList");

  if (clients.length === 0) {
    return (
      <NoData 
        message="You haven't added any clients yet" 
        actionLabel="Add your first client" 
        onAction={onAddNew}
      />
    );
  }

  return (
    <div className="rounded-md overflow-hidden border animate-fade-in">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Organization Number</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, index) => (
            <TableRow 
              key={client.id}
              className="hover:bg-muted/40 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.company || "-"}</TableCell>
              <TableCell>{client.organizationNumber || "-"}</TableCell>
              <TableCell>{client.email || "-"}</TableCell>
              <TableCell>{client.phone || "-"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card shadow-lg">
                    <DropdownMenuItem 
                      onClick={() => onEdit(client)}
                      className="cursor-pointer focus:bg-muted/60"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(client.id)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

ClientsList.displayName = "ClientsList";
