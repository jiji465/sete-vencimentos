import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FiscalEvent, CalendarState } from '@/types/fiscal';
import { useToast } from '@/hooks/use-toast';

interface UseFiscalStorageProps {
  calendarId: string;
  isViewOnly?: boolean;
}

export function useFiscalStorage({ calendarId, isViewOnly = false }: UseFiscalStorageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<CalendarState>({
    appInfo: {
      name: '',
      cnpj: '',
      calendarTitle: 'Calendário de Impostos'
    },
    events: []
  });
  const { toast } = useToast();

  // Load calendar data from database
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get calendar info
      const { data: calendar } = await supabase
        .from('fiscal_calendars')
        .select('*')
        .eq('id', calendarId)
        .single();

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
  }, [calendarId]);

  // Save calendar data to database and localStorage
  const saveData = useCallback(async (newState: CalendarState) => {
    if (isViewOnly) return;

    try {
      setSaving(true);

      // Save calendar info
      await supabase
        .from('fiscal_calendars')
        .upsert({
          id: calendarId,
          calendar_title: newState.appInfo.calendarTitle,
          client_name: newState.appInfo.name,
          client_cnpj: newState.appInfo.cnpj
        });

      // Delete existing events and insert new ones
      await supabase
        .from('fiscal_events')
        .delete()
        .eq('calendar_id', calendarId);

      if (newState.events.length > 0) {
        await supabase
          .from('fiscal_events')
          .insert(
            newState.events.map(event => ({
              id: event.id,
              calendar_id: calendarId,
              tax_name: event.taxName,
              title: event.title,
              date: event.date,
              value: event.value,
              type: event.type
            }))
          );
      }

      // Backup to localStorage
      localStorage.setItem(`fiscal-calendar-${calendarId}`, JSON.stringify(newState));
      
    } catch (error) {
      console.error('Error saving calendar data:', error);
      // Fallback to localStorage only
      localStorage.setItem(`fiscal-calendar-${calendarId}`, JSON.stringify(newState));
      
      toast({
        title: "Aviso",
        description: "Dados salvos localmente. Conecte-se à internet para sincronização.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [calendarId, isViewOnly, toast]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    state,
    setState,
    loading,
    saving,
    saveData,
    loadData
  };
}