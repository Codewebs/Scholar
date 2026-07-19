import React, { useEffect, useState } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { financeService } from '../../api/financeService';
import { gradeService } from '../../api/gradeService';
import { pedagogyService } from '../../api/pedagogyService';
import { EleveUiModel } from '../../types/student';
import {
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  FileText,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Download,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ParentPortal: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [children, setChildren] = useState<EleveUiModel[]>([]);
  const [selectedChild, setSelectedChild] = useState<EleveUiModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<{
      finance?: any;
      periscolaire?: any;
      transport?: any;
      notes?: any[];
      summary?: {
          moyenneGenerale: number;
          nbSequences: number;
          totalAbsences: number;
          sequences: any[];
      };
  }>({});
  const [activeModal, setActiveModal] = useState<'NOTES' | 'FINANCE' | 'ABSENCES' | 'DOCS' | null>(null);

  const [sequences, setSequences] = useState<any[]>([]);
  const [activeSequence, setActiveSequence] = useState<any>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [allInscriptions, setAllInscriptions] = useState<any[]>([]);
  const [selectedInscription, setSelectedInscription] = useState<any>(null);

  useEffect(() => {
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (yearId) {
        studentService.getAllStudents(yearId).then(res => {
            setChildren(res.data);
            if (res.data.length > 0) setSelectedChild(res.data[0]);
            setLoading(false);
        }).catch(() => setLoading(false));
    } else {
        // Si pas d'année sélectionnée, on ne peut pas charger les enfants mais on arrête le loading
        setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (selectedChild && yearId) {
        fetchChildDetails(selectedChild.idEleve);
    }
  }, [selectedChild, selectedYear]);

  const fetchChildDetails = async (idEleve: number) => {
      const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
      if (!yearId || !selectedChild) return;

      try {
          // 0. Historique des inscriptions pour le sélecteur d'année
          studentService.getStudent(idEleve).then(res => {
              const inscriptions = (res.data as any).Inscriptions || [];
              setAllInscriptions(inscriptions);
              // On cherche l'inscription correspondant à l'année sélectionnée
              const current = inscriptions.find((ins: any) => ins.idAnneeScolaire === yearId);
              if (current) setSelectedInscription(current);
          });

          // 1. Finance (Exigibles, Periscolaires, Transport) - Utilisation de Promise.allSettled pour ne pas bloquer si un service échoue (ex: pas de transport)
          Promise.allSettled([
              financeService.getStudentPaymentDetails(idEleve, yearId),
              financeService.getStudentPeriscolaireDetails(idEleve, yearId),
              financeService.getStudentTransportSubscription(idEleve, yearId)
          ]).then((results) => {
              setDetails(prev => ({
                  ...prev,
                  finance: results[0].status === 'fulfilled' ? (results[0] as PromiseFulfilledResult<any>).value.data : null,
                  periscolaire: results[1].status === 'fulfilled' ? (results[1] as PromiseFulfilledResult<any>).value.data : null,
                  transport: results[2].status === 'fulfilled' ? (results[2] as PromiseFulfilledResult<any>).value.data : null
              }));
          });

          // 2. Séquences et Notes
          const seqRes = await pedagogyService.getSequenceRepartition(yearId, selectedChild.idClasse);
          setSequences(seqRes.data);

          // 3. Résumé global (Moyenne annuelle, Absences)
          gradeService.getStudentSummary(selectedChild.idInscription, yearId).then(res => {
              setDetails(prev => ({ ...prev, summary: res.data }));
          });

          if (seqRes.data.length > 0) {
              const currentSeq = seqRes.data[seqRes.data.length - 1]; // Par défaut la dernière séquence
              setActiveSequence(currentSeq);
              fetchNotes(selectedChild.idInscription, currentSeq.idSousPeriode, yearId, selectedChild.idClasse);
          } else {
              setDetails(prev => ({ ...prev, notes: [] }));
              setActiveSequence(null);
          }
      } catch (err) {
          console.error("Error fetching child details", err);
      }
  };

  const fetchNotes = async (idInscription: number, idSequence: number, yearId: number, idClasse: number) => {
    setLoadingNotes(true);
    try {
        const noteRes = await gradeService.getNotesByStudent(idInscription, idSequence, yearId, idClasse);
        setDetails(prev => ({ ...prev, notes: noteRes.data }));
    } catch (err) {
        console.error("Error fetching notes", err);
    } finally {
        setLoadingNotes(false);
    }
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
        >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {children}
            </div>
        </motion.div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Espace Famille</h2>
          <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-[0.2em] mt-2">
            Tableau de bord parental — {selectedYear?.libelleAnneeScolaire}
          </p>
        </div>

        {/* Children Selector if multiple */}
        {children.length > 1 && (
            <div className="flex bg-gray-50 p-1.5 rounded-[24px] border border-gray-100 shadow-inner">
                {children.map(child => (
                    <button
                        key={child.idEleve}
                        onClick={() => setSelectedChild(child)}
                        className={clsx(
                            "px-6 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                            selectedChild?.idEleve === child.idEleve ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-black"
                        )}
                    >
                        {child.nom?.split(' ')[0] || 'Enfant'}
                    </button>
                ))}
            </div>
        )}
      </div>

      {children.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[40px] p-24 text-center space-y-8">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Users size={48} className="text-gray-200" />
            </div>
            <div className="max-w-md mx-auto">
                <h3 className="text-xl font-black uppercase tracking-tight">Aucun enfant lié à ce compte</h3>
                <p className="text-xs text-[#9E9E9E] font-bold uppercase tracking-widest mt-4 leading-relaxed">
                    Si vos enfants sont inscrits, contactez l'administration pour vérifier que votre numéro de téléphone ({localStorage.getItem('user_phone') || 'N/A'}) est correctement renseigné dans leur dossier.
                </p>
            </div>
        </div>
      ) : selectedChild && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Main Info Card */}
          <div className="xl:col-span-2 space-y-10">
            <div className="bg-white border border-border rounded-[40px] p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-[0.02] rounded-full blur-3xl pointer-events-none group-hover:opacity-[0.05] transition-opacity"></div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-32 h-32 bg-gray-50 rounded-[32px] flex items-center justify-center shadow-inner border border-gray-100 overflow-hidden relative">
                         {/* Student Photo placeholder */}
                         <GraduationCap size={48} className="text-gray-200" />
                         <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedChild.nom} {selectedChild.prenom || ''}</h3>
                            <span className="bg-black text-white text-[9px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] w-fit mx-auto md:mx-0 shadow-lg">
                                {selectedChild.classeLabel || 'N/A'}
                            </span>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl">
                                <span className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest">Matricule:</span>
                                <span className="text-[10px] font-black">{selectedChild.matricule}</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl">
                                <span className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest">Né(e) le:</span>
                                <span className="text-[10px] font-black">
                                    {selectedChild.dateNaissance ? new Date(selectedChild.dateNaissance).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 pt-10 border-t border-gray-100">
                    {[
                        {
                            label: 'Moyenne Actuelle',
                            val: details.summary?.moyenneGenerale ? details.summary.moyenneGenerale.toFixed(2) : '--',
                            sub: `/20 (${details.summary?.nbSequences || 0} séq.)`,
                            icon: TrendingUp,
                            color: 'text-indigo-600',
                            onClick: () => setActiveModal('NOTES')
                        },
                        {
                            label: 'Assiduité',
                            val: details.summary?.totalAbsences?.toString().padStart(2, '0') || '00',
                            sub: 'Heures d\'Absence',
                            icon: Calendar,
                            color: 'text-rose-600',
                            onClick: () => setActiveModal('ABSENCES')
                        },
                        {
                            label: 'État Financier (Scolarité)',
                            val: (details.finance?.resteGlobal || 0) === 0 ? 'À JOUR' : `${(details.finance?.resteGlobal || 0).toLocaleString()} CFA`,
                            sub: (details.finance?.resteGlobal || 0) === 0 ? 'Solvable' : 'À Payer',
                            icon: CreditCard,
                            color: (details.finance?.resteGlobal || 0) === 0 ? 'text-emerald-600' : 'text-rose-600',
                            onClick: () => setActiveModal('FINANCE')
                        },
                    ].map((stat, i) => (
                        <div key={i} onClick={stat.onClick} className="cursor-pointer group/stat p-6 rounded-[24px] hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 shadow-sm hover:shadow-md">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className={clsx("p-2 rounded-xl bg-gray-50 group-hover/stat:scale-110 transition-transform shadow-sm", stat.color.replace('text', 'bg').replace('600', '100'))}>
                                    <stat.icon size={18} className={stat.color} />
                                </div>
                                <span className="text-[9px] font-black text-[#9E9E9E] uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <div className="flex items-baseline space-x-1">
                                <span className={clsx("text-2xl font-black", stat.color)}>{stat.val}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase">{stat.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Mes Notes', icon: FileText, color: 'bg-indigo-50 text-indigo-600', modal: 'NOTES' },
                    { label: 'Paiements', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600', modal: 'FINANCE' },
                    { label: 'Bulletins', icon: Download, color: 'bg-blue-50 text-blue-600', modal: 'DOCS' },
                    { label: 'Discipline', icon: AlertCircle, color: 'bg-rose-50 text-rose-600', modal: 'ABSENCES' },
                ].map((action, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveModal(action.modal as any)}
                        className="bg-white p-8 rounded-[32px] border border-border hover:border-black transition-all group flex flex-col items-center justify-center space-y-4 shadow-sm hover:shadow-xl"
                    >
                        <div className={clsx("p-4 rounded-2xl transition-transform group-hover:scale-110 shadow-sm", action.color)}>
                            <action.icon size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{action.label}</span>
                    </button>
                ))}
            </div>
          </div>

          {/* Right Sidebar: School Updates & Notifications */}
          <div className="space-y-10">
            <div className="bg-black text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-8">
                        <MessageCircle size={20} className="text-accent" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Derniers Communiqués</h3>
                    </div>
                    <div className="space-y-8">
                        {[
                            { title: 'Réunion de Parents', date: 'Samedi 12, 10:00', body: 'Réunion générale de fin de trimestre.' },
                            { title: 'Remise des Bulletins', date: 'Vendredi 18', body: 'Disponibles sur l\'espace en ligne dès 15h.' },
                        ].map((msg, i) => (
                            <div key={i} className="space-y-2 group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black uppercase group-hover:text-accent transition-colors">{msg.title}</h4>
                                    <span className="text-[8px] font-bold text-gray-500">{msg.date}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-tight">{msg.body}</p>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-[20px] text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2">
                        <span>Voir tous les messages</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-20 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white border border-border p-8 rounded-[40px] space-y-8">
                <div className="flex items-center space-x-3">
                    <AlertCircle size={20} className="text-rose-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Alertes & Urgences</h3>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[24px]">
                    <p className="text-[9px] font-black text-rose-600 uppercase mb-2">Santé & Infirmerie</p>
                    <p className="text-[10px] font-bold text-rose-900 leading-relaxed uppercase tracking-tight">
                        Pensez à mettre à jour les carnets de vaccination pour la visite médicale annuelle du mois prochain.
                    </p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals Implementation */}
      <AnimatePresence>
        {activeModal === 'NOTES' && (
            <Modal title="Relevé de Notes" onClose={() => setActiveModal(null)}>
                <div className="space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-gray-50 p-8 rounded-[32px] gap-6">
                        <div className="flex items-center space-x-6">
                            <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest mb-1">Année Scolaire</p>
                                <div className="relative">
                                    <select
                                        className="bg-transparent border-none p-0 font-black uppercase text-sm focus:ring-0 cursor-pointer pr-8"
                                        value={selectedInscription?.idAnneeScolaire || ''}
                                        onChange={async (e) => {
                                            const idAnn = Number(e.target.value);
                                            const ins = allInscriptions.find(i => i.idAnneeScolaire === idAnn);
                                            if (ins) {
                                                setSelectedInscription(ins);
                                                // On récupère les nouvelles séquences pour cette classe de cette année
                                                const seqRes = await pedagogyService.getSequenceRepartition(idAnn, ins.idSalle ? ins.Salle?.idClasse : undefined);
                                                setSequences(seqRes.data);
                                                if (seqRes.data.length > 0) {
                                                    const last = seqRes.data[seqRes.data.length - 1];
                                                    setActiveSequence(last);
                                                    fetchNotes(ins.idInscription, last.idSousPeriode, idAnn, ins.Salle?.idClasse || 0);
                                                } else {
                                                    setDetails(prev => ({ ...prev, notes: [] }));
                                                    setActiveSequence(null);
                                                }
                                            }
                                        }}
                                    >
                                        {allInscriptions.map(ins => (
                                            <option key={ins.idInscription} value={ins.idAnneeScolaire}>
                                                {ins.AnneeScolaire?.libelleAnneeScolaire || 'N/A'} — {ins.Salle?.Classe?.libelleClasseFr || 'Classe'}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-8">
                            <div className="text-right">
                                <p className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest">Période</p>
                                <h4 className="text-[10px] font-black uppercase tracking-tight">{activeSequence?.SousPeriode?.Periode?.libellePeriodeFr || 'N/A'}</h4>
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest">Moyenne Générale</p>
                                <span className="text-2xl font-black text-indigo-600">
                                    {(() => {
                                        if (!details.notes || details.notes.length === 0) return '--';

                                        // 1. Grouper par matière
                                        const groups = (details.notes || []).reduce((acc: any, n: any) => {
                                            const key = n.idRepartitionMatiere;
                                            if (!acc[key]) {
                                                acc[key] = { coef: n.coef || 1, notes: [] };
                                            }
                                            acc[key].notes.push(n.note || 0);
                                            return acc;
                                        }, {});

                                        // 2. Calculer moyenne de chaque matière et pondérer
                                        let totalPoints = 0;
                                        let totalCoef = 0;

                                        Object.values(groups).forEach((g: any) => {
                                            const subjectAvg = Math.round((g.notes.reduce((s: number, v: number) => s + v, 0) / g.notes.length) * 100) / 100;
                                            totalPoints += (subjectAvg * g.coef);
                                            totalCoef += g.coef;
                                        });

                                        return totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : '--';
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Onglets des Séquences */}
                    <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-gray-100">
                        {sequences.map((seq, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (!selectedInscription) return;
                                    setActiveSequence(seq);
                                    fetchNotes(selectedInscription.idInscription, seq.idSousPeriode, selectedInscription.idAnneeScolaire, selectedInscription.Salle?.idClasse || 0);
                                }}
                                className={clsx(
                                    "flex-none px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    activeSequence?.idSousPeriode === seq.idSousPeriode
                                        ? "bg-black text-white shadow-lg"
                                        : "bg-white text-gray-400 hover:text-black border border-gray-100"
                                )}
                            >
                                {seq.SousPeriode?.libelleSousPeriodeFr}
                            </button>
                        ))}
                    </div>

                    {loadingNotes ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Chargement des notes...</p>
                        </div>
                    ) : (
                        <div className="border border-border rounded-[32px] overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-border">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest">Matière</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Note /20</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Coeff</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Appréciation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {details.notes && details.notes.length > 0 ? (
                                        Object.values((details.notes || []).reduce((acc: any, n: any) => {
                                            const key = n.idRepartitionMatiere;
                                            if (!acc[key]) {
                                                acc[key] = {
                                                    matiereLabel: n.matiereLabel,
                                                    coef: n.coef || 1,
                                                    notes: []
                                                };
                                            }
                                            acc[key].notes.push(n);
                                            return acc;
                                        }, {})).map((group: any, idx: number) => {
                                            const avg = Math.round((group.notes.reduce((s: number, n: any) => s + (n.note || 0), 0) / group.notes.length) * 100) / 100;

                                            return (
                                                <React.Fragment key={idx}>
                                                    {/* Subject Header Row */}
                                                    <tr className="bg-gray-50/30">
                                                        <td className="p-6">
                                                            <div className="font-black uppercase text-[11px] tracking-tight text-black">
                                                                {group.matiereLabel}
                                                            </div>
                                                            <div className="text-[8px] font-bold text-gray-400 uppercase mt-1">
                                                                {group.notes.length} Compétence(s) évaluée(s)
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-center font-black text-sm text-indigo-600">
                                                            {avg.toFixed(2)}
                                                        </td>
                                                        <td className="p-6 text-center text-[10px] font-bold text-gray-400">
                                                            x{group.coef}
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <span className={clsx(
                                                                "text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm",
                                                                avg >= 10 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                            )}>
                                                                {avg >= 12 ? 'Très Bien' : avg >= 10 ? 'Passable' : 'Insuffisant'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {/* Competency Sub-Rows */}
                                                    {group.notes.map((n: any, i: number) => (
                                                        <tr key={`${idx}-${i}`} className="hover:bg-gray-50/50 transition-colors border-l-4 border-l-gray-100">
                                                            <td className="py-4 px-10">
                                                                <div className="text-[9px] font-bold uppercase text-gray-500 italic">
                                                                    — {n.competenceLabel || 'Compétence sans libellé'}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-center font-bold text-[10px] text-gray-600">
                                                                {n.note !== null ? n.note.toFixed(2) : '--'}
                                                            </td>
                                                            <td className="py-4"></td>
                                                            <td className="py-4 text-center">
                                                                <div className="text-[8px] font-bold text-gray-400 uppercase">
                                                                    {n.appreciation}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-20 text-center">
                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                        <FileText size={24} className="text-gray-200" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        Aucune note disponible pour cette séquence.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>
        )}

        {activeModal === 'FINANCE' && (
            <Modal title="Situation Financière" onClose={() => setActiveModal(null)}>
                <div className="space-y-12">
                    {/* Synthèse Globale */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Versé</p>
                            <p className="text-3xl font-black text-emerald-900">
                                {((details.finance?.totalDejaVerse || 0) + (details.periscolaire?.totalDejaVerse || 0) + (details.transport?.echeances?.reduce((acc: number, e: any) => acc + (e.montantPaye || 0), 0) || 0)).toLocaleString()} CFA
                            </p>
                        </div>
                        <div className="bg-rose-50 p-8 rounded-[32px] border border-rose-100">
                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2">Reste à Payer</p>
                            <p className="text-3xl font-black text-rose-900">
                                {((details.finance?.resteGlobal || 0) + (details.periscolaire?.resteGlobal || 0) + (details.transport?.echeances?.reduce((acc: number, e: any) => acc + (e.montantDu - e.montantPaye), 0) || 0)).toLocaleString()} CFA
                            </p>
                        </div>
                        <div className="bg-black p-8 rounded-[40px] text-white flex flex-col justify-between">
                            <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-4">Statut Global</p>
                            <div className="flex items-center space-x-3">
                                <div className={clsx(
                                    "w-3 h-3 rounded-full animate-pulse",
                                    (details.finance?.resteGlobal || 0) === 0 ? "bg-green-500" : "bg-amber-500"
                                )}></div>
                                <p className="text-lg font-black uppercase tracking-tighter">
                                    {(details.finance?.resteGlobal || 0) === 0 ? 'SOLVABLE' : 'INSOLVABLE'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tableaux de Répartition */}
                    <div className="space-y-10">
                        {/* 1. Frais Exigibles */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-xs font-black uppercase tracking-widest flex items-center">
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></div>
                                    Frais Exigibles (Scolarité)
                                </h4>
                            </div>
                            <div className="border border-border rounded-[28px] overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 border-b border-border">
                                        <tr>
                                            <th className="p-5 text-[9px] font-black uppercase tracking-widest">Libellé Frais</th>
                                            <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Montant Du</th>
                                            <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Déjà Versé</th>
                                            <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Reste</th>
                                            <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(details.finance?.frais || []).map((f: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-5 text-[10px] font-black uppercase">{f.libelle}</td>
                                                <td className="p-5 text-[10px] font-bold text-center">{f.montantDu?.toLocaleString()}</td>
                                                <td className="p-5 text-[10px] font-bold text-center text-emerald-600">{f.montantPaye?.toLocaleString()}</td>
                                                <td className="p-5 text-[10px] font-bold text-center text-rose-600">{f.reste?.toLocaleString()}</td>
                                                <td className="p-5 text-center">
                                                    {f.isComplet ?
                                                        <CheckCircle2 size={16} className="text-emerald-500 mx-auto" /> :
                                                        <Clock size={16} className="text-amber-500 mx-auto" />
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Résumé Frais Exigibles */}
                            <div className="bg-indigo-50/50 p-6 rounded-[24px] border border-indigo-100 flex justify-around items-center">
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Exigible</p>
                                    <p className="text-sm font-black text-indigo-900">{details.finance?.totalTotalDu?.toLocaleString()} CFA</p>
                                </div>
                                <div className="w-px h-8 bg-indigo-100"></div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Réglé</p>
                                    <p className="text-sm font-black text-emerald-600">{details.finance?.totalDejaVerse?.toLocaleString()} CFA</p>
                                </div>
                                <div className="w-px h-8 bg-indigo-100"></div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Solde Restant</p>
                                    <p className="text-sm font-black text-rose-600">{details.finance?.resteGlobal?.toLocaleString()} CFA</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Frais Périscolaires */}
                        {details.periscolaire?.frais?.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center">
                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mr-2"></div>
                                        Frais Périscolaires
                                    </h4>
                                </div>
                                <div className="border border-border rounded-[28px] overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b border-border">
                                            <tr>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest">Libellé Activité</th>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Montant Du</th>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Déjà Versé</th>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Reste</th>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {details.periscolaire.frais.map((f: any, i: number) => (
                                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-5 text-[10px] font-black uppercase">{f.libelle}</td>
                                                    <td className="p-5 text-[10px] font-bold text-center">{f.montantDu?.toLocaleString()}</td>
                                                    <td className="p-5 text-[10px] font-bold text-center text-emerald-600">{f.montantPaye?.toLocaleString()}</td>
                                                    <td className="p-5 text-[10px] font-bold text-center text-rose-600">{f.reste?.toLocaleString()}</td>
                                                    <td className="p-5 text-center">
                                                        {f.isComplet ?
                                                            <CheckCircle2 size={16} className="text-emerald-500 mx-auto" /> :
                                                            <Clock size={16} className="text-amber-500 mx-auto" />
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Résumé Frais Périscolaires */}
                                <div className="bg-emerald-50/50 p-6 rounded-[24px] border border-emerald-100 flex justify-around items-center">
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Périscolaire</p>
                                        <p className="text-sm font-black text-emerald-900">{details.periscolaire?.totalTotalDu?.toLocaleString()} CFA</p>
                                    </div>
                                    <div className="w-px h-8 bg-emerald-100"></div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Payé</p>
                                        <p className="text-sm font-black text-emerald-600">{details.periscolaire?.totalDejaVerse?.toLocaleString()} CFA</p>
                                    </div>
                                    <div className="w-px h-8 bg-emerald-100"></div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Dû</p>
                                        <p className="text-sm font-black text-rose-600">{details.periscolaire?.resteGlobal?.toLocaleString()} CFA</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Transport */}
                        {details.transport && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center">
                                        <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mr-2"></div>
                                        Service de Transport ({details.transport.TarifTransport?.Quartier?.libelle})
                                    </h4>
                                </div>
                                <div className="border border-border rounded-[28px] overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b border-border">
                                            <tr>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest">Échéance</th>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Date Limite</th>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Montant Du</th>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Déjà Versé</th>
                                                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-center">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(details.transport.echeances || []).map((e: any, i: number) => (
                                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-5 text-[10px] font-black uppercase">{e.libelle}</td>
                                                    <td className="p-5 text-[10px] font-bold text-center">{new Date(e.dateLimite).toLocaleDateString()}</td>
                                                    <td className="p-5 text-[10px] font-bold text-center">{e.montantDu?.toLocaleString()}</td>
                                                    <td className="p-5 text-[10px] font-bold text-center text-emerald-600">{e.montantPaye?.toLocaleString()}</td>
                                                    <td className="p-5 text-center">
                                                        {e.montantPaye >= e.montantDu ?
                                                            <CheckCircle2 size={16} className="text-emerald-500 mx-auto" /> :
                                                            <Clock size={16} className="text-amber-500 mx-auto" />
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Résumé Transport */}
                                <div className="bg-amber-50/50 p-6 rounded-[24px] border border-amber-100 flex justify-around items-center">
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Total Transport</p>
                                        <p className="text-sm font-black text-amber-900">{(details.transport.echeances || []).reduce((acc: number, e: any) => acc + (e.montantDu || 0), 0).toLocaleString()} CFA</p>
                                    </div>
                                    <div className="w-px h-8 bg-amber-100"></div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Payé</p>
                                        <p className="text-sm font-black text-emerald-600">{(details.transport.echeances || []).reduce((acc: number, e: any) => acc + (e.montantPaye || 0), 0).toLocaleString()} CFA</p>
                                    </div>
                                    <div className="w-px h-8 bg-amber-100"></div>
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Reste</p>
                                        <p className="text-sm font-black text-rose-600">{(details.transport.echeances || []).reduce((acc: number, e: any) => acc + ((e.montantDu - e.montantPaye) || 0), 0).toLocaleString()} CFA</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        )}

        {activeModal === 'ABSENCES' && (
            <Modal title="Détails des Absences & Discipline" onClose={() => setActiveModal(null)}>
                <div className="space-y-8">
                    <div className="bg-rose-50 p-8 rounded-[32px] border border-rose-100 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2">Total des Absences</p>
                            <p className="text-3xl font-black text-rose-900">{details.summary?.totalAbsences || 0} Heures</p>
                        </div>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <Clock size={32} className="text-rose-500" />
                        </div>
                    </div>

                    <div className="border border-border rounded-[32px] overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-border">
                                <tr>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest">Compétence / Activité</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Justifiées</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Non Justifiées</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {details.summary?.sequences?.filter((s: any) => s.absences?.length > 0).map((seq: any) => (
                                    <React.Fragment key={seq.idSequence}>
                                        <tr className="bg-gray-50/50">
                                            <td colSpan={4} className="p-4 px-6 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                {seq.libelle}
                                            </td>
                                        </tr>
                                        {seq.absences.map((abs: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-6">
                                                    <div className="font-black uppercase text-[10px] tracking-tight text-black">
                                                        {abs.competenceLabel}
                                                    </div>
                                                    <div className="text-[8px] font-bold text-gray-400 uppercase mt-1">
                                                        {abs.matiereLabel}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center font-bold text-xs text-emerald-600">{abs.heuresAJ} H</td>
                                                <td className="p-6 text-center font-bold text-xs text-rose-600">{abs.heuresANJ} H</td>
                                                <td className="p-6 text-center font-black text-xs text-black">{abs.heuresAJ + abs.heuresANJ} H</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                                {(!details.summary?.sequences || details.summary.sequences.every((s: any) => !s.absences || s.absences.length === 0)) && (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-gray-400 uppercase font-black text-[10px] tracking-widest">
                                            Aucune absence enregistrée.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParentPortal;
