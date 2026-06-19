import api from './axios';
import { EleveUiModel } from '../types/student';

export interface StudentRegistrationPayload {
    matricule?: string;
    nom: string;
    prenom?: string;
    dateNaissance: string;
    lieuNaissance: string;
    sexe: string;
    nomPere?: string;
    telephonePere?: number;
    nomMere?: string;
    telephoneMere?: number;
    nomTuteur?: string;
    telephoneTuteur?: number;
    idAnneeScolaire: number;
    idSalle: number;
    ancienEtablissement?: string;
    quartier?: string;
    nouveau: boolean;
}

export const studentService = {
  getAllStudents: (yearId: number) =>
    api.get<EleveUiModel[]>(`/students/all/${yearId}`),

  getStudentsByRoom: (yearId: number, roomId: number) =>
    api.get<EleveUiModel[]>(`/students/room/${yearId}/${roomId}`),

  getStudent: (idEleve: number) =>
    api.get<EleveUiModel>(`/students/${idEleve}`),

  registerAndEnroll: (payload: StudentRegistrationPayload) =>
    api.post('/students/register-enroll', payload),

  updateStudent: (idEleve: number, payload: StudentRegistrationPayload) =>
    api.put(`/students/${idEleve}`, payload),

  deleteEnrollment: (idEleve: number, yearId: number) =>
    api.delete(`/students/enrollment/${idEleve}/${yearId}`),

  getRegistrationReceiptData: (idEleve: number, yearId: number) =>
    api.get(`/students/receipt/${idEleve}/${yearId}`),

  getRooms: (yearId: number) =>
    api.get<any[]>(`/salles/annee/${yearId}`),

  globalSearch: (q: string, yearId: number) =>
    api.get<any[]>(`/students/global/search`, { params: { q, idAnneeScolaire: yearId } }),

  getStudentsBySalle: (yearId: number, idSalle: number) =>
    api.get<any[]>(`/students/room/${yearId}/${idSalle}`),
};
