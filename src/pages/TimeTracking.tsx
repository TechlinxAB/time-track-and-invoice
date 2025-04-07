
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { formatDate, formatDisplayDate, getDatesForCurrentWeek, getNextWeek, getPreviousWeek } from "@/lib/date-utils";
import DateSelector from "@/components/time-tracking/DateSelector";
import NewTimeEntry from "@/components/time-tracking/NewTimeEntry";
import TimeEntriesList from "@/components/time-tracking/TimeEntriesList";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

const TimeTracking = () => {
  const {
    selectedDate,
    setSelectedDate,
    clients,
    activities
  } = useAppContext();
  const [weekDates, setWeekDates] = useState(getDatesForCurrentWeek());
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePrevWeek = () => {
    const prevWeek = getPreviousWeek(weekDates[0]);
    setWeekDates(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = getNextWeek(weekDates[0]);
    setWeekDates(nextWeek);
  };
  
  const handleCloseAddEntry = () => {
    // Ensure modal is fully closed before updating state
    setTimeout(() => {
      setIsAddingEntry(false);
    }, 50);
  };

  // Show a warning if there are no clients or activities
  const showEmptyDataWarning = () => {
    if (clients.length === 0 && activities.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            You need to add clients and activities before you can track time. 
            Go to the <strong>Clients</strong> and <strong>Activities</strong> pages to add them.
          </p>
        </div>
      );
    } else if (clients.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            You need to add clients before you can track time. 
            Go to the <strong>Clients</strong> page to add them.
          </p>
        </div>
      );
    } else if (activities.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            You need to add activities before you can track time. 
            Go to the <strong>Activities</strong> page to add them.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <div className="flex gap-4">
          {/* Add any additional buttons/controls here */}
        </div>
      </div>

      {showEmptyDataWarning()}

      <div className="grid md:grid-cols-12 gap-6">
        {/* Left side - Date selector */}
        <div className="md:col-span-3">
          <DateSelector weekDates={weekDates} selectedDate={selectedDate} onSelectDate={setSelectedDate} onPrevWeek={handlePrevWeek} onNextWeek={handleNextWeek} />
        </div>
        
        {/* Right side - Time entry form and list */}
        <div className="md:col-span-9 space-y-6">
          {/* Time entry form */}
          <div className="card-glass rounded-xl p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="lg" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            ) : isAddingEntry ? (
              <NewTimeEntry 
                date={selectedDate} 
                onClose={handleCloseAddEntry} 
                onSuccessfulAdd={handleCloseAddEntry} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <h3 className="text-xl font-medium mb-2">Track your time</h3>
                <p className="text-muted-foreground mb-4">
                  Add time entries for {formatDisplayDate(selectedDate)}
                </p>
                <button 
                  className="bg-success hover:bg-success/90 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 shadow-sm timetrack-btn" 
                  onClick={() => {
                    if (clients.length === 0 || activities.length === 0) {
                      toast.error("You need clients and activities before adding time entries");
                      return;
                    }
                    setIsAddingEntry(true);
                  }}
                >
                  + Add time entry
                </button>
              </div>
            )}
          </div>
          
          {/* Time entries list for selected date */}
          <TimeEntriesList date={formatDate(selectedDate)} />
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
