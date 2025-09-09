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
import { useShareTokens, ShareToken } from '@/hooks/use-share-tokens';
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
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
    try {
      const expiresInDays = newExpireDays ? parseInt(newExpireDays) : undefined;
      await createToken(newClientId.trim(), newScope, expiresInDays);
      setNewClientId('');
      setNewExpireDays('');
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async (token: ShareToken) => {
    if (!token.token) return;
    
    const shareUrl = generateShareUrl(token.token, token.client_id);
    await navigator.clipboard.writeText(shareUrl);
    setCopiedToken(token.id);
    
    toast({
      title: "Link copiado!",
      description: "Link de compartilhamento copiado para a área de transferência",
    });

    setTimeout(() => setCopiedToken(null), 2000);
  };

  const isExpired = (token: ShareToken) => {
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
            Gerencie links de compartilhamento seguros para seus clientes acessarem o calendário fiscal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Token */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Novo Link de Compartilhamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">CNPJ ou ID do Cliente</Label>
                  <Input
                    id="clientId"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scope">Tipo de Acesso</Label>
                  <Select value={newScope} onValueChange={(value: 'view' | 'edit') => setNewScope(value)}>
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
            </CardContent>
          </Card>

          {/* Existing Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links de Compartilhamento Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-4">Carregando...</p>
              ) : tokens.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum link de compartilhamento criado ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className={`p-4 border rounded-lg ${isExpired(token) ? 'bg-muted/50 opacity-60' : 'bg-background'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
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
                          {token.token && !isExpired(token) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(token)}
                              className="gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              {copiedToken === token.id ? 'Copiado!' : 'Copiar Link'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteToken(token.id)}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
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
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>URLs únicas:</strong> Cada cliente recebe um link único com token seguro criptografado</li>
              <li>• <strong>Acesso controlado:</strong> Links de <span className="text-foreground font-medium">visualização</span> são somente leitura</li>
              <li>• <strong>Edição segura:</strong> Links de <span className="text-foreground font-medium">edição</span> permitem ao cliente confirmar e editar impostos</li>
              <li>• <strong>Expiração:</strong> Configure prazo de validade para maior segurança</li>
              <li>• <strong>Gerenciamento:</strong> Remova ou crie novos links a qualquer momento</li>
              <li>• <strong>Auditoria:</strong> Veja quando cada link foi criado e quando expira</li>
            </ul>
            <div className="mt-3 p-3 bg-primary/10 rounded border-l-4 border-primary">
              <p className="text-sm text-foreground font-medium">
                💡 Dica para contabilidades grandes: Use o CNPJ como identificação do cliente para facilitar o gerenciamento
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
