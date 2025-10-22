import { useClientFiscalStorage } from '@/hooks/use-client-fiscal-storage';
import { ClientFiscalCalendar } from '@/components/fiscal/ClientFiscalCalendar';

interface ClientViewContentProps {
    calendarId: string;
    token: string;
    clientId: string | null | undefined;
}

export function ClientViewContent({ calendarId, token, clientId }: ClientViewContentProps) {
    const clientStorage = useClientFiscalStorage({
        calendarId,
        token,
        clientId: clientId
    });

    return (
        <ClientFiscalCalendar
            state={clientStorage.state}
            loading={clientStorage.loading}
            tokenScope={clientStorage.tokenScope}
            onSave={clientStorage.saveData}
            clientId={clientId}
        />
    )
}