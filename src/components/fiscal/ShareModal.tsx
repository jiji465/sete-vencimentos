import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Copy, Check, ExternalLink, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createCustomShareLink, createEditLink } from "@/lib/fiscal-utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId: string;
  clientName?: string;
}

export function ShareModal({ isOpen, onClose, calendarId, clientName }: ShareModalProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);
  const { toast } = useToast();

  const shareLink = createCustomShareLink(calendarId, clientName);
  const editLink = createEditLink(calendarId);

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedShare(true);
      toast({
        title: "Link de partilha copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleCopyEdit = async () => {
    try {
      await navigator.clipboard.writeText(editLink);
      setCopiedEdit(true);
      toast({
        title: "Link de edição copiado!",
        description: "Guarde este link para poder editar o calendário.",
      });
      setTimeout(() => setCopiedEdit(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl gradient-brand bg-clip-text text-transparent flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Partilhar Calendário
          </DialogTitle>
          <DialogDescription className="sr-only">Gerencie e copie os links de partilha e edição do calendário.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">
            Gerencie os links do seu calendário fiscal de forma segura e personalizada.
          </p>

          {/* Link de Partilha para Cliente */}
          <div className="space-y-2">
            <Label htmlFor="share-link" className="text-sm font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Link de Partilha (Cliente)
            </Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareLink}
                readOnly
                className="bg-muted cursor-pointer font-mono text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopyShare}
                variant="outline"
                size="icon"
                className="transition-spring"
              >
                {copiedShare ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Link personalizado para o cliente visualizar o calendário
            </p>
          </div>

          {/* Link de Edição para o Criador */}
          <div className="space-y-2">
            <Label htmlFor="edit-link" className="text-sm font-medium flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Link de Edição (Seu)
            </Label>
            <div className="flex gap-2">
              <Input
                id="edit-link"
                value={editLink}
                readOnly
                className="bg-muted cursor-pointer font-mono text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopyEdit}
                variant="outline"
                size="icon"
                className="transition-spring"
              >
                {copiedEdit ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Guarde este link para poder editar o calendário no futuro
            </p>
          </div>

          <div className="bg-secondary/30 p-4 rounded-lg border border-accent/20">
            <h4 className="font-semibold text-sm mb-2 text-accent-foreground">
              Instruções importantes:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Link de Partilha:</strong> Apenas visualização, seguro para clientes</li>
              <li>• <strong>Link de Edição:</strong> Permite modificar dados, mantenha privado</li>
              <li>• Links personalizados nunca expiram</li>
              <li>• Funcionam em qualquer dispositivo e navegador</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose} variant="outline" className="transition-spring">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}