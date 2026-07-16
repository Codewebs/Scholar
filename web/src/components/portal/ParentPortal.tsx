import React, { useEffect, useState } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { financeService } from '../../api/financeService';
import { gradeService } from '../../api/gradeService';
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
  Download,
  X
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
      notes?: any[];
      absences?: number;
  }>({});
  const [activeModal, setActiveModal] = useState<'NOTES' | 'FINANCE' | 'ABSENCES' | 'DOCS' | null>(null);

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
      if (!yearId) return;

      try {
          const [finRes, noteRes] = await Promise.all([
              financeService.getStudentPaymentDetails(idEleve, yearId),
              gradeService.getNotesByStudent(idEleve, 1, yearId, 0) // Example params
          ]);
          setDetails({
              finance: finRes.data,
              notes: noteRes.data,
              absences: 0 // Fetch from attendance service when available
          });
      } catch (err) {
          console.error("Error fetching child details", err);
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
                        { label: 'Moyenne Actuelle', val: '14.5', sub: '/20', icon: TrendingUp, color: 'text-indigo-600', onClick: () => setActiveModal('NOTES') },
                        { label: 'Assiduité', val: '02', sub: 'Absences', icon: Calendar, color: 'text-rose-600', onClick: () => setActiveModal('ABSENCES') },
                        { label: 'État Financier', val: details.finance?.soldeRestant === 0 ? 'À JOUR' : `${details.finance?.soldeRestant || 0} CFA`, sub: 'À Payer', icon: CreditCard, color: 'text-emerald-600', onClick: () => setActiveModal('FINANCE') },
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
                    <div className="flex items-center justify-between bg-gray-50 p-6 rounded-[24px]">
                        <div>
                            <p className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest">Séquence Actuelle</p>
                            <h4 className="text-xl font-black uppercase tracking-tight">Première Séquence</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest">Moyenne Générale</p>
                            <span className="text-2xl font-black text-indigo-600">14.50</span>
                        </div>
                    </div>

                    <div className="border border-border rounded-[32px] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-border">
                                <tr>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest">Matière</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Note /20</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Coef</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Observation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(details.notes || []).map((n: any, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-6 font-black uppercase text-[10px] tracking-tight">{n.libelleMatiere}</td>
                                        <td className="p-6 text-center font-black text-xs">{n.note}</td>
                                        <td className="p-6 text-center text-[10px] font-bold text-gray-500">{n.coefficient}</td>
                                        <td className="p-6 text-center">
                                            <span className={clsx(
                                                "text-[8px] font-black px-3 py-1 rounded-full uppercase",
                                                n.note >= 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {n.note >= 12 ? 'Très Bien' : n.note >= 10 ? 'Passable' : 'Insuffisant'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
        )}

        {activeModal === 'FINANCE' && (
            <Modal title="Situation Financière" onClose={() => setActiveModal(null)}>
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Payé</p>
                            <p className="text-3xl font-black text-emerald-900">{details.finance?.totalPaye || 0} CFA</p>
                        </div>
                        <div className="bg-rose-50 p-8 rounded-[32px] border border-rose-100">
                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2">Reste à Payer</p>
                            <p className="text-3xl font-black text-rose-900">{details.finance?.soldeRestant || 0} CFA</p>
                        </div>
                        <div className="bg-black p-8 rounded-[40px] text-white flex flex-col justify-between">
                            <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-4">Prochaine Échéance</p>
                            <p className="text-lg font-black uppercase tracking-tighter">15 Décembre 2024</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest px-2">Historique des Versements</h4>
                        <div className="space-y-4">
                            {(details.finance?.transactions || []).map((t: any, i: number) => (
                                <div key={i} className="bg-white border border-border p-6 rounded-[24px] flex items-center justify-between hover:border-black transition-all">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-tight">{t.libelleFrais}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{new Date(t.datePaiement).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-black">{t.montantVerse} CFA</p>
                                        <button className="text-[8px] font-black text-accent uppercase tracking-widest hover:underline mt-1">Reçu PDF</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParentPortal;
