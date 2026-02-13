
import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import NoteModal from './components/NoteModal';
import SummaryView from './components/SummaryView';
import { DateKey, NotesStorage } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<'calendar' | 'summary'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<DateKey | null>(null);
  const [notes, setNotes] = useState<NotesStorage>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const handle = await storageService.loadRootHandle();
      if (handle) {
        setIsConnected(true);
        const allNotes = await storageService.loadAllNotes();
        setNotes(allNotes);
      }
      setIsInitializing(false);
    };
    checkConnection();
  }, []);

  const handleConnectFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      await storageService.saveRootHandle(handle);
      setIsConnected(true);
      const allNotes = await storageService.loadAllNotes();
      setNotes(allNotes);
    } catch (err) {
      console.error('Directory selection cancelled', err);
    }
  };

  const handleRefresh = async () => {
    if (isConnected) {
      const allNotes = await storageService.loadAllNotes();
      setNotes(allNotes);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = async (day: number) => {
    if (!isConnected) {
      alert('Please connect a folder first to start taking notes.');
      return;
    }
    // Re-verify permission if needed (some browsers revoke it on idle)
    const hasPermission = await storageService.requestPermission();
    if (!hasPermission) return;

    setSelectedDate({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
      day
    });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-black text-slate-800 tracking-tight hidden sm:inline">CHRONICLE</span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleConnectFolder}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isConnected 
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
                    : 'text-indigo-600 bg-indigo-50 border-indigo-200 animate-bounce'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                {isConnected ? 'FOLDER CONNECTED' : 'CONNECT FOLDER'}
              </button>
              
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  view === 'calendar' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setView('summary')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  view === 'summary' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8 sm:px-6 lg:px-8">
        {!isConnected ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm animate-in fade-in zoom-in duration-500">
            <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Select a Storage Folder</h1>
            <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
              Choose a local folder to store your journal. All your notes and images will be saved directly on your computer in a human-readable structure.
            </p>
            <button
              onClick={handleConnectFolder}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
            >
              Start Journaling
            </button>
          </div>
        ) : (
          view === 'calendar' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900">Your Timeline</h1>
                <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 self-start">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 text-xs font-bold text-indigo-600 uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <Calendar 
                currentDate={currentDate} 
                onDateClick={handleDateClick} 
                notes={notes}
              />

              <div className="mt-12 bg-indigo-600 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-xl">
                    <h2 className="text-3xl font-bold mb-2">Private & Local</h2>
                    <p className="text-indigo-100 text-lg opacity-90">
                      Your data stays on your machine. We only use the File System Access API to organize your thoughts into a professional directory structure.
                    </p>
                  </div>
                  <button 
                    onClick={() => setView('summary')}
                    className="bg-white text-indigo-600 px-8 py-3.5 rounded-2xl font-bold shadow-xl hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 text-center"
                  >
                    View Full Archive
                  </button>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-30" />
                <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-indigo-400 rounded-full blur-2xl opacity-20" />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <SummaryView onBack={() => setView('calendar')} />
            </div>
          )
        )}
      </main>

      {selectedDate && (
        <NoteModal 
          date={selectedDate} 
          onClose={() => setSelectedDate(null)} 
          onSave={handleRefresh}
        />
      )}
    </div>
  );
};

export default App;
