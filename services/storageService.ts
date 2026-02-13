
import { NotesStorage, DayNote, DateKey } from '../types';

const DB_NAME = 'ChronicleDB';
const STORE_NAME = 'Handles';
const ROOT_KEY = 'root_handle';

// Simple IDB wrapper for handle persistence
async function getDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const storageService = {
  rootHandle: null as FileSystemDirectoryHandle | null,

  async saveRootHandle(handle: FileSystemDirectoryHandle) {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, ROOT_KEY);
    this.rootHandle = handle;
  },

  async loadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const handle = await new Promise<FileSystemDirectoryHandle>((resolve) => {
      const req = tx.objectStore(STORE_NAME).get(ROOT_KEY);
      req.onsuccess = () => resolve(req.result);
    });
    if (handle) {
      // Check if we still have permission
      if ((await (handle as any).queryPermission({ mode: 'readwrite' })) === 'granted') {
        this.rootHandle = handle;
      }
    }
    return this.rootHandle;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.rootHandle) return false;
    const status = await (this.rootHandle as any).requestPermission({ mode: 'readwrite' });
    return status === 'granted';
  },

  async getDirectory(path: string[], create = false): Promise<FileSystemDirectoryHandle | null> {
    if (!this.rootHandle) return null;
    let current = this.rootHandle;
    for (const segment of path) {
      current = await current.getDirectoryHandle(segment, { create });
    }
    return current;
  },

  async saveNote(date: DateKey, htmlContent: string, images: File[] = []): Promise<void> {
    if (!this.rootHandle) return;
    const { year, month, day } = date;
    const path = [year.toString(), (month + 1).toString(), day.toString()];
    const dir = await this.getDirectory(path, true);
    if (!dir) return;

    // Save images first
    for (const img of images) {
      const fileHandle = await dir.getFileHandle(img.name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(img);
      await writable.close();
    }

    // Save note HTML
    const noteHandle = await dir.getFileHandle('index.html', { create: true });
    const writable = await noteHandle.createWritable();
    await writable.write(htmlContent);
    await writable.close();
  },

  async getNote(date: DateKey): Promise<DayNote | null> {
    if (!this.rootHandle) return null;
    try {
      const { year, month, day } = date;
      const path = [year.toString(), (month + 1).toString(), day.toString()];
      const dir = await this.getDirectory(path);
      if (!dir) return null;

      const fileHandle = await dir.getFileHandle('index.html');
      const file = await fileHandle.getFile();
      let content = await file.text();

      // Resolve relative images to blob URLs
      content = await this.resolveImagePaths(content, dir);

      return {
        content,
        updatedAt: file.lastModified
      };
    } catch (e) {
      return null;
    }
  },

  async resolveImagePaths(html: string, dir: FileSystemDirectoryHandle): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imgs = doc.querySelectorAll('img');
    
    for (const img of Array.from(imgs)) {
      const src = img.getAttribute('src');
      if (src && src.startsWith('./')) {
        try {
          const fileName = src.replace('./', '');
          const fileHandle = await dir.getFileHandle(fileName);
          const file = await fileHandle.getFile();
          img.src = URL.createObjectURL(file);
        } catch (e) {
          console.error('Failed to resolve image:', src);
        }
      }
    }
    return doc.body.innerHTML;
  },

  async loadAllNotes(): Promise<NotesStorage> {
    if (!this.rootHandle) return {};
    const storage: NotesStorage = {};

    // Basic crawl (could be optimized for large journals)
    for await (const [year, yearHandle] of (this.rootHandle as any).entries()) {
      if (yearHandle.kind !== 'directory' || isNaN(parseInt(year))) continue;
      storage[year] = {};
      
      for await (const [month, monthHandle] of yearHandle.entries()) {
        if (monthHandle.kind !== 'directory') continue;
        storage[year][(parseInt(month) - 1).toString()] = {};
        
        for await (const [day, dayHandle] of monthHandle.entries()) {
          if (dayHandle.kind !== 'directory') continue;
          
          try {
            const fileHandle = await dayHandle.getFileHandle('index.html');
            const file = await fileHandle.getFile();
            let content = await file.text();
            content = await this.resolveImagePaths(content, dayHandle);

            storage[year][(parseInt(month) - 1).toString()][day] = {
              content,
              updatedAt: file.lastModified
            };
          } catch(e) {}
        }
      }
    }
    return storage;
  },

// Cache the results of this and don't redo unless its dirty
  async getAllNotesSorted(): Promise<{ date: DateKey; note: DayNote }[]> {
    const notes = await this.loadAllNotes();
    const result: { date: DateKey; note: DayNote }[] = [];

    Object.keys(notes).forEach((yearStr) => {
      const months = notes[yearStr];
      Object.keys(months).forEach((monthStr) => {
        const days = months[monthStr];
        Object.keys(days).forEach((dayStr) => {
          result.push({
            date: { 
              year: parseInt(yearStr), 
              month: parseInt(monthStr), 
              day: parseInt(dayStr) 
            },
            note: days[dayStr]
          });
        });
      });
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.date.year, a.date.month, a.date.day).getTime();
      const dateB = new Date(b.date.year, b.date.month, b.date.day).getTime();
      return dateB - dateA;
    });
  }
};
