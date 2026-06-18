import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../../../context/SchoolYearContext';
import { studentService } from '../../../../api/studentService';
import { pedagogyService } from '../../../../api/pedagogyService';
import { matiereService } from '../../../../api/matiereService';
import { gradeService } from '../../../../api/gradeService';
import { NoteUiModel } from '../../../../types/grades';
import { SousPeriodeEntity } from '../../../../types/pedagogy';
import GradeSequentialEntry from '../components/GradeSequentialEntry';
import {
    Save,
    Search,
    User,
    Hash,
    FileEdit,
    AlertCircle,
    CheckCircle2,
    Building2,
    Book,
    Calendar,
    ChevronRight,
    SearchX,
    Zap
} from 'lucide-react';
import AuthButton from '../../../../components/ui/AuthButton';
import { clsx } from 'clsx';

interface SaisieMatiereViewProps {
    salle?: any;
    sequence?: any;
    matiere?: any;
}

const SaisieMatiereView: React.FC<SaisieMatiereViewProps> = ({ salle: propSalle, sequence: propSequence, matiere: propMatiere }) => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [step, setStep] = useState<'SALLE' | 'REPARTITION' | 'SEQUENCE' | 'SAISIE'>(
    propSalle && propSequence && propMatiere ? 'SAISIE' : 'SALLE'
  );

  const [salles, setSalles] = useState<any[]>([]);
  const [sequences, setSequences] = useState<SousPeriodeEntity[]>([]);
  const [repartitions, setRepartitions] = useState<any[]>([]);
  const [sequenceRepartition, setSequenceRepartition] = useState<any[]>([]);
  const [justifications, setJustifications] = useState<any[]>([]);

  const [selectedSalleId, setSelectedSalleId] = useState<number | null>(propSalle?.idSalle || null);
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(propSequence?.idSousPeriode || null);
  const [selectedRepartitionId, setSelectedRepartitionId] = useState<number | null>(propMatiere?.idMatiere || null);

  useEffect(() => {
    if (propSalle && propSequence && propMatiere) {
        setSelectedSalleId(propSalle.idSalle);
        setSelectedSequenceId(propSequence.idSousPeriode);
        setSelectedRepartitionId(propMatiere.idMatiere);
        setStep('SAISIE');
    }
  }, [propSalle, propSequence, propMatiere]);

  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSequential, setShowSequential] = useState(false);
  const [sequentialIndex, setSequentialIndex] = useState(0);

  const [competences, setCompetences] = useState<any[]>([]);

  useEffect(() => {
    if (yearId) {
      loadInitialData();
    }
  }, [yearId]);

  const loadInitialData = async () => {
    try {
      const [roomsRes, periodsRes, justRes, seqRepRes] = await Promise.all([
        studentService.getRooms(yearId!),
        pedagogyService.getPeriodes(yearId!),
        gradeService.getJustifications(),
        pedagogyService.getSequenceRepartition(yearId!)
      ]);

      const activeRooms = roomsRes.data
        .filter((r: any) => !r.supprimer)
        .map((r: any) => ({
            ...r,
            nomSalle: r.nomSalle || r.nom || 'N/A',
            Classe: {
                ...r.Classe,
                nomClasse: r.Classe?.libelleFr || r.Classe?.nomClasse || 'N/A'
            }
        }));
      setSalles(activeRooms);
      setJustifications(justRes.data);
      setSequenceRepartition(seqRepRes.data);

      const allSequences: SousPeriodeEntity[] = [];
      periodsRes.data.forEach((p) => {
        if (p.sousPeriodes) allSequences.push(...p.sousPeriodes);
      });
      setSequences(allSequences);
    } catch (err) {
      setError("Erreur lors du chargement des données");
    }
  };

  useEffect(() => {
    if (selectedSalleId) {
        const salle = salles.find(s => s.idSalle === selectedSalleId);
        if (salle) {
            matiereService.getRepartition(yearId!, salle.idClasse).then(res => {
                const normalized = res.data.map((r: any) => ({
                    ...r,
                    Matiere: {
                        ...r.Matiere,
                        libelleFr: r.Matiere?.libelleFr || r.Matiere?.libelle // Safety
                    }
                }));
                setRepartitions(normalized);
            });
        }
    }
  }, [selectedSalleId, yearId, salles]);

  useEffect(() => {
    if (selectedSalleId && selectedRepartitionId && selectedSequenceId) {
        handleLoadNotes();
    }
  }, [selectedSalleId, selectedRepartitionId, selectedSequenceId]);

  const handleLoadNotes = async () => {
    setLoading(true);
    setError(null);
    console.log(`🔍 [SaisieMatiere] Loading notes for Salle: ${selectedSalleId}, Repartition: ${selectedRepartitionId}, Sequence: ${selectedSequenceId}`);
    try {
      // 1. Get room students
      const studentsRes = await studentService.getStudentsByRoom(yearId!, selectedSalleId!);
      const roomStudents = studentsRes.data;
      console.log(`👥 [SaisieMatiere] ${roomStudents.length} students found in room`);

      // 2. Get existing notes for this subject and sequence
      const [notesRes, compsRes] = await Promise.all([
          gradeService.getNotesByMatiere(
              selectedSalleId!,
              selectedRepartitionId!,
              selectedSequenceId!,
              yearId!
          ),
          matiereService.getRepartitionCompetences({
              repartitionMatiereId: selectedRepartitionId!,
              sequenceId: selectedSequenceId!
          })
      ]);

      const existingNotes = notesRes.data;
      const comps = compsRes.data;
      console.log(`📚 [SaisieMatiere] ${existingNotes.length} existing notes found. ${comps.length} competencies defined for this sequence.`);
      setCompetences(comps);

      // 3. Flatten: Iterate over students, then subject competencies
      const gridNotes: any[] = [];
      roomStudents.forEach((s: any) => {
          const studentName = s.nomComplet || `${s.nom || ''} ${s.prenom || ''}`.trim() || "Élève inconnu";
          const studentNotes = existingNotes.filter((n: any) => n.idInscription === s.idInscription);

          // Calculate missing competencies for the "chips" display
          const missing = comps.length === 0
              ? (studentNotes.some(n => !n.idCompetence && n.note !== null) ? [] : [{ label: 'GÉN' }])
              : comps.filter(c => !studentNotes.some(n => n.idCompetence === c.idCompetence && n.note !== null))
                     .map(c => ({ label: c.Competence?.abreviation || c.Competence?.libelle?.substring(0, 3) }));

          if (comps.length === 0) {
              // Standard mode
              const note = studentNotes.find((n: any) => !n.idCompetence);
              gridNotes.push({
                  ...s,
                  idInscription: s.idInscription,
                  nomComplet: studentName,
                  matricule: s.matricule,
                  idNote: note?.idNote,
                  note: note?.note ?? null,
                  cote: note?.cote,
                  nonClasse: note?.nonClasse || false,
                  idJustification: note?.idJustification,
                  missingCompetencies: missing
              });
          } else {
              // APC mode
              comps.forEach(c => {
                  const note = studentNotes.find((n: any) =>
                      n.idCompetence === c.idCompetence
                  );
                  gridNotes.push({
                      ...s,
                      idInscription: s.idInscription,
                      nomComplet: studentName,
                      matricule: s.matricule,
                      idNote: note?.idNote,
                      note: note?.note ?? null,
                      cote: note?.cote,
                      nonClasse: note?.nonClasse || false,
                      idJustification: note?.idJustification,
                      idCompetence: c.idCompetence,
                      idRepartitionCompetence: c.idRepartitionCompetence,
                      competenceLabel: c.Competence?.libelle,
                      missingCompetencies: missing
                  });
              });
          }
      });

      console.log(`✅ [SaisieMatiere] Grid prepared with ${gridNotes.length} rows`);
      setNotes(gridNotes);
    } catch (err) {
      console.error("❌ [SaisieMatiere Error] handleLoadNotes:", err);
      setError("Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...notes];
    const val = parseFloat(value);
    newNotes[index].note = isNaN(val) ? null : val;
    newNotes[index].nonClasse = false;
    setNotes(newNotes);
  };

  const toggleNonClasse = (index: number) => {
    const newNotes = [...notes];
    newNotes[index].nonClasse = !newNotes[index].nonClasse;
    if (newNotes[index].nonClasse) {
        newNotes[index].note = null;
    }
    setNotes(newNotes);
  };

  const handleJustificationChange = (index: number, justId: string) => {
    const newNotes = [...notes];
    newNotes[index].idJustification = justId ? Number(justId) : null;
    setNotes(newNotes);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    console.log("💾 [SaisieMatiere] Initiating Bulk Save...");
    try {
        // Validation: idRepartitionCompetence is mandatory
        const invalidNotes = notes.filter(n => n.idCompetence && !n.idRepartitionCompetence);
        if (invalidNotes.length > 0) {
            console.error("❌ [SaisieMatiere Validation] Some notes are missing idRepartitionCompetence", invalidNotes);
            throw new Error("Erreur de configuration: ID Répartition Compétence manquant.");
        }

      const payload = {
        notes: notes.map(n => ({
          idInscription: n.idInscription,
          idCompetence: n.idCompetence,
          idRepartitionCompetence: n.idRepartitionCompetence,
          note: n.note,
          idNote: n.idNote,
          nonClasse: n.nonClasse,
          idJustification: n.idJustification,
          cote: n.cote
        })),
        idSequence: selectedSequenceId!,
        idAnneeScolaire: yearId!,
        modeSaisie: 'NUMERIC'
      };

      console.log(`📤 [SaisieMatiere] Sending ${payload.notes.length} notes to server. Sample item:`, payload.notes[0]);

      const response = await gradeService.saveNotes(payload as any);
      console.log("✅ [SaisieMatiere] Save successful:", response.data);
      setSuccess("Notes enregistrées !");
      setTimeout(() => setSuccess(null), 3000);
      handleLoadNotes();
    } catch (err: any) {
      console.error("❌ [SaisieMatiere Save Error]:", err);
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
    newNotes[index].nonClasse = false;
    setNotes(newNotes);

    const payload = {
        notes: [{
            idInscription: newNotes[index].idInscription,
            idCompetence: competenceId,
            idRepartitionCompetence: newNotes[index].idRepartitionCompetence, // Ajouté
            note: note,
            idNote: newNotes[index].idNote,
            nonClasse: false,
            idJustification: null,
            cote: cote
        }],
        idSequence: selectedSequenceId!,
        idAnneeScolaire: yearId!,
        modeSaisie: mode === 'DECIMAL' ? 'NUMERIC' : 'ALPHABETIC'
    };

    console.log("🔥 [FULL PAYLOAD] Saving Single Grade (Sequential):", JSON.stringify(payload, null, 2));

    if (competenceId === undefined) {
        console.warn("⚠️ [WARNING] Saving note without competenceId!");
    }

    const res = await gradeService.saveNotes(payload as any);
    console.log("✅ [SERVER RESPONSE] Sequential Save Response:", res.data);
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

  const selectedSalle = salles.find(s => s.idSalle === selectedSalleId);
  const selectedRepartition = repartitions.find(r => r.idRepartitionMatiere === selectedRepartitionId);
  const selectedSequence = sequences.find(s => s.idSousPeriode === selectedSequenceId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Selection Summary (Breadcrumbs) */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
          <SelectionSummaryItem
            label="Salle"
            value={selectedSalle?.nomSalle}
            isActive={step === 'SALLE'}
            onClick={() => { setStep('SALLE'); setSelectedRepartitionId(null); setSelectedSequenceId(null); }}
          />
          {selectedSalle && <ChevronRight size={14} className="text-gray-300" />}

          <SelectionSummaryItem
            label="Matière"
            value={selectedRepartition?.Matiere?.libelleFr || selectedRepartition?.Matiere?.libelle}
            isActive={step === 'REPARTITION'}
            isVisible={!!selectedSalle}
            onClick={() => { setStep('REPARTITION'); setSelectedSequenceId(null); }}
          />
          {selectedRepartition && <ChevronRight size={14} className="text-gray-300" />}

          <SelectionSummaryItem
            label="Évaluation"
            value={selectedSequence?.libelleSousPeriodeFr}
            isActive={step === 'SEQUENCE'}
            isVisible={!!selectedRepartition}
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
                        onClick={() => { setSelectedSalleId(s.idSalle); setStep('REPARTITION'); }}
                    />
                ))}
            </div>
        )}

        {step === 'REPARTITION' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
                {repartitions.map(r => (
                    <SelectionCard
                        key={r.idRepartitionMatiere}
                        title={r.Matiere?.libelleFr || r.Matiere?.libelle}
                        subtitle={`Coefficient: ${r.coef}`}
                        icon={Book}
                        onClick={() => { setSelectedRepartitionId(r.idRepartitionMatiere); setStep('SEQUENCE'); }}
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
                            <FileEdit size={24} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-lg">
                                {selectedRepartition?.Matiere?.libelleFr || selectedRepartition?.Matiere?.libelle}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {competences.map(c => (
                                    <span key={c.idCompetence} className="text-[10px] font-black uppercase text-accent bg-accent/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Zap size={10} />
                                        {c.Competence?.libelle}
                                    </span>
                                ))}
                            </div>
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
                                <span>{saving ? "..." : "Enregistrer"}</span>
                            </div>
                        </AuthButton>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                             <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-black">Chargement...</p>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                           <SearchX size={48} className="mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucun élève trouvé</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white z-[5] shadow-sm">
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Élève</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 w-48">Note (/20)</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Options</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cote</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {notes.map((n, idx) => (
                                    <tr key={`${n.idInscription}-${n.idCompetence || 'general'}`} className={clsx("hover:bg-gray-50/50 transition-colors", n.nonClasse && "bg-orange-50/30")}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400">
                                                    {n.nomComplet?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm uppercase tracking-tight text-black">{n.nomComplet}</span>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        <span className="text-[9px] font-bold text-gray-300 uppercase">{n.matricule}</span>
                                                        {n.missingCompetencies?.map((mc, i) => (
                                                            <span key={i} className="text-[7px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase">
                                                                {mc.label}
                                                            </span>
                                                        ))}
                                                        {n.competenceLabel && (
                                                            <span className="text-[9px] font-black text-accent uppercase flex items-center gap-1 ml-1 bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10">
                                                                <Zap size={10} />
                                                                {n.competenceLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative max-w-[120px] mx-auto">
                                                <input
                                                    type="number"
                                                    step="0.25"
                                                    min="0"
                                                    max="20"
                                                    disabled={n.nonClasse}
                                                    className={clsx(
                                                        "w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 text-center font-black text-lg outline-none transition-all",
                                                        n.note !== null && n.note < 10 ? "text-red-500" : "text-black",
                                                        n.nonClasse && "opacity-20"
                                                    )}
                                                    value={n.note === null ? "" : n.note}
                                                    onChange={(e) => handleNoteChange(idx, e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center space-y-2">
                                                <button
                                                    onClick={() => toggleNonClasse(idx)}
                                                    className={clsx(
                                                        "text-[9px] font-black uppercase px-3 py-1 rounded-full border-2 transition-all",
                                                        n.nonClasse ? "bg-orange-500 border-orange-500 text-white" : "border-gray-100 text-gray-400 hover:border-orange-200"
                                                    )}
                                                >
                                                    Non Classé
                                                </button>
                                                {n.nonClasse && (
                                                    <select
                                                        className="text-[9px] font-bold bg-white border border-orange-200 rounded-lg p-1 outline-none"
                                                        value={n.idJustification || ""}
                                                        onChange={(e) => handleJustificationChange(idx, e.target.value)}
                                                    >
                                                        <option value="">Motif...</option>
                                                        {justifications.map(j => (
                                                            <option key={j.idJustification} value={j.idJustification}>{j.libelle}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {n.nonClasse ? (
                                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">N.C</span>
                                            ) : n.cote ? (
                                                <div className="flex flex-col items-center">
                                                    <span className={clsx(
                                                        "px-4 py-1.5 rounded-full text-[10px] font-black",
                                                        n.note >= 10 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                    )}>{n.cote}</span>
                                                </div>
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
        mode="BY_MATIERE"
        noteSur={selectedRepartition?.noteSur || 20}
        subjectLabel={selectedRepartition?.Matiere?.libelleFr || selectedRepartition?.Matiere?.libelle}
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

export default SaisieMatiereView;
