
import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { formatTimeFromMinutes, getTotalDurationForDay } from "@/lib/date-utils";
import { TimeEntry as TimeEntryType } from "@/types";
import TimeEntryItem from "./TimeEntryItem";
import EditTimeEntryModal from "./EditTimeEntryModal";
import { ClockIcon } from "lucide-react";

interface TimeEntriesListProps {
  date: string;
}

const TimeEntriesList = ({ date }: TimeEntriesListProps) => {
  const { getTimeEntriesForDate, getClientById, getActivityById } = useAppContext();
  const [editingEntry, setEditingEntry] = useState<TimeEntryType | null>(null);

  const timeEntries = getTimeEntriesForDate(date);
  const totalDuration = getTotalDurationForDay(timeEntries);

  const handleEdit = (entry: TimeEntryType) => {
    setEditingEntry(entry);
  };
  
  const handleCloseModal = () => {
    // Use setTimeout to ensure the DOM is updated properly
    setTimeout(() => {
      setEditingEntry(null);
    }, 50);
  };

  // Clean up any lingering styles when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, []);

  return (
    <div className="card-glass rounded-xl overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold">Recorded activities</h2>
        {totalDuration > 0 && (
          <div className="flex items-center text-sm">
            <ClockIcon size={16} className="mr-1" />
            <span>Total: {formatTimeFromMinutes(totalDuration)}</span>
          </div>
        )}
      </div>

      {timeEntries.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No activities recorded for this day.</p>
          <p className="text-sm text-muted-foreground mt-1">Add a time entry to start tracking.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {timeEntries.map((entry) => (
            <TimeEntryItem 
              key={entry.id}
              entry={entry}
              client={getClientById(entry.clientId)}
              activity={getActivityById(entry.activityId)}
              onEdit={() => handleEdit(entry)}
            />
          ))}
        </div>
      )}

      {editingEntry && (
        <EditTimeEntryModal 
          entry={editingEntry} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default TimeEntriesList;
