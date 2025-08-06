import { useState } from 'react';
import { FiscalHeader } from './FiscalHeader';
import { ClientInfo } from './ClientInfo';
import { CalendarControls } from './CalendarControls';
import { Calendar } from './Calendar';
import { EventModal } from './EventModal';
import { ShareModal } from './ShareModal';
import { useFiscalCalendar } from '@/hooks/use-fiscal-calendar';
import { FiscalEvent } from '@/types/fiscal';

interface FiscalCalendarAppProps {
  isViewOnly?: boolean;
  calendarId?: string;
}

export function FiscalCalendarApp({ isViewOnly = false, calendarId }: FiscalCalendarAppProps) {
  const {
    currentDate,
    calendarId: currentCalendarId,
    state,
    navigateMonth,
    saveEvent,
    deleteEvent,
    updateAppInfo
  } = useFiscalCalendar({ isViewOnly, initialCalendarId: calendarId });

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FiscalEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setEventModalOpen(true);
  };

  const handleEventEdit = (event: FiscalEvent) => {
    setSelectedEvent(event);
    setSelectedDate('');
    setEventModalOpen(true);
  };

  const handleEventSave = (event: FiscalEvent) => {
    saveEvent(event);
    setEventModalOpen(false);
  };

  const handleEventDelete = (eventId: string) => {
    deleteEvent(eventId);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setEventModalOpen(true);
  };

  const handleExportPdf = () => {
    // TODO: Implement PDF export
    console.log('Export PDF functionality to be implemented');
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <FiscalHeader
          calendarTitle={state.appInfo.calendarTitle}
          onCalendarTitleChange={(title) => updateAppInfo({ calendarTitle: title })}
          onAddEvent={handleAddEvent}
          onExportPdf={handleExportPdf}
          onShare={handleShare}
          isViewOnly={isViewOnly}
        />

        <div className="space-y-6">
          <ClientInfo
            clientName={state.appInfo.name}
            clientCnpj={state.appInfo.cnpj}
            onClientNameChange={(name) => updateAppInfo({ name })}
            onClientCnpjChange={(cnpj) => updateAppInfo({ cnpj })}
            isViewOnly={isViewOnly}
          />

          <CalendarControls
            currentDate={currentDate}
            onPrevMonth={() => navigateMonth('prev')}
            onNextMonth={() => navigateMonth('next')}
          />

          <Calendar
            currentDate={currentDate}
            events={state.events}
            onDayClick={handleDayClick}
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            isViewOnly={isViewOnly}
          />
        </div>

        <EventModal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
          event={selectedEvent}
          defaultDate={selectedDate}
        />

        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          calendarId={currentCalendarId}
        />
      </div>
    </div>
  );
}