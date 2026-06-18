export interface FeePaymentDetail {
    idTarif: number;
    libelle: string;
    montantDu: number;
    montantPaye: number;
    reste: number;
    isComplet: boolean;
}

export interface StudentPaymentDetails {
    nomComplet: string;
    classeLabel: string;
    totalDejaVerse: number;
    totalTotalDu: number;
    resteGlobal: number;
    frais: FeePaymentDetail[];
}

export interface PaiementPayload {
    idEleve: number;
    idAnneeScolaire: number;
    idClasse: number;
    montantVerse: number;
    modePaiement: string;
    reference?: string;
}

export interface RecouvrementStatsResponse {
    nbEleves: number;
    stats: FraisStatItem[];
}

export interface FraisStatItem {
    idTarif: number;
    libelle: string;
    montantUnitaire: number;
    attendu: number;
    encaisse: number;
    pourcentage: number;
}
