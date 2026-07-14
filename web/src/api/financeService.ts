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

  getRegistrationReceiptData: (idEleve: number, idAnneeScolaire: number, docType?: string) =>
    api.get(`/finance/receipt/registration/${idEleve}/${idAnneeScolaire}`, { params: { docType } }),

  getRegistrationReceiptSimple: (idEleve: number, idAnneeScolaire: number) =>
    api.get(`/finance/receipt/registration-simple/${idEleve}/${idAnneeScolaire}`),

  annulerPaiement: (idPaiementFraisGlobal: number, motif: string) =>
    api.post(`/finance/paiements/annuler/${idPaiementFraisGlobal}`, { motif }),

  getBilanJournalier: (idAnneeScolaire: number, date?: string) =>
    api.get(`/finance/reports/bilan/journalier/${idAnneeScolaire}`, { params: { date } }),

  getBilanMensuel: (idAnneeScolaire: number) =>
    api.get(`/finance/reports/bilan/mensuel/${idAnneeScolaire}`),

  getBilanAnnuel: (idAnneeScolaire: number) =>
    api.get(`/finance/reports/bilan/annuel/${idAnneeScolaire}`),

  getPerformanceComparison: (idAnneeScolaire: number, filters?: { idCycle?: number; idEnseignement?: number }) =>
    api.get(`/finance/reports/comparaison/performance/${idAnneeScolaire}`, { params: filters }),

  getInsolvablesList: (idAnneeScolaire: number, idTranche: number) =>
    api.get(`/finance/reports/listes/insolvables/${idAnneeScolaire}/${idTranche}`),

  getCockpitAggregates: (idAnneeScolaire: number, filters?: any) =>
    api.get(`/finance/reports/cockpit/aggregates/${idAnneeScolaire}`, { params: filters }),

  // Transport
  getQuartiers: () => api.get('/finance/transport/quartiers'),
  createQuartier: (data: any) => api.post('/finance/transport/quartiers', data),
  getTarifsTransport: (idAnneeScolaire: number) => api.get(`/finance/transport/tarifs/${idAnneeScolaire}`),
  saveTarifTransport: (data: any) => api.post('/finance/transport/tarifs', data),
  subscribeStudentToTransport: (data: any) => api.post('/finance/transport/subscribe', data),
  getStudentTransportSubscription: (idEleve: number, idAnneeScolaire: number) => api.get(`/finance/transport/subscription/${idEleve}/${idAnneeScolaire}`),
  payerTransport: (payload: any) => api.post('/finance/paiements/transport', payload),

  searchStudents: (q: string, idAnneeScolaire: number) =>
    api.get<any[]>(`/students/search/${idAnneeScolaire}`, { params: { q } }),

  quickSetup: (payload: { idAnneeScolaire: number; classes: { idClasse: number; nomSalle: string }[] }) =>
    api.post('/finance/setup/quick', payload),

  importFromPreviousYear: (payload: { idAnneeScolaire: number; idAnneePrecedente: number }) =>
    api.post('/finance/setup/import-previous', payload),
};
