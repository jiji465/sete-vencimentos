import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClientInfoProps {
  clientName: string;
  clientCnpj: string;
  onClientNameChange: (name: string) => void;
  onClientCnpjChange: (cnpj: string) => void;
  onFieldBlur?: () => void;
  isViewOnly?: boolean;
}

export function ClientInfo({
  clientName,
  clientCnpj,
  onClientNameChange,
  onClientCnpjChange,
  onFieldBlur,
  isViewOnly = false
}: ClientInfoProps) {
  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="client-name" className="text-sm font-medium text-muted-foreground mb-2 block">
              Nome do Cliente
            </Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
              onBlur={() => !isViewOnly && onFieldBlur?.()}
              placeholder="Digite o nome do cliente"
              disabled={isViewOnly}
              className="transition-smooth"
            />
          </div>
          
          <div>
            <Label htmlFor="client-cnpj" className="text-sm font-medium text-muted-foreground mb-2 block">
              CNPJ
            </Label>
            <Input
              id="client-cnpj"
              value={clientCnpj}
              onChange={(e) => onClientCnpjChange(e.target.value)}
              onBlur={() => !isViewOnly && onFieldBlur?.()}
              placeholder="00.000.000/0001-00"
              disabled={isViewOnly}
              className="transition-smooth"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}