import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarState } from '@/types/fiscal';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';

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

  // Create a client with the token header for RLS
  const clientWithToken = useMemo(() => {
    return createClient(
      'https://ooklajermcompfanffwl.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9va2xhamVybWNvbXBmYW5mZndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NjE2OTEsImV4cCI6MjA3MDEzNzY5MX0.wpxbK33ikYQ0EWgUp-A0ee30GPQIgGKOp5LyTSvKMlI',
      {
        global: {
          headers: {
            'x-share-token': token
          }
        }
      }
    );
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Client Storage: Loading data for calendar:', calendarId, 'with token:', token?.slice(0, 10) + '...');

      // Validate token first
      const { data: validation } = await supabase.rpc('validate_share_token', {
        p_token: token,
        p_calendar_id: calendarId,
        p_client_id: clientId || null,
      });

      console.log('🔐 Token validation result:', validation);

      if (!validation || validation.length === 0 || !validation[0].valid) {
        throw new Error('Token inválido ou expirado');
      }

      const tokenData = validation[0];
      setTokenScope(tokenData.scope as 'view' | 'edit');
      console.log('✅ Token validated, scope:', tokenData.scope);

      // Load calendar data with token header
      const { data: calendar, error: calendarError } = await clientWithToken
        .from('fiscal_calendars')
        .select('*')
        .eq('id', calendarId)
        .single();

      console.log('📅 Calendar data:', calendar, 'Error:', calendarError);

      if (calendarError) throw calendarError;

      // Load events with token header
      const { data: events, error: eventsError } = await clientWithToken
        .from('fiscal_events')
        .select('*')
        .eq('calendar_id', calendarId);

      console.log('📝 Events data:', events?.length, 'events loaded. Error:', eventsError);

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
      console.log('💾 Saving client data for calendar:', calendarId);
      console.log('📊 New state events count:', newState.events.length);
      
      // Use the secure client save function
      const { data, error } = await supabase.rpc('client_save_calendar_data', {
        p_token: token,
        p_calendar_id: calendarId,
        p_client_name: newState.appInfo.name,
        p_client_cnpj: newState.appInfo.cnpj,
        p_events: JSON.stringify(newState.events)
      });

      console.log('💾 Save function result:', data, 'Error:', error);

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar dados');
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