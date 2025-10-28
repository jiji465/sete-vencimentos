import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FiscalEvent, CalendarState } from '@/types/fiscal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface UseFiscalStorageProps {
  calendarId: string;
  isViewOnly?: boolean;
}

export function useFiscalStorage({ calendarId, isViewOnly = false }: UseFiscalStorageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [state, setState] = useState<CalendarState>({
    appInfo: {
      name: '',
      cnpj: '',
      calendarTitle: 'Calendário de Impostos'
    },
    events: []
  });
  const { toast } = useToast();
  const saveTimeoutRef = useRef<number>();
  const { user } = useAuth();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Load calendar data from database
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get calendar info
      const { data: calendar } = await supabase
        .from('fiscal_calendars')
        .select('*')
        .eq('id', calendarId)
        .maybeSingle();

      // Get events
      const { data: events } = await supabase
        .from('fiscal_events')
        .select('*')
        .eq('calendar_id', calendarId)
        .order('date', { ascending: true });

      if (calendar || events) {
        setState({
          appInfo: {
            name: calendar?.client_name || '',
            cnpj: calendar?.client_cnpj || '',
            calendarTitle: calendar?.calendar_title || 'Calendário de Impostos'
          },
          events: (events || []).map(event => ({
            id: event.id,
            taxName: event.tax_name,
            title: event.title || '',
            date: event.date,
            value: parseFloat(event.value?.toString() || '0'),
            type: event.type as 'imposto' | 'parcelamento'
          }))
        });
        setLastSavedAt(calendar?.updated_at ? new Date(calendar.updated_at) : null);
        setOwnerId(calendar?.owner_id ?? null);
        setIsOwner(!!(calendar?.owner_id && user?.id && calendar.owner_id === user.id));
      } else {
        setOwnerId(null);
        setIsOwner(false);
      }

      // If calendar doesn't exist yet, provision it (only when editable AND authenticated)
      if (!calendar && !isViewOnly && user?.id) {
        await supabase.from('fiscal_calendars').upsert({
          id: calendarId,
          calendar_title: 'Calendário de Impostos',
          client_name: '',
          client_cnpj: '',
          owner_id: user.id
        });
        setOwnerId(user.id);
        setIsOwner(true);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      // Try to load from localStorage as fallback
      const stored = localStorage.getItem(`fiscal-calendar-${calendarId}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setState(data);
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [calendarId, isViewOnly, user?.id]);

  // Save calendar data to database and localStorage
  const saveData = useCallback(async (newState: CalendarState) => {
    // If explicitly view-only or no authenticated user, do not attempt DB writes
    if (isViewOnly || !user?.id) {
      // Always keep local backup
      localStorage.setItem(`fiscal-calendar-${calendarId}`, JSON.stringify(newState));
      if (!user?.id) {
        toast({
          title: "Login necessário",
          description: "Entre para salvar suas alterações na nuvem.",
        });
      }
      return;
    }

    try {
      setSaving(true);

      // Save calendar info with owner_id
      const { error: calendarError } = await supabase
        .from('fiscal_calendars')
        .upsert({
          id: calendarId,
          calendar_title: newState.appInfo.calendarTitle,
          client_name: newState.appInfo.name,
          client_cnpj: newState.appInfo.cnpj,
          owner_id: user.id
        });

      if (calendarError) {
        throw new Error(`Erro ao salvar calendário: ${calendarError.message}`);
      }

      // Get current events from database to compare
      const { data: currentEvents } = await supabase
        .from('fiscal_events')
        .select('id')
        .eq('calendar_id', calendarId);

      const currentEventIds = new Set((currentEvents || []).map(e => e.id));
      const newEventIds = new Set(newState.events.map(e => e.id));

      // Delete events that are no longer in the new state
      const eventsToDelete = Array.from(currentEventIds).filter(id => !newEventIds.has(id));
      if (eventsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('fiscal_events')
          .delete()
          .in('id', eventsToDelete);

        if (deleteError) {
          console.error('Error deleting events:', deleteError);
        }
      }

      // Upsert all events (insert new, update existing)
      if (newState.events.length > 0) {
        const { error: eventsError } = await supabase
          .from('fiscal_events')
          .upsert(
            newState.events.map(event => ({
              id: event.id,
              calendar_id: calendarId,
              tax_name: event.taxName,
              title: event.title || '',
              date: event.date,
              value: event.value,
              type: event.type
            }))
          );

        if (eventsError) {
          throw new Error(`Erro ao salvar eventos: ${eventsError.message}`);
        }
      }

      // Backup to localStorage
      localStorage.setItem(`fiscal-calendar-${calendarId}`, JSON.stringify(newState));
      
      setLastSavedAt(new Date());
      console.log('Calendar data saved successfully to Supabase');
      
    } catch (error) {
      console.error('Error saving calendar data:', error);
      // Fallback to localStorage only
      localStorage.setItem(`fiscal-calendar-${calendarId}`, JSON.stringify(newState));
      
      toast({
        title: "Erro de Sincronização",
        description: error instanceof Error ? error.message : "Dados salvos localmente. Verifique sua conexão.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [calendarId, isViewOnly, toast, user?.id]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime syncing between devices
  useEffect(() => {
    const channel = supabase
      .channel(`calendar-${calendarId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fiscal_calendars', filter: `id=eq.${calendarId}` }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fiscal_events', filter: `calendar_id=eq.${calendarId}` }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [calendarId, loadData]);

  // Debounced save function for frequent updates
  const saveDataDebounced = useCallback((newState: CalendarState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save immediately to localStorage for better UX
    localStorage.setItem(`fiscal-calendar-${calendarId}`, JSON.stringify(newState));
    
    // Debounce the Supabase save
    saveTimeoutRef.current = setTimeout(() => {
      saveData(newState);
    }, 1000); // 1 second debounce
  }, [calendarId, saveData]);

  // Immediate save function for important operations
  const saveDataImmediate = useCallback(async (newState: CalendarState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveData(newState);
  }, [saveData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    setState,
    loading,
    saving,
    lastSavedAt,
    saveData,
    saveDataDebounced,
    saveDataImmediate,
    loadData,
    ownerId,
    isOwner
  };
}
