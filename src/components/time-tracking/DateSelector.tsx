
import { useState } from "react";
import { format, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/date-utils";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";

interface DateSelectorProps {
  weekDates: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const DateSelector = ({
  weekDates,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: DateSelectorProps) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSelectDate(date);
      setShowCalendar(false);
    }
  };

  return (
    <div className="card-glass rounded-xl overflow-hidden">
      {/* Week navigation */}
      <div className="flex justify-between items-center p-3 border-b border-border">
        <button
          onClick={onPrevWeek}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium">
          {format(weekDates[0], "MMM d")} - {format(weekDates[6], "MMM d")}
        </div>
        <button
          onClick={onNextWeek}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days list */}
      <div className="divide-y divide-border">
        {weekDates.map((date) => (
          <button
            key={format(date, "yyyy-MM-dd")}
            className={cn(
              "w-full px-4 py-3 text-left transition-colors flex items-center justify-between",
              isSameDay(date, selectedDate) 
                ? "bg-success/20 text-success font-medium" 
                : "hover:bg-accent"
            )}
            onClick={() => onSelectDate(date)}
          >
            <span>{formatDisplayDate(date)}</span>
            {isToday(date) && (
              <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Date Picker */}
      <div className="p-3 border-t border-border">
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowCalendar(true)}
            >
              <span>Choose a specific date</span>
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateSelector;
