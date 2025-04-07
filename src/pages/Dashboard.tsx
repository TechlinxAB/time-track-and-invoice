
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { format, startOfMonth, endOfMonth, parseISO, isToday } from "date-fns";
import { formatDate, formatTimeFromMinutes, getTotalDurationForDay } from "@/lib/date-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntry } from "@/types";
import { Clock, FileText, BarChart3, ArrowRight, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { timeEntries, clients, getClientById, getActivityById } = useAppContext();
  
  // Get today's date
  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntries = timeEntries.filter(entry => entry.date === today);
  const totalTodayDuration = getTotalDurationForDay(todayEntries);
  
  // Get current month entries
  const startMonth = formatDate(startOfMonth(new Date()));
  const endMonth = formatDate(endOfMonth(new Date()));
  const monthEntries = timeEntries.filter(
    entry => entry.date >= startMonth && entry.date <= endMonth
  );
  
  // Calculate month stats
  const monthlyDuration = monthEntries.reduce((sum, entry) => sum + entry.duration, 0);
  
  // Get unbilled entries
  const unbilledEntries = timeEntries.filter(entry => !entry.invoiced);
  
  // Get recent entries (last 5)
  const recentEntries = [...timeEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's time */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTimeFromMinutes(totalTodayDuration)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayEntries.length} {todayEntries.length === 1 ? 'entry' : 'entries'} today
            </p>
            <Button 
              variant="link" 
              className="px-0 mt-2 text-success"
              onClick={() => navigate('/time-tracking')}
            >
              Add time entry
            </Button>
          </CardContent>
        </Card>
        
        {/* Monthly time */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTimeFromMinutes(monthlyDuration)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'} this month
            </p>
          </CardContent>
        </Card>
        
        {/* Clients */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <Button 
              variant="link" 
              className="px-0 mt-2 text-success"
              onClick={() => navigate('/clients')}
            >
              Manage clients
            </Button>
          </CardContent>
        </Card>
        
        {/* Unbilled time */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unbilled time</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTimeFromMinutes(unbilledEntries.reduce((sum, entry) => sum + entry.duration, 0))}
            </div>
            <Button 
              variant="link" 
              className="px-0 mt-2 text-success"
              onClick={() => navigate('/invoicing')}
            >
              Create invoice
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent entries */}
      <Card className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <CardHeader>
          <CardTitle>Recent time entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentEntries.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No time entries yet.</p>
              <Button 
                variant="link" 
                className="mt-2 text-success"
                onClick={() => navigate('/time-tracking')}
              >
                Add your first time entry
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentEntries.map(entry => {
                const client = getClientById(entry.clientId);
                const activity = getActivityById(entry.activityId);
                
                return (
                  <div key={entry.id} className="p-4 hover:bg-accent/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{client?.name}</div>
                        <div className="text-sm text-muted-foreground">{activity?.name}</div>
                        {entry.description && (
                          <div className="text-sm mt-1 truncate max-w-md">{entry.description}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatTimeFromMinutes(entry.duration)}</div>
                        <div className="text-sm text-muted-foreground">
                          {isToday(parseISO(entry.date)) ? 'Today' : format(parseISO(entry.date), 'dd MMM yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="p-4 text-center">
                <Button 
                  variant="link"
                  className="text-success"
                  onClick={() => navigate('/time-tracking')}
                >
                  View all time entries
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
