import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ShareToken {
  id: string;
  calendar_id: string;
  client_id: string;
  scope: 'view' | 'edit';
  expires_at?: string;
  created_at: string;
  token?: string; // Only available when creating
}

export function useShareTokens(calendarId: string) {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadTokens = useCallback(async () => {
    if (!calendarId) return;
    setLoading(true);
    try {
      // Require authentication to manage tokens
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setTokens([]);
        return;
      }

      const { data, error } = await supabase
        .from('calendar_share_tokens')
        .select('*')
        .eq('calendar_id', calendarId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens((data || []) as ShareToken[]);
    } catch (error) {
      console.error('Error loading share tokens:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tokens de compartilhamento (verifique se está logado)",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [calendarId, toast]);

  const createToken = async (clientId: string, scope: 'view' | 'edit' = 'view', expiresInDays?: number) => {
    // crypto.subtle check removed to allow non-secure contexts (e.g. localhost)

    try {
      // Require authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const msg = "Você precisa estar logado e ser o proprietário do calendário para criar links.";
        toast({ title: "Login necessário", description: msg, variant: "destructive" });
        throw new Error(msg);
      }

      // Generate secure token
      const token = crypto.randomUUID() + '-' + crypto.randomUUID();
      const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
      const tokenHashHex = Array.from(new Uint8Array(tokenHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('calendar_share_tokens')
        .insert({
          calendar_id: calendarId,
          client_id: clientId,
          token_hash: tokenHashHex,
          scope,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      const tokenWithKey = { ...data, token } as ShareToken;

      // For security, don't store the raw token in the component state.
      const { token: rawToken, ...tokenForState } = tokenWithKey;
      setTokens(prev => [tokenForState, ...prev]);

      toast({
        title: "Token criado",
        description: `Token de ${scope === 'view' ? 'visualização' : 'edição'} criado para ${clientId}`,
      });

      return tokenWithKey; // Return the object with the raw token
    } catch (error: any) {
      console.error('Error creating share token:', error);
      const message = typeof error?.message === 'string' && /row level security|permission|not authorized|jwt/i.test(error.message)
        ? 'Permissão negada. Entre com sua conta e verifique se você é o proprietário do calendário.'
        : 'Erro ao criar token de compartilhamento';
      toast({ title: "Erro", description: message, variant: "destructive" });
      throw error;
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_share_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(prev => prev.filter(t => t.id !== tokenId));
      toast({
        title: "Token removido",
        description: "Token de compartilhamento removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting share token:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover token de compartilhamento",
        variant: "destructive",
      });
    }
  };

  const generateShareUrl = (token: string, clientId: string) => {
    // Use environment variable for the base URL if available, otherwise fallback to window.location.origin
    // This makes URL generation reliable across different environments (local, staging, prod)
    const baseUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    const slug = clientId.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 16)
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${baseUrl}/cliente/${slug}?calendar=${calendarId}&token=${token}&client=${encodeURIComponent(clientId)}`;
  };

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  return {
    tokens,
    loading,
    createToken,
    deleteToken,
    generateShareUrl,
    loadTokens,
  };
}