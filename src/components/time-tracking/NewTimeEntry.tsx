
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
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
import { formatDate } from "@/lib/date-utils";
import { X } from "lucide-react";
import { toast } from "sonner";

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
  const [activityType, setActivityType] = useState<"hourly" | "fixed">("hourly");

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

  // Watch for activity changes to update activity type
  const selectedActivityId = form.watch("activityId");
  useEffect(() => {
    if (selectedActivityId) {
      const activity = activities.find((a) => a.id === selectedActivityId);
      if (activity) {
        setActivityType(activity.isFixedPrice ? "fixed" : "hourly");
      }
    }
  }, [selectedActivityId, activities]);

  const onSubmit = (data: FormValues) => {
    try {
      addTimeEntry({
        ...data,
        date: formatDate(date),
        billable: true,
        invoiced: false,
      });
      onSuccessfulAdd();
      toast.success("Time entry added successfully");
    } catch (error) {
      toast.error("Failed to add time entry");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">New time entry</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X size={18} />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Client</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                  <FormLabel>Activity / Item</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              Save Time Entry
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewTimeEntry;
