import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { FiscalEvent } from "@/types/fiscal";
import { formatCurrencyForInput, parseCurrency, generateCalendarId } from "@/lib/fiscal-utils";
import { Trash2 } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: FiscalEvent) => void;
  onDelete?: (eventId: string) => void;
  event?: FiscalEvent | null;
  defaultDate?: string;
}

export function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultDate
}: EventModalProps) {
  const [formData, setFormData] = useState<Partial<FiscalEvent>>({
    taxName: '',
    title: '',
    date: defaultDate || new Date().toISOString().split('T')[0],
    value: 0,
    type: 'imposto'
  });

  const isEdit = !!event;

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      setFormData({
        taxName: '',
        title: '',
        date: defaultDate || new Date().toISOString().split('T')[0],
        value: 0,
        type: 'imposto'
      });
    }
  }, [event, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.taxName || !formData.date) return;

    const eventData: FiscalEvent = {
      id: event?.id || generateCalendarId(),
      taxName: formData.taxName,
      title: formData.title || '',
      date: formData.date,
      value: formData.value || 0,
      type: formData.type as 'imposto' | 'parcelamento'
    };

    onSave(eventData);
    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const handleValueChange = (valueStr: string) => {
    const numericValue = parseCurrency(valueStr);
    setFormData(prev => ({ ...prev, value: numericValue }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl gradient-brand bg-clip-text text-transparent">
            {isEdit ? 'Editar Vencimento' : 'Adicionar Vencimento'}
          </DialogTitle>
          <DialogDescription className="sr-only">Formulário para criar ou editar vencimentos fiscais.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="taxName" className="text-sm font-medium">
              Nome do Imposto/Obrigação *
            </Label>
            <Input
              id="taxName"
              value={formData.taxName}
              onChange={(e) => setFormData(prev => ({ ...prev, taxName: e.target.value }))}
              placeholder="Ex: ICMS, ISS, COFINS..."
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Observações (Opcional)
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Informações adicionais..."
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="text-sm font-medium">
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="value" className="text-sm font-medium">
                Valor (R$) *
              </Label>
              <Input
                id="value"
                value={formatCurrencyForInput(formData.value || 0)}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="0,00"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type" className="text-sm font-medium">
              Tipo
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'imposto' | 'parcelamento' }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imposto">Imposto</SelectItem>
                <SelectItem value="parcelamento">Parcelamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-between pt-4">
            <div>
              {isEdit && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="transition-spring"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="brand" className="transition-spring">
                {isEdit ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}