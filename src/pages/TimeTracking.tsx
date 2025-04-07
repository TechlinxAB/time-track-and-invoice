
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { format } from "date-fns";
import { formatDate, formatDisplayDate, getDatesForCurrentWeek, getNextWeek, getPreviousWeek } from "@/lib/date-utils";
import DateSelector from "@/components/time-tracking/DateSelector";
import NewTimeEntry from "@/components/time-tracking/NewTimeEntry";
import TimeEntriesList from "@/components/time-tracking/TimeEntriesList";

const TimeTracking = () => {
  const { selectedDate, setSelectedDate } = useAppContext();
  const [weekDates, setWeekDates] = useState(getDatesForCurrentWeek());
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  
  const handlePrevWeek = () => {
    const prevWeek = getPreviousWeek(weekDates[0]);
    setWeekDates(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = getNextWeek(weekDates[0]);
    setWeekDates(nextWeek);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <div className="flex gap-4">
          <button 
            className="bg-success hover:bg-success/90 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 shadow-sm timetrack-btn"
            onClick={() => setIsAddingEntry(true)}
          >
            + New time entry
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Left side - Date selector */}
        <div className="md:col-span-3">
          <DateSelector 
            weekDates={weekDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
          />
        </div>
        
        {/* Right side - Time entry form and list */}
        <div className="md:col-span-9 space-y-6">
          {/* Time entry form */}
          <div className="card-glass rounded-xl p-6">
            {isAddingEntry ? (
              <NewTimeEntry 
                date={selectedDate} 
                onClose={() => setIsAddingEntry(false)} 
                onSuccessfulAdd={() => setIsAddingEntry(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <h3 className="text-xl font-medium mb-2">Track your time</h3>
                <p className="text-muted-foreground mb-4">
                  Add time entries for {formatDisplayDate(selectedDate)}
                </p>
                <button 
                  className="bg-success hover:bg-success/90 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 shadow-sm timetrack-btn"
                  onClick={() => setIsAddingEntry(true)}
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
