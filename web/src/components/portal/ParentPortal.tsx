import React, { useEffect, useState } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { EleveEntity } from '../../types/models';
import {
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  FileText,
  MessageCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const ParentPortal: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [children, setChildren] = useState<EleveEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedYear?.idServeur) {
        // Backend already filters by phone number for PARENT role
        studentService.getAllStudents(selectedYear.idServeur).then(res => {
            setChildren(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }
  }, [selectedYear]);

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Espace Famille</h2>
          <p className="text-sm text-[#9E9E9E] font-bold uppercase tracking-widest mt-1">Suivi de vos enfants — {selectedYear?.libelleAnneeScolaire}</p>
        </div>
        <div className="bg-green-50 text-green-600 px-4 py-2 rounded-full flex items-center space-x-2 border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Portail Actif</span>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Users size={40} className="text-gray-200" />
            </div>
            <div>
                <h3 className="text-lg font-black uppercase">Aucun enfant trouvé</h3>
                <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto mt-2">
                    Si vos enfants sont inscrits, assurez-vous que votre numéro de téléphone correspond à celui enregistré par l'administration.
                </p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {children.map((child, idx) => (
            <motion.div
              key={child.idServeur || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white border border-border rounded-[32px] shadow-sm hover:shadow-2xl hover:border-black transition-all duration-500 overflow-hidden group"
            >
              <div className="p-8 space-y-8">
                {/* Child Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center shadow-inner">
                        <GraduationCap size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight leading-none">{child.nom} {child.prenom}</h3>
                        <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-[0.2em] mt-2">Matricule: {child.matricule}</p>
                    </div>
                  </div>
                  <span className="bg-black text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                    6ème A
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                        <p className="text-[8px] font-black text-[#9E9E9E] uppercase mb-1">Moyenne</p>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-lg font-black">14.5</span>
                            <span className="text-[10px] text-gray-400">/20</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                        <p className="text-[8px] font-black text-[#9E9E9E] uppercase mb-1">Absences</p>
                        <span className="text-lg font-black text-red-500">02</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                        <p className="text-[8px] font-black text-[#9E9E9E] uppercase mb-1">Solde</p>
                        <span className="text-lg font-black text-green-600">Payé</span>
                    </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                    {[
                        { icon: FileText, label: 'Bulletins', color: 'bg-blue-50 text-blue-600' },
                        { icon: TrendingUp, label: 'Notes', color: 'bg-purple-50 text-purple-600' },
                        { icon: Calendar, label: 'Assiduité', color: 'bg-orange-50 text-orange-600' },
                        { icon: CreditCard, label: 'Finance', color: 'bg-emerald-50 text-emerald-600' },
                    ].map((btn, i) => (
                        <button key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all space-y-2 group/btn">
                            <div className={clsx("p-3 rounded-xl transition-transform group-hover/btn:scale-110", btn.color)}>
                                <btn.icon size={20} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{btn.label}</span>
                        </button>
                    ))}
                </div>
              </div>

              {/* Latest Alert */}
              <div className="bg-black/5 p-4 flex items-center justify-between border-t border-gray-100">
                <div className="flex items-center space-x-3">
                    <AlertCircle size={14} className="text-amber-500" />
                    <span className="text-[9px] font-bold uppercase tracking-tight text-gray-600">Réunion de parents samedi à 10h</span>
                </div>
                <MessageCircle size={14} className="text-gray-400" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
