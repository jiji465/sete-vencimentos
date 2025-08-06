import { FiscalEvent as FiscalEventType } from "@/types/fiscal";
import { CalendarDay } from "./CalendarDay";
import { Card } from "@/components/ui/card";

interface CalendarProps {
  currentDate: Date;
  events: FiscalEventType[];
  onDayClick: (date: string) => void;
  onEventEdit: (event: FiscalEventType) => void;
  onEventDelete: (eventId: string) => void;
  isViewOnly?: boolean;
}

export function Calendar({
  currentDate,
  events,
  onDayClick,
  onEventEdit,
  onEventDelete,
  isViewOnly = false
}: CalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
  const lastDateOfLastMonth = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month days
  for (let i = firstDayOfMonth; i > 0; i--) {
    const day = lastDateOfLastMonth - i + 1;
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    days.push(
      <CalendarDay
        key={`prev-${day}`}
        date={dateStr}
        dayNumber={day}
        events={events}
        onDayClick={onDayClick}
        onEventEdit={onEventEdit}
        onEventDelete={onEventDelete}
        isCurrentMonth={false}
        isViewOnly={isViewOnly}
      />
    );
  }

  // Current month days
  for (let day = 1; day <= lastDateOfMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    days.push(
      <CalendarDay
        key={`current-${day}`}
        date={dateStr}
        dayNumber={day}
        events={events}
        onDayClick={onDayClick}
        onEventEdit={onEventEdit}
        onEventDelete={onEventDelete}
        isCurrentMonth={true}
        isViewOnly={isViewOnly}
      />
    );
  }

  // Next month days (to fill the grid)
  const remainingCells = 42 - days.length;
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    const dateStr = date.toISOString().split('T')[0];
    days.push(
      <CalendarDay
        key={`next-${day}`}
        date={dateStr}
        dayNumber={day}
        events={events}
        onDayClick={onDayClick}
        onEventEdit={onEventEdit}
        onEventDelete={onEventDelete}
        isCurrentMonth={false}
        isViewOnly={isViewOnly}
      />
    );
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card className="shadow-elegant overflow-hidden">
      {/* Header with week days */}
      <div className="gradient-brand text-primary-foreground">
        <div className="grid grid-cols-7 text-center py-3">
          {weekDays.map(day => (
            <div key={day} className="font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {days}
      </div>
    </Card>
  );
}