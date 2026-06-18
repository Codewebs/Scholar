import api from './axios';
import { School, SchoolYear, SetupProgress } from '../types/models';

export const dashboardService = {
  getSchools: (userId: number) =>
    api.get<School[]>(`/etablissement/user/${userId}`),

  getYears: (schoolId: number) =>
    api.get<SchoolYear[]>(`/annee/etablissement/${schoolId}`),

  getSetupProgress: (schoolId: number, yearId?: number) =>
    api.get<SetupProgress>(`/system/setup-progress`, { params: { schoolId, yearId } }),

  // CRUD for years (matching HomeFragment logic)
  createYear: (data: Partial<SchoolYear>) =>
    api.post<SchoolYear>('/annee', data),

  updateYear: (id: number, data: Partial<SchoolYear>) =>
    api.put<SchoolYear>(`/annee/${id}`, data),

  deleteYear: (id: number) =>
    api.delete(`/annee/${id}`),
};
