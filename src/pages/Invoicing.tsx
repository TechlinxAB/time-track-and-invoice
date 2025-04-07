
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/lib/date-utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Invoicing = () => {
  const { clients, timeEntries, getClientById, getActivityById } = useAppContext();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const handleExport = () => {
    toast.success("This feature will be implemented in the next version");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Invoicing</h1>

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Invoice</CardTitle>
              <CardDescription>Select a client and date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Select Client</label>
                <select 
                  className="w-full p-2 border border-input rounded-md"
                  onChange={(e) => setSelectedClient(e.target.value)}
                  value={selectedClient || ""}
                >
                  <option value="">Choose a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button 
                className="w-full bg-success hover:bg-success/90 text-success-foreground"
                disabled={!selectedClient || !dateRange.from}
                onClick={handleExport}
              >
                Generate Invoice
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
                Export to Fortnox
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
                Download PDF
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
                Export to CSV
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
              <CardDescription>
                Select a client and date range to see a preview
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedClient || !dateRange.from ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Select a client and date range to generate an invoice preview
                  </p>
                </div>
              ) : (
                <p className="text-center py-12 text-muted-foreground">
                  Invoice preview will be implemented in the next version
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
