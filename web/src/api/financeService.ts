import api from './axios';

export interface FraisExigible {
    idFraisExigible?: number;
    fraisFr: string;
    fraisEn: string;
    description?: string;
}

export interface FraisActivitePeriscolaire {
    idFraisActivitePeriscolaire?: number;
    libelleFr: string;
    libelleEn?: string;
}

export const financeService = {
  // Frais Exigibles
  getExigibles: () =>
    api.get<FraisExigible[]>('/finance/exigibles/library'),

  createExigible: (data: Partial<FraisExigible>) =>
    api.post<FraisExigible>('/finance/exigibles/library', data),

  updateExigible: (id: number, data: Partial<FraisExigible>) =>
    api.put<FraisExigible>(`/finance/exigibles/library/${id}`, data),

  deleteExigible: (id: number) =>
    api.delete(`/finance/exigibles/library/${id}`),

  // Frais Periscolaires
  getPeriscolaires: () =>
    api.get<FraisActivitePeriscolaire[]>('/finance/periscolaires/library'),

  createPeriscolaire: (data: Partial<FraisActivitePeriscolaire>) =>
    api.post<FraisActivitePeriscolaire>('/finance/periscolaires/library', data),

  updatePeriscolaire: (id: number, data: Partial<FraisActivitePeriscolaire>) =>
    api.put<FraisActivitePeriscolaire>(`/finance/periscolaires/library/${id}`, data),

  deletePeriscolaire: (id: number) =>
    api.delete(`/finance/periscolaires/library/${id}`),

  // Collection
  getStudentPaymentDetails: (idEleve: number, idAnneeScolaire: number) =>
    api.get<any>(`/finance/paiements/details/${idEleve}/${idAnneeScolaire}`),

  getStudentPeriscolaireDetails: (idEleve: number, idAnneeScolaire: number) =>
    api.get<any>(`/finance/paiements/periscolaires/details/${idEleve}/${idAnneeScolaire}`),

  getStudentTransactions: (idEleve: number, idAnneeScolaire: number) =>
    api.get<any[]>(`/finance/paiements/transactions/${idEleve}/${idAnneeScolaire}`),

  payerFraisExigibles: (payload: any) =>
    api.post('/finance/paiements/exigibles', payload),

  payerFraisPeriscolaires: (payload: any) =>
    api.post('/finance/paiements/periscolaires', payload),

  getRegistrationReceiptData: (idEleve: number, idAnneeScolaire: number) =>
    api.get(`/finance/receipt/registration/${idEleve}/${idAnneeScolaire}`),

  getRegistrationReceiptSimple: (idEleve: number, idAnneeScolaire: number) =>
    api.get(`/finance/receipt/registration-simple/${idEleve}/${idAnneeScolaire}`),

  annulerPaiement: (idPaiementFraisGlobal: number) =>
    api.post(`/finance/paiements/annuler/${idPaiementFraisGlobal}`),

  getBilanJournalier: (idAnneeScolaire: number, date?: string) =>
    api.get(`/finance/reports/bilan/journalier/${idAnneeScolaire}`, { params: { date } }),
};
