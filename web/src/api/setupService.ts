import api from './axios';
import { School, SchoolYear } from '../types/models';
import { MatiereEntity } from '../types/pedagogy';

export interface UserAssociation {
    school: School;
    etat: 'VALIDE' | 'EN_ATTENTE' | 'REJETE';
    roles: string[];
    idAnneeScolaire: number;
    permissionsAjoutees?: string[];
    permissionsRetirees?: string[];
}

export interface DemandeInscriptionPayload {
    idUtilisateur: number;
    idEtablissement: number;
    profilDemande: string;
    nom: string;
    prenom: string;
    telephone1: number;
    email: string | null;
    specialites: string | null;
}

export const setupService = {
    getUserAssociations: (userId: number) =>
        api.get<UserAssociation[]>(`/personnel/user-associations/${userId}`),

    searchSchools: (query: string) =>
        api.get<School[]>(`/etablissement/search`, { params: { q: query } }),

    createSchool: (data: Partial<School>) =>
        api.post<School>(`/etablissement`, data),

    updateSchool: (id: number, data: Partial<School>) =>
        api.put(`/etablissement/${id}`, data),

    envoyerDemande: (payload: DemandeInscriptionPayload) =>
        api.post(`/personnel/demande`, payload),

    getYearsBySchool: (schoolId: number) =>
        api.get<SchoolYear[]>(`/annee/etablissement/${schoolId}`),

    createYear: (data: Partial<SchoolYear>) =>
        api.post<SchoolYear>(`/annee`, data),

    getMatieres: () =>
        api.get<MatiereEntity[]>(`/pedagogy/matieres`),
};
