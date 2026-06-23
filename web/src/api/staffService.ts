import api from './axios';

export interface PersonnelEntity {
    idInscriptionPersonnel: number;
    idUtilisateur: number;
    idEtablissement: number;
    idAnneeScolaire: number;
    role: string;
    bloque: boolean;
    etat?: string; // Derived or extra field
    permissionsAjoutees: string[];
    permissionsRetirees: string[];
    utilisateur?: {
        nom: string;
        email: string;
        telephone1?: number;
        telephone?: number;
        diplomes?: string;
    };
    nom?: string; // From InscriptionPersonnel
    prenom?: string;
    email?: string;
    telephone1?: number;
}

export interface DemandeInscription {
    idDemande: number;
    idUtilisateur: number;
    idEtablissement: number;
    profilDemande: string;
    nom: string;
    prenom: string;
    email: string;
    telephone1: number;
    specialites: string | null;
    dateDemande: string;
}

export const staffService = {
    getStaffActif: (schoolId: number, yearId: number) =>
        api.get<PersonnelEntity[]>(`/personnel/actif/${schoolId}/${yearId}`),

    getDemandesEnAttente: (schoolId: number) =>
        api.get<DemandeInscription[]>(`/personnel/demandes/etablissement/${schoolId}`),

    validerDemande: (payload: {
        idDemande: number,
        idAnneeScolaire: number,
        matricule?: string,
        role?: string,
        dateNaissance?: string,
        lieuNaissance?: string,
        sexe?: string,
        diplomes?: string,
        permissionsAjoutees?: string[],
        permissionsRetirees?: string[]
    }) =>
        api.post(`/personnel/valider-demande`, payload),

    rejeterDemande: (idDemande: number) =>
        api.post(`/personnel/rejeter-demande`, { idDemande }),

    setBloque: (idUtilisateur: number, idEtablissement: number, bloque: boolean) =>
        api.post(`/personnel/bloquer`, { idUtilisateur, idEtablissement, bloque }),

    updatePermissions: (idInscriptionPersonnel: number, permissionsAjoutees: string[], permissionsRetirees: string[]) =>
        api.post(`/personnel/update-permissions`, { idInscriptionPersonnel, permissionsAjoutees, permissionsRetirees }),

    updateStaffProfile: (idUtilisateur: number, data: { nom: string, prenom: string, diplomes: string, email: string, telephone: string }) =>
        api.put(`/personnel/profile/${idUtilisateur}`, data)
};
