
import React, { useState, useEffect, useRef } from 'react';
import { DateKey } from '../types';
import { storageService } from '../services/storageService';

declare const Quill: any;

interface NoteModalProps {
  date: DateKey;
  onClose: () => void;
  onSave: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ date, onClose, onSave }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const pendingImages = useRef<File[]>([]);

  const formattedDate = new Date(date.year, date.month, date.day).toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    const init = async () => {
      if (editorRef.current && !quillInstance.current) {
        quillInstance.current = new Quill(editorRef.current, {
          theme: 'snow',
          modules: {
            syntax: true,
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              ['blockquote', 'code-block'],
              ['link', 'image'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['clean']
            ]
          },
          placeholder: 'Write your thoughts here...'
        });

        // Custom Image Handler
        const toolbar = quillInstance.current.getModule('toolbar');
        toolbar.addHandler('image', () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = () => {
            const file = input.files?.[0];
            if (file) {
              // Store file to save later
              const fileName = `img_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
              const renamedFile = new File([file], fileName, { type: file.type });
              pendingImages.current.push(renamedFile);

              const range = quillInstance.current.getSelection();
              // Use a relative path placeholder that we'll convert back and forth
              quillInstance.current.insertEmbed(range.index, 'image', URL.createObjectURL(renamedFile));
              // Mark the element with the real relative filename for saving
              const img = editorRef.current?.querySelectorAll('img')[editorRef.current?.querySelectorAll('img').length - 1];
              if (img) img.setAttribute('data-filename', `./${fileName}`);
            }
          };
        });

        const existing = await storageService.getNote(date);
        if (existing) {
          quillInstance.current.root.innerHTML = existing.content;
        }
      }
    };
    init();
  }, [date]);

  const handleSave = async () => {
    if (quillInstance.current) {
      setIsSaving(true);
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = quillInstance.current.root.innerHTML;
        
        // Clean up: convert Blob URLs back to relative paths for disk storage
        const imgs = tempDiv.querySelectorAll('img');
        imgs.forEach(img => {
          const filename = img.getAttribute('data-filename');
          if (filename) {
            img.src = filename;
            img.removeAttribute('data-filename');
          } else if (img.src.startsWith('blob:')) {
            // Fallback for pasted images or ones missing data-filename
            // In a production app we'd convert these blobs to files too
          }
        });

        const content = tempDiv.innerHTML;
        const cleanContent = content === '<p><br></p>' ? '' : content;
        
        await storageService.saveNote(date, cleanContent, pendingImages.current);
        onSave();
        onClose();
      } catch (err) {
        alert('Failed to save to local file system. Ensure the app has permission.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Note for {formattedDate}</h3>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">
              Stored in /{date.year}/{date.month + 1}/{date.day}/
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          <div ref={editorRef} className="h-full" />
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
