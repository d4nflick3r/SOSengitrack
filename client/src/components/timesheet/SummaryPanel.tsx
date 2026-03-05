import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TimesheetState } from "@/hooks/use-timesheet";
import { calculateSummary } from "@/lib/calculations";
import { Calculator } from "lucide-react";

export function SummaryPanel({ state }: { state: TimesheetState }) {
  const summary = calculateSummary(state);

  return (
    <Card className="bg-slate-900 text-slate-50 border-slate-800 shadow-xl overflow-hidden sticky top-20">
      <div className="bg-blue-600 px-5 py-4 flex items-center gap-3">
        <Calculator className="h-5 w-5 text-white" />
        <h3 className="font-bold text-white text-lg tracking-wide">Weekly Summary</h3>
      </div>
      <CardContent className="p-0">
        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hours Breakdown</h4>
            
            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-300">Standard (x1.0)</span>
              <span className="font-mono text-base">{summary.hours.standardHours.toFixed(2)}h</span>
            </div>
            
            {summary.hours.weekdayOvertime > 0 && (
              <div className="flex justify-between items-center text-sm text-blue-300 border-b border-slate-800 pb-2">
                <span>Weekday OT (x1.5)</span>
                <span className="font-mono text-base">{summary.hours.weekdayOvertime.toFixed(2)}h</span>
              </div>
            )}
            
            {summary.hours.saturdayHours > 0 && (
              <div className="flex justify-between items-center text-sm text-orange-300 border-b border-slate-800 pb-2">
                <span>Saturday (x1.5)</span>
                <span className="font-mono text-base">{summary.hours.saturdayHours.toFixed(2)}h</span>
              </div>
            )}
            
            {summary.hours.sundayHours > 0 && (
              <div className="flex justify-between items-center text-sm text-red-300 border-b border-slate-800 pb-2">
                <span>Sunday (x2.0)</span>
                <span className="font-mono text-base">{summary.hours.sundayHours.toFixed(2)}h</span>
              </div>
            )}
            
            {summary.hours.bankHolidayHours > 0 && (
              <div className="flex justify-between items-center text-sm text-purple-300 border-b border-slate-800 pb-2">
                <span>Bank Holiday (x2.0)</span>
                <span className="font-mono text-base">{summary.hours.bankHolidayHours.toFixed(2)}h</span>
              </div>
            )}
            
            <div className="flex justify-between items-center font-bold text-white pt-1">
              <span>Total Hours</span>
              <span className="font-mono text-lg text-blue-400">{summary.hours.total.toFixed(2)}h</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pay Breakdown</h4>
            
            <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
              <span className="text-slate-300">Hourly Pay Base</span>
              <span className="font-mono text-base">£{(
                summary.pay.payStandard + 
                summary.pay.payWeekdayOT + 
                summary.pay.paySaturday + 
                summary.pay.paySunday + 
                summary.pay.payBankHoliday
              ).toFixed(2)}</span>
            </div>
            
            {summary.pay.payRepairs > 0 && (
              <div className="flex justify-between items-center text-sm text-green-300 border-b border-slate-800 pb-2">
                <span>Repairs ({state.repairs.count} @ £10)</span>
                <span className="font-mono text-base">£{summary.pay.payRepairs.toFixed(2)}</span>
              </div>
            )}
            
            {summary.pay.payExtraJobs > 0 && (
              <div className="flex justify-between items-center text-sm text-green-300 border-b border-slate-800 pb-2">
                <span>Extra Jobs ({state.extraJobs.count} @ £10)</span>
                <span className="font-mono text-base">£{summary.pay.payExtraJobs.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-950 p-6 flex justify-between items-center">
          <span className="font-bold text-slate-200 uppercase tracking-widest text-sm">Est. Gross Pay</span>
          <span className="text-3xl font-bold font-mono text-green-400">£{summary.pay.totalGrossPay.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
