import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId: string;
}

export function ShareModal({ isOpen, onClose, calendarId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = `${baseUrl}?view=${calendarId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
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
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Envie o link abaixo para o seu cliente. Ele terá acesso apenas para visualização do calendário.
          </p>

          <div>
            <Label htmlFor="share-link" className="text-sm font-medium">
              Link de Partilha
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="share-link"
                value={shareLink}
                readOnly
                className="bg-muted cursor-pointer"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="transition-spring"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-secondary/30 p-4 rounded-lg border border-accent/20">
            <h4 className="font-semibold text-sm mb-2 text-accent-foreground">
              Instruções para o cliente:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Clique no link para ver o calendário fiscal</li>
              <li>• O calendário abrirá em modo apenas leitura</li>
              <li>• Não é possível editar os dados através deste link</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} variant="brand" className="transition-spring">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}