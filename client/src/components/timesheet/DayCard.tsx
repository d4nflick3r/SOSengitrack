import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DayEntry, TimeBlock } from "@/hooks/use-timesheet";
import { format, parseISO } from "date-fns";
import { calculateDayHours } from "@/lib/calculations";

interface DayCardProps {
  day: DayEntry;
  index: number;
  updateDay: (index: number, updates: Partial<DayEntry>) => void;
  updateTimeBlock: (dayIndex: number, blockIndex: number, field: keyof TimeBlock, value: string) => void;
}

export function DayCard({ day, index, updateDay, updateTimeBlock }: DayCardProps) {
  const date = parseISO(day.date);
  const dayName = format(date, 'EEEE');
  const shortDate = format(date, 'MMM d');
  const hours = calculateDayHours(day);

  const isInactive = day.isWeekend ? !day.workedWeekend : false;
  const showTimeInputs = day.isWeekend ? day.workedWeekend : true;

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 ${isInactive ? 'opacity-60 bg-muted/50' : 'bg-card'}`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${day.isBankHoliday ? 'bg-purple-500' : day.isWeekend ? 'bg-orange-400' : 'bg-blue-500'}`} />
      
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="w-full sm:w-auto flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            {dayName} <span className="text-sm font-normal text-muted-foreground">{shortDate}</span>
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-sm w-full sm:w-auto pt-1 sm:pt-0">
          {day.isBankHoliday && (
            <span className="text-purple-600 font-semibold text-xs uppercase tracking-wider bg-purple-100 px-2 py-1 rounded">Bank Holiday</span>
          )}
          {day.isWeekend && (
            <div className="flex items-center gap-2">
              <Switch 
                id={`worked-${index}`}
                checked={day.workedWeekend} 
                onCheckedChange={(c) => updateDay(index, { workedWeekend: c })}
              />
              <Label htmlFor={`worked-${index}`} className="cursor-pointer whitespace-nowrap text-orange-600 font-semibold">Worked (Overtime)</Label>
            </div>
          )}
        </div>
      </CardHeader>
      
      {showTimeInputs && (
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-end gap-2 sm:gap-4">
              <div className="grid gap-1.5 flex-1">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Start Time</Label>
                <Input 
                  type="time" 
                  value={day.timeBlocks[0].startTime} 
                  onChange={(e) => updateTimeBlock(index, 0, 'startTime', e.target.value)}
                  className="font-mono text-base h-10"
                />
              </div>
              <div className="grid gap-1.5 flex-1">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">End Time</Label>
                <Input 
                  type="time" 
                  value={day.timeBlocks[0].endTime} 
                  onChange={(e) => updateTimeBlock(index, 0, 'endTime', e.target.value)}
                  className="font-mono text-base h-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
