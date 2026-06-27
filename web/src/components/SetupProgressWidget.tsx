import React, { useState } from 'react';
import { useSchoolYear } from '../context/SchoolYearContext';
import { dashboardService } from '../api/dashboardService';
import { SetupProgress } from '../types/models';
import {
  ClipboardList,
  X,
  CheckCircle2,
  Circle,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

const SetupProgressWidget: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [isOpen, setIsProgressOpen] = useState(false);
  const [progress, setProgress] = useState<SetupProgress | null>(null);

  const currentSchoolId = Number(localStorage.getItem('school_id') || 0);

  const fetchProgress = async () => {
    if (!currentSchoolId) return;
    try {
      const res = await dashboardService.getSetupProgress(currentSchoolId, selectedYear?.idServeur);
      setProgress(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleOpen = () => {
    if (!isOpen) fetchProgress();
    setIsProgressOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-8 left-8 z-[60] flex flex-col items-start no-print">
      {isOpen && (
        <div className="mb-6 w-80 bg-white border border-border rounded-[24px] shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h4 className="font-black uppercase tracking-widest text-xs">Suivi de configuration</h4>
            <button onClick={() => setIsProgressOpen(false)} className="hover:rotate-90 transition-transform">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-6">
            {progress ? (
              Object.entries(progress).map(([key, item]: [string, any]) => (
                <div key={key} className="flex items-center space-x-4 group">
                  <div className={clsx(
                    "transition-colors duration-300",
                    item.done ? "text-accent" : "text-gray-200"
                  )}>
                    {item.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className={clsx(item.done ? "text-black" : "text-[#9E9E9E]")}>{item.label || key}</span>
                      <span className="text-[#9E9E9E]">{item.count}/{item.total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={clsx("h-full transition-all duration-1000", item.done ? "bg-accent" : "bg-black/20")}
                        style={{ width: `${(item.count / item.total) * 100 || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                 <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest leading-relaxed">Synchronisation des données...</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100">
             <button className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-accent hover:text-black transition-colors">
                <span>Finaliser la structure</span>
                <ChevronRight size={14} />
             </button>
          </div>
        </div>
      )}

      <button
        onClick={toggleOpen}
        className={clsx(
          "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 group",
          isOpen ? "bg-black text-white" : "bg-white text-black border-2 border-black hover:bg-black hover:text-white"
        )}
      >
        {isOpen ? <X size={24} /> : <ClipboardList size={28} className={clsx(!isOpen && "group-hover:text-accent transition-colors")} />}
      </button>
    </div>
  );
};

export default SetupProgressWidget;
