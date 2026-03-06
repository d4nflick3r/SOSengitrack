import { useTimesheet } from "@/hooks/use-timesheet";
import { useExpenses, calcVat } from "@/hooks/use-expenses";
import { calculateSummary, calculateDayHours } from "@/lib/calculations";
import { DayCard } from "@/components/timesheet/DayCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings2, RotateCcw, Download, Calendar as CalendarIcon, Briefcase, Wrench, Copy, CheckCircle2, Send, Mail, Save, Trash2, User, Plus, Receipt, X } from "lucide-react";
import logoImg from "@assets/leak-detection-company-224_1772356833916.webp";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Home() {
  const { 
    state, resetWeek, updateDay, updateTimeBlock, addTimeBlock, removeTimeBlock, 
    setBaseRate, setStandardHoursPerDay, setRepairs, setExtraJobs
  } = useTimesheet();

  const { expenses, addExpense, updateExpense, removeExpense, clearExpenses, totals: expenseTotals, categories } = useExpenses(state.weekStartDate);

  const [activeTab, setActiveTab] = useState<'timesheet' | 'expenses'>('timesheet');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [generatedCsvContent, setGeneratedCsvContent] = useState("");
  const [generatedExpensesCsvContent, setGeneratedExpensesCsvContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [expensesCopied, setExpensesCopied] = useState(false);
  const [engineerName, setEngineerName] = useState(() => localStorage.getItem('engineer-name') || '');
  const [nameSaved, setNameSaved] = useState(() => !!localStorage.getItem('engineer-name'));
  const handleSaveName = () => {
    localStorage.setItem('engineer-name', engineerName.trim());
    setNameSaved(true);
  };

  const handleDeleteName = () => {
    localStorage.removeItem('engineer-name');
    setEngineerName('');
    setNameSaved(false);
  };

  const getCsvFileName = (type: 'timesheet' | 'expenses' = 'timesheet') => {
    const safeName = engineerName.trim().replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
    if (safeName) {
      return `${type}-${safeName}-${state.weekStartDate}.csv`;
    }
    return `${type}-${state.weekStartDate}.csv`;
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(generatedCsvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildCsv = () => {
    const summary = calculateSummary(state);
    
    let csv = "SOSengitrack Weekly Timesheet Export\n";
    if (engineerName.trim()) csv += `Engineer,${engineerName.trim()}\n`;
    csv += `Week Commencing,${state.weekStartDate}\n\n`;
    
    csv += "Date,Day,Start Time,End Time,Total Hours,Bank Holiday,Holiday,Sickness,Weekend Worked\n";
    state.days.forEach(d => {
      const date = parseISO(d.date);
      const dayHours = calculateDayHours(d);
      const start = d.timeBlocks[0]?.startTime || '';
      const end = d.timeBlocks[0]?.endTime || '';
      const status = d.isWeekend ? 'Non-Working Day' : (d.isDayOff ? 'Yes' : 'No');
      csv += `${d.date},${format(date, 'EEEE')},${start},${end},${dayHours.toFixed(2)},${d.isBankHoliday ? 'Yes' : 'No'},${status},${d.isSick ? 'Yes' : 'No'},${d.isWeekend && d.workedWeekend ? 'Yes' : 'No'}\n`;
    });
    
    csv += `\nWeekly Totals\n`;
    csv += `Total Hours,${summary.hours.total.toFixed(2)}\n`;
    csv += `Standard Hours (Mon-Fri),${summary.hours.standardHours.toFixed(2)}\n`;
    csv += `Weekday Overtime,${summary.hours.weekdayOvertime.toFixed(2)}\n`;
    csv += `Saturday Hours,${summary.hours.saturdayHours.toFixed(2)}\n`;
    csv += `Sunday Hours,${summary.hours.sundayHours.toFixed(2)}\n`;
    csv += `Bank Holiday Hours,${summary.hours.bankHolidayHours.toFixed(2)}\n\n`;

    csv += `Repairs Logged,${state.repairs.count}\n`;
    csv += `Repairs Notes,"${state.repairs.notes.replace(/"/g, '""')}"\n\n`;
    csv += `Extra Jobs Logged,${state.extraJobs.count}\n`;
    csv += `Extra Jobs Notes,"${state.extraJobs.notes.replace(/"/g, '""')}"\n`;

    return csv;
  };

  const buildExpensesCsv = () => {
    let csv = "SOSengitrack Weekly Expenses Export\n";
    if (engineerName.trim()) csv += `Engineer,${engineerName.trim()}\n`;
    csv += `Week Commencing,${state.weekStartDate}\n\n`;

    csv += "Date,Category,Description,Amount Entered (£),Inc. VAT?,Net (£),VAT (£),Gross (£),Receipt\n";
    expenses.items.forEach(item => {
      const v = calcVat(item.amount || 0, item.includesVat);
      csv += `${item.date},"${item.category}","${item.description.replace(/"/g, '""')}",${item.amount.toFixed(2)},${item.includesVat ? 'Yes' : 'No'},${v.net.toFixed(2)},${v.vat.toFixed(2)},${v.gross.toFixed(2)},${item.receipt ? 'Yes' : 'No'}\n`;
    });

    csv += `\nTotals,,,,,,,,\n`;
    csv += `Net Total,,,,,${expenseTotals.net.toFixed(2)},,,\n`;
    csv += `VAT Total,,,,,,${expenseTotals.vat.toFixed(2)},,\n`;
    csv += `Gross Total,,,,,,,${expenseTotals.gross.toFixed(2)},\n`;
    csv += `Number of Items,${expenses.items.length},,,,,,\n`;
    return csv;
  };

  const downloadCsv = (csv: string, type: 'timesheet' | 'expenses' = 'timesheet') => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getCsvFileName(type);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (state.repairs.count > 0 && !state.repairs.notes.trim()) {
      alert('Please add notes for your repairs before submitting.');
      return;
    }
    if (state.extraJobs.count > 0 && !state.extraJobs.notes.trim()) {
      alert('Please add notes for your extra jobs before submitting.');
      return;
    }
    const csv = buildCsv();
    setGeneratedCsvContent(csv);
    downloadCsv(csv, 'timesheet');

    const csvFile = new File([csv], getCsvFileName('timesheet'), { type: 'text/csv' });
    const canShareFiles = navigator.share && navigator.canShare && navigator.canShare({ files: [csvFile] });

    if (canShareFiles) {
      try {
        await navigator.share({
          title: `Timesheet - Week Commencing ${state.weekStartDate}`,
          text: engineerName.trim() ? `Timesheet for ${engineerName.trim()} - Week commencing ${state.weekStartDate}` : `Timesheet - Week commencing ${state.weekStartDate}`,
          files: [csvFile],
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    setIsSubmitModalOpen(true);
  };

  const handleEmailTimesheet = () => {
    const nameStr = engineerName.trim() ? ` - ${engineerName.trim()}` : '';
    const subject = encodeURIComponent(`Timesheet${nameStr} - Week Commencing ${state.weekStartDate}`);
    const body = encodeURIComponent(`Hi,\n\nPlease find my timesheet for the week commencing ${state.weekStartDate} attached.\n\nThanks${engineerName.trim() ? `\n${engineerName.trim()}` : ''}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSubmitExpenses = async () => {
    const csv = buildExpensesCsv();
    setGeneratedExpensesCsvContent(csv);
    downloadCsv(csv, 'expenses');

    const csvFile = new File([csv], getCsvFileName('expenses'), { type: 'text/csv' });
    const canShareFiles = navigator.share && navigator.canShare && navigator.canShare({ files: [csvFile] });

    if (canShareFiles) {
      try {
        await navigator.share({
          title: `Expenses - Week Commencing ${state.weekStartDate}`,
          text: engineerName.trim() ? `Expenses for ${engineerName.trim()} - Week commencing ${state.weekStartDate}` : `Expenses - Week commencing ${state.weekStartDate}`,
          files: [csvFile],
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    setIsExpensesModalOpen(true);
  };

  const handleEmailExpenses = () => {
    const nameStr = engineerName.trim() ? ` - ${engineerName.trim()}` : '';
    const subject = encodeURIComponent(`Expenses${nameStr} - Week Commencing ${state.weekStartDate}`);
    const body = encodeURIComponent(`Hi,\n\nPlease find my expenses for the week commencing ${state.weekStartDate} attached.\n\nTotal: £${expenseTotals.gross.toFixed(2)} (Net: £${expenseTotals.net.toFixed(2)} + VAT: £${expenseTotals.vat.toFixed(2)})\n\nThanks${engineerName.trim() ? `\n${engineerName.trim()}` : ''}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyExpensesCsv = () => {
    navigator.clipboard.writeText(generatedExpensesCsvContent);
    setExpensesCopied(true);
    setTimeout(() => setExpensesCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <header className="bg-white border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-3 min-h-[4rem] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="SOS Leak Detection" className="h-10 sm:h-12 object-contain" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (window.confirm('Reset timesheet and expenses for this week? This cannot be undone.')) {
                resetWeek();
                clearExpenses();
              }
            }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('timesheet')}
              className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === 'timesheet' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              data-testid="tab-timesheet"
            >
              <CalendarIcon className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Timesheet
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              data-testid="tab-expenses"
            >
              <Receipt className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Expenses
              {expenses.items.length > 0 && (
                <span className="ml-1.5 bg-orange-100 text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{expenses.items.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4 border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                  <Settings2 className="h-5 w-5 text-slate-500" />
                  Timesheet Settings
                </CardTitle>
                <CardDescription>Set your week start date</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="space-y-2 max-w-sm">
                  <Label className="font-semibold text-slate-700">Engineer Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="text"
                      placeholder="e.g. John Smith"
                      value={engineerName}
                      onChange={(e) => { setEngineerName(e.target.value); setNameSaved(false); }}
                      className="text-base"
                      data-testid="input-engineer-name"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleSaveName} 
                      disabled={!engineerName.trim() || nameSaved}
                      className={nameSaved ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                      data-testid="button-save-name"
                    >
                      {nameSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    </Button>
                    {engineerName.trim() && (
                      <Button size="sm" variant="outline" onClick={handleDeleteName} data-testid="button-delete-name">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  {nameSaved && <p className="text-xs text-green-600 font-medium">Name saved — it will be remembered next time</p>}
                </div>
                <div className="space-y-2 max-w-sm">
                  <Label className="font-semibold text-slate-700">Week Commencing (Mon)</Label>
                  <Input 
                    type="date" 
                    value={state.weekStartDate}
                    onChange={(e) => resetWeek(e.target.value)}
                    className="font-mono text-base"
                    data-testid="input-week-start"
                  />
                </div>
              </CardContent>
            </Card>

            {activeTab === 'timesheet' && (
              <>
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                      Daily Logs
                    </h2>
                  </div>
                  <div className="grid gap-5">
                    {state.days.map((day, index) => (
                      <DayCard 
                        key={day.date} 
                        day={day} 
                        index={index} 
                        updateDay={updateDay}
                        updateTimeBlock={updateTimeBlock}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5 pt-4">
                  <Card className="shadow-sm border-slate-200 border-t-4 border-t-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                        <Wrench className="h-5 w-5 text-green-600" />
                        Repairs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <Label className="font-semibold">Total Repairs Completed:</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={state.repairs.count} 
                          onChange={(e) => setRepairs({ count: parseInt(e.target.value) || 0 })}
                          className="w-24 font-mono font-bold text-lg text-center"
                          data-testid="input-repairs-count"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">
                          Notes / Job References {state.repairs.count > 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea 
                          placeholder="e.g. LD***" 
                          value={state.repairs.notes}
                          onChange={(e) => setRepairs({ notes: e.target.value })}
                          className={`resize-none h-24 text-sm ${state.repairs.count > 0 && !state.repairs.notes.trim() ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                          data-testid="input-repairs-notes"
                        />
                        {state.repairs.count > 0 && !state.repairs.notes.trim() && (
                          <p className="text-xs text-red-500">Required when repairs are logged</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-slate-200 border-t-4 border-t-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        Extra Jobs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <Label className="font-semibold">Extra Jobs Picked Up:</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={state.extraJobs.count} 
                          onChange={(e) => setExtraJobs({ count: parseInt(e.target.value) || 0 })}
                          className="w-24 font-mono font-bold text-lg text-center"
                          data-testid="input-extra-jobs-count"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">
                          Notes / References {state.extraJobs.count > 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea 
                          placeholder="e.g. LD***" 
                          value={state.extraJobs.notes}
                          onChange={(e) => setExtraJobs({ notes: e.target.value })}
                          className={`resize-none h-24 text-sm ${state.extraJobs.count > 0 && !state.extraJobs.notes.trim() ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                          data-testid="input-extra-jobs-notes"
                        />
                        {state.extraJobs.count > 0 && !state.extraJobs.notes.trim() && (
                          <p className="text-xs text-red-500">Required when extra jobs are logged</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-8 pb-4">
                  <Button 
                    size="lg" 
                    className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700" 
                    onClick={handleSubmit}
                    data-testid="button-submit"
                  >
                    <Download className="h-5 w-5 mr-2" /> Submit Timesheet
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'expenses' && (
              <>
                <Card className="shadow-sm border-slate-200 border-t-4 border-t-orange-500">
                  <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 font-bold text-slate-800">
                        <Receipt className="h-5 w-5 text-orange-600" />
                        Weekly Expenses
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {expenses.items.length > 0 && (
                          <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full" data-testid="text-expenses-total">
                            Total: £{expenseTotals.gross.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <CardDescription>Log fuel, parking, tools, materials and other work expenses</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {expenses.items.map((item, idx) => (
                      <div key={item.id} className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3" data-testid={`expense-item-${idx}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-500">Expense #{idx + 1}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeExpense(item.id)} className="h-7 w-7 p-0 text-red-400 hover:text-red-600" data-testid={`button-remove-expense-${idx}`}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-600">Date</Label>
                            <Input
                              type="date"
                              value={item.date}
                              onChange={(e) => updateExpense(item.id, { date: e.target.value })}
                              className="text-sm"
                              data-testid={`input-expense-date-${idx}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-600">Category</Label>
                            <Select value={item.category} onValueChange={(val) => updateExpense(item.id, { category: val })}>
                              <SelectTrigger className="text-sm" data-testid={`select-expense-category-${idx}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-600">Description</Label>
                          <Input
                            type="text"
                            placeholder="e.g. Diesel fill-up, Screwfix tools"
                            value={item.description}
                            onChange={(e) => updateExpense(item.id, { description: e.target.value })}
                            className="text-sm"
                            data-testid={`input-expense-desc-${idx}`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-600">Amount (£)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.amount || ''}
                              onChange={(e) => updateExpense(item.id, { amount: parseFloat(e.target.value) || 0 })}
                              className="text-sm font-mono"
                              data-testid={`input-expense-amount-${idx}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-600">VAT</Label>
                            <div className="flex items-center gap-2 h-9">
                              <Switch
                                checked={item.includesVat}
                                onCheckedChange={(checked) => updateExpense(item.id, { includesVat: checked })}
                                data-testid={`switch-expense-vat-${idx}`}
                              />
                              <Label className="text-xs font-medium text-slate-600">{item.includesVat ? 'Inc. VAT' : 'Exc. VAT'}</Label>
                            </div>
                          </div>
                        </div>
                        {item.amount > 0 && (
                          <div className="bg-white rounded border border-slate-100 px-3 py-2 grid grid-cols-3 gap-2 text-xs" data-testid={`expense-vat-breakdown-${idx}`}>
                            <div>
                              <span className="text-slate-400 block">Net</span>
                              <span className="font-mono font-semibold text-slate-700">£{calcVat(item.amount, item.includesVat).net.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">VAT (20%)</span>
                              <span className="font-mono font-semibold text-slate-700">£{calcVat(item.amount, item.includesVat).vat.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Gross</span>
                              <span className="font-mono font-bold text-orange-600">£{calcVat(item.amount, item.includesVat).gross.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.receipt}
                            onCheckedChange={(checked) => updateExpense(item.id, { receipt: checked })}
                            data-testid={`switch-expense-receipt-${idx}`}
                          />
                          <Label className="text-sm font-medium text-slate-700">Receipt kept</Label>
                        </div>
                      </div>
                    ))}

                    <Button variant="outline" className="w-full border-dashed border-2 text-slate-600 hover:text-orange-600 hover:border-orange-300" onClick={addExpense} data-testid="button-add-expense">
                      <Plus className="h-4 w-4 mr-2" /> Add Expense
                    </Button>

                    {expenses.items.length > 0 && (
                      <>
                        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 space-y-2" data-testid="expenses-summary">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Net Total</span>
                            <span className="font-mono font-semibold">£{expenseTotals.net.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">VAT (20%)</span>
                            <span className="font-mono font-semibold">£{expenseTotals.vat.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold border-t border-orange-200 pt-2">
                            <span className="text-slate-800">Gross Total</span>
                            <span className="font-mono text-orange-600">£{expenseTotals.gross.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={clearExpenses} data-testid="button-clear-expenses">
                            <Trash2 className="h-4 w-4 mr-2" /> Clear All
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <div className="pt-8 pb-4">
                  {expenses.items.length > 0 ? (
                    <Button 
                      size="lg" 
                      className="w-full text-lg h-14 bg-orange-600 hover:bg-orange-700" 
                      onClick={handleSubmitExpenses}
                      data-testid="button-submit-expenses"
                    >
                      <Download className="h-5 w-5 mr-2" /> Submit Expenses
                    </Button>
                  ) : (
                    <p className="text-center text-slate-400 text-sm py-4">Add an expense to get started</p>
                  )}
                </div>
              </>
            )}

        </div>
      </main>

      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" /> Timesheet CSV Downloaded
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-slate-700">
              Your timesheet has been saved as <strong>{getCsvFileName('timesheet')}</strong>. Open your email to send it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base" onClick={handleEmailTimesheet} data-testid="button-open-email">
              <Mail className="h-5 w-5 mr-2" /> Open Email App
            </Button>

            <p className="text-xs text-center text-muted-foreground">Attach the downloaded CSV file to your email</p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => downloadCsv(generatedCsvContent, 'timesheet')} className="flex-1" data-testid="button-download-csv">
                <Download className="h-4 w-4 mr-2" /> Download Again
              </Button>
              <Button variant="outline" onClick={handleCopyCsv} className="flex-1" data-testid="button-copy-csv">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy CSV"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExpensesModalOpen} onOpenChange={setIsExpensesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <CheckCircle2 className="h-5 w-5" /> Expenses CSV Downloaded
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-slate-700">
              Your expenses have been saved as <strong>{getCsvFileName('expenses')}</strong>. Total: <strong>£{expenseTotals.gross.toFixed(2)}</strong> (Net £{expenseTotals.net.toFixed(2)} + VAT £{expenseTotals.vat.toFixed(2)})
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 space-y-3">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base" onClick={handleEmailExpenses} data-testid="button-open-email-expenses">
              <Mail className="h-5 w-5 mr-2" /> Open Email App
            </Button>

            <p className="text-xs text-center text-muted-foreground">Attach the downloaded CSV file to your email</p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => downloadCsv(generatedExpensesCsvContent, 'expenses')} className="flex-1" data-testid="button-download-expenses-csv">
                <Download className="h-4 w-4 mr-2" /> Download Again
              </Button>
              <Button variant="outline" onClick={handleCopyExpensesCsv} className="flex-1" data-testid="button-copy-expenses-csv">
                {expensesCopied ? <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                {expensesCopied ? "Copied!" : "Copy CSV"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
