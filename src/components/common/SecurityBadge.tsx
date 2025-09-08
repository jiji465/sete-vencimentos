import { Shield, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

interface SecurityBadgeProps {
  variant?: "compact" | "full";
}

export function SecurityBadge({ variant = "compact" }: SecurityBadgeProps) {
  const { isAuthenticated } = useAuth();

  if (variant === "compact") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isAuthenticated ? "default" : "secondary"} 
            className="gap-1 text-xs"
          >
            {isAuthenticated ? (
              <ShieldCheck className="w-3 h-3" />
            ) : (
              <Shield className="w-3 h-3" />
            )}
            {isAuthenticated ? "Protegido" : "Público"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isAuthenticated 
              ? "Seus dados estão protegidos e criptografados" 
              : "Entre para proteger seus dados fiscais"
            }
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
      {isAuthenticated ? (
        <ShieldCheck className="w-5 h-5 text-primary" />
      ) : (
        <Shield className="w-5 h-5 text-muted-foreground" />
      )}
      <div className="flex-1">
        <p className="font-medium text-sm">
          {isAuthenticated ? "Dados Protegidos" : "Modo Público"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isAuthenticated 
            ? "Informações criptografadas e privadas" 
            : "Entre para proteger informações fiscais sensíveis"
          }
        </p>
      </div>
    </div>
  );
}