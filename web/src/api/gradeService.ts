import api from './axios';
import { NoteUiModel, StudentNoteUiModel } from '../types/grades';

export const gradeService = {
  getNotesByMatiere: (roomId: number, repartitionId: number, sequenceId: number, yearId: number) =>
    api.get<NoteUiModel[]>('/pedagogy/notes/matiere', {
        params: { idSalle: roomId, idRepartitionMatiere: repartitionId, idSequence: sequenceId, idAnneeScolaire: yearId }
    }),

  saveNotes: (payload: any) =>
    api.post('/pedagogy/notes/save', payload),

  saveStudentNotes: (payload: any) =>
    api.post('/pedagogy/notes/student/save', payload),

  getNotesByStudent: (inscriptionId: number, sequenceId: number, yearId: number, classId: number) =>
    api.get<StudentNoteUiModel[]>('/pedagogy/notes/student', {
        params: { idInscription: inscriptionId, idSequence: sequenceId, idAnneeScolaire: yearId, idClasse: classId }
    }),

  getSalleProgress: (roomId: number, sequenceId: number, yearId: number) =>
    api.get('/pedagogy/notes/progress/salle', {
        params: { idSalle: roomId, idSequence: sequenceId, idAnneeScolaire: yearId }
    }),

  getPVData: (type: 'SEQUENCE' | 'TRIMESTRE' | 'ANNUEL', yearId: number, roomId?: number, sequenceId?: number, periodId?: number) =>
    api.get('/pedagogy/notes/pv', {
        params: { type, idAnneeScolaire: yearId, idSalle: roomId, idSequence: sequenceId, idPeriode: periodId }
    }),

  getAbsencesBySalle: (roomId: number, sequenceId: number, yearId: number) =>
    api.get('/pedagogy/notes/absences', {
        params: { idSalle: roomId, idSequence: sequenceId, idAnneeScolaire: yearId }
    }),

  saveAbsences: (payload: { absences: any[], idSequence: number, idAnneeScolaire: number }) =>
    api.post('/pedagogy/notes/absences/save', payload),

  getJustifications: () =>
    api.get<any[]>('/pedagogy/notes/justifications'),

  saveJustification: (payload: { idJustification?: number, libelle: string }) =>
    api.post('/pedagogy/notes/justifications/save', payload),

  deleteJustification: (id: number) =>
    api.delete(`/pedagogy/notes/justifications/${id}`),
};
