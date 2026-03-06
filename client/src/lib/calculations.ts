import { TimesheetState, DayEntry } from '../hooks/use-timesheet';
import { differenceInMinutes, parse } from 'date-fns';

export function calculateDayHours(day: DayEntry) {
  if (day.isDayOff || day.isSick) return 0;
  if (day.isWeekend && !day.workedWeekend) return 0;
  let totalMinutes = 0;
  
  day.timeBlocks.forEach(block => {
    if (block.startTime && block.endTime) {
      try {
        const start = parse(block.startTime, 'HH:mm', new Date());
        const end = parse(block.endTime, 'HH:mm', new Date());
        let diff = differenceInMinutes(end, start);
        if (diff < 0) diff += 24 * 60; // handle overnight shifts
        totalMinutes += diff;
      } catch (e) {
        // invalid time format
      }
    }
  });

  return Math.max(0, totalMinutes / 60);
}

export function calculateSummary(state: TimesheetState) {
  let standardHours = 0;
  let weekdayOvertime = 0;
  let saturdayHours = 0;
  let sundayHours = 0;
  let bankHolidayHours = 0;

  state.days.forEach((day, index) => {
    const hours = calculateDayHours(day);
    if (hours === 0) return;

    if (day.isBankHoliday) {
      bankHolidayHours += hours;
    } else if (index === 5) { // Saturday
      saturdayHours += hours;
    } else if (index === 6) { // Sunday
      sundayHours += hours;
    } else { // Mon-Fri
      const std = Math.min(hours, state.standardHoursPerDay);
      const ot = hours - std;
      standardHours += std;
      weekdayOvertime += ot;
    }
  });

  const base = state.baseRate;
  const payStandard = standardHours * base;
  const payWeekdayOT = weekdayOvertime * base * 1.5;
  const paySaturday = saturdayHours * base * 1.5;
  const paySunday = sundayHours * base * 2.0;
  const payBankHoliday = bankHolidayHours * base * 2.0;
  
  const totalGrossPay = payStandard + payWeekdayOT + paySaturday + paySunday + payBankHoliday;
  const totalHours = standardHours + weekdayOvertime + saturdayHours + sundayHours + bankHolidayHours;

  return {
    hours: { standardHours, weekdayOvertime, saturdayHours, sundayHours, bankHolidayHours, total: totalHours },
    pay: { payStandard, payWeekdayOT, paySaturday, paySunday, payBankHoliday, totalGrossPay }
  };
}

export const UK_BANK_HOLIDAYS = [
  // 2024
  "2024-01-01", "2024-03-29", "2024-04-01", "2024-05-06", "2024-05-27", "2024-08-26", "2024-12-25", "2024-12-26",
  // 2025
  "2025-01-01", "2025-04-18", "2025-04-21", "2025-05-05", "2025-05-26", "2025-08-25", "2025-12-25", "2025-12-26",
  // 2026
  "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04", "2026-05-25", "2026-08-31", "2026-12-25", "2026-12-28"
];
