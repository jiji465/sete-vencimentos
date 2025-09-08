
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Download, Plus, FileText, LogIn, LogOut } from "lucide-react";
import { SecurityBadge } from "@/components/common/SecurityBadge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface FiscalHeaderProps {
  calendarTitle: string;
  onCalendarTitleChange: (title: string) => void;
  onAddEvent: () => void;
  onExportPdf: () => void;
  onShare: () => void;
  onNewCalendar?: () => void;
  onDuplicateCalendar?: () => void;
  onOpenClients?: () => void;
  onTitleBlur?: () => void;
  isViewOnly?: boolean;
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function FiscalHeader({
  calendarTitle,
  onCalendarTitleChange,
  onAddEvent,
  onExportPdf,
  onShare,
  onNewCalendar,
  onDuplicateCalendar,
  onOpenClients,
  onTitleBlur,
  isViewOnly = false,
  isAuthenticated = false,
  onLogin,
  onLogout
}: FiscalHeaderProps) {
  return (
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
      <div className="w-full lg:flex-1">
        <h1 className="text-4xl lg:text-5xl font-bold gradient-brand bg-clip-text text-transparent mb-3">
          Sete Soluções Fiscais
        </h1>
        <div className="max-w-md space-y-3">
          <Label htmlFor="calendar-title" className="sr-only">
            Título do Calendário
          </Label>
          <Input
            id="calendar-title"
            value={calendarTitle}
            onChange={(e) => onCalendarTitleChange(e.target.value)}
            onBlur={() => !isViewOnly && onTitleBlur?.()}
            placeholder="Calendário de Impostos"
            disabled={isViewOnly}
            className="text-lg font-medium text-accent bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <SecurityBadge variant="compact" />
        </div>
      </div>

      {!isViewOnly && (
        <div className="flex items-center gap-3 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shadow-sm transition-spring">Ações</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onNewCalendar}>Novo calendário</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicateCalendar}>Duplicar</DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenClients}>Clientes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={onShare}
            variant="outline"
            className="shadow-sm hover:shadow-brand transition-spring"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Partilhar
          </Button>
          <Button
            onClick={onExportPdf}
            variant="secondary"
            className="shadow-gold transition-spring"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            onClick={onAddEvent}
            variant="brand"
            className="transition-spring"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
          {isAuthenticated ? (
            <Button variant="outline" onClick={onLogout} className="transition-spring">
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          ) : (
            <Button variant="outline" onClick={onLogin} className="transition-spring">
              <LogIn className="w-4 h-4 mr-2" /> Entrar
            </Button>
          )}
        </div>
      )}

      {isViewOnly && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-md">
          <FileText className="w-4 h-4" />
          Modo Consulta
          {!isAuthenticated && (
            <Button variant="outline" size="sm" onClick={onLogin} className="ml-2 h-7 px-2">
              <LogIn className="w-3 h-3 mr-1" /> Entrar
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
