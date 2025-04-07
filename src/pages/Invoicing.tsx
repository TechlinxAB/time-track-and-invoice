import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Info } from "lucide-react";
import { formatCurrency } from "@/lib/date-utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { exportInvoiceToFortnox, getFortnoxCredentials } from "@/services/fortnoxService";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Invoicing = () => {
  const { clients, timeEntries, getClientById, getActivityById } = useAppContext();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [invoiceNotes, setInvoiceNotes] = useState<string>("");
  const [hasFortnoxCredentials, setHasFortnoxCredentials] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const client = selectedClient ? getClientById(selectedClient) : null;
  const hasOrganizationNumber = client?.organizationNumber && client.organizationNumber.length > 0;

  useEffect(() => {
    const checkFortnoxCredentials = async () => {
      const credentials = await getFortnoxCredentials();
      setHasFortnoxCredentials(!!credentials && !!credentials.clientId && !!credentials.clientSecret);
    };
    
    checkFortnoxCredentials();
  }, []);

  const filteredTimeEntries = selectedClient && dateRange.from ? 
    timeEntries.filter(entry => 
      entry.clientId === selectedClient && 
      new Date(entry.date) >= dateRange.from! &&
      (!dateRange.to || new Date(entry.date) <= dateRange.to)
    ) : [];

  const handleExport = async () => {
    if (!hasOrganizationNumber) {
      toast.error("Organization number required for Fortnox integration. Please update client details.");
      return;
    }
    
    if (!selectedClient || !dateRange.from) {
      toast.error("Please select a client and date range");
      return;
    }
    
    setIsExporting(true);
    
    const invoiceData = {
      client: getClientById(selectedClient),
      dateRange,
      entries: filteredTimeEntries,
      notes: invoiceNotes,
      totalAmount: filteredTimeEntries.reduce((sum, entry) => {
        const activity = getActivityById(entry.activityId);
        if (!activity) return sum;
        
        if (activity.isFixedPrice) {
          return sum + (activity.fixedPrice || 0);
        } else {
          return sum + ((entry.duration / 60) * activity.hourlyRate);
        }
      }, 0),
    };
    
    try {
      if (!hasFortnoxCredentials) {
        toast.error("Fortnox credentials not found. Please set up Fortnox integration in Settings.");
        setIsExporting(false);
        return;
      }
      
      const result = await exportInvoiceToFortnox(invoiceData);
      
      if (result.success) {
        toast.success("Invoice exported to Fortnox successfully");
      } else {
        toast.error(`Failed to export invoice: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred during export");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
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
                    <option key={client.id} value={client.id}>
                      {client.name} {!client.organizationNumber && "(No org. number)"}
                    </option>
                  ))}
                </select>
                
                {selectedClient && !hasOrganizationNumber && (
                  <p className="mt-1 text-xs text-destructive">
                    Organization number required for Fortnox export
                  </p>
                )}
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

              <div>
                <label className="text-sm font-medium mb-1 block">Invoice Notes</label>
                <Textarea
                  placeholder="Add notes to your invoice"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full bg-success hover:bg-success/90 text-success-foreground"
                disabled={!selectedClient || !dateRange.from || isExporting}
                onClick={handleExport}
              >
                {isExporting ? <Spinner size="sm" className="mr-2" /> : null}
                Generate Invoice
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between" 
                        onClick={handleExport}
                        disabled={!selectedClient || !dateRange.from || !hasOrganizationNumber || isExporting || !hasFortnoxCredentials}
                      >
                        <span>Export to Fortnox</span>
                        {!hasFortnoxCredentials ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Fortnox credentials not set up. Go to Settings.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Info className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Requires client organization number and Fortnox credentials</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => toast.success("PDF download will be available in the next version")}
                disabled={!selectedClient || !dateRange.from}
              >
                Download PDF
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => toast.success("CSV export will be available in the next version")}
                disabled={!selectedClient || !dateRange.from}
              >
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
                {selectedClient && dateRange.from 
                  ? `${filteredTimeEntries.length} entries found for selected period` 
                  : "Select a client and date range to see a preview"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedClient || !dateRange.from ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Select a client and date range to generate an invoice preview
                  </p>
                </div>
              ) : filteredTimeEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No time entries found for the selected date range
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Activity</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTimeEntries.map(entry => {
                          const activity = getActivityById(entry.activityId);
                          let amount = 0;
                          
                          if (activity) {
                            if (activity.isFixedPrice) {
                              amount = activity.fixedPrice || 0;
                            } else {
                              amount = (entry.duration / 60) * activity.hourlyRate;
                            }
                          }
                          
                          return (
                            <TableRow key={entry.id}>
                              <TableCell>{format(new Date(entry.date), "yyyy-MM-dd")}</TableCell>
                              <TableCell>
                                {activity?.name}
                                {activity?.accountNumber && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    (Konto: {activity.accountNumber})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{entry.description}</TableCell>
                              <TableCell>
                                {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(amount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>
                          {formatCurrency(
                            filteredTimeEntries.reduce((sum, entry) => {
                              const activity = getActivityById(entry.activityId);
                              if (!activity) return sum;
                              
                              if (activity.isFixedPrice) {
                                return sum + (activity.fixedPrice || 0);
                              } else {
                                return sum + ((entry.duration / 60) * activity.hourlyRate);
                              }
                            }, 0)
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>
                          {formatCurrency(
                            filteredTimeEntries.reduce((sum, entry) => {
                              const activity = getActivityById(entry.activityId);
                              if (!activity) return sum;
                              
                              if (activity.isFixedPrice) {
                                return sum + (activity.fixedPrice || 0);
                              } else {
                                return sum + ((entry.duration / 60) * activity.hourlyRate);
                              }
                            }, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Invoicing;
