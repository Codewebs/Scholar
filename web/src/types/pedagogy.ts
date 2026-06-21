export interface MatiereEntity {
    idMatiere?: number;
    idServeur?: number;
    libelleFr: string;
    libelleEn: string;
    codeMatiere: string;
}

export interface PeriodeEntity {
    idPeriode?: number;
    libellePeriodeFr: string;
    libellePeriodeEn?: string;
    libellePeriodeEs?: string;
    abrevLibelleFr: string;
    abrevLibelleEn?: string;
    abrevLibelleEs?: string;
    dateDebut: string;
    dateFin: string;
    idAnneeScolaire: number;
    ordrePeriode: number;
    sousPeriodes?: SousPeriodeEntity[];
}

export interface SousPeriodeEntity {
    idSousPeriode?: number;
    libelleSousPeriodeFr: string;
    libelleSousPeriodeEn?: string;
    libelleSousPeriodeEs?: string;
    abrevLibelleFr: string;
    abrevLibelleEn?: string;
    abrevLibelleEs?: string;
    dateDebut: string;
    dateFin: string;
    idPeriode: number;
    ordreSousPeriode: number;
}

export interface GroupeMatiereEntity {
    idGroupeMatiere: number;
    libelleFr: string;
    libelleEn?: string;
    ordre: number;
}

export interface RepartitionMatiereEntity {
    idRepartitionMatiere: number;
    coef: number;
    noteSur: number;
    ordreMatiere: number;
    idMatiere: number;
    idGroupeMatiere: number | null;
    Matiere: MatiereEntity;
}

export interface CompetenceEntity {
    idCompetence: number;
    libelle: string;
}

export interface RepartitionCompetenceEntity {
    id: number;
    idRepartitionMatiere: number;
    idCompetence: number;
    idSousPeriode: number;
    Competence: CompetenceEntity;
}
