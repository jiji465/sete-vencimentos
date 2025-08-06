import { FiscalEvent as FiscalEventType } from "@/types/fiscal";
import { FiscalEvent } from "./FiscalEvent";
import { isToday } from "@/lib/fiscal-utils";

interface CalendarDayProps {
  date: string;
  dayNumber: number;
  events: FiscalEventType[];
  onDayClick: (date: string) => void;
  onEventEdit: (event: FiscalEventType) => void;
  onEventDelete: (eventId: string) => void;
  isCurrentMonth?: boolean;
  isViewOnly?: boolean;
}

export function CalendarDay({
  date,
  dayNumber,
  events,
  onDayClick,
  onEventEdit,
  onEventDelete,
  isCurrentMonth = true,
  isViewOnly = false
}: CalendarDayProps) {
  const isDayToday = isToday(date);
  const dayEvents = events.filter(e => e.date === date).sort((a, b) => a.taxName.localeCompare(b.taxName));

  const handleDayClick = () => {
    if (!isViewOnly && isCurrentMonth) {
      onDayClick(date);
    }
  };

  return (
    <div
      className={`calendar-day ${isDayToday ? 'today' : ''} ${!isCurrentMonth ? 'opacity-30' : ''}`}
      onClick={handleDayClick}
    >
      <div className="flex justify-end mb-2">
        <span className={`text-sm font-semibold ${
          isDayToday 
            ? 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center' 
            : 'text-muted-foreground'
        }`}>
          {dayNumber}
        </span>
      </div>
      
      <div className="space-y-1 overflow-y-auto flex-1">
        {dayEvents.map(event => (
          <FiscalEvent
            key={event.id}
            event={event}
            onEdit={onEventEdit}
            onDelete={onEventDelete}
            isViewOnly={isViewOnly}
          />
        ))}
      </div>
    </div>
  );
}