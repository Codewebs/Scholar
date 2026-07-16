import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchoolYear } from '../context/SchoolYearContext';
import { dashboardService } from '../api/dashboardService';
import { SetupProgress } from '../types/models';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  X,
  CheckCircle2,
  Circle,
  ChevronRight,
  Info,
  ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const SetupProgressWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedYear } = useSchoolYear();
  const [isOpen, setIsProgressOpen] = useState(false);
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const currentSchoolId = Number(localStorage.getItem('school_id') || 0);

  const fetchProgress = async () => {
    if (!currentSchoolId) return;
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    try {
      const res = await dashboardService.getSetupProgress(currentSchoolId, yearId);
      setProgress(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [currentSchoolId, selectedYear]);

  const roles = (user?.role || '').toUpperCase().split(',').map(r => r.trim());
  const isUsagerOnly = roles.length > 0 && roles.every(r => r === 'PARENT' || r === 'ELEVE' || r === 'DEMANDEUR' || r === 'SANS_ROLE');

  if (isUsagerOnly) return null;

  const itemPaths: Record<string, string> = {
    schoolYear: "/app/admin/config",
    academicProfile: "/app/academic/structure",
    globalFees: "/app/admin/config",
    classFees: "/app/admin/config",
    rooms: "/app/academic/classes",
    periods: "/app/admin/config",
    subPeriods: "/app/admin/config",
    subjects: "/app/pedagogy/matieres"
  };

  const descriptions: Record<string, string> = {
    schoolYear: "Définit la période calendaire des activités scolaires. Indispensable pour l'historique des données.",
    academicProfile: "Configure les cycles (Primaire, Secondaire) et les séries/spécialités de votre établissement.",
    globalFees: "Définit les frais généraux applicables à tout l'établissement (ex: Transport, Tenues).",
    classFees: "Définit les frais spécifiques à chaque niveau ou classe (Pension, Frais techniques).",
    rooms: "Créez vos salles de classe physiques et associez-les aux niveaux correspondants.",
    periods: "Divise l'année scolaire en grandes étapes (ex: Trimestres ou Semestres).",
    subPeriods: "Découpe les périodes en unités d'évaluation (ex: Séquences ou Mois).",
    subjects: "Liste les matières enseignées et définit les coefficients pour le calcul des moyennes."
  };

  const nextStep = useMemo(() => {
    if (!progress) return null;
    const items = Object.entries(progress);
    const pending = items.find(([_, item]) => !item.done);
    return pending ? { key: pending[0], ...pending[1] } : null;
  }, [progress]);

  const toggleOpen = () => {
    if (!isOpen) fetchProgress();
    setIsProgressOpen(!isOpen);
  };

  return (
    <div id="setup-widget" className="fixed bottom-8 left-8 z-[60] flex flex-col items-start no-print">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-6 w-96 bg-white border border-border rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
              <div>
                <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-accent mb-1">{t('setup.widget.title')}</h4>
                <p className="text-[8px] font-bold text-[#9E9E9E] uppercase tracking-widest">Progression de la configuration</p>
              </div>
              <button onClick={() => setIsProgressOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              {progress ? (
                Object.entries(progress).map(([key, item]: [string, any]) => (
                  <div
                    key={key}
                    className="relative group cursor-pointer"
                    onMouseEnter={() => setHoveredItem(key)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                        const path = itemPaths[key];
                        if (path) {
                            navigate(path, { state: { highlight: path } });
                            setIsProgressOpen(false);
                        }
                    }}
                  >
                    <div className="flex items-center space-x-4">
                        <div className={clsx(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                        item.done ? "bg-accent text-white" : "bg-gray-50 text-gray-200 border border-gray-100"
                        )}>
                        {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </div>
                        <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className={clsx(item.done ? "text-black" : "text-[#9E9E9E]")}>{item.label || key}</span>
                            <span className="text-[#9E9E9E]">{item.count}/{item.total}</span>
                        </div>
                        <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden shadow-inner border border-gray-100/50">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.count / item.total) * 100 || 0}%` }}
                                className={clsx("h-full transition-all duration-1000", item.done ? "bg-accent shadow-[0_0_10px_rgba(124,58,237,0.3)]" : "bg-black/20")}
                            ></motion.div>
                        </div>
                        </div>
                    </div>

                    {/* Tooltip Description */}
                    <AnimatePresence>
                        {hoveredItem === key && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 20 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="absolute left-full top-0 ml-4 w-48 bg-black text-white p-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest leading-relaxed shadow-2xl z-[70] pointer-events-none"
                            >
                                <div className="absolute left-[-6px] top-4 w-3 h-3 bg-black rotate-45"></div>
                                {descriptions[key] || "Description non disponible."}
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                   <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest leading-relaxed">{t('setup.widget.syncing')}</p>
                </div>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100">
               <button className="w-full bg-black text-white py-4 rounded-2xl flex items-center justify-center space-x-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent hover:shadow-xl transition-all group">
                  <span>{t('setup.widget.finalize')}</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center space-x-4">
        <button
            onClick={toggleOpen}
            className={clsx(
            "w-20 h-20 rounded-[28px] shadow-2xl flex items-center justify-center transition-all active:scale-90 group relative overflow-hidden border-4 border-white",
            isOpen ? "bg-black text-white rotate-90" : "bg-white text-black hover:bg-black hover:text-white"
            )}
        >
            {isOpen ? <X size={28} /> : <ClipboardList size={32} className={clsx(!isOpen && "group-hover:text-accent transition-colors")} />}
            {progress && !isOpen && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></div>
            )}
        </button>

        {/* Next Step Badge */}
        {!isOpen && nextStep && (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border-2 border-black rounded-[24px] px-6 py-4 shadow-xl flex items-center space-x-4 group cursor-pointer hover:bg-gray-50 transition-all"
                onClick={() => {
                    const path = itemPaths[nextStep.key];
                    if (path) navigate(path, { state: { highlight: path } });
                    else setIsProgressOpen(true);
                }}
            >
                <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Info size={16} />
                </div>
                <div>
                    <p className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest leading-none mb-1">Étape suivante</p>
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-tight text-black">{nextStep.label || nextStep.key}</span>
                        <ArrowRight size={12} className="text-accent group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default SetupProgressWidget;
