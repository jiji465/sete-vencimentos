import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useClientFiscalStorage } from '@/hooks/use-client-fiscal-storage';
import { ClientFiscalCalendar } from '@/components/fiscal/ClientFiscalCalendar';
import { FiscalCalendarApp } from '@/components/fiscal/FiscalCalendarApp';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Calendar, AlertTriangle } from 'lucide-react';

interface TokenValidation {
  valid: boolean;
  scope: string;
  client_id: string;
  calendar_id: string;
}

export default function ClientView() {
  const { clientSlug } = useParams();
  const [searchParams] = useSearchParams();
  const calendarId = searchParams.get('calendar');
  const token = searchParams.get('token');
  
  const [tokenValidation, setTokenValidation] = useState<TokenValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the client fiscal storage hook when we have valid params
  const clientStorage = calendarId && token ? useClientFiscalStorage({
    calendarId,
    token,
    clientId: clientSlug
  }) : null;

  useEffect(() => {
    const validateToken = async () => {
      if (!calendarId || !token) {
        setError('Link inválido - parâmetros ausentes');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('validate_share_token', {
          p_token: token,
          p_calendar_id: calendarId,
        });

        if (error) throw error;

        if (!data || data.length === 0 || !data[0].valid) {
          setError('Token inválido ou expirado');
          setLoading(false);
          return;
        }

        setTokenValidation(data[0]);
        setLoading(false);
      } catch (err) {
        console.error('Token validation error:', err);
        setError('Erro ao validar token de acesso');
        setLoading(false);
      }
    };

    validateToken();
  }, [calendarId, token]);

  if (loading || (clientStorage && clientStorage.loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando acesso...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !tokenValidation?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground">{error || 'Link de compartilhamento inválido'}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Entre em contato com sua contabilidade para obter um novo link de acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isViewOnly = tokenValidation.scope === 'view';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Client Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Calendário Fiscal - {tokenValidation.client_id}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Acesso: {isViewOnly ? 'Somente Visualização' : 'Visualização e Edição'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Acesso Seguro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="container mx-auto px-4 py-6">
        {clientStorage ? (
          <ClientFiscalCalendar
            state={clientStorage.state}
            loading={clientStorage.loading}
            tokenScope={clientStorage.tokenScope}
            onSave={clientStorage.saveData}
            clientId={tokenValidation.client_id}
          />
        ) : (
          <FiscalCalendarApp 
            calendarId={calendarId}
            isViewOnly={isViewOnly}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-background/50 border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Este é um calendário fiscal compartilhado de forma segura. 
          Todas as informações são criptografadas e protegidas.
        </div>
      </div>
    </div>
  );
}