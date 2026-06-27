export interface EleveUiModel {
    idEleve: number;
    idInscription: number;
    matricule: string;
    nom?: string;
    prenom?: string;
    nomComplet: string;
    idClasse: number;
    classeLabel: string;
    idSalle: number;
    salleLabel?: string;
    sexe: string;
    statutInscription: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    quartier?: string;
    dateInscription?: string;
    isSolded: boolean;
    hasAnyPayment: boolean;
    hasGrades: boolean;
    nomPere?: string;
    telephonePere?: number;
    nomMere?: string;
    telephoneMere?: number;
    nomTuteur?: string;
    telephoneTuteur?: number;
    ancienEtablissement?: string;
}
