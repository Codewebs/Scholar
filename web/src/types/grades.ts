export interface NoteUiModel {
    idNote?: number;
    note: number | null;
    cote?: string | null;
    appreciation?: string | null;
    nonClasse?: boolean;
    idJustification?: number | null;
    idInscription: number;
    idRepartitionMatiere: number;
    idSequence: number;
    idAnneeScolaire: number;
    idCompetence: number; // Désormais obligatoire
    nomComplet?: string;
    matricule?: string;
}

export interface StudentNoteUiModel {
    idNote?: number;
    note: number | null;
    cote?: string | null;
    matiereLabel: string;
    matiereAbrev: string;
    coef: number;
    idRepartitionMatiere: number;
    idCompetence?: number; // Optionnel ici car on peut avoir plusieurs lignes
    nonClasse?: boolean;
    idJustification?: number | null;
}
