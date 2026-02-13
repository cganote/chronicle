
import React from 'react';
import { NotesStorage } from '../types';

interface CalendarProps {
  currentDate: Date;
  onDateClick: (day: number) => void;
  notes: NotesStorage;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, onDateClick, notes }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const today = new Date();
  const isToday = (day: number) => 
    today.getDate() === day && 
    today.getMonth() === month && 
    today.getFullYear() === year;

  const hasNote = (day: number) => {
    return !!notes[year]?.[month]?.[day]?.content.trim();
  };

  const getPreviewText = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="bg-slate-900 text-white py-6 px-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {monthName} <span className="text-slate-400 font-medium">{year}</span>
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 p-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}

        {blanks.map(b => (
          <div key={`blank-${b}`} className="bg-slate-50/50 min-h-[100px] md:min-h-[120px]" />
        ))}

        {days.map(day => (
          <button
            key={day}
            onClick={() => onDateClick(day)}
            className={`
              relative bg-white min-h-[100px] md:min-h-[120px] p-2 transition-all hover:bg-indigo-50 group
              ${isToday(day) ? 'bg-indigo-50/50' : ''}
            `}
          >
            <div className={`
              w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mb-1
              ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-700'}
            `}>
              {day}
            </div>
            
            {hasNote(day) && (
              <div className="mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mx-auto" />
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 px-1 text-left">
                  {getPreviewText(notes[year][month][day].content)}
                </p>
              </div>
            )}
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
