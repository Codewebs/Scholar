import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSchoolYear } from '../../context/SchoolYearContext';
import {
  Trophy,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  Bell,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';

const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useSchoolYear();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data for the student
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Welcome Banner */}
      <div className="relative bg-black text-white p-12 rounded-[40px] overflow-hidden shadow-2xl">
         <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <Trophy size={14} className="text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Major de classe - Trimestre 1</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Bonjour, {user?.nom.split(' ')[0]} 👋</h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Tes performances pour l'année {selectedYear?.libelleAnneeScolaire}</p>
         </div>
         <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent/20 to-transparent"></div>
         <BookOpen size={200} className="absolute -right-20 -bottom-20 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Left Column: Academic Summary */}
         <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Moyenne Générale', val: '15.82', sub: '/20', icon: TrendingUp, color: 'text-green-500' },
                    { label: 'Rang', val: '01', sub: 'er', icon: Award, color: 'text-amber-500' },
                    { label: 'Absences', val: '00', sub: 'heures', icon: Clock, color: 'text-red-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-border shadow-sm hover:shadow-xl transition-all group">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-colors">
                            <stat.icon size={20} />
                        </div>
                        <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-baseline space-x-1">
                            <span className={`text-3xl font-black ${stat.color}`}>{stat.val}</span>
                            <span className="text-xs font-bold text-gray-400">{stat.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Courses / Subjects */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black uppercase tracking-tight">Mes Matières</h3>
                    <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Voir tout</button>
                </div>
                <div className="space-y-4">
                    {[
                        { name: 'Mathématiques', note: '18.5', trend: '+1.5', progress: 92 },
                        { name: 'Physique-Chimie', note: '16.0', trend: '-0.5', progress: 80 },
                        { name: 'Français', note: '14.2', trend: '+2.0', progress: 71 },
                    ].map((matiere, i) => (
                        <div key={i} className="bg-white p-6 rounded-[24px] border border-border flex items-center justify-between hover:border-black transition-all">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xs">
                                    {matiere.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black uppercase text-xs tracking-tight">{matiere.name}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-black" style={{ width: `${matiere.progress}%` }}></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400">{matiere.progress}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black">{matiere.note}</p>
                                <p className={`text-[9px] font-bold ${matiere.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                    {matiere.trend}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </div>

         {/* Right Column: Timeline & Docs */}
         <div className="space-y-10">
            {/* Timeline */}
            <div className="bg-white p-8 rounded-[40px] border border-border space-y-8">
                <div className="flex items-center space-x-3">
                    <Bell size={20} className="text-accent" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Évènements à venir</h3>
                </div>
                <div className="space-y-6">
                    {[
                        { date: '15 MARS', title: 'Examen de Mi-Trimestre', type: 'Examen' },
                        { date: '22 MARS', title: 'Sortie Pédagogique', type: 'Activité' },
                        { date: '05 AVRIL', title: 'Vacances de Pâques', type: 'Calendrier' },
                    ].map((item, i) => (
                        <div key={i} className="flex space-x-4">
                            <div className="text-center min-w-[50px]">
                                <p className="text-[10px] font-black">{item.date.split(' ')[0]}</p>
                                <p className="text-[8px] font-bold text-gray-400">{item.date.split(' ')[1]}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase leading-none">{item.title}</p>
                                <span className="inline-block text-[8px] font-bold text-accent uppercase tracking-widest">{item.type}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Downloads */}
            <div className="bg-accent text-white p-8 rounded-[40px] space-y-6 shadow-xl shadow-accent/20">
                <h3 className="text-xs font-black uppercase tracking-widest">Mes Documents</h3>
                <div className="space-y-3">
                    <button className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-between transition-all group">
                        <span className="text-[10px] font-black uppercase">Bulletin Trimestre 1</span>
                        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                    </button>
                    <button className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-between transition-all group">
                        <span className="text-[10px] font-black uppercase">Emploi du temps</span>
                        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StudentPortal;
