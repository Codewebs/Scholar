import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { gradeService } from '../../api/gradeService';
import { financeService } from '../../api/financeService';
import { EleveUiModel } from '../../types/student';
import {
  Trophy,
  BookOpen,
  TrendingUp,
  Clock,
  Bell,
  Download,
  CreditCard,
  FileText
} from 'lucide-react';
import { clsx } from 'clsx';

const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useSchoolYear();
  const [student, setStudent] = useState<EleveUiModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
      notes: any[];
      finance: any;
  }>({ notes: [], finance: null });

  useEffect(() => {
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (yearId) {
        setLoading(true);
        // Backend filters by linked user for STUDENT role
        studentService.getAllStudents(yearId).then(async res => {
            if (res.data.length > 0) {
                const s = res.data[0];
                setStudent(s);

                try {
                    const [finRes, noteRes] = await Promise.all([
                        financeService.getStudentPaymentDetails(s.idEleve, yearId),
                        gradeService.getNotesByStudent(s.idEleve, 1, yearId, 0)
                    ]);
                    setData({ finance: finRes.data, notes: noteRes.data });
                } catch (e) {
                    console.error("Error fetching student details", e);
                }
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [selectedYear]);

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!student) {
      return (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
              <BookOpen size={64} className="mx-auto text-gray-200 mb-6" />
              <h2 className="text-xl font-black uppercase">Profil non trouvé</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">
                  Ton compte n'est pas encore lié à un dossier élève valide. Contacte l'administration.
              </p>
          </div>
      );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Welcome Banner */}
      <div className="relative bg-black text-white p-12 rounded-[40px] overflow-hidden shadow-2xl">
         <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <Trophy size={14} className="text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tableau de Bord Élève</span>
            </div>
            <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Salut, {user?.nom.split(' ')[0]} 👋</h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Classe: {student.classeLabel || 'N/A'} — Année {selectedYear?.libelleAnneeScolaire}</p>
         </div>
         <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent/20 to-transparent"></div>
         <BookOpen size={200} className="absolute -right-20 -bottom-20 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Left Column: Academic Summary */}
         <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Moyenne Générale', val: '15.82', sub: '/20', icon: TrendingUp, color: 'text-indigo-500' },
                    { label: 'Scolarité', val: data.finance?.soldeRestant === 0 ? 'À JOUR' : `${data.finance?.soldeRestant || 0}`, sub: 'Restant', icon: CreditCard, color: 'text-emerald-500' },
                    { label: 'Absences', val: '00', sub: 'heures', icon: Clock, color: 'text-rose-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-border shadow-sm hover:shadow-xl transition-all group">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-colors shadow-sm">
                            <stat.icon size={20} />
                        </div>
                        <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-baseline space-x-1">
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{stat.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Courses / Subjects from real data */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">Mes Notes Récentes</h3>
                    <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Voir mon relevé</button>
                </div>
                <div className="space-y-4">
                    {data.notes.length > 0 ? data.notes.map((n, i) => (
                        <div key={i} className="bg-white p-6 rounded-[24px] border border-border flex items-center justify-between hover:border-black transition-all shadow-sm">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner">
                                    {n.libelleMatiere.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black uppercase text-xs tracking-tight">{n.libelleMatiere}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-black" style={{ width: `${(n.note/20)*100}%` }}></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400">{n.note}/20</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black">{n.note}</p>
                                <span className={clsx("text-[8px] font-black px-3 py-1 rounded-full uppercase", n.note >= 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                    {n.note >= 10 ? 'Validé' : 'Échec'}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="p-10 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                            <FileText size={32} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase">Aucune note enregistrée pour le moment</p>
                        </div>
                    )}
                </div>
            </div>
         </div>

         {/* Right Column: Timeline & Docs */}
         <div className="space-y-10">
            {/* Timeline */}
            <div className="bg-white p-8 rounded-[40px] border border-border space-y-8 shadow-sm">
                <div className="flex items-center space-x-3">
                    <Bell size={20} className="text-accent" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Agenda</h3>
                </div>
                <div className="space-y-8">
                    {[
                        { date: '15 MARS', title: 'Examen Séquence 2', type: 'Examen' },
                        { date: '22 MARS', title: 'Journée Culturelle', type: 'Activité' },
                    ].map((item, i) => (
                        <div key={i} className="flex space-x-4 group cursor-pointer">
                            <div className="text-center min-w-[50px] bg-gray-50 p-2 rounded-xl group-hover:bg-black group-hover:text-white transition-all">
                                <p className="text-[10px] font-black">{item.date.split(' ')[0]}</p>
                                <p className="text-[8px] font-bold opacity-60 uppercase">{item.date.split(' ')[1]}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase leading-none tracking-tight">{item.title}</p>
                                <span className="inline-block text-[8px] font-black text-accent uppercase tracking-widest">{item.type}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Downloads */}
            <div className="bg-accent text-white p-10 rounded-[40px] space-y-8 shadow-2xl shadow-accent/30 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6">Documents Officiels</h3>
                    <div className="space-y-4">
                        <button className="w-full bg-white/10 hover:bg-white/20 p-5 rounded-[20px] flex items-center justify-between transition-all group border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest">Bulletin T1</span>
                            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>
                        <button className="w-full bg-white/10 hover:bg-white/20 p-5 rounded-[20px] flex items-center justify-between transition-all group border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest">Emploi du temps</span>
                            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StudentPortal;
