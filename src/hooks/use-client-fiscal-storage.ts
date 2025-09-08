import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarState } from '@/types/fiscal';
import { useToast } from '@/hooks/use-toast';

interface UseClientFiscalStorageProps {
  calendarId: string;
  token: string;
  clientId?: string;
}

export function useClientFiscalStorage({ calendarId, token, clientId }: UseClientFiscalStorageProps) {
  const [state, setState] = useState<CalendarState>({
    appInfo: {
      calendarTitle: 'Calendário de Impostos',
      name: '',
      cnpj: '',
    },
    events: [],
  });
  const [loading, setLoading] = useState(true);
  const [tokenScope, setTokenScope] = useState<'view' | 'edit'>('view');
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);

      // Validate token first
      const { data: validation } = await supabase.rpc('validate_share_token', {
        p_token: token,
        p_calendar_id: calendarId,
        p_client_id: clientId || null,
      });

      if (!validation || validation.length === 0 || !validation[0].valid) {
        throw new Error('Token inválido ou expirado');
      }

      const tokenData = validation[0];
      setTokenScope(tokenData.scope as 'view' | 'edit');

      // Load calendar data
      const { data: calendar, error: calendarError } = await supabase
        .from('fiscal_calendars')
        .select('*')
        .eq('id', calendarId)
        .single();

      if (calendarError) throw calendarError;

      // Load events
      const { data: events, error: eventsError } = await supabase
        .from('fiscal_events')
        .select('*')
        .eq('calendar_id', calendarId);

      if (eventsError) throw eventsError;

      // Set state with loaded data
      setState({
        appInfo: {
          calendarTitle: calendar.calendar_title,
          name: calendar.client_name || '',
          cnpj: calendar.client_cnpj || '',
        },
        events: (events || []).map(event => ({
          id: event.id,
          taxName: event.tax_name,
          title: event.title || '',
          date: event.date,
          value: event.value,
          type: event.type as 'imposto' | 'parcelamento',
        })),
      });

    } catch (error) {
      console.error('Error loading client calendar data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do calendário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newState: CalendarState) => {
    if (tokenScope !== 'edit') {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para editar este calendário",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate token again before saving
      const { data: validation } = await supabase.rpc('validate_share_token', {
        p_token: token,
        p_calendar_id: calendarId,
        p_client_id: clientId || null,
      });

      if (!validation || validation.length === 0 || !validation[0].valid) {
        throw new Error('Token expirou. Solicite um novo link de acesso.');
      }

      // Update calendar info (only client data, not title)
      await supabase
        .from('fiscal_calendars')
        .update({
          client_name: newState.appInfo.name,
          client_cnpj: newState.appInfo.cnpj,
        })
        .eq('id', calendarId);

      // Update events
      const existingEventIds = state.events.map(e => e.id);
      const newEventIds = newState.events.map(e => e.id);

      // Delete removed events
      const eventsToDelete = existingEventIds.filter(id => !newEventIds.includes(id));
      if (eventsToDelete.length > 0) {
        await supabase
          .from('fiscal_events')
          .delete()
          .in('id', eventsToDelete);
      }

      // Upsert current events
      if (newState.events.length > 0) {
        await supabase
          .from('fiscal_events')
          .upsert(
            newState.events.map(event => ({
              id: event.id,
              calendar_id: calendarId,
              tax_name: event.taxName,
              title: event.title || '',
              date: event.date,
              value: event.value,
              type: event.type,
            }))
          );
      }

      setState(newState);
      toast({
        title: "Salvo com sucesso",
        description: "Suas alterações foram salvas",
      });

    } catch (error) {
      console.error('Error saving client data:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar alterações",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [calendarId, token]);

  return {
    state,
    loading,
    tokenScope,
    saveData,
    loadData,
  };
}