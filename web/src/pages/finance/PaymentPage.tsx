import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { financeService } from '../../api/financeService';
import { studentService } from '../../api/studentService';
import { StudentPaymentDetails, PaiementPayload } from '../../types/finance';
import { EleveUiModel } from '../../types/student';
import AuthButton from '../../components/ui/AuthButton';
import AuthInput from '../../components/ui/AuthInput';
import PaymentReceipt from '../../components/finance/PaymentReceipt';
import {
  ArrowLeft,
  Wallet,
  History,
  Printer,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Receipt,
  Search,
  ChevronRight,
  MoreVertical,
  Settings,
  Plus,
  CircleDollarSign,
  Pending,
  X,
  CreditCard as CardIcon,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const yearId = Number(localStorage.getItem('year_id') || 0);
  const transactionRef = useRef<HTMLDivElement>(null);

  // Lists & Filtering
  const [allStudents, setAllStudents] = useState<EleveUiModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tout afficher');

  // Selected Data
  const [selectedStudent, setSelectedStudent] = useState<EleveUiModel | null>(null);
  const [details, setDetails] = useState<StudentPaymentDetails | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // States
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [isPeriscolaire, setIsPeriscolaire] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [success, setSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);

  useEffect(() => {
    if (yearId) {
      loadStudents();
    }
  }, [yearId]);

  // Handle Query Params
  useEffect(() => {
    const idEleve = searchParams.get('idEleve');
    const highlight = searchParams.get('highlight');
    if (idEleve && allStudents.length > 0) {
        const student = allStudents.find(s => s.idEleve === Number(idEleve));
        if (student) {
            setSelectedStudent(student);
            if (highlight === 'true') {
                setHighlightActive(true);
                setTimeout(() => setHighlightActive(false), 2000);
            }
        }
    }
  }, [searchParams, allStudents]);

  const loadStudents = async () => {
    setLoadingList(true);
    try {
      const res = await studentService.getAllStudents(yearId);
      setAllStudents(res.data);
    } catch (error) {
      console.error("[PaymentPage] ❌ Erreur chargement élèves:", error);
    } finally {
      setLoadingList(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = allStudents;
    if (searchQuery) {
        result = result.filter(s =>
            s.nomComplet.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.matricule.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    if (statusFilter !== 'Tout afficher') {
        result = result.filter(s => {
            if (statusFilter === 'Soldé') return s.isSolded;
            if (statusFilter === 'Incomplet') return !s.isSolded && s.hasAnyPayment;
            if (statusFilter === 'Aucun versement') return !s.hasAnyPayment;
            return true;
        });
    }
    return result;
  }, [allStudents, searchQuery, statusFilter]);

  useEffect(() => {
    if (selectedStudent && yearId) {
      loadDetails();
      loadTransactions();
    }
  }, [selectedStudent, isPeriscolaire, yearId]);

  const loadDetails = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const res = isPeriscolaire
        ? await financeService.getStudentPeriscolaireDetails(selectedStudent.idEleve, yearId)
        : await financeService.getStudentPaymentDetails(selectedStudent.idEleve, yearId);
      setDetails(res.data);
    } catch (error) {
      console.error("[PaymentPage] ❌ Erreur chargement détails:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!selectedStudent) return;
    try {
      const res = await financeService.getStudentTransactions(selectedStudent.idEleve, yearId);
      setTransactions(res.data);
    } catch (error) {
      console.error("[PaymentPage] ❌ Erreur chargement transactions:", error);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !amount || Number(amount) <= 0) return;

    setLoading(true);
    const payload: PaiementPayload = {
      idEleve: selectedStudent.idEleve,
      idAnneeScolaire: yearId,
      idClasse: selectedStudent.idClasse,
      montantVerse: Number(amount),
      modePaiement: paymentMode
    };

    try {
      await (isPeriscolaire
        ? financeService.payerFraisPeriscolaires(payload)
        : financeService.payerFraisExigibles(payload));

      setSuccess(true);
      setAmount('');
      loadDetails();
      loadTransactions();
      loadStudents();
    } catch (error) {
      console.error("[PaymentPage] ❌ Échec du paiement:", error);
      alert("Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = async () => {
      if (!selectedStudent) return;
      setLoading(true);
      try {
          const recRes = await financeService.getRegistrationReceiptData(selectedStudent.idEleve, yearId);
          setReceiptData(recRes.data);
          setShowReceipt(true);
      } catch (err) {
          console.error("[PaymentPage] ❌ Erreur ré-impression:", err);
          alert("Erreur lors de la récupération du reçu");
      } finally {
          setLoading(false);
      }
  };

  const handleCancelPayment = async (id: number) => {
      if (!window.confirm("Voulez-vous vraiment annuler ce paiement ?")) return;
      try {
          await financeService.annulerPaiement(id);
          alert("Paiement annulé");
          loadDetails();
          loadTransactions();
          loadStudents();
      } catch (error: any) {
          console.error("[PaymentPage] ❌ Erreur annulation:", error);
          alert(error.response?.data?.error || "Erreur lors de l'annulation");
      }
  };

  const canCancel = user?.permissions?.includes('CANCEL_PAYMENT');
  const validTransactions = transactions.filter(tx => !tx.annule);

  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-500">
      {/* Top Navigation / Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-6">
          <button onClick={() => window.history.back()} className="p-3 bg-white hover:bg-gray-50 rounded-full transition-all shadow-sm border border-gray-100">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Encaissements</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Gestion des frais scolaires & périscolaires</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                <input
                    type="text"
                    placeholder="Nom ou Matricule..."
                    className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl focus:border-black outline-none transition-all font-bold text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 pb-10">
        {/* Left Column: Student List */}
        <div className="w-full lg:w-96 bg-white rounded-[32px] border border-gray-100 flex flex-col shadow-sm overflow-hidden lg:h-[calc(100vh-280px)]">
            <div className="p-6 border-b border-gray-50 flex flex-col space-y-4 bg-gray-50/30">
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                    {['Tout afficher', 'Soldé', 'Incomplet', 'Aucun versement'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={clsx(
                                "whitespace-nowrap px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                statusFilter === status ? "bg-black text-white shadow-lg" : "bg-white text-gray-400 border border-gray-100 hover:border-gray-300"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {loadingList ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
                        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Chargement...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <Search size={40} className="text-gray-100 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Aucun élève trouvé</p>
                    </div>
                ) : (
                    filteredStudents.map(student => {
                        const isSelected = selectedStudent?.idEleve === student.idEleve;
                        return (
                            <div
                                key={student.idEleve}
                                onClick={() => setSelectedStudent(student)}
                                className={clsx(
                                    "p-5 rounded-[24px] cursor-pointer transition-all border-2 flex items-center justify-between group relative overflow-hidden",
                                    isSelected ? "border-black bg-black text-white shadow-xl" : "border-transparent bg-white hover:bg-gray-50"
                                )}
                            >
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all",
                                        isSelected ? "bg-accent text-white" : "bg-gray-50 text-secondary group-hover:bg-white"
                                    )}>
                                        {student.nomComplet.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-xs uppercase tracking-tight">{student.nomComplet}</p>
                                        <p className={clsx("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-gray-400" : "text-[#9E9E9E]")}>
                                            {student.matricule} • {student.classeLabel}
                                        </p>
                                    </div>
                                </div>
                                {isSelected ? (
                                    <ChevronRight size={18} className="text-accent relative z-10" />
                                ) : (
                                    <div className={clsx(
                                        "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest relative z-10",
                                        student.isSolded ? "bg-green-100 text-green-700" : student.hasAnyPayment ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                                    )}>
                                        {student.isSolded ? "Soldé" : student.hasAnyPayment ? "Avance" : "Aucun"}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Right Column: Selected Student View */}
        <div className="flex-1 bg-white rounded-[32px] border border-gray-100 shadow-sm relative flex flex-col min-h-[500px]">
            {!selectedStudent ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                    <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-8">
                        <Wallet size={48} className="text-gray-200" />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-300">Sélectionnez un élève</h2>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-200 mt-4 max-w-xs">
                        Cliquez sur un élève dans la liste de gauche pour consulter son état financier.
                    </p>
                </div>
            ) : (
                <>
                    <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">
                                {selectedStudent.nomComplet.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedStudent.nomComplet}</h3>
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{selectedStudent.matricule}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">{selectedStudent.classeLabel}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-gray-100">
                            <button
                                onClick={() => setIsPeriscolaire(false)}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    !isPeriscolaire ? "bg-black text-white shadow-lg" : "text-secondary hover:bg-gray-50"
                                )}
                            >Exigibles</button>
                            <button
                                onClick={() => setIsPeriscolaire(true)}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    isPeriscolaire ? "bg-black text-white shadow-lg" : "text-secondary hover:bg-gray-50"
                                )}
                            >Périscolaires</button>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-8 bg-black rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-150"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Déjà Versé</p>
                                <p className="text-4xl font-black tracking-tighter">
                                    {details?.totalDejaVerse.toLocaleString()} <span className="text-xs text-accent">FCFA</span>
                                </p>
                            </div>
                            <div className="p-8 bg-gray-50 border border-gray-100 rounded-[32px] relative overflow-hidden group">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Reste Global</p>
                                <p className={clsx(
                                    "text-4xl font-black tracking-tighter",
                                    details?.resteGlobal === 0 ? "text-green-500" : "text-black"
                                )}>
                                    {details?.resteGlobal.toLocaleString()} <span className="text-xs">FCFA</span>
                                </p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-2">Détail des frais</h4>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loading ? (
                                        Array.from({length: 4}).map((_, i) => (
                                            <div key={i} className="h-20 bg-gray-50 rounded-[24px] animate-pulse"></div>
                                        ))
                                    ) : details?.frais.map((frais) => (
                                        <div key={frais.idTarif} className="p-6 bg-white border border-gray-100 rounded-[28px] flex items-center justify-between group hover:border-black transition-all">
                                            <div className="flex items-center space-x-5">
                                                <div className={clsx(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                    frais.isComplet ? "bg-green-50 text-green-500" : "bg-orange-50 text-orange-500"
                                                )}>
                                                    {frais.isComplet ? <CheckCircle2 size={20} /> : <CircleDollarSign size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs uppercase tracking-tight">{frais.libelle}</p>
                                                    <p className="text-[8px] font-bold text-secondary uppercase tracking-widest">
                                                        Attendu: {frais.montantDu.toLocaleString()} FCFA
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-xs">{frais.montantPaye.toLocaleString()} FCFA</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-green-500">Payé</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-2 flex items-center gap-2">
                                    <History size={14} /> Transactions
                                </h4>
                                <div
                                    ref={transactionRef}
                                    className={clsx(
                                        "space-y-2 p-4 rounded-[28px] transition-all duration-500 max-h-[400px] overflow-y-auto custom-scrollbar",
                                        highlightActive ? "bg-accent/5 border-2 border-accent/20" : "bg-gray-50/50 border-2 border-transparent"
                                    )}
                                >
                                    {transactions.map((tx, index) => {
                                        const isMostRecentValid = !tx.annule && tx.idPaiementFraisGlobal === validTransactions[0]?.idPaiementFraisGlobal;

                                        return (
                                            <div key={tx.idPaiementFraisGlobal} className={clsx(
                                                "p-4 rounded-[20px] border flex items-center justify-between transition-all",
                                                tx.annule ? "bg-red-50/30 border-red-100 opacity-60" : "bg-white border-gray-100 hover:border-gray-200"
                                            )}>
                                                <div className="flex items-center space-x-4">
                                                    <div className={clsx(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                                        tx.annule ? "bg-red-100 text-red-500" : "bg-gray-50 text-secondary"
                                                    )}>
                                                        {tx.annule ? <X size={20} /> : <Receipt size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[11px] uppercase tracking-tight">
                                                            {tx.modePaiement} - {tx.montantTotal.toLocaleString()} FCFA
                                                            {tx.annule && <span className="ml-2 text-red-500 text-[8px] tracking-widest">[ANNULÉ]</span>}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {new Date(tx.createdAt).toLocaleString()} • Réf: #FS-{tx.idPaiementFraisGlobal}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!tx.annule && canCancel && (
                                                    <button
                                                        onClick={() => handleCancelPayment(tx.idPaiementFraisGlobal)}
                                                        className={clsx(
                                                            "p-2 transition-colors",
                                                            isMostRecentValid ? "text-gray-300 hover:text-red-500" : "text-gray-100 cursor-not-allowed"
                                                        )}
                                                        title={isMostRecentValid ? "Annuler ce paiement" : "Seule la transaction la plus récente peut être annulée"}
                                                        disabled={!isMostRecentValid}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Float */}
                    <div className="absolute bottom-8 right-8 flex flex-col gap-4">
                        <button
                            onClick={() => { setSuccess(false); setShowPaymentModal(true); }}
                            disabled={details?.resteGlobal === 0}
                            className={clsx(
                                "w-16 h-16 rounded-[24px] shadow-2xl transition-all flex items-center justify-center group",
                                details?.resteGlobal === 0 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-accent text-white shadow-accent/30 hover:scale-110 active:scale-95"
                            )}
                            title={details?.resteGlobal === 0 ? "Déjà soldé" : "Encaisser"}
                        >
                            <Plus size={28} className={clsx(!details?.resteGlobal === 0 && "group-hover:rotate-90 transition-transform duration-500")} />
                        </button>
                        <button
                            onClick={handleReprint}
                            className="w-16 h-16 bg-white text-black border border-gray-100 rounded-[24px] shadow-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center group"
                            title="Ré-imprimer"
                        >
                            <Printer size={24} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[56px] p-12 max-w-lg w-full shadow-2xl relative overflow-hidden">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"
                  ><X size={24}/></button>

                  <div className="mb-10">
                      <div className="flex items-center space-x-3 text-accent mb-2">
                          <CardIcon size={20} />
                          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Nouveau Versement</span>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter text-black">
                        {isPeriscolaire ? 'Périscolaire' : 'Scolarité'}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary mt-1">
                          {selectedStudent.nomComplet}
                      </p>
                  </div>

                  {success ? (
                      <div className="text-center space-y-8 py-4 animate-in zoom-in-95">
                          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[40px] flex items-center justify-center mx-auto shadow-inner">
                              <CheckCircle2 size={48} />
                          </div>
                          <div>
                              <h4 className="text-2xl font-black uppercase tracking-tight">Validé !</h4>
                              <p className="text-[11px] font-bold text-secondary uppercase tracking-widest mt-2">Enregistrement terminé avec succès</p>
                          </div>
                          <div className="flex flex-col gap-3">
                              <AuthButton onClick={() => setShowReceipt(true)}>
                                  <Printer size={20} className="mr-3" /> Imprimer le reçu
                              </AuthButton>
                              <button
                                onClick={() => { setSuccess(false); setShowPaymentModal(false); }}
                                className="py-5 font-black uppercase text-[10px] tracking-widest text-secondary hover:text-black transition-all"
                              >Fermer le guichet</button>
                          </div>
                      </div>
                  ) : (
                      <form onSubmit={handlePayment} className="space-y-8">
                          <div className="space-y-6">
                              <AuthInput
                                  label="Montant du versement (FCFA)"
                                  type="number"
                                  placeholder="Entrez le montant"
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  required
                                  autoFocus
                              />

                              <div className="space-y-3">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-2">Mode de Paiement</label>
                                  <div className="grid grid-cols-2 gap-4">
                                      {['CASH', 'BANQUE'].map(mode => (
                                          <button
                                              key={mode}
                                              type="button"
                                              onClick={() => setPaymentMode(mode)}
                                              className={clsx(
                                                  "p-5 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2",
                                                  paymentMode === mode ? "border-black bg-black text-white shadow-xl" : "border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200"
                                              )}
                                          >
                                              {mode === 'CASH' ? <Banknote size={24} /> : <CreditCard size={24} />}
                                              <span className="text-[10px] font-black uppercase tracking-widest">{mode === 'CASH' ? 'Espèces' : 'Virement'}</span>
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          <div className="pt-4">
                              <AuthButton type="submit" disabled={loading} className="w-full py-6">
                                  {loading ? (
                                      <RefreshCw className="animate-spin mr-3" size={20} />
                                  ) : (
                                      <CheckCircle2 className="mr-3" size={20} />
                                  )}
                                  <span>{loading ? "Traitement..." : "Confirmer le Versement"}</span>
                              </AuthButton>
                          </div>
                      </form>
                  )}
              </div>
          </div>
      )}

      {showReceipt && receiptData && (
          <PaymentReceipt
            data={receiptData}
            onClose={() => setShowReceipt(false)}
          />
      )}
    </div>
  );
};

export default PaymentPage;
