import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Shield, Users, Clock, Eye, Edit } from 'lucide-react';

export function ShareGuide() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Guia de Compartilhamento Seguro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Para Contabilidades
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Crie links únicos para cada cliente usando seu CNPJ</li>
              <li>• Configure permissões (visualizar ou editar)</li>
              <li>• Defina prazos de expiração conforme necessário</li>
              <li>• Gerencie todos os links de forma centralizada</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Tokens criptografados únicos por cliente</li>
              <li>• Acesso isolado - cada cliente vê apenas seus dados</li>
              <li>• Links com expiração configurável</li>
              <li>• Revogação instantânea de acesso</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Eye className="h-3 w-3" />
            Visualização: Cliente vê impostos
          </Badge>
          <Badge variant="default" className="gap-1">
            <Edit className="h-3 w-3" />
            Edição: Cliente pode confirmar/editar
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Expiração: 1-365 dias
          </Badge>
        </div>

        <div className="bg-primary/10 p-3 rounded border-l-4 border-primary">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">Exemplo de URL gerada:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                /cliente/empresa-xyz?calendar=abc123&token=secure-token&client=12345678000100
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}