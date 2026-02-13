
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { DateKey, DayNote } from '../types';

declare const hljs: any;

interface SummaryViewProps {
  onBack: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ onBack }) => {
  const [allNotes, setAllNotes] = useState<{ date: DateKey; note: DayNote }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const notes = await storageService.getAllNotesSorted();
      setAllNotes(notes);
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoading && typeof hljs !== 'undefined') {
      hljs.highlightAll();
    }
  }, [isLoading, allNotes]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 font-bold">Crawling File System...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Journal Archive</h2>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Calendar
        </button>
      </div>

      {allNotes.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-400">No notes found yet</h3>
          <p className="text-slate-400 mt-2">Start writing by clicking a day on the calendar.</p>
        </div>
      ) : (
        <div className="space-y-12 bg-white p-6 md:p-12 rounded-3xl shadow-xl border border-slate-100">
          {allNotes.map(({ date, note }, idx) => {
            const dateObj = new Date(date.year, date.month, date.day);
            const dateString = dateObj.toLocaleDateString('default', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div key={`${date.year}-${date.month}-${date.day}`} className="group relative">
                {idx !== allNotes.length - 1 && (
                  <div className="absolute left-[7px] top-8 bottom-[-40px] w-px bg-slate-100" />
                )}
                
                <div className="flex items-start gap-6">
                  <div className="mt-1 w-4 h-4 rounded-full border-2 border-indigo-400 bg-white flex-shrink-0 z-10" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">
                      {dateString}
                    </h3>
                    <div className="prose prose-slate prose-lg max-w-none text-slate-600 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 group-hover:bg-indigo-50/30 transition-colors overflow-hidden">
                      <div dangerouslySetInnerHTML={{ __html: note.content }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} Chronicle Notes — Private, Local, Secure.</p>
      </div>
    </div>
  );
};

export default SummaryView;
