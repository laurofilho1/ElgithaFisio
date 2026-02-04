
export interface Patient {
  id?: number;
  name: string;
  susCard: string;
  doctor: string;
  birthDate: string;
  examDate: string;
  dum: string;
  age: number;
  comorbidity: boolean;
  origin: 'ELGITHA' | 'SEMUS';
}

export interface Exam {
  id: string;
  label: string;
  value: number;
}

export interface Attendance {
  id?: number;
  patientId: number;
  patientName: string;
  susCard: string;
  examId: string;
  examLabel: string;
  examValue: number;
  date: string;
  doctor: string; // Adicionado
  status: 'Normal' | 'Remarcado';
}

export interface DailyReportData {
  date: string;
  totalValue: number;
  doctorName?: string; // Adicionado
  attendances: Attendance[];
}
