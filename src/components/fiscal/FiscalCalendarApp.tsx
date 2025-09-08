import { useState, useEffect } from 'react';
import { FiscalHeader } from './FiscalHeader';
import { ClientInfo } from './ClientInfo';
import { CalendarControls } from './CalendarControls';
import { Calendar } from './Calendar';
import { EventModal } from './EventModal';
import { ShareModal } from './ShareModal';
import { FiscalDashboard } from './FiscalDashboard';
import { useFiscalCalendar } from '@/hooks/use-fiscal-calendar';
import { FiscalEvent } from '@/types/fiscal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { generateCalendarId } from '@/lib/fiscal-utils';
import { generateEventId } from '@/types/fiscal';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface FiscalCalendarAppProps {
  isViewOnly?: boolean;
  calendarId?: string;
}

export function FiscalCalendarApp({ isViewOnly = false, calendarId }: FiscalCalendarAppProps) {
  const {
    currentDate,
    calendarId: currentCalendarId,
    state,
    loading,
    saving,
    lastSavedAt,
    navigateMonth,
    saveEvent,
    deleteEvent,
    updateAppInfo,
    persistNow
  } = useFiscalCalendar({ isViewOnly, initialCalendarId: calendarId });

  const { user, isAuthenticated, signOut } = useAuth();
  const { toast } = useToast();

  const navigate = useNavigate();

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FiscalEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Determine effective view-only: explicit or not authenticated
  const effectiveViewOnly = isViewOnly || !isAuthenticated;

  const handleDayClick = (date: string) => {
    if (effectiveViewOnly) {
      toast({ title: "Somente leitura", description: "Entre para adicionar ou editar eventos." });
      return;
    }
    setSelectedDate(date);
    setSelectedEvent(null);
    setEventModalOpen(true);
  };

  const handleEventEdit = (event: FiscalEvent) => {
    if (effectiveViewOnly) {
      toast({ title: "Somente leitura", description: "Entre para editar eventos." });
      return;
    }
    setSelectedEvent(event);
    setSelectedDate('');
    setEventModalOpen(true);
  };

  const handleEventSave = (event: FiscalEvent) => {
    if (effectiveViewOnly) {
      toast({ title: "Somente leitura", description: "Entre para salvar alterações." });
      return;
    }
    saveEvent(event);
    setEventModalOpen(false);
  };

  const handleEventDelete = (eventId: string) => {
    if (effectiveViewOnly) {
      toast({ title: "Somente leitura", description: "Entre para excluir eventos." });
      return;
    }
    deleteEvent(eventId);
  };

  const handleAddEvent = () => {
    if (effectiveViewOnly) {
      toast({ title: "Somente leitura", description: "Entre para adicionar eventos." });
      return;
    }
    setSelectedEvent(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setEventModalOpen(true);
  };

  const handleExportPdf = async () => {
    const el = document.querySelector('#calendar-root') as HTMLElement | null;
    if (el) {
      const { exportElementToPdf } = await import('@/lib/pdf');
      await exportElementToPdf(el);
    }
  };

  const handleShare = async () => {
    if (persistNow) {
      await persistNow();
    }
    setShareModalOpen(true);
  };

  const handleNewCalendar = async () => {
    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Entre para criar um novo calendário." });
      navigate("/auth");
      return;
    }
    if (persistNow) await persistNow();
    const newId = generateCalendarId();
    await supabase.from('fiscal_calendars').upsert({
      id: newId,
      calendar_title: state.appInfo.calendarTitle || 'Calendário de Impostos',
      client_name: '',
      client_cnpj: '',
      owner_id: user?.id || null
    });
    navigate(`/calendario-fiscal?id=${newId}`);
  };

  const handleDuplicateCalendar = async () => {
    if (!isAuthenticated) {
      toast({ title: "Login necessário", description: "Entre para duplicar calendários." });
      navigate("/auth");
      return;
    }
    if (persistNow) await persistNow();
    const newId = generateCalendarId();

    await supabase.from('fiscal_calendars').upsert({
      id: newId,
      calendar_title: state.appInfo.calendarTitle,
      client_name: state.appInfo.name,
      client_cnpj: state.appInfo.cnpj,
      owner_id: user?.id || null
    });

    if (state.events.length > 0) {
      await supabase.from('fiscal_events').upsert(
        state.events.map(e => ({
          id: generateEventId(),
          calendar_id: newId,
          tax_name: e.taxName,
          title: e.title || '',
          date: e.date,
          value: e.value,
          type: e.type
        }))
      );
    }

    navigate(`/calendario-fiscal?id=${newId}`);
  };

  const handleOpenClients = () => {
    navigate('/clientes');
  };

  useEffect(() => {
    const handler = () => {
      if (persistNow) persistNow();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [persistNow]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <div id="calendar-root" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative">
        {saving && (
          <div className="fixed top-4 right-4 z-50 bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm text-primary">Sincronizando...</span>
          </div>
        )}
        {!saving && lastSavedAt && (
          <div className="fixed top-4 right-4 z-40 bg-muted/60 backdrop-blur border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
            Sincronizado às {new Date(lastSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        <FiscalHeader
          calendarTitle={state.appInfo.calendarTitle}
          onCalendarTitleChange={(title) => {
            if (effectiveViewOnly) return;
            updateAppInfo({ calendarTitle: title });
          }}
          onAddEvent={handleAddEvent}
          onExportPdf={handleExportPdf}
          onShare={handleShare}
          onNewCalendar={handleNewCalendar}
          onDuplicateCalendar={handleDuplicateCalendar}
          onOpenClients={handleOpenClients}
          onTitleBlur={() => !effectiveViewOnly && persistNow?.()}
          isViewOnly={effectiveViewOnly}
          isAuthenticated={isAuthenticated}
          onLogin={() => navigate("/auth")}
          onLogout={() => signOut()}
        />

        <div className="space-y-6">
          <ClientInfo
            clientName={state.appInfo.name}
            clientCnpj={state.appInfo.cnpj}
            onClientNameChange={(name) => {
              if (effectiveViewOnly) return;
              updateAppInfo({ name });
            }}
            onClientCnpjChange={(cnpj) => {
              if (effectiveViewOnly) return;
              updateAppInfo({ cnpj });
            }}
            onFieldBlur={() => !effectiveViewOnly && (persistNow?.())}
            isViewOnly={effectiveViewOnly}
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
            isViewOnly={effectiveViewOnly}
          />

          <FiscalDashboard
            events={state.events}
            currentDate={currentDate}
            clientName={state.appInfo.name}
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
          clientName={state.appInfo.name}
        />
      </div>
    </div>
  );
}
