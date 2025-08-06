import { FiscalEvent as FiscalEventType } from "@/types/fiscal";
import { formatCurrencyForDisplay } from "@/lib/fiscal-utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FiscalEventProps {
  event: FiscalEventType;
  onEdit: (event: FiscalEventType) => void;
  onDelete: (eventId: string) => void;
  isViewOnly?: boolean;
}

export function FiscalEvent({ event, onEdit, onDelete, isViewOnly = false }: FiscalEventProps) {
  const handleEdit = () => {
    if (!isViewOnly) {
      onEdit(event);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isViewOnly) {
      onDelete(event.id);
    }
  };

  return (
    <div
      className={`calendar-event ${event.type} cursor-pointer transition-spring hover:scale-102`}
      onClick={handleEdit}
    >
      {!isViewOnly && (
        <Button
          size="icon"
          variant="ghost"
          className="event-delete-btn"
          onClick={handleDelete}
        >
          <X className="w-2 h-2" />
        </Button>
      )}
      
      <div className="font-medium text-xs mb-1 pr-5">
        {event.taxName}
      </div>
      
      {event.title && (
        <div className="text-xs opacity-80 mb-1">
          {event.title}
        </div>
      )}
      
      <div className="text-xs font-semibold">
        {formatCurrencyForDisplay(event.value)}
      </div>
    </div>
  );
}