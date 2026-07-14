import api from './axios';
import { MatiereEntity } from '../types/pedagogy';

export interface MatiereKPIs {
    totalMatieres: number;
    tauxRepartition: number;
}

export interface ClassMatiereStat {
    idClasse: number;
    nomClasse: string;
    nbMatieres: number;
    isComplete: boolean;
}

export const matiereService = {
  getGlobalLibrary: (idEtablissement?: number) =>
    api.get<MatiereEntity[]>('/pedagogy/matieres', { params: { idEtablissement } }),

  createMatiere: (data: Partial<MatiereEntity>) =>
    api.post<MatiereEntity>('/pedagogy/matieres', data),

  updateMatiere: (id: number, data: Partial<MatiereEntity>) =>
    api.put(`/pedagogy/matieres/${id}`, data),

  deleteMatiere: (id: number) =>
    api.delete(`/pedagogy/matieres/${id}`),

  getKPIs: (yearId: number) =>
    api.get<MatiereKPIs>(`/pedagogy/matieres/stats/kpi/${yearId}`),

  getRepartitionStats: (yearId: number) =>
    api.get<ClassMatiereStat[]>(`/pedagogy/matieres/stats/repartition-classes/${yearId}`),

  getRepartition: (yearId: number, classId?: number, salleId?: number) =>
    api.get<any[]>(`/pedagogy/matieres/repartition/${yearId}`, { params: { idClasse: classId, idSalle: salleId } }),

  // Groups
  getGroups: (idEtablissement?: number) =>
    api.get<any[]>('/pedagogy/matieres/groups', { params: { idEtablissement } }),

  createGroup: (data: any) =>
    api.post('/pedagogy/matieres/groups', data),

  cloneTemplateGroups: (idEtablissement?: number) =>
    api.post('/pedagogy/matieres/groups/clone-templates', { idEtablissement }),

  updateGroup: (id: number, data: any) =>
    api.put(`/pedagogy/matieres/groups/${id}`, data),

  deleteGroup: (id: number) =>
    api.delete(`/pedagogy/matieres/groups/${id}`),

  // Advanced Distribution
  cloneProgram: (payload: any) =>
    api.post('/pedagogy/matieres/repartition/clone', payload),

  transferSubject: (payload: any) =>
    api.post('/pedagogy/matieres/repartition/transfer-subject', payload),

  transferGroup: (payload: any) =>
    api.post('/pedagogy/matieres/repartition/transfer-group', payload),

  bulkAssign: (payload: any) =>
    api.post('/pedagogy/matieres/repartition/bulk-assign', payload),

  // Competencies (APC)
  getRepartitionCompetences: (params: { repartitionMatiereId?: number; sequenceId?: number; yearId?: number; classId?: number; idEtablissement?: number }) =>
      api.get('/pedagogy/matieres/repartition/competences', {
          params: {
              idRepartitionMatiere: params.repartitionMatiereId,
              idSousPeriode: params.sequenceId,
              idAnneeScolaire: params.yearId,
              idClasse: params.classId,
              idEtablissement: params.idEtablissement
          }
      }),

  saveRepartitionCompetence: (data: any) =>
    api.post('/pedagogy/matieres/repartition/competences', data),

  deleteRepartitionCompetence: (id: number) =>
    api.delete(`/pedagogy/matieres/repartition/competences/${id}`),

  getGlobalCompetencies: (idEtablissement?: number) =>
    api.get<any[]>('/pedagogy/competences', { params: { idEtablissement } }), // Need to ensure this exists in backend

  importFromLibrary: (idEnseignement: number, idCountry: number) =>
    api.post('/pedagogy/matieres/import-library', { idEnseignement, idCountry }),
};
