import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Plus, Eye, Edit, Clock } from 'lucide-react';
import { useShareTokens } from '@/hooks/use-share-tokens';
import { useToast } from '@/hooks/use-toast';
import { formatDateForDisplay } from '@/lib/fiscal-utils';

interface ClientShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId: string;
  defaultClientId?: string;
}

export function ClientShareModal({ isOpen, onClose, calendarId, defaultClientId }: ClientShareModalProps) {
  const [newClientId, setNewClientId] = useState(defaultClientId || '');
  const [newScope, setNewScope] = useState<'view' | 'edit'>('view');
  const [newExpireDays, setNewExpireDays] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedLink, setNewlyCreatedLink] = useState<string | null>(null);

  const { tokens, loading, createToken, deleteToken, generateShareUrl } = useShareTokens(calendarId);
  const { toast } = useToast();

  const handleCreateToken = async () => {
    if (!newClientId.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o CNPJ ou identificação do cliente",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    setNewlyCreatedLink(null);
    try {
      const expiresInDays = newExpireDays ? parseInt(newExpireDays) : undefined;
      const newFullToken = await createToken(newClientId.trim(), newScope, expiresInDays);

      if (newFullToken && newFullToken.token) {
        const shareUrl = generateShareUrl(newFullToken.token, newFullToken.client_id);
        setNewlyCreatedLink(shareUrl);

        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link copiado!",
            description: "O novo link de compartilhamento foi copiado para a área de transferência.",
          });
        } catch (err) {
          console.error('Failed to auto-copy to clipboard:', err);
          toast({
            title: "Link Gerado",
            description: "Copie o link gerado manualmente.",
            variant: "default",
          });
        }
      }

      setNewClientId('');
      setNewExpireDays('');
    } catch (error) {
      // Error is handled and toasted in the hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleManualCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const isExpired = (token: { expires_at?: string | null }) => {
    return token.expires_at && new Date(token.expires_at) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Compartilhamento por Cliente
          </DialogTitle>
          <DialogDescription>
            Gerencie links de compartilhamento seguros para seus clientes acessarem o calendário fiscal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {newlyCreatedLink ? 'Link de Compartilhamento Gerado' : 'Criar Novo Link de Compartilhamento'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {newlyCreatedLink ? (
                <div className="space-y-4 flex flex-col items-center">
                  <p className="text-sm text-center text-muted-foreground">
                    Copie o link abaixo. <strong className="text-destructive">Ele só é exibido uma vez.</strong> Guarde-o em local seguro.
                  </p>
                  <div className="flex items-center gap-2 w-full">
                    <Input readOnly value={newlyCreatedLink} className="bg-muted text-sm" />
                    <Button variant="outline" size="icon" onClick={() => handleManualCopy(newlyCreatedLink)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={() => setNewlyCreatedLink(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Outro Link
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">CNPJ ou ID do Cliente</Label>
                      <Input
                        id="clientId"
                        value={newClientId}
                        onChange={(e) => setNewClientId(e.target.value)}
                        placeholder="00.000.000/0001-00"
                        disabled={isCreating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scope">Tipo de Acesso</Label>
                      <Select
                        value={newScope}
                        onValueChange={(value: 'view' | 'edit') => setNewScope(value)}
                        disabled={isCreating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Apenas Visualização
                            </div>
                          </SelectItem>
                          <SelectItem value="edit">
                            <div className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Visualização e Edição
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expireDays">Expira em (dias)</Label>
                      <Input
                        id="expireDays"
                        type="number"
                        value={newExpireDays}
                        onChange={(e) => setNewExpireDays(e.target.value)}
                        placeholder="30 (opcional)"
                        min="1"
                        max="365"
                        disabled={isCreating}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateToken}
                    disabled={isCreating || !newClientId.trim()}
                    className="w-full"
                  >
                    {isCreating ? 'Criando...' : 'Criar Link de Compartilhamento'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links de Compartilhamento Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-4">Carregando...</p>
              ) : tokens.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 space-y-1">
                    <p>Nenhum link de compartilhamento criado ainda.</p>
                    <p className="text-xs">Use o formulário acima para criar o primeiro.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className={`p-4 border rounded-lg ${isExpired(token) ? 'bg-muted/50 opacity-60' : 'bg-background'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{token.client_id}</span>
                            <Badge variant={token.scope === 'view' ? 'secondary' : 'default'}>
                              {token.scope === 'view' ? (
                                <><Eye className="h-3 w-3 mr-1" /> Visualização</>
                              ) : (
                                <><Edit className="h-3 w-3 mr-1" /> Edição</>
                              )}
                            </Badge>
                            {isExpired(token) && (
                              <Badge variant="destructive">
                                <Clock className="h-3 w-3 mr-1" />
                                Expirado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Criado em {formatDateForDisplay(token.created_at.split('T')[0])}
                            {token.expires_at && (
                              <> • Expira em {formatDateForDisplay(token.expires_at.split('T')[0])}</>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteToken(token.id)}
                            className="gap-2 text-destructive hover:text-destructive"
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Como funciona:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li><strong>URLs únicas:</strong> Cada cliente recebe um link único com token seguro. O link é exibido <strong className="text-foreground">apenas uma vez</strong> após a criação.</li>
              <li><strong>Acesso controlado:</strong> Links de <span className="text-foreground font-medium">visualização</span> são somente leitura.</li>
              <li><strong>Edição segura:</strong> Links de <span className="text-foreground font-medium">edição</span> permitem ao cliente confirmar e editar impostos.</li>
              <li><strong>Expiração:</strong> Configure um prazo de validade para maior segurança.</li>
              <li><strong>Gerenciamento:</strong> Remova o acesso de um link a qualquer momento. Se um link for perdido, crie um novo.</li>
            </ul>
            <div className="mt-3 p-3 bg-primary/10 rounded border-l-4 border-primary">
              <p className="text-sm text-foreground font-medium">
                💡 Dica: Use o CNPJ como identificação do cliente para facilitar o gerenciamento.
              </p>
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
  );
}
