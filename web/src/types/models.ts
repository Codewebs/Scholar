export interface School {
    idLocal?: number;
    idServeur?: number;
    idEtablissement?: number;
    nomFr: string;
    nomEn?: string;
    abreviation?: string;
    adresse?: string;
    arrete?: string;
    description?: string;
    deviseFr?: string;
    deviseEn?: string;
    email?: string;
    fax?: number;
    logo?: string;
    numBp?: number;
    sise?: string;
    siteWeb?: string;
    telephone1: number;
    telephone2?: number;
    telephone3?: number;
    ville?: string;
    pays?: string;
    codeRecrutement?: string;
    codeInscription?: string;
    idCreateur?: number;
    pinSecurite?: string;
}

export interface SchoolYear {
    idServeur?: number;
    idAnneeScolaire?: number;
    libelleAnneeScolaire: string;
    dateDebut: string;
    dateFin: string;
    cloturerAnnee: boolean;
    idEtablissement: number;
}

export interface ProgressItem {
    done: boolean;
    label: string;
    count: number;
    total: number;
}

export interface SetupProgress {
    schoolYear: ProgressItem;
    academicProfile: ProgressItem;
    globalFees: ProgressItem;
    classFees: ProgressItem;
    rooms: ProgressItem;
    periods: ProgressItem;
    subPeriods: ProgressItem;
    subjects: ProgressItem;
}
