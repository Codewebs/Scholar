import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../../../context/SchoolYearContext';
import { studentService } from '../../../../api/studentService';
import { pedagogyService } from '../../../../api/pedagogyService';
import { gradeService } from '../../../../api/gradeService';
import { SousPeriodeEntity } from '../../../../types/pedagogy';
import {
    Save,
    Clock,
    AlertCircle,
    CheckCircle2,
    Building2,
    Calendar,
    ChevronRight,
    UserX
} from 'lucide-react';
import AuthButton from '../../../../components/ui/AuthButton';
import { clsx } from 'clsx';

const AbsenceView: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [step, setStep] = useState<'SALLE' | 'SEQUENCE' | 'SAISIE'>('SALLE');

  const [salles, setSalles] = useState<any[]>([]);
  const [sequences, setSequences] = useState<SousPeriodeEntity[]>([]);
  const [sequenceRepartition, setSequenceRepartition] = useState<any[]>([]);

  const [selectedSalleId, setSelectedSalleId] = useState<number | null>(null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(null);

  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (yearId) {
      loadInitialData();
    }
  }, [yearId]);

  const loadInitialData = async () => {
    try {
      const [roomsRes, periodsRes, seqRepRes] = await Promise.all([
        studentService.getRooms(yearId!),
        pedagogyService.getPeriodes(yearId!),
        pedagogyService.getSequenceRepartition(yearId!)
      ]);
      const normalizedRooms = roomsRes.data.map((r: any) => ({
          ...r,
          nomSalle: r.nomSalle || r.nom || 'N/A',
          Classe: {
              ...r.Classe,
              nomClasse: r.Classe?.libelleFr || r.Classe?.nomClasse || 'N/A'
          }
      }));
      setSalles(normalizedRooms);
      setSequenceRepartition(seqRepRes.data);

      const allSequences: SousPeriodeEntity[] = [];
      periodsRes.data.forEach(p => {
        if (p.sousPeriodes) allSequences.push(...p.sousPeriodes);
      });
      setSequences(allSequences);
    } catch (err) {
      setError("Erreur lors du chargement des données");
    }
  };

  const filteredSequences = React.useMemo(() => {
    if (!selectedSalleId) return [];
    const salle = salles.find(s => s.idSalle === selectedSalleId);
    if (!salle) return [];
    const allowedSequenceIds = sequenceRepartition
        .filter(r => r.idClasse === salle.idClasse && !r.supprimer)
        .map(r => Number(r.idSousPeriode));
    if (allowedSequenceIds.length === 0) return [];
    return sequences.filter(s => allowedSequenceIds.includes(Number(s.idSousPeriode)));
  }, [selectedSalleId, salles, sequences, sequenceRepartition]);

  useEffect(() => {
    if (selectedSalleId && selectedSequenceId) {
        handleLoadAbsences();
    }
  }, [selectedSalleId, selectedSequenceId]);

  const handleLoadAbsences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await (gradeService as any).getAbsencesBySalle(
        selectedSalleId!,
        selectedSequenceId!,
        yearId!
      );
      setAbsences(res.data);
    } catch (err) {
      setError("Erreur lors du chargement des absences");
    } finally {
      setLoading(false);
    }
  };

  const handleAbsenceChange = (index: number, field: 'heuresAJ' | 'heuresANJ', value: string) => {
    const newAbs = [...absences];
    const val = parseInt(value);
    newAbs[index][field] = isNaN(val) ? 0 : val;
    setAbsences(newAbs);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        absences: absences.map(a => ({
          idInscription: a.idInscription,
          heuresAJ: a.heuresAJ,
          heuresANJ: a.heuresANJ,
          idSuiviAbsence: a.idSuiviAbsence
        })),
        idSequence: selectedSequenceId!,
        idAnneeScolaire: yearId!
      };
      await (gradeService as any).saveAbsences(payload);
      setSuccess("Absences enregistrées !");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const selectedSalle = salles.find(s => s.idSalle === selectedSalleId);
  const selectedSequence = sequences.find(s => s.idSousPeriode === selectedSequenceId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Selection Summary (Breadcrumbs) */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
          <SelectionSummaryItem
            label="Salle"
            value={selectedSalle?.nomSalle}
            isActive={step === 'SALLE'}
            onClick={() => { setStep('SALLE'); setSelectedSequenceId(null); }}
          />
          {selectedSalle && <ChevronRight size={14} className="text-gray-300" />}

          <SelectionSummaryItem
            label="Évaluation"
            value={selectedSequence?.libelleSousPeriodeFr}
            isActive={step === 'SEQUENCE'}
            isVisible={!!selectedSalle}
            onClick={() => setStep('SEQUENCE')}
          />
      </div>

      <div className="min-h-[500px]">
        {step === 'SALLE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
                {salles.map(s => (
                    <SelectionCard
                        key={s.idSalle}
                        title={`${s.Classe?.nomClasse} ${s.nomLettre || s.nomSalle}`}
                        subtitle={s.nomSalle}
                        icon={Building2}
                        onClick={() => { setSelectedSalleId(s.idSalle); setStep('SEQUENCE'); }}
                    />
                ))}
            </div>
        )}

        {step === 'SEQUENCE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
                {filteredSequences.map(s => (
                    <SelectionCard
                        key={s.idSousPeriode}
                        title={s.libelleSousPeriodeFr}
                        subtitle="Période d'évaluation"
                        icon={Calendar}
                        onClick={() => { setSelectedSequenceId(s.idSousPeriode!); setStep('SAISIE'); }}
                    />
                ))}
            </div>
        )}

        {step === 'SAISIE' && (
            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-lg">Registre d'Absences</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {selectedSalle?.nomSalle} — {absences.length} Élèves
                            </p>
                        </div>
                    </div>

                    <AuthButton
                        onClick={handleSave}
                        disabled={saving || absences.length === 0}
                        className="md:w-auto px-10 bg-black shadow-xl"
                    >
                        <div className="flex items-center space-x-2">
                            <Save size={18} />
                            <span>{saving ? "Sauvegarde..." : "Enregistrer Absences"}</span>
                        </div>
                    </AuthButton>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                             <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-black">Récupération...</p>
                        </div>
                    ) : absences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                           <UserX size={48} className="mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucun élève trouvé</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white z-[5] shadow-sm">
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Élève</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Heures Justifiées</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Non Justifiées</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {absences.map((a, idx) => (
                                    <tr key={a.idInscription} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400">
                                                    {a.nomComplet?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm uppercase tracking-tight text-black">{a.nomComplet}</span>
                                                    <span className="text-[9px] font-bold text-gray-300 uppercase">{a.matricule}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative max-w-[100px] mx-auto">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-green-500 rounded-xl p-3 text-center font-black text-lg outline-none transition-all"
                                                    value={a.heuresAJ}
                                                    onChange={(e) => handleAbsenceChange(idx, 'heuresAJ', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative max-w-[100px] mx-auto">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-xl p-3 text-center font-black text-lg outline-none transition-all"
                                                    value={a.heuresANJ}
                                                    onChange={(e) => handleAbsenceChange(idx, 'heuresANJ', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={clsx(
                                                "inline-flex items-center space-x-2 px-4 py-2 rounded-full font-black text-xs",
                                                (a.heuresAJ + a.heuresANJ) > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"
                                            )}>
                                                <span>{a.heuresAJ + a.heuresANJ} H</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-50">
                    {success && (
                        <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const SelectionSummaryItem: React.FC<{
    label: string;
    value?: string;
    isActive: boolean;
    isVisible?: boolean;
    onClick: () => void;
}> = ({ label, value, isActive, isVisible = true, onClick }) => {
    if (!isVisible) return null;
    return (
        <div
            onClick={onClick}
            className={clsx(
                "px-4 py-2 rounded-2xl cursor-pointer transition-all flex flex-col",
                isActive ? "bg-black text-white shadow-md" : "hover:bg-gray-50"
            )}
        >
            <span className={clsx("text-[8px] font-black uppercase tracking-widest", isActive ? "text-gray-400" : "text-gray-300")}>{label}</span>
            <span className="text-[11px] font-black uppercase tracking-tight">{value || "Choisir..."}</span>
        </div>
    );
};

const SelectionCard: React.FC<{
    title: string;
    subtitle: string;
    icon: any;
    onClick: () => void;
}> = ({ title, subtitle, icon: Icon, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-black transition-all cursor-pointer group flex flex-col items-center text-center space-y-4"
    >
        <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all shadow-inner">
            <Icon size={28} />
        </div>
        <div>
            <h4 className="font-black text-sm uppercase tracking-tight text-black">{title}</h4>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-all">
            <div className="bg-black text-white p-2 rounded-full">
                <ChevronRight size={16} />
            </div>
        </div>
    </div>
);

export default AbsenceView;
