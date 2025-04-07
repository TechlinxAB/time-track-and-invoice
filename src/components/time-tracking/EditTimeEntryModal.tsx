
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { TimeEntry } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateDuration } from "@/lib/date-utils";

interface EditTimeEntryModalProps {
  entry: TimeEntry;
  onClose: () => void;
}

const formSchema = z.object({
  clientId: z.string(),
  activityId: z.string(),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EditTimeEntryModal = ({ entry, onClose }: EditTimeEntryModalProps) => {
  const { clients, activities, updateTimeEntry } = useAppContext();
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: entry.clientId,
      activityId: entry.activityId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      description: entry.description,
    },
  });

  // Handle dialog close with proper cleanup
  const handleClose = () => {
    if (isSubmitting) return;
    
    setIsOpen(false);
    
    // Allow animation to complete before removing from DOM
    // Use a slightly longer timeout to ensure UI is responsive
    setTimeout(() => {
      // Reset the form before unmounting
      form.reset();
      onClose();
    }, 300);
  };

  // Ensure dialog properly cleans up on unmount
  useEffect(() => {
    return () => {
      // Cleanup function for when component unmounts
      document.body.style.pointerEvents = '';
    };
  }, []);

  // Handle open state change from Dialog component
  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      handleClose();
    }
    setIsOpen(open);
  };

  const onSubmit = (data: FormValues) => {
    try {
      setIsSubmitting(true);
      const duration = calculateDuration(data.startTime, data.endTime);
      
      updateTimeEntry({
        ...entry,
        ...data,
        duration,
      });
      
      handleClose();
    } catch (error) {
      console.error("Error updating time entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => {
        // Prevent interaction outside while submitting
        if (isSubmitting) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Activity Selection */}
              <FormField
                control={form.control}
                name="activityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an activity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activities.map((activity) => (
                          <SelectItem key={activity.id} value={activity.id}>
                            {activity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time fields */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time From</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        className="input-time w-full"
                        placeholder="HH:MM"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time To</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        className="input-time w-full"
                        placeholder="HH:MM"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What did you do?"
                      className="h-24"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-2 space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-success hover:bg-success/90 text-success-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTimeEntryModal;
