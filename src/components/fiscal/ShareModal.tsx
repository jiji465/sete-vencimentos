import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Settings } from 'lucide-react';
import { ClientShareModal } from './ClientShareModal';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId: string;
  clientName?: string;
}

export function ShareModal({ isOpen, onClose, calendarId, clientName }: ShareModalProps) {
  const [showClientModal, setShowClientModal] = useState(false);
  const { toast } = useToast();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Calendário</DialogTitle>
            <DialogDescription>
              Escolha como deseja compartilhar este calendário fiscal com seus clientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha como deseja compartilhar este calendário fiscal:
            </p>

            <div className="space-y-3">
              <Button 
                onClick={() => setShowClientModal(true)}
                className="w-full justify-start gap-3 h-auto p-4"
                variant="outline"
              >
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Compartilhamento Seguro por Cliente</div>
                  <div className="text-sm text-muted-foreground">
                    Gere links únicos e seguros para cada cliente
                  </div>
                </div>
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Recursos do Compartilhamento Seguro:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Links únicos por cliente (CNPJ)</li>
                  <li>• Controle de acesso (visualização ou edição)</li>
                  <li>• Data de expiração configurável</li>
                  <li>• Gerenciamento completo dos acessos</li>
                  <li>• Segurança avançada com tokens criptografados</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ClientShareModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        calendarId={calendarId}
        defaultClientId={clientName}
      />
    </>
  );
}