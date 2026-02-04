
import React, { useState, useEffect, useCallback } from 'react';
import { Patient, Attendance } from './types';
import { EXAMS } from './constants';
import { db } from './db';
import PatientForm from './components/PatientForm';
import ExamSelection from './components/ExamSelection';
import { generatePatientSheet, generateDailyReport } from './services/pdfService';

const INITIAL_PATIENT: Patient = {
  name: '',
  susCard: '',
  doctor: '',
  birthDate: '',
  examDate: new Date().toISOString().split('T')[0],
  dum: '',
  age: 0,
  comorbidity: false,
  origin: 'ELGITHA',
};

export default function App() {
  const [patient, setPatient] = useState<Patient>(INITIAL_PATIENT);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const loadAttendances = useCallback(async () => {
    try {
      const allAttendances = await db.attendances.toArray();
      setAttendances(allAttendances.reverse());
    } catch (error) {
      console.error("Erro ao carregar atendimentos:", error);
    }
  }, []);

  useEffect(() => {
    loadAttendances();
  }, [loadAttendances]);

  const handleRegister = async () => {
    if (!patient.name || selectedExamIds.length === 0) {
      alert('Por favor, preencha o nome do paciente e selecione ao menos um exame.');
      return;
    }

    try {
      const patientId = await db.patients.add(patient);
      
      const newAttendances: Attendance[] = selectedExamIds.map(id => {
        const exam = EXAMS.find(e => e.id === id)!;
        return {
          patientId: patientId as number,
          patientName: patient.name,
          susCard: patient.susCard,
          examId: id,
          examLabel: exam.label,
          examValue: exam.value,
          date: patient.examDate,
          doctor: patient.doctor, // Agora salva o médico no atendimento
          status: 'Normal'
        };
      });

      await db.attendances.bulkAdd(newAttendances);
      
      generatePatientSheet(patient, selectedExamIds.map(id => EXAMS.find(e => e.id === id)!.label));
      
      // Reset state
      setPatient(INITIAL_PATIENT);
      setSelectedExamIds([]);
      loadAttendances();
    } catch (error) {
      console.error("Erro ao registrar atendimento:", error);
      alert("Erro ao salvar os dados. Tente novamente.");
    }
  };

  const handleGenerateReport = async () => {
    try {
      const dayAttendances = await db.attendances
        .where('date')
        .equals(reportDate)
        .toArray();

      if (dayAttendances.length === 0) {
        alert('Nenhum atendimento encontrado para esta data.');
        return;
      }

      const total = dayAttendances.reduce((acc, curr) => acc + curr.examValue, 0);
      
      // Pega o médico do primeiro atendimento do dia para o cabeçalho
      const firstDoctor = dayAttendances[0].doctor || "NÃO INFORMADO";

      generateDailyReport({
        date: reportDate,
        totalValue: total,
        doctorName: firstDoctor,
        attendances: dayAttendances
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Houve um erro ao gerar o PDF do relatório. Verifique o console para mais detalhes.");
    }
  };

  const filteredAttendances = attendances.filter(a => 
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.susCard.includes(searchTerm)
  );

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-green-600 text-white p-2 rounded-lg font-bold text-2xl">+ AMV</div>
            <div>
              <h1 className="text-xl font-bold text-blue-900 leading-tight">Ambulatório Maria da Vitória</h1>
              <p className="text-gray-500 text-sm">Cadastro de Atendimentos e Exames</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <input 
              type="date"
              className="border border-gray-300 rounded px-3 py-1 text-sm outline-none"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
            <button 
              onClick={handleGenerateReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition shadow-md"
            >
              Relatório Diário
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            <PatientForm data={patient} onChange={setPatient} />
            <ExamSelection 
              selectedExamIds={selectedExamIds} 
              onChange={setSelectedExamIds} 
            />
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={handleRegister}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded shadow-lg transition uppercase tracking-wider text-sm"
              >
                Imprimir Ficha & Salvar
              </button>
              <button 
                onClick={() => { setPatient(INITIAL_PATIENT); setSelectedExamIds([]); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-8 rounded transition uppercase text-sm"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Search and History Table Area */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[800px]">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-bold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                Pesquisar Pacientes
              </h2>
              <input 
                type="text" 
                placeholder="Nome ou Cartão SUS..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 font-bold text-gray-600 uppercase">Nome</th>
                    <th className="px-4 py-2 font-bold text-gray-600 uppercase">Procedimento</th>
                    <th className="px-4 py-2 font-bold text-gray-600 uppercase">SUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendances.length > 0 ? (
                    filteredAttendances.map((att, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition cursor-default">
                        <td className="px-4 py-3 font-medium text-gray-800">{att.patientName}</td>
                        <td className="px-4 py-3 text-gray-600 uppercase">{att.examLabel}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono">{att.susCard}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-gray-400 italic">
                        Nenhum atendimento registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 border-t text-right">
              <button 
                onClick={() => { if(confirm('Deseja realmente sair?')) window.close(); }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded text-sm font-bold shadow transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
