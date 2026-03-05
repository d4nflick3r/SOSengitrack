import { useState, useEffect } from 'react';
import { startOfWeek, addDays, format, parseISO } from 'date-fns';
import { UK_BANK_HOLIDAYS } from '../lib/calculations';

export interface TimeBlock {
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
}

export interface DayEntry {
  date: string; // ISO yyyy-MM-dd
  isDayOff: boolean;
  isBankHoliday: boolean;
  isSick: boolean;
  isWeekend: boolean;
  workedWeekend: boolean;
  timeBlocks: TimeBlock[];
}

export interface TimesheetState {
  weekStartDate: string; // ISO yyyy-MM-dd
  baseRate: number;
  standardHoursPerDay: number;
  days: DayEntry[];
  repairs: { count: number; notes: string };
  extraJobs: { count: number; notes: string };
}

const defaultState = (startDate: Date): TimesheetState => {
  const days: DayEntry[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const isWeekend = i === 5 || i === 6;
    const dateStr = format(date, 'yyyy-MM-dd');
    days.push({
      date: dateStr,
      isDayOff: false,
      isBankHoliday: UK_BANK_HOLIDAYS.includes(dateStr),
      isSick: false,
      isWeekend,
      workedWeekend: false,
      timeBlocks: [{ startTime: isWeekend ? '' : '08:00', endTime: isWeekend ? '' : '17:00' }],
    });
  }
  
  return {
    weekStartDate: format(startDate, 'yyyy-MM-dd'),
    baseRate: 15.00,
    standardHoursPerDay: 8,
    days,
    repairs: { count: 0, notes: '' },
    extraJobs: { count: 0, notes: '' },
  };
};

export function useTimesheet() {
  const [state, setState] = useState<TimesheetState>(() => {
    const saved = localStorage.getItem('timesheet-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.days) {
          parsed.days = parsed.days.map((d: any, i: number) => ({
            ...d,
            isWeekend: i === 5 || i === 6,
            workedWeekend: d.workedWeekend || false,
            isSick: d.isSick || false,
            isDayOff: (i === 5 || i === 6) ? false : (d.isDayOff || false),
          }));
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return defaultState(monday);
  });

  useEffect(() => {
    localStorage.setItem('timesheet-state', JSON.stringify(state));
  }, [state]);

  const resetWeek = (newStartDate?: string) => {
    const monday = newStartDate ? parseISO(newStartDate) : startOfWeek(new Date(), { weekStartsOn: 1 });
    setState(defaultState(monday));
  };

  const updateDay = (index: number, updates: Partial<DayEntry>) => {
    setState(s => {
      const newDays = [...s.days];
      newDays[index] = { ...newDays[index], ...updates };
      return { ...s, days: newDays };
    });
  };
  
  const updateTimeBlock = (dayIndex: number, blockIndex: number, field: keyof TimeBlock, value: string) => {
    setState(s => {
      const newDays = [...s.days];
      const newBlocks = [...newDays[dayIndex].timeBlocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], [field]: value };
      newDays[dayIndex] = { ...newDays[dayIndex], timeBlocks: newBlocks };
      return { ...s, days: newDays };
    });
  };

  const addTimeBlock = (dayIndex: number) => {
    setState(s => {
      const newDays = [...s.days];
      newDays[dayIndex] = { ...newDays[dayIndex], timeBlocks: [...newDays[dayIndex].timeBlocks, { startTime: '', endTime: '' }] };
      return { ...s, days: newDays };
    });
  };

  const removeTimeBlock = (dayIndex: number, blockIndex: number) => {
    setState(s => {
      const newDays = [...s.days];
      const newBlocks = newDays[dayIndex].timeBlocks.filter((_, i) => i !== blockIndex);
      newDays[dayIndex] = { ...newDays[dayIndex], timeBlocks: newBlocks };
      return { ...s, days: newDays };
    });
  };

  const setBaseRate = (rate: number) => setState(s => ({ ...s, baseRate: rate }));
  const setStandardHoursPerDay = (hours: number) => setState(s => ({ ...s, standardHoursPerDay: hours }));
  const setRepairs = (updates: Partial<TimesheetState['repairs']>) => setState(s => ({ ...s, repairs: { ...s.repairs, ...updates } }));
  const setExtraJobs = (updates: Partial<TimesheetState['extraJobs']>) => setState(s => ({ ...s, extraJobs: { ...s.extraJobs, ...updates } }));

  return { state, resetWeek, updateDay, updateTimeBlock, addTimeBlock, removeTimeBlock, setBaseRate, setStandardHoursPerDay, setRepairs, setExtraJobs };
}
