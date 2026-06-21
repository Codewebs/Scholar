import api from './axios';
import { School } from '../types/models';

export const schoolService = {
  getSchool: (id: number) =>
    api.get<School>(`/etablissement/${id}`),

  getUserSchools: (userId: number) =>
    api.get<School[]>(`/etablissement/user/${userId}`),

  updateSchool: (id: number, data: Partial<School>) =>
    api.put(`/etablissement/${id}`, data),

  uploadLogo: (schoolId: number, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post(`/etablissement/${schoolId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
