import api from './axios';
import { PeriodeEntity, SousPeriodeEntity } from '../types/pedagogy';

export interface EducationProfile {
    nomPays: string;
    profils: PredefinedProfil[];
}

export interface PredefinedProfil {
    idEnseignement: number;
    nomProfil: string;
    enseignementLibelles: { [key: string]: string };
}

export interface EnseignementResponse {
    idEnseignement: number;
    enseignementFr: string;
    enseignementEn?: string;
    idCountry?: number;
    cycles?: any[];
}

export const pedagogyService = {
  // Academic Structure
  getEducationProfiles: () =>
    api.get<EducationProfile[]>('/academic-structure/predefined-profiles'),

  getStructure: (yearId: number) =>
    api.get<EnseignementResponse[]>(`/academic-structure/annee/${yearId}`),

  saveProfiles: (yearId: number, country: string, selectedEnseignements: PredefinedProfil[]) =>
    api.post('/academic-structure', {
        idAnneeScolaire: yearId,
        nomPays: country,
        selectedEnseignements: selectedEnseignements.map(p => p.idEnseignement)
    }),

  getClassSequences: (yearId: number, classId: number) =>
    api.get<any[]>(`/pedagogy/periodes/repartition/${yearId}`, { params: { idClasse: classId } }),

  // Periods & Sub-periods
  getPeriodes: (yearId: number) =>
    api.get<PeriodeEntity[]>(`/pedagogy/periodes/annee/${yearId}`),

  savePeriode: (data: Partial<PeriodeEntity>) => {
    if (data.idPeriode) return api.put(`/pedagogy/periodes/${data.idPeriode}`, data);
    return api.post('/pedagogy/periodes', data);
  },

  deletePeriode: (id: number) =>
    api.delete(`/pedagogy/periodes/${id}`),

  saveSousPeriode: (data: Partial<SousPeriodeEntity>) => {
    if (data.idSousPeriode) return api.put(`/pedagogy/periodes/sous-periodes/${data.idSousPeriode}`, data);
    return api.post('/pedagogy/periodes/sous-periodes', data);
  },

  deleteSousPeriode: (id: number) =>
    api.delete(`/pedagogy/periodes/sous-periodes/${id}`),

  // Sequence Distribution (Repartition)
  getSequenceRepartition: (yearId: number, classId?: number) =>
    api.get<any[]>(`/pedagogy/periodes/repartition/${yearId}`, { params: { idClasse: classId } }),

  bulkAssignSequences: (payload: { idAnneeScolaire: number, classIds: number[], sequenceIds: number[] }) =>
    api.post('/pedagogy/periodes/repartition/bulk-assign', payload),

  // Classes
  createClasse: (data: any) =>
    api.post('/academic-structure/classes', data),

  updateClasse: (id: number, data: any) =>
    api.put(`/academic-structure/classes/${id}`, data),

  deleteClasse: (id: number) =>
    api.delete(`/academic-structure/classes/${id}`),
};
