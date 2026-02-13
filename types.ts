
export interface DayNote {
  content: string;
  updatedAt: number;
}

// Simulated folder structure: Year -> Month -> Day
export interface NotesStorage {
  [year: string]: {
    [month: string]: {
      [day: string]: DayNote;
    };
  };
}

export interface DateKey {
  year: number;
  month: number;
  day: number;
}
