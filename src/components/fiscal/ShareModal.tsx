import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Settings } from 'lucide-react';
import { ClientShareModal } from './ClientShareModal';
import { useToast } from '@/hooks/use-toast';

import { ShareGuide } from './ShareGuide';

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
            <Button
              onClick={() => setShowClientModal(true)}
              className="w-full justify-start gap-3 h-auto p-4"
              variant="outline"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Compartilhamento Seguro por Cliente</div>
                <div className="text-sm text-muted-foreground">
                  Gere links únicos e seguros para cada cliente acessar seus impostos
                </div>
              </div>
              <Settings className="h-4 w-4 opacity-50" />
            </Button>
          </div>

          <ShareGuide />

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