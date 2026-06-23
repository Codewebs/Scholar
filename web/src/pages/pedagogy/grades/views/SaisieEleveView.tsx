import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../../../context/SchoolYearContext';
import { studentService } from '../../../../api/studentService';
import { pedagogyService } from '../../../../api/pedagogyService';
import { matiereService } from '../../../../api/matiereService';
import { gradeService } from '../../../../api/gradeService';
import { StudentNoteUiModel } from '../../../../types/grades';
import { SousPeriodeEntity } from '../../../../types/pedagogy';
import GradeSequentialEntry from '../components/GradeSequentialEntry';
import {
    Save,
    Search,
    User,
    Book,
    Calculator,
    AlertCircle,
    CheckCircle2,
    Building2,
    Calendar,
    ChevronRight,
    SearchX,
    Users,
    Zap
} from 'lucide-react';
import AuthButton from '../../../../components/ui/AuthButton';
import { clsx } from 'clsx';

interface SaisieEleveViewProps {
    salle?: any;
    eleve?: any;
    sequence?: any;
    refreshTrigger?: number;
}

const SaisieEleveView: React.FC<SaisieEleveViewProps> = ({ salle: propSalle, eleve: propEleve, sequence: propSequence, refreshTrigger }) => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [step, setStep] = useState<'SALLE' | 'ELEVE' | 'SEQUENCE' | 'SAISIE'>(
    propSalle && propEleve && propSequence ? 'SAISIE' : (propEleve ? 'SAISIE' : (propSalle ? 'ELEVE' : 'SALLE'))
  );

  const [salles, setSalles] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sequences, setSequences] = useState<SousPeriodeEntity[]>([]);
  const [sequenceRepartition, setSequenceRepartition] = useState<any[]>([]);

  const [selectedSalleId, setSelectedSalleId] = useState<number | null>(propSalle?.idSalle || null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(propEleve?.idInscription || null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(propSequence?.idSousPeriode || null);

  useEffect(() => {
    if (propSalle) setSelectedSalleId(propSalle.idSalle);
    if (propEleve) {
        setSelectedStudentId(propEleve.idInscription);
        // If an individual student is passed from parent, jump to entry or sequence selection
        if (propSequence) setStep('SAISIE');
        else if (propSalle) setStep('SEQUENCE');
    }
    if (propSequence) setSelectedSequenceId(propSequence.idSousPeriode);
  }, [propSalle, propEleve, propSequence]);

  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSequential, setShowSequential] = useState(false);
  const [sequentialIndex, setSequentialIndex] = useState(0);

  const [matiereCompetences, setMatiereCompetences] = useState<{[key: number]: any[]}>({});

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
    if (selectedSalleId) {
        studentService.getStudentsByRoom(yearId!, selectedSalleId).then(res => {
            setStudents(res.data);
        });
    }
  }, [selectedSalleId, yearId]);

  useEffect(() => {
    if (selectedStudentId && selectedSequenceId) {
        handleLoadNotes();
    }
  }, [selectedStudentId, selectedSequenceId, refreshTrigger]);

  const handleLoadNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const salle = salles.find(s => s.idSalle === selectedSalleId);
      if (!salle) {
          return;
      }

      // 1. Get class subjects (repartition) and notes in parallel
      const [repartitionRes, notesRes] = await Promise.all([
          matiereService.getRepartition(yearId!, salle.idClasse, salle.idSalle),
          gradeService.getNotesByStudent(
            selectedStudentId!,
            selectedSequenceId!,
            yearId!,
            salle.idClasse
          )
      ]);

      const repartitions = repartitionRes.data;
      const existingNotes = notesRes.data;

      // 2. Load competences for each subject in this sequence
      const compsMap: {[key: number]: any[]} = {};
      await Promise.all(repartitions.map(async (r: any) => {
          const cRes = await matiereService.getRepartitionCompetences({
              repartitionMatiereId: r.idRepartitionMatiere,
              sequenceId: selectedSequenceId!
          });
          compsMap[r.idRepartitionMatiere] = cRes.data;
      }));
      setMatiereCompetences(compsMap);

      // 3. Flatten: Iterate over subjects, then their competencies
      const gridNotes: any[] = [];
      repartitions.forEach((r: any) => {
          const comps = compsMap[r.idRepartitionMatiere] || [];

          if (comps.length === 0) {
              // Standard mode
              const note = existingNotes.find((n: any) =>
                  Number(n.idRepartitionMatiere) === Number(r.idRepartitionMatiere) && !n.idRepartitionCompetence
              );
              gridNotes.push({
                  ...r,
                  idInscription: selectedStudentId!,
                  matiereLabel: r.Matiere?.libelleFr || r.Matiere?.libelle,
                  idNote: note?.idNote,
                  note: note?.note ?? null,
                  cote: note?.cote,
                  nonClasse: note?.nonClasse || false
              });
          } else {
              // APC mode: Match by idRepartitionCompetence
              comps.forEach(c => {
                  const note = existingNotes.find((n: any) =>
                      Number(n.idRepartitionCompetence) === Number(c.id)
                  );
                  gridNotes.push({
                      ...r,
                      idInscription: selectedStudentId!,
                      matiereLabel: r.Matiere?.libelleFr || r.Matiere?.libelle,
                      idNote: note?.idNote,
                      note: note?.note ?? null,
                      cote: note?.cote,
                      nonClasse: note?.nonClasse || false,
                      idCompetence: c.idCompetence,
                      idRepartitionCompetence: c.id,
                      competenceLabel: c.Competence?.libelle
                  });
              });
          }
      });

      setNotes(gridNotes);

    } catch (err) {
      setError("Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...notes];
    const val = parseFloat(value);
    newNotes[index].note = isNaN(val) ? null : val;
    setNotes(newNotes);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Validation: idRepartitionCompetence is mandatory
      const invalidNotes = notes.filter(n => n.idCompetence && !n.idRepartitionCompetence);
      if (invalidNotes.length > 0) {
          throw new Error("Erreur de configuration: ID Répartition Compétence manquant.");
      }

      const payload = {
        notes: notes.map(n => ({
          idRepartitionMatiere: n.idRepartitionMatiere,
          idCompetence: n.idCompetence,
          idRepartitionCompetence: n.idRepartitionCompetence,
          note: n.note,
          idNote: n.idNote,
          nonClasse: n.nonClasse,
          idJustification: n.idJustification,
          cote: n.cote
        })),
        idInscription: selectedStudentId!,
        idSequence: selectedSequenceId!,
        idAnneeScolaire: yearId!,
        modeSaisie: 'NUMERIC'
      };

      const response = await gradeService.saveStudentNotes(payload as any);
      setSuccess("Notes enregistrées !");
      setTimeout(() => setSuccess(null), 3000);
      handleLoadNotes();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSequentialSave = async (index: number, note: number | null, mode: 'DECIMAL' | 'ALPHABETIC', cote?: string, competenceId?: number) => {
    const newNotes = [...notes];
    newNotes[index].note = note;
    newNotes[index].cote = cote;
    newNotes[index].idCompetence = competenceId;
    setNotes(newNotes);

    const payload = {
        notes: [{
            idRepartitionMatiere: newNotes[index].idRepartitionMatiere,
            idCompetence: competenceId,
            idRepartitionCompetence: newNotes[index].idRepartitionCompetence,
            note: note,
            idNote: newNotes[index].idNote,
            nonClasse: false,
            idJustification: null,
            cote: cote
        }],
        idInscription: selectedStudentId!,
        idSequence: selectedSequenceId!,
        idAnneeScolaire: yearId!,
        modeSaisie: mode === 'DECIMAL' ? 'NUMERIC' : 'ALPHABETIC'
    };
    await gradeService.saveStudentNotes(payload as any);
  };

  const selectedSalle = salles.find(s => s.idSalle === selectedSalleId);
  const selectedStudent = students.find(s => s.idInscription === selectedStudentId);
  const selectedSequence = sequences.find(s => s.idSousPeriode === selectedSequenceId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Selection Summary (Breadcrumbs) */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
          <SelectionSummaryItem
            label="Salle"
            value={selectedSalle?.nomSalle}
            isActive={step === 'SALLE'}
            onClick={() => { setStep('SALLE'); setSelectedStudentId(null); setSelectedSequenceId(null); }}
          />
          {selectedSalle && <ChevronRight size={14} className="text-gray-300" />}

          <SelectionSummaryItem
            label="Élève"
            value={selectedStudent ? `${selectedStudent.nom} ${selectedStudent.prenom}` : undefined}
            isActive={step === 'ELEVE'}
            isVisible={!!selectedSalle}
            onClick={() => { setStep('ELEVE'); setSelectedSequenceId(null); }}
          />
          {selectedStudent && <ChevronRight size={14} className="text-gray-300" />}

          <SelectionSummaryItem
            label="Évaluation"
            value={selectedSequence?.libelleSousPeriodeFr}
            isActive={step === 'SEQUENCE'}
            isVisible={!!selectedStudent}
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
                        onClick={() => { setSelectedSalleId(s.idSalle); setStep('ELEVE'); }}
                    />
                ))}
            </div>
        )}

        {step === 'ELEVE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
                {students.map(s => (
                    <SelectionCard
                        key={s.idInscription}
                        title={`${s.nom} ${s.prenom}`}
                        subtitle={s.matricule || "SANS MATRICULE"}
                        icon={User}
                        onClick={() => { setSelectedStudentId(s.idInscription); setStep('SEQUENCE'); }}
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
            <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in duration-500">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-lg">
                                {selectedStudent?.nom} {selectedStudent?.prenom}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {selectedSalle?.nomSalle} — {notes.length} Matières
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => { setSequentialIndex(0); setShowSequential(true); }}
                            className="p-3 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-2xl transition-all shadow-sm"
                            title="Saisie Rapide"
                        >
                            <Zap size={20} />
                        </button>
                        <AuthButton
                            onClick={handleSave}
                            disabled={saving || notes.length === 0}
                            className="md:w-auto px-10 bg-black shadow-xl"
                        >
                            <div className="flex items-center space-x-2">
                                <Save size={18} />
                                <span>{saving ? "..." : "Enregistrer Fiche"}</span>
                            </div>
                        </AuthButton>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                             <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-black">Génération...</p>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                           <SearchX size={48} className="mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucune matière configurée</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white z-[5] shadow-sm">
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Matière / Compétence</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Coef</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 w-48">Note (/20)</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cote</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {notes.map((n, idx) => (
                                    <tr key={`${n.idRepartitionMatiere}-${n.idCompetence || 'gen'}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                                    <Book size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm uppercase tracking-tight text-black">{n.matiereLabel}</span>
                                                    {n.competenceLabel && (
                                                        <span className="text-[9px] font-bold text-accent uppercase flex items-center gap-1 mt-1">
                                                            <Zap size={10} />
                                                            {n.competenceLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-500">x{n.coef}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative max-w-[120px] mx-auto">
                                                <input
                                                    type="number"
                                                    step="0.25"
                                                    min="0"
                                                    max="20"
                                                    className={clsx(
                                                        "w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-center font-black text-lg outline-none transition-all",
                                                        n.note !== null && n.note < 10 ? "text-red-500" : "text-black"
                                                    )}
                                                    value={n.note === null ? "" : n.note}
                                                    onChange={(e) => handleNoteChange(idx, e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {n.cote ? (
                                                <span className={clsx(
                                                    "px-4 py-1.5 rounded-full text-[10px] font-black",
                                                    n.note >= 10 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                )}>{n.cote}</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-200 uppercase">---</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
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

      <GradeSequentialEntry
        isOpen={showSequential}
        onClose={() => { setShowSequential(false); handleLoadNotes(); }}
        items={notes}
        currentIndex={sequentialIndex}
        onNavigate={setSequentialIndex}
        onSave={handleSequentialSave}
        mode="BY_ELEVE"
        studentName={selectedStudent ? `${selectedStudent.nom} ${selectedStudent.prenom}` : undefined}
      />
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

export default SaisieEleveView;
