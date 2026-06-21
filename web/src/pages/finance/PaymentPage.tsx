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
  const [selectedFraisId, setSelectedFraisId] = useState<number | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [isPeriscolaire, setIsPeriscolaire] = useState(false);
  const [isTransport, setIsTransport] = useState(false);
  const [transportSub, setTransportSub] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [txToCancel, setTxToCancel] = useState<number | null>(null);
  const [cancelMotif, setCancelMotif] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [availableTarifs, setAvailableTarifs] = useState<any[]>([]);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (showSubscriptionModal && yearId) {
        financeService.getTarifsTransport(yearId).then(res => setAvailableTarifs(res.data));
    }
  }, [showSubscriptionModal, yearId]);

  const handleSubscription = async (tarifId: number) => {
      if (!selectedStudent || !yearId) return;
      setSubscribing(true);
      try {
          // Generate default monthly echeances (Oct to June)
          const tarif = availableTarifs.find(t => t.idTarifTransport === tarifId);
          const monthlyAmount = Math.ceil(tarif.montantTransport / 9);
          const echeances = [
              { libelle: 'Octobre', montantDu: monthlyAmount, dateLimite: '2025-10-31' },
              { libelle: 'Novembre', montantDu: monthlyAmount, dateLimite: '2025-11-30' },
              { libelle: 'Décembre', montantDu: monthlyAmount, dateLimite: '2025-12-31' },
              { libelle: 'Janvier', montantDu: monthlyAmount, dateLimite: '2026-01-31' },
              { libelle: 'Février', montantDu: monthlyAmount, dateLimite: '2026-02-28' },
              { libelle: 'Mars', montantDu: monthlyAmount, dateLimite: '2026-03-31' },
              { libelle: 'Avril', montantDu: monthlyAmount, dateLimite: '2026-04-30' },
              { libelle: 'Mai', montantDu: monthlyAmount, dateLimite: '2026-05-31' },
              { libelle: 'Juin', montantDu: tarif.montantTransport - (monthlyAmount * 8), dateLimite: '2026-06-30' },
          ];

          await financeService.subscribeStudentToTransport({
              idEleve: selectedStudent.idEleve,
              idTarifTransport: tarifId,
              reduction: 0,
              echeances
          });
          setShowSubscriptionModal(false);
          loadDetails();
      } catch (err) {
          console.error(err);
          alert("Erreur lors de l'abonnement");
      } finally {
          setSubscribing(false);
      }
  };
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
                setTimeout(() => {
                    setHighlightActive(false);
                    transactionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 1000);
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
  }, [selectedStudent, isPeriscolaire, isTransport, yearId]);

  const loadDetails = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      if (isTransport) {
        const res = await financeService.getStudentTransportSubscription(selectedStudent.idEleve, yearId);
        setTransportSub(res.data);
      } else {
        const res = isPeriscolaire
          ? await financeService.getStudentPeriscolaireDetails(selectedStudent.idEleve, yearId)
          : await financeService.getStudentPaymentDetails(selectedStudent.idEleve, yearId);
        setDetails(res.data);
      }
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
    const amountVal = Number(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
        alert("Veuillez entrer un montant valide.");
        setLoading(false);
        return;
    }

    if (amountVal > (details?.resteGlobal || 0)) {
        alert(`Montant trop élevé. Le reste à payer est de ${(details?.resteGlobal || 0).toLocaleString()} FCFA.`);
        setLoading(false);
        return;
    }

    const payload: PaiementPayload = {
      idEleve: selectedStudent.idEleve,
      idAnneeScolaire: yearId,
      idClasse: selectedStudent.idClasse,
      montantVerse: Number(amount),
      modePaiement: paymentMode
    };

    try {
      if (isTransport) {
        await financeService.payerTransport(payload);
      } else if (isPeriscolaire) {
          if (!selectedFraisId) {
              alert("Veuillez sélectionner l'activité à payer.");
              setLoading(false);
              return;
          }
          await financeService.payerFraisPeriscolaires({
              ...payload,
              idTarifFraisActivitePeriscolaire: selectedFraisId
          });
      } else {
          await financeService.payerFraisExigibles(payload);
      }

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
      setTxToCancel(id);
      setCancelMotif('');
      setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
      if (!txToCancel || !cancelMotif.trim()) return;
      if (cancelMotif.length < 5) {
          alert("Le motif doit contenir au moins 5 caractères.");
          return;
      }

      setCancelling(true);
      try {
          await financeService.annulerPaiement(txToCancel, cancelMotif);
          setShowCancelModal(false);
          setTxToCancel(null);
          loadDetails();
          loadTransactions();
          loadStudents();
      } catch (error: any) {
          console.error("[PaymentPage] ❌ Erreur annulation:", error);
          alert(error.response?.data?.error || "Erreur lors de l'annulation");
      } finally {
          setCancelling(false);
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
        {/* Left Column: Student List (Increased by 20% width) */}
        <div className="w-full lg:w-[calc(24rem*1.2)] bg-white rounded-[32px] border border-gray-100 flex flex-col shadow-sm overflow-hidden lg:h-[calc(100vh-280px)]">
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
                                onClick={() => { setIsPeriscolaire(false); setIsTransport(false); setSelectedFraisId(null); }}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    (!isPeriscolaire && !isTransport) ? "bg-black text-white shadow-lg" : "text-secondary hover:bg-gray-50"
                                )}
                            >Exigibles</button>
                            <button
                                onClick={() => { setIsPeriscolaire(true); setIsTransport(false); setSelectedFraisId(null); }}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    (isPeriscolaire && !isTransport) ? "bg-black text-white shadow-lg" : "text-secondary hover:bg-gray-50"
                                )}
                            >Périscolaires</button>
                            <button
                                onClick={() => { setIsTransport(true); setIsPeriscolaire(false); setSelectedFraisId(null); }}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    isTransport ? "bg-black text-white shadow-lg" : "text-secondary hover:bg-gray-50"
                                )}
                            >Transport</button>
                        </div>
                    </div>

                    <div className="p-8 space-y-4">
                        {/* Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-8 bg-black rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-150"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Déjà Versé</p>
                                <p className="text-4xl font-black tracking-tighter">
                                    {isTransport
                                        ? transportSub?.echeances?.reduce((sum: number, e: any) => sum + e.montantPaye, 0).toLocaleString()
                                        : details?.totalDejaVerse.toLocaleString()} <span className="text-xs text-accent">FCFA</span>
                                </p>
                            </div>
                            <div className="p-8 bg-gray-50 border border-gray-100 rounded-[32px] relative overflow-hidden group">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Reste Global</p>
                                <p className={clsx(
                                    "text-4xl font-black tracking-tighter",
                                    (isTransport ? (transportSub?.echeances?.reduce((sum: number, e: any) => sum + (e.montantDu - e.montantPaye), 0) === 0) : (details?.resteGlobal === 0)) ? "text-green-500" : "text-black"
                                )}>
                                    {isTransport
                                        ? transportSub?.echeances?.reduce((sum: number, e: any) => sum + (e.montantDu - e.montantPaye), 0).toLocaleString()
                                        : details?.resteGlobal.toLocaleString()} <span className="text-xs">FCFA</span>
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
                                    ) : isTransport ? (
                                        !transportSub ? (
                                            <div className="p-10 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4">
                                                <div className="p-4 bg-gray-50 rounded-full text-secondary">
                                                    <Settings size={32} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Non abonné au transport</p>
                                                <button
                                                    onClick={() => setShowSubscriptionModal(true)}
                                                    className="px-6 py-3 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                                >
                                                    S'abonner maintenant
                                                </button>
                                            </div>
                                        ) : (
                                            transportSub.echeances?.map((ech: any) => (
                                                <div
                                                    key={ech.idEcheancier}
                                                    className={clsx(
                                                        "p-6 border rounded-[28px] flex items-center justify-between bg-white border-gray-100"
                                                    )}
                                                >
                                                    <div className="flex items-center space-x-5">
                                                        <div className={clsx(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                            ech.montantPaye >= ech.montantDu ? "bg-green-50 text-green-500" : "bg-orange-50 text-orange-500"
                                                        )}>
                                                            {ech.montantPaye >= ech.montantDu ? <CheckCircle2 size={20} /> : <CircleDollarSign size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-xs uppercase tracking-tight">{ech.libelle}</p>
                                                            <p className="text-[8px] font-bold text-secondary uppercase tracking-widest">
                                                                Dû: {ech.montantDu.toLocaleString()} FCFA
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-xs">{ech.montantPaye.toLocaleString()} FCFA</p>
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-green-500">Payé</p>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    ) : details?.frais.map((frais) => {
                                        const isSelected = selectedFraisId === frais.idTarif;
                                        return (
                                        <div
                                            key={frais.idTarif}
                                            onClick={() => isPeriscolaire && setSelectedFraisId(frais.idTarif)}
                                            className={clsx(
                                                "p-6 border rounded-[28px] flex items-center justify-between group transition-all",
                                                isPeriscolaire && "cursor-pointer hover:border-black",
                                                isSelected ? "bg-accent/5 border-accent" : "bg-white border-gray-100 hover:border-gray-200"
                                            )}
                                        >
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
                                            <div className="text-right flex items-center gap-3">
                                                <div>
                                                    <p className="font-black text-xs">{frais.montantPaye.toLocaleString()} FCFA</p>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-green-500">Payé</p>
                                                </div>
                                                {isPeriscolaire && isSelected && (
                                                    <div className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                                        <Check size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )})}
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
                            disabled={
                                isTransport
                                ? (!transportSub || transportSub.echeances?.every((e:any) => e.montantPaye >= e.montantDu))
                                : (isPeriscolaire ? !selectedFraisId || details?.frais.find(f => f.idTarif === selectedFraisId)?.isComplet : details?.resteGlobal === 0)
                            }
                            className={clsx(
                                "w-16 h-16 rounded-[24px] shadow-2xl transition-all flex items-center justify-center group",
                                (isTransport ? (!transportSub || transportSub.echeances?.every((e:any) => e.montantPaye >= e.montantDu)) : (isPeriscolaire ? !selectedFraisId || details?.frais.find(f => f.idTarif === selectedFraisId)?.isComplet : details?.resteGlobal === 0))
                                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                : "bg-accent text-white shadow-accent/30 hover:scale-110 active:scale-95"
                            )}
                            title={isTransport ? (transportSub ? "Encaisser transport" : "S'abonner d'abord") : (isPeriscolaire ? (selectedFraisId ? "Payer l'activité" : "Sélectionnez une activité") : (details?.resteGlobal === 0 ? "Déjà soldé" : "Encaisser"))}
                        >
                            <Plus size={28} className={clsx(!(isTransport ? (!transportSub || transportSub.echeances?.every((e:any) => e.montantPaye >= e.montantDu)) : (isPeriscolaire ? !selectedFraisId || details?.frais.find(f => f.idTarif === selectedFraisId)?.isComplet : details?.resteGlobal === 0)) && "group-hover:rotate-90 transition-transform duration-500")} />
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
                        {isTransport ? 'Transport' : (isPeriscolaire ? 'Périscolaire' : 'Scolarité')}
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
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Entrez le montant"
                                  value={amount}
                                  onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^[0-9]+$/.test(val)) {
                                          setAmount(val);
                                      }
                                  }}
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

      {showSubscriptionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[56px] p-12 max-w-2xl w-full shadow-2xl relative">
                  <button onClick={() => setShowSubscriptionModal(false)} className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"><X size={24}/></button>
                  <div className="mb-10">
                      <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Abonnement Transport</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary mt-1">Choisissez le quartier pour {selectedStudent?.nomComplet}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {availableTarifs.map(t => (
                          <div
                            key={t.idTarifTransport}
                            onClick={() => !subscribing && handleSubscription(t.idTarifTransport)}
                            className="p-6 border-2 border-gray-50 rounded-[32px] hover:border-black cursor-pointer transition-all group bg-gray-50/30"
                          >
                              <p className="font-black text-xs uppercase tracking-tight">{t.Quartier?.libelle}</p>
                              <p className="text-xl font-black mt-2">{t.montantTransport.toLocaleString()} <span className="text-[10px] text-secondary">FCFA / AN</span></p>
                              <div className="mt-4 flex items-center text-[8px] font-black uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 transition-all">
                                  Choisir ce tarif <ChevronRight size={10} className="ml-1" />
                              </div>
                          </div>
                      ))}
                  </div>

                  {availableTarifs.length === 0 && (
                      <div className="text-center py-10">
                          <AlertCircle size={40} className="mx-auto text-gray-200 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Aucun tarif transport configuré</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl relative">
                  <div className="mb-8">
                      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                          <AlertCircle size={32} />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tight text-black">Annuler la Transaction</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary mt-2">
                          Cette action est irréversible. Elle restaurera la dette de l'élève.
                      </p>
                  </div>

                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-2">Motif d'annulation</label>
                          <textarea
                              className="w-full p-6 bg-gray-50 border-none rounded-[24px] focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-xs min-h-[120px]"
                              placeholder="Ex: Erreur de saisie, Paiement rejeté par la banque..."
                              value={cancelMotif}
                              onChange={(e) => setCancelMotif(e.target.value)}
                          />
                      </div>

                      <div className="flex gap-3">
                          <button
                              onClick={() => setShowCancelModal(false)}
                              className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-secondary hover:bg-gray-100 transition-all"
                          >Abandonner</button>
                          <button
                              onClick={confirmCancellation}
                              disabled={cancelling || cancelMotif.trim().length < 5}
                              className={clsx(
                                  "flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all shadow-xl",
                                  (cancelling || cancelMotif.trim().length < 5) ? "bg-gray-300" : "bg-red-600 shadow-red-200 hover:scale-105 active:scale-95"
                              )}
                          >
                              {cancelling ? <RefreshCw className="animate-spin mx-auto" size={18} /> : "Confirmer"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default PaymentPage;
