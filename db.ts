
import { Dexie, Table } from 'dexie';
import { Patient, Attendance } from './types';

// Fix: Use named import for Dexie to ensure inherited properties like 'version' are properly recognized by the type checker.
export class AppDatabase extends Dexie {
  patients!: Table<Patient>;
  attendances!: Table<Attendance>;

  constructor() {
    super('AMV_AmbulatorioDB');
    // Define the database version and schema
    this.version(1).stores({
      patients: '++id, name, susCard, examDate',
      attendances: '++id, patientId, date, patientName, examLabel'
    });
  }
}

export const db = new AppDatabase();
