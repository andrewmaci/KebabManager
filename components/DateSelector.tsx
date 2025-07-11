import React from 'react';
import { CalendarIcon } from './icons/CalendarIcon';

interface DateSelectorProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onDateChange: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
  const getDisplayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dateObj = new Date(selectedDate);
    const locale = 'pl-PL';

    if (selectedDate === today) {
      return `Dzisiaj (${dateObj.toLocaleDateString(locale, { timeZone: 'UTC', day: 'numeric', month: 'long' })})`;
    }
    if (selectedDate === yesterday) {
      return `Wczoraj (${dateObj.toLocaleDateString(locale, { timeZone: 'UTC', day: 'numeric', month: 'long' })})`;
    }
    return dateObj.toLocaleDateString(locale, { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="mb-8 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dziennik Zamówień</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Zamówienia na dzień: <span className="font-semibold text-amber-600">{getDisplayDate()}</span></p>
      </div>
      <div className="relative flex items-center w-full sm:w-auto">
        <label htmlFor="date-picker" className="sr-only">Wybierz datę</label>
        <CalendarIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 absolute left-3 pointer-events-none" />
        <input 
          id="date-picker"
          type="date" 
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg py-2 pl-10 pr-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none w-full"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  );
};
