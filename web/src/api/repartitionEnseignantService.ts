import api from './axios';

export const repartitionEnseignantService = {
  getTeachersPool: (idAnneeScolaire: number) =>
    api.get(`/pedagogy/teachers-repartition/pool`, { params: { idAnneeScolaire } }),

  getRoomAssignments: (idSalle: number, idAnneeScolaire: number) =>
    api.get(`/pedagogy/teachers-repartition/room`, { params: { idSalle, idAnneeScolaire } }),

  assignTeacher: (data: {
    idInscriptionPersonnel: number;
    idSalle: number;
    idRepartitionMatiere?: number;
    isPrincipal?: boolean;
    idAnneeScolaire: number;
  }) => api.post(`/pedagogy/teachers-repartition/assign`, data),

  removeAssignment: (id: number) =>
    api.delete(`/pedagogy/teachers-repartition/${id}`),

  getPrintData: (idSalle: number, idAnneeScolaire: number) =>
    api.get(`/pedagogy/teachers-repartition/print`, { params: { idSalle, idAnneeScolaire } })
};
