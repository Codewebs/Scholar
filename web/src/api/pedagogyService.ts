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

  // Reports
  getReportData: (reportId: string, params: { idClasse: number, idAnneeScolaire: number, [key: string]: any }) => {
    let endpoint = '';
    switch (reportId) {
      case 'alpha_global': endpoint = '/pedagogy/reports/alphabetical'; break;
      case 'attendance_monthly': endpoint = '/pedagogy/reports/attendance'; break;
      case 'gender_split': endpoint = '/pedagogy/reports/gender-split'; break;
      case 'trombinoscope': endpoint = '/pedagogy/reports/trombinoscope'; break;
      case 'insolvent_fees': endpoint = '/pedagogy/reports/insolvent-fees'; break;
      case 'insolvent_perischool': endpoint = '/pedagogy/reports/insolvent-perischool'; break;
      case 'global_financial': endpoint = '/pedagogy/reports/global-finance'; break;
      case 'daily_payments': endpoint = '/pedagogy/reports/daily-payments'; break;
      case 'scholarship': endpoint = '/pedagogy/reports/scholarship'; break;
      case 'fees_bilan': endpoint = '/pedagogy/reports/fees-bilan'; break;
      default: endpoint = '/pedagogy/reports/alphabetical';
    }
    return api.get<any[]>(endpoint, { params });
  }
};
