import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthYear } from "@/lib/fiscal-utils";

interface CalendarControlsProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarControls({
  currentDate,
  onPrevMonth,
  onNextMonth
}: CalendarControlsProps) {
  return (
    <Card className="shadow-sm border-border/50">
      <div className="flex justify-between items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevMonth}
          className="hover:bg-muted transition-smooth"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <h2 className="text-xl font-semibold text-primary capitalize">
          {getMonthYear(currentDate)}
        </h2>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextMonth}
          className="hover:bg-muted transition-smooth"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
}