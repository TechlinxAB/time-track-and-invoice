
import { useAppContext } from "@/contexts/AppContext";
import { calculateDuration, formatTimeFromMinutes } from "@/lib/date-utils";
import { Activity, Client, TimeEntry } from "@/types";
import { formatCurrency } from "@/lib/date-utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface TimeEntryItemProps {
  entry: TimeEntry;
  client: Client | undefined;
  activity: Activity | undefined;
  onEdit: () => void;
}

const TimeEntryItem = ({ entry, client, activity, onEdit }: TimeEntryItemProps) => {
  const { deleteTimeEntry } = useAppContext();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    deleteTimeEntry(entry.id);
    toast.success("Time entry deleted");
  };

  if (!client || !activity) {
    return null;
  }
  
  const amount = activity.isFixedPrice 
    ? activity.fixedPrice || 0
    : (entry.duration / 60) * activity.hourlyRate;

  return (
    <div className="p-4 hover:bg-accent/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{client.name}</h3>
              <div className="text-sm text-muted-foreground">{activity.name}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatCurrency(amount)}</div>
              <div className="text-sm text-muted-foreground">
                {entry.startTime} - {entry.endTime} ({formatTimeFromMinutes(entry.duration)})
              </div>
            </div>
          </div>
          
          {entry.description && (
            <p className="text-sm mt-2 text-muted-foreground">{entry.description}</p>
          )}
        </div>

        <div className="ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)} 
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this time entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeEntryItem;
