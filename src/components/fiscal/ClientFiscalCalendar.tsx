import { useState } from 'react';
import { Calendar } from './Calendar';
import { ClientInfo } from './ClientInfo';
import { CalendarControls } from './CalendarControls';
import { FiscalDashboard } from './FiscalDashboard';
import { EventModal } from './EventModal';
import { CalendarState, FiscalEvent } from '@/types/fiscal';
import { generateEventId } from '@/types/fiscal';
import { useToast } from '@/hooks/use-toast';

interface ClientFiscalCalendarProps {
  state: CalendarState;
  loading: boolean;
  tokenScope: 'view' | 'edit';
  onSave: (state: CalendarState) => void;
  clientId: string;
}

export function ClientFiscalCalendar({ 
  state, 
  loading, 
  tokenScope, 
  onSave, 
  clientId 
}: ClientFiscalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FiscalEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { toast } = useToast();

  const isViewOnly = tokenScope === 'view';

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayClick = (date: string) => {
    if (isViewOnly) {
      toast({ 
        title: "Somente visualização", 
        description: "Você não tem permissão para adicionar eventos neste calendário" 
      });
      return;
    }
    setSelectedDate(date);
    setSelectedEvent(null);
    setEventModalOpen(true);
  };

  const handleEventEdit = (event: FiscalEvent) => {
    if (isViewOnly) {
      toast({ 
        title: "Somente visualização", 
        description: "Você não tem permissão para editar eventos neste calendário" 
      });
      return;
    }
    setSelectedEvent(event);
    setSelectedDate('');
    setEventModalOpen(true);
  };

  const handleEventSave = (event: FiscalEvent) => {
    if (isViewOnly) {
      toast({ 
        title: "Somente visualização", 
        description: "Você não tem permissão para salvar alterações" 
      });
      return;
    }

    const updatedEvents = selectedEvent
      ? state.events.map(e => e.id === event.id ? event : e)
      : [...state.events, { ...event, id: event.id || generateEventId() }];

    onSave({
      ...state,
      events: updatedEvents
    });
    setEventModalOpen(false);
  };

  const handleEventDelete = (eventId: string) => {
    if (isViewOnly) {
      toast({ 
        title: "Somente visualização", 
        description: "Você não tem permissão para excluir eventos" 
      });
      return;
    }

    const updatedEvents = state.events.filter(e => e.id !== eventId);
    onSave({
      ...state,
      events: updatedEvents
    });
  };

  const handleClientInfoChange = (field: 'name' | 'cnpj', value: string) => {
    if (isViewOnly) {
      toast({ 
        title: "Somente visualização", 
        description: "Você não tem permissão para editar informações do cliente" 
      });
      return;
    }

    onSave({
      ...state,
      appInfo: {
        ...state.appInfo,
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando calendário...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {state.appInfo.calendarTitle}
        </h1>
        <p className="text-muted-foreground">
          Cliente: {clientId}
          {!isViewOnly && (
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              Modo Edição
            </span>
          )}
        </p>
      </div>

      {/* Client Information */}
      <ClientInfo
        clientName={state.appInfo.name}
        clientCnpj={state.appInfo.cnpj}
        onClientNameChange={(name) => handleClientInfoChange('name', name)}
        onClientCnpjChange={(cnpj) => handleClientInfoChange('cnpj', cnpj)}
        onFieldBlur={() => {}} // Auto-save is handled by parent
        isViewOnly={isViewOnly}
      />

      {/* Calendar Controls */}
      <CalendarControls
        currentDate={currentDate}
        onPrevMonth={() => navigateMonth('prev')}
        onNextMonth={() => navigateMonth('next')}
      />

      {/* Calendar */}
      <Calendar
        currentDate={currentDate}
        events={state.events}
        onDayClick={handleDayClick}
        onEventEdit={handleEventEdit}
        onEventDelete={handleEventDelete}
        isViewOnly={isViewOnly}
      />

      {/* Dashboard */}
      <FiscalDashboard
        events={state.events}
        currentDate={currentDate}
        clientName={state.appInfo.name}
      />

      {/* Event Modal */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        event={selectedEvent}
        defaultDate={selectedDate}
      />
    </div>
  );
}