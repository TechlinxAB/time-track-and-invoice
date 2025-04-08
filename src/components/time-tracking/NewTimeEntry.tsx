
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext"; // Import Auth context
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate, calculateDuration } from "@/lib/date-utils";
import { X } from "lucide-react";
import { toast } from "sonner";
import { TimeInput } from "@/components/ui/time-input";

interface NewTimeEntryProps {
  date: Date;
  onClose: () => void;
  onSuccessfulAdd: () => void;
}

const formSchema = z.object({
  clientId: z.string({ required_error: "Please select a client" }),
  activityId: z.string({ required_error: "Please select an activity" }),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const NewTimeEntry = ({ date, onClose, onSuccessfulAdd }: NewTimeEntryProps) => {
  const { clients, activities, addTimeEntry } = useAppContext();
  const { user } = useAuth(); // Get the current authenticated user
  const [activityType, setActivityType] = useState<"hourly" | "fixed">("hourly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      activityId: "",
      startTime: "",
      endTime: "",
      description: "",
    },
  });

  const selectedActivityId = form.watch("activityId");
  useEffect(() => {
    if (selectedActivityId) {
      const activity = activities.find((a) => a.id === selectedActivityId);
      if (activity) {
        setActivityType(activity.isFixedPrice ? "fixed" : "hourly");
      }
    }
  }, [selectedActivityId, activities]);

  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, []);

  const handleClose = () => {
    if (isSubmitting) return;
    
    form.reset();
    
    setTimeout(() => {
      onClose();
    }, 50);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Check if user is authenticated
      if (!user) {
        toast.error("You must be logged in to add time entries");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Adding time entry for user:", user.id);
      
      const duration = calculateDuration(data.startTime, data.endTime);
      
      const selectedActivity = activities.find(a => a.id === data.activityId);
      
      const timeEntryData = {
        clientId: data.clientId,
        activityId: data.activityId,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description || "",
        date: formatDate(date),
        duration,
        billable: true,
        invoiced: false,
        entryType: selectedActivity?.type || "service"
      };
      
      await addTimeEntry(timeEntryData);
      
      toast.success("Time entry added successfully");
      
      setTimeout(() => {
        onSuccessfulAdd();
      }, 100);
    } catch (error) {
      console.error("Error adding time entry:", error);
      toast.error("Failed to add time entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">New time entry</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          disabled={isSubmitting}
          className="h-8 w-8 p-0"
        >
          <X size={18} />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Client</FormLabel>
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

            <FormField
              control={form.control}
              name="activityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity / Item</FormLabel>
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
                          {activity.isFixedPrice
                            ? ` (Fixed: ${activity.fixedPrice} SEK)`
                            : ` (${activity.hourlyRate} SEK/h)`}
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
            <FormField
              control={form.control}
              name="startTime"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Time From</FormLabel>
                  <FormControl>
                    <TimeInput
                      {...field}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      error={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Time To</FormLabel>
                  <FormControl>
                    <TimeInput
                      {...field}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      error={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <div className="flex justify-end pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-success hover:bg-success/90 text-success-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Time Entry"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewTimeEntry;
