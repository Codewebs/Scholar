import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../../../context/SchoolYearContext';
import { studentService } from '../../../../api/studentService';
import { gradeService } from '../../../../api/gradeService';
import {
    Zap,
    Clock,
    User,
    SearchX,
    Binary
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DisciplineViewProps {
    salle: any;
    sequence: any;
    matiere: any;
    competence: any;
    refreshTrigger?: number;
}

const DisciplineView: React.FC<DisciplineViewProps> = ({
    salle,
    sequence,
    matiere,
    competence,
    refreshTrigger
}) => {
  const { t } = useTranslation();
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (salle && sequence && yearId) {
        handleLoadAbsences();
    }
  }, [salle, sequence, matiere, competence, yearId, refreshTrigger]);

  const handleLoadAbsences = async () => {
    setLoading(true);
    try {
      const res = await gradeService.getAbsencesBySalle(
          salle.idSalle,
          sequence.idSousPeriode,
          yearId!,
          competence?.id
      );
      setAbsences(res.data);
    } catch (err) {
      console.error("Error loading absences", err);
    } finally {
      setLoading(false);
    }
  };

  if (!salle || !sequence) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-[32px] border border-gray-100 shadow-sm">
              <SearchX size={48} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest italic opacity-50">Veuillez sélectionner une salle et une séquence</p>
          </div>
      );
  }

  return (
    <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Clock size={24} />
                </div>
                <div>
                    <h3 className="font-black uppercase tracking-tight text-lg">
                        Récapitulatif des Absences
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {salle.classeLabel} {salle.nomSalle} — {sequence.nomSequence || sequence.libelleSequence}
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="bg-accent/10 text-accent px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-accent/20">
                    <Zap size={10} className="fill-accent" />
                    {competence?.Competence?.libelle || "Toutes les compétences"}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                     <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-black">Chargement...</p>
                </div>
            ) : absences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                   <SearchX size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Aucune absence enregistrée</p>
                </div>
            ) : (
                <table className="w-full">
                    <thead className="sticky top-0 bg-white z-[5] shadow-sm">
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Élève</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Abs. Justifiées</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Abs. Non Justifiées</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {absences.map((a, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                            <User size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm uppercase tracking-tight text-black">{a.nomComplet}</span>
                                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{a.matricule}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black">{a.heuresAJ} H</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">{a.heuresANJ} H</span>
                                </td>
                                <td className="px-8 py-6 text-center text-sm font-black text-gray-600">
                                    {Number(a.heuresAJ) + Number(a.heuresANJ)} H
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  );
};

export default DisciplineView;
