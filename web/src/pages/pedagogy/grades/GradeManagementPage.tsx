import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../../context/SchoolYearContext';
import { gradeService } from '../../../api/gradeService';
import { studentService } from '../../../api/studentService';
import { pedagogyService } from '../../../api/pedagogyService';
import { matiereService } from '../../../api/matiereService';
import api from '../../../api/axios';
import {
    BookOpen,
    User,
    Clock,
    FileText,
    ChevronRight,
    LayoutGrid,
    GraduationCap,
    ArrowLeft,
    Zap,
    DoorOpen,
    Layers,
    BookMarked,
    SortAsc,
    SortDesc,
    CheckCircle2,
    Users
} from 'lucide-react';
import { clsx } from 'clsx';
import SaisieMatiereView from './views/SaisieMatiereView';
import SaisieEleveView from './views/SaisieEleveView';
import AbsenceView from './views/AbsenceView';
import PVView from './views/PVView';
import JustificationManagement from './components/JustificationManagement';
import GradeSequentialEntry from './components/GradeSequentialEntry';

interface Salle {
    idSalle: number;
    nomSalle: string;
    idClasse: number;
    classeLabel: string;
    capacite?: number;
    studentCount?: number;
    isComplete?: boolean;
}

interface Sequence {
    idSousPeriode: number;
    nomSequence: string;
    libelleSequence?: string;
    isComplete?: boolean;
}

interface Matiere {
    idMatiere: number;
    libelle: string;
    libelleMatiereFr?: string;
    coef: number;
    noteSur?: number;
    isComplete?: boolean;
}

interface Eleve {
    idInscription: number;
    idEleve: number;
    nomEleve: string;
    prenomEleve: string;
    note?: number | null;
    isComplete?: boolean;
    missingCompetencies?: any[];
}

type SortOrder = 'ASC' | 'DESC';
type SalleSortField = 'NAME' | 'COUNT';

type ViewType = 'matiere' | 'eleve' | 'absences' | 'pv' | 'config';
type GradeEntryMode = 'DECIMAL' | 'ALPHABETIC';

const GradeManagementPage: React.FC = () => {
    const { selectedYear } = useSchoolYear();
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

    const [activeView, setActiveView] = useState<ViewType>('matiere');

    // Selection State
    const [salles, setSalles] = useState<Salle[]>([]);
    const [selectedSalle, setSelectedSalle] = useState<Salle | null>(null);

    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);

    const [matieres, setMatieres] = useState<Matiere[]>([]);
    const [selectedMatiere, setSelectedMatiere] = useState<Matiere | null>(null);

    const [eleves, setEleves] = useState<Eleve[]>([]);
    const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
    const [competences, setCompetences] = useState<any[]>([]);
    const [modalItems, setModalItems] = useState<any[]>([]);
    const [modalIndex, setModalIndex] = useState(0);

    const [gradeModalOpen, setGradeModalOpen] = useState(false);
    const [completionPercentage, setCompletionPercentage] = useState(0);

    const [loading, setLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Sorting State
    const [salleSort, setSalleSort] = useState<{ field: SalleSortField, order: SortOrder }>({ field: 'NAME', order: 'ASC' });
    const [sequenceSort, setSequenceSort] = useState<SortOrder>('ASC');
    const [matiereSort, setMatiereSort] = useState<SortOrder>('ASC');
    const [eleveSort, setEleveSort] = useState<SortOrder>('ASC');

    useEffect(() => {
        if (yearId) {
            console.log("🚀 [GradeManagementPage] Year changed, loading salles. YearID:", yearId);
            loadSalles();
        }
    }, [yearId]);

    // When salle changes, load its sequences
    useEffect(() => {
        if (selectedSalle && yearId) {
            console.log("📍 [GradeManagementPage] Salle selected, loading sequences for:", selectedSalle.nomSalle);
            loadSequencesForSalle(selectedSalle);
        }
    }, [selectedSalle, yearId]);

    // When sequence changes, load its matieres
    useEffect(() => {
        if (selectedSalle && selectedSequence && yearId) {
            console.log("📅 [GradeManagementPage] Sequence selected, loading matieres for:", selectedSequence.nomSequence);
            loadMatieresForSalle(selectedSalle, selectedSequence);
        }
    }, [selectedSequence, selectedSalle, yearId]);

    // When salle changes, load eleves
    useEffect(() => {
        if (selectedSalle && yearId) {
            console.log("👥 [GradeManagementPage] Salle selected, loading students for:", selectedSalle.nomSalle);
            loadElevesForSalle(selectedSalle);
        }
    }, [selectedSalle, yearId]);

    const loadSalles = async () => {
        setLoading(true);
        try {
            const res = await studentService.getRooms(yearId!);
            console.log("🏢 [GradeManagementPage] Raw rooms from API:", res.data);

            // Filter: Only active rooms with at least 1 student enrolled this year
            const normalized = res.data
                .filter((s: any) => !s.supprimer && (s.elevesInscrits || 0) > 0)
                .map((s: any) => ({
                    idSalle: s.idSalle,
                    nomSalle: s.nomSalle || s.nom || 'N/A',
                    idClasse: s.idClasse,
                    classeLabel: s.Classe?.libelleClasseFr || s.Classe?.libelleFr || s.Classe?.libelle || 'N/A',
                    studentCount: s.elevesInscrits || 0,
                    isComplete: false
                }));
            console.log("🏢 [GradeManagementPage] Normalized rooms:", normalized);
            console.log("🏢 [GradeManagementPage] Normalized rooms:", normalized);
            setSalles(normalized);
            if (normalized.length > 0 && !selectedSalle) {
                setSelectedSalle(normalized[0]);
            }
        } catch (error) {
            console.error('Erreur chargement salles:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSequencesForSalle = async (salle: Salle) => {
        setLoading(true);
        try {
            const res = await pedagogyService.getClassSequences(yearId!, salle.idClasse);
            console.log("📅 Raw sequences response:", res.data);
            console.log("   Sample sequence:", res.data[0]);
            
            // Map RepartitionSousPeriode data to Sequence interface
            // Structure: { idRepartitionSousPeriode, SousPeriode: { idSousPeriode, libelleSousPeriodeFr, ... } }
            const normalizedSequences = res.data.map((rep: any) => ({
                idSousPeriode: rep.idSousPeriode || rep.SousPeriode?.idSousPeriode,
                nomSequence: rep.SousPeriode?.libelleSousPeriodeFr || 'N/A',
                libelleSequence: rep.SousPeriode?.libelleSousPeriodeFr
            }));
            
            console.log("   Normalized sequences:", normalizedSequences);
            
            setSequences(normalizedSequences);
            if (normalizedSequences.length > 0) {
                setSelectedSequence(normalizedSequences[0]);
            }
        } catch (error) {
            console.error('Erreur chargement séquences:', error);
            setSequences([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMatieresForSalle = async (salle: Salle, sequence: Sequence) => {
        setLoading(true);
        try {
            const res = await api.get(`/pedagogy/matieres/repartition/${yearId}`, {
                params: { idClasse: salle.idClasse }
            });
            
            console.log("📚 Raw matieres response:", res.data);
            console.log("   Sample matiere:", res.data[0]);
            
            // Map RepartitionMatiere data to Matiere interface
            // Structure: { idRepartitionMatiere, coef, noteSur, Matiere: { libelleFr, ... } }
            const normalizedMatieres = res.data.map((rep: any) => ({
                idMatiere: rep.idRepartitionMatiere,
                libelle: rep.Matiere?.libelleFr || rep.Matiere?.libelle || 'N/A',
                libelleMatiereFr: rep.Matiere?.libelleFr,
                coef: rep.coef,
                noteSur: rep.noteSur || 20
            }));
            
            console.log("   Normalized matieres:", normalizedMatieres);
            
            setMatieres(normalizedMatieres);
            if (normalizedMatieres.length > 0) {
                setSelectedMatiere(normalizedMatieres[0]);
            }
        } catch (error) {
            console.error('Erreur chargement matières:', error);
            setMatieres([]);
        } finally {
            setLoading(false);
        }
    };

    const loadElevesForSalle = async (salle: Salle) => {
        setLoading(true);
        try {
            const res = await studentService.getStudentsBySalle(yearId!, salle.idSalle);
            console.log("👥 Raw eleves response:", res.data);
            console.log("   Sample eleve:", res.data[0]);
            
            // Map response to Eleve interface
            // API returns: { idEleve, idInscription, nomComplet, matricule, ... }
            const normalizedEleves = res.data.map((e: any) => ({
                idInscription: e.idInscription || e.idEleve,
                idEleve: e.idEleve,
                nomEleve: e.nomComplet || 'N/A',
                prenomEleve: '',
                note: null  // Will be fetched later
            }));
            
            console.log("   Normalized eleves:", normalizedEleves);

            setEleves(normalizedEleves);
            if (normalizedEleves.length > 0) {
                setSelectedEleve(normalizedEleves[0]);
            }
        } catch (error) {
            console.error('Erreur chargement élèves:', error);
            setEleves([]);
        } finally {
            setLoading(false);
        }
    };

    // When selection is complete, load notes to show progress in the 4th block
    useEffect(() => {
        if (selectedSalle && selectedSequence && selectedMatiere && yearId) {
            console.log("📝 [GradeManagementPage] Selection complete, loading notes for progress...");
            loadNotesForProgress();

            // Fetch competencies for the selected subject
            matiereService.getRepartitionCompetences({
                repartitionMatiereId: selectedMatiere.idMatiere,
                sequenceId: selectedSequence.idSousPeriode
            }).then(res => setCompetences(res.data));
        }
    }, [selectedSalle, selectedSequence, selectedMatiere, yearId]);

    const loadNotesForProgress = async () => {
        console.log("🔍 [Progress] Fetching data for progress calculation...");
        try {
            const [notesRes, compsRes] = await Promise.all([
                gradeService.getNotesByMatiere(
                    selectedSalle!.idSalle,
                    selectedMatiere!.idMatiere,
                    selectedSequence!.idSousPeriode,
                    yearId!
                ),
                matiereService.getRepartitionCompetences({
                    repartitionMatiereId: selectedMatiere!.idMatiere,
                    sequenceId: selectedSequence!.idSousPeriode
                })
            ]);

            const currentNotes = notesRes.data;
            const currentComps = compsRes.data;
            setCompetences(currentComps);

            console.log(`📥 [Progress] ${currentNotes.length} notes and ${currentComps.length} competencies fetched.`);

            // Group notes by student to see which competencies are covered
            const studentNotesMap = new Map<number, any[]>();
            currentNotes.forEach((n: any) => {
                if (!studentNotesMap.has(n.idInscription)) {
                    studentNotesMap.set(n.idInscription, []);
                }
                studentNotesMap.get(n.idInscription)!.push(n);
            });

            setEleves(prev => {
                const updated = prev.map(e => {
                    const studentGrades = studentNotesMap.get(e.idInscription) || [];

                    // Determine missing competencies for this student
                    let missing;
                    if (currentComps.length === 0) {
                        // Standard mode: check if there's at least one note without competenceId
                        const hasNote = studentGrades.some(g => !g.idCompetence && (g.note !== null || g.nonClasse));
                        missing = hasNote ? [] : [{ idCompetence: null, label: 'Générale' }];
                    } else {
                        // APC mode: check each competence
                        missing = currentComps
                            .filter(c => !studentGrades.some(g => g.idCompetence === c.idCompetence && (g.note !== null || g.nonClasse)))
                            .map(c => ({ idCompetence: c.idCompetence, label: c.Competence?.abreviation || c.Competence?.libelle?.substring(0, 3) }));
                    }

                    const isComplete = missing.length === 0;

                    return {
                        ...e,
                        note: isComplete ? 1 : null,
                        isComplete,
                        missingCompetencies: missing
                    };
                });

                console.log("📊 [Progress] Updated student list with missing competencies");
                setTimeout(() => calculateCompletionPercentage(updated), 0);
                return updated;
            });
        } catch (error) {
            console.error('❌ [Progress Error] Erreur chargement données:', error);
        }
    };

    const calculateCompletionPercentage = (elevesData: Eleve[]) => {
        if (elevesData.length === 0) {
            setCompletionPercentage(0);
            return;
        }
        const withGrades = elevesData.filter(e => e.note !== null && e.note !== undefined).length;
        const percent = Math.round((withGrades / elevesData.length) * 100);
        setCompletionPercentage(percent);
        console.log(`📊 [Progress] Room: ${selectedSalle?.nomSalle}, Subject: ${selectedMatiere?.libelle}, Progress: ${percent}%`);

        // Cascading Progress Update
        if (percent === 100 && selectedMatiere) {
            console.log(`✅ [Progress] Subject ${selectedMatiere.libelle} is COMPLETE! Turning green.`);
            setMatieres(prev => prev.map(m =>
                m.idMatiere === selectedMatiere.idMatiere ? { ...m, isComplete: true } : m
            ));
        }

        // Force UI update for student items
        setEleves([...elevesData]);
    };

    // Monitor subjects to update sequences
    useEffect(() => {
        if (matieres.length > 0 && matieres.every(m => m.isComplete) && selectedSequence) {
            setSequences(prev => prev.map(s =>
                s.idSousPeriode === selectedSequence.idSousPeriode ? { ...s, isComplete: true } : s
            ));
        }
    }, [matieres, selectedSequence]);

    // Monitor sequences to update rooms
    useEffect(() => {
        if (sequences.length > 0 && sequences.every(s => s.isComplete) && selectedSalle) {
            setSalles(prev => prev.map(s =>
                s.idSalle === selectedSalle.idSalle ? { ...s, isComplete: true } : s
            ));
        }
    }, [sequences, selectedSalle]);

    const handleOpenGradeModal = async (eleve: Eleve) => {
        setLoading(true);
        console.log(`🚀 [Modal] Opening sequential entry starting with student: ${eleve.nomEleve}`);
        try {
            // Fetch all notes for this room/subject/sequence to populate the whole list
            const notesRes = await gradeService.getNotesByMatiere(
                selectedSalle!.idSalle,
                selectedMatiere!.idMatiere,
                selectedSequence!.idSousPeriode,
                yearId!
            );
            const allNotes = notesRes.data;

            // Prepare items for ALL students (Flattened with competencies)
            const allItems: any[] = [];
            let startIndex = 0;

            // We iterate over sortedEleves to maintain order
            sortedEleves.forEach(student => {
                const studentNotes = allNotes.filter((n: any) => n.idInscription === student.idInscription);

                if (student.idInscription === eleve.idInscription) {
                    startIndex = allItems.length;
                }

                if (competences.length === 0) {
                    const note = studentNotes.find((n: any) => !n.idCompetence);
                    allItems.push({
                        idInscription: student.idInscription,
                        nomComplet: student.nomEleve,
                        matricule: '',
                        note: note?.note ?? null,
                        idNote: note?.idNote,
                        idCompetence: undefined,
                        competenceLabel: 'Générale',
                        coef: selectedMatiere?.coef
                    });
                } else {
                    competences.forEach(c => {
                        const note = studentNotes.find((n: any) => n.idCompetence === c.idCompetence);
                        allItems.push({
                            idInscription: student.idInscription,
                            nomComplet: student.nomEleve,
                            matricule: '',
                            note: note?.note ?? null,
                            idNote: note?.idNote,
                            idCompetence: c.idCompetence,
                            idRepartitionCompetence: c.id,
                            competenceLabel: c.Competence?.libelle,
                            coef: selectedMatiere?.coef
                        });
                    });
                }
            });

            console.log(`📦 [Modal] Prepared ${allItems.length} sequential items for ${sortedEleves.length} students`);
            setModalItems(allItems);
            setModalIndex(startIndex);
            setGradeModalOpen(true);
        } catch (error) {
            console.error("❌ [Modal Error] handleOpenGradeModal:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModalSave = async (index: number, note: number | null, mode: 'DECIMAL' | 'ALPHABETIC', cote?: string, competenceId?: number) => {
        const item = modalItems[index];

        const payload = {
            notes: [{
                idInscription: item.idInscription,
                idCompetence: competenceId,
                idRepartitionCompetence: item.idRepartitionCompetence,
                note: note,
                idNote: item.idNote,
                nonClasse: false,
                idJustification: null,
                cote: cote
            }],
            idSequence: selectedSequence!.idSousPeriode,
            idAnneeScolaire: yearId!,
            idRepartitionMatiere: selectedMatiere!.idMatiere,
            modeSaisie: mode === 'DECIMAL' ? 'NUMERIC' : 'ALPHABETIC'
        };

        console.log("🚀 [DEBUG] handleModalSave Payload:", JSON.stringify(payload, null, 2));
        console.log("📍 [DEBUG] Source Item:", JSON.stringify(item, null, 2));

        try {
            await gradeService.saveNotes(payload as any);
            console.log(`✅ [Modal Save] Success for ${item.nomComplet}`);

            // Update the local modal item to reflect change if user navigates back
            const newModalItems = [...modalItems];
            newModalItems[index].note = note;
            newModalItems[index].cote = cote;
            setModalItems(newModalItems);

            setRefreshTrigger(prev => prev + 1);
            loadNotesForProgress();
        } catch (err) {
            console.error(`❌ [Modal Save Error] Failed for ${item.nomComplet}:`, err);
            throw err;
        }
    };

    const menuItems = [
        { id: 'matiere', label: 'Par Matière', icon: BookOpen, desc: 'Saisie groupée pour une classe' },
        { id: 'eleve', label: 'Par Élève', icon: User, desc: 'Toutes les notes d\'un étudiant' },
        { id: 'absences', label: 'Absences', icon: Clock, desc: 'Suivi de présence & retards' },
        { id: 'pv', label: 'Procès Verbaux', icon: FileText, desc: 'Rapports et délibérations' },
        { id: 'config', label: 'Config', icon: Layers, desc: 'Configuration' }
    ];

    const sortedSalles = [...salles].sort((a, b) => {
        if (salleSort.field === 'NAME') {
            const nameA = `${a.classeLabel} ${a.nomSalle}`.toLowerCase();
            const nameB = `${b.classeLabel} ${b.nomSalle}`.toLowerCase();
            return salleSort.order === 'ASC' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        } else {
            return salleSort.order === 'ASC' ? (a.studentCount || 0) - (b.studentCount || 0) : (b.studentCount || 0) - (a.studentCount || 0);
        }
    });

    const sortedSequences = [...sequences].sort((a, b) => {
        const nameA = a.nomSequence.toLowerCase();
        const nameB = b.nomSequence.toLowerCase();
        return sequenceSort === 'ASC' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    const sortedMatieres = [...matieres].sort((a, b) => {
        const nameA = a.libelle.toLowerCase();
        const nameB = b.libelle.toLowerCase();
        return matiereSort === 'ASC' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    const sortedEleves = [...eleves].sort((a, b) => {
        const nameA = a.nomEleve.toLowerCase();
        const nameB = b.nomEleve.toLowerCase();
        return eleveSort === 'ASC' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    const isEntryView = activeView === 'matiere' || activeView === 'eleve';

    return (
        <div className="max-w-full mx-auto space-y-4 animate-in fade-in duration-500 pb-20 p-4">
            {/* Header */}
            <div className="bg-white p-5 rounded-[24px] shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-black">Notes & Évaluations</h1>
                            <div className="flex items-center space-x-2 mt-1">
                                <div className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center">
                                    <GraduationCap size={10} className="mr-1" /> Pédagogie
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-gray-50 p-1 rounded-[18px] border border-gray-100">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id as ViewType)}
                                className={clsx(
                                    "px-3 py-2 rounded-[14px] text-[8px] font-black uppercase tracking-widest transition-all flex items-center space-x-1.5",
                                    activeView === item.id ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-black"
                                )}
                            >
                                <item.icon size={12} className={activeView === item.id ? "text-accent" : ""} />
                                <span className="hidden sm:inline">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Three-Column Selection Panel - Only for Entry Views */}
            {isEntryView && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-in slide-in-from-top-4 duration-500">
                    {/* Bloc 1: Salles */}
                    <div className="bg-white border border-gray-100 rounded-[20px] p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-[#9E9E9E] flex items-center">
                                <DoorOpen size={11} className="mr-1.5" /> Salle
                            </h3>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => setSalleSort(prev => ({ field: 'COUNT', order: prev.order === 'ASC' ? 'DESC' : 'ASC' }))}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-400"
                                    title="Trier par effectif"
                                >
                                    <Users size={10} />
                                </button>
                                <button
                                    onClick={() => setSalleSort(prev => ({ field: 'NAME', order: prev.order === 'ASC' ? 'DESC' : 'ASC' }))}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-400"
                                >
                                    {salleSort.order === 'ASC' ? <SortAsc size={10} /> : <SortDesc size={10} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {sortedSalles.length > 0 ? sortedSalles.map(salle => (
                                <button
                                    key={salle.idSalle}
                                    onClick={() => setSelectedSalle(salle)}
                                    className={clsx(
                                        "w-full text-left border rounded-[14px] p-2.5 transition-all text-[9px] relative overflow-hidden",
                                        selectedSalle?.idSalle === salle.idSalle
                                            ? "border-black bg-black text-white shadow-md font-black"
                                            : salle.isComplete ? "border-green-200 bg-green-50/30 text-green-700" : "border-gray-100 hover:border-black hover:shadow-sm"
                                    )}
                                >
                                    <div className="font-black text-[9px] uppercase tracking-tight">{salle.classeLabel} {salle.nomSalle}</div>
                                    <div className={clsx(
                                        "text-[8px] tracking-[0.2em] mt-0.5 font-bold uppercase",
                                        selectedSalle?.idSalle === salle.idSalle ? "text-white/70" : "text-[#9E9E9E]"
                                    )}>{salle.studentCount} Élèves</div>
                                    {salle.isComplete && (
                                        <CheckCircle2 size={10} className="absolute top-2 right-2 text-green-500" />
                                    )}
                                </button>
                            )) : (
                                <div className="text-center text-[8px] text-[#9E9E9E] py-4 uppercase font-black tracking-widest">Aucune salle</div>
                            )}
                        </div>
                    </div>

                    {/* Bloc 2: Séquences */}
                    <div className="bg-white border border-gray-100 rounded-[20px] p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-[#9E9E9E] flex items-center">
                                <Layers size={11} className="mr-1.5" /> Séquence
                            </h3>
                            <button
                                onClick={() => setSequenceSort(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400"
                            >
                                {sequenceSort === 'ASC' ? <SortAsc size={10} /> : <SortDesc size={10} />}
                            </button>
                        </div>
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {selectedSalle ? (sortedSequences.length > 0 ? sortedSequences.map(seq => (
                                <button
                                    key={seq.idSousPeriode}
                                    onClick={() => setSelectedSequence(seq)}
                                    className={clsx(
                                        "w-full text-left border rounded-[14px] p-2.5 transition-all text-[9px] relative",
                                        selectedSequence?.idSousPeriode === seq.idSousPeriode
                                            ? "border-black bg-black text-white shadow-md font-black"
                                            : seq.isComplete ? "border-green-200 bg-green-50/30 text-green-700" : "border-gray-100 hover:border-black hover:shadow-sm"
                                    )}
                                >
                                    <div className="font-black text-[9px] uppercase tracking-tight">{seq.nomSequence || seq.libelleSequence}</div>
                                    {seq.isComplete && (
                                        <CheckCircle2 size={10} className="absolute top-2 right-2 text-green-500" />
                                    )}
                                </button>
                            )) : (
                                <div className="text-center text-[8px] text-[#9E9E9E] py-4 uppercase font-black tracking-widest">Aucune séquence</div>
                            )) : (
                                <div className="text-center text-[8px] text-[#9E9E9E] py-4 uppercase font-black tracking-widest italic opacity-50">Sélectionnez une salle</div>
                            )}
                        </div>
                    </div>

                    {/* Bloc 3: Matières */}
                    <div className={clsx(
                        "bg-white border border-gray-100 rounded-[20px] p-3 shadow-sm transition-all duration-300",
                        activeView === 'eleve' && "opacity-30 grayscale pointer-events-none"
                    )}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-[#9E9E9E] flex items-center">
                                <BookMarked size={11} className="mr-1.5" /> Matière
                            </h3>
                            <button
                                onClick={() => setMatiereSort(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400"
                            >
                                {matiereSort === 'ASC' ? <SortAsc size={10} /> : <SortDesc size={10} />}
                            </button>
                        </div>
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {selectedSalle && selectedSequence ? (sortedMatieres.length > 0 ? sortedMatieres.map(mat => (
                                <button
                                    key={mat.idMatiere}
                                    onClick={() => setSelectedMatiere(mat)}
                                    className={clsx(
                                        "w-full text-left border rounded-[14px] p-2.5 transition-all text-[9px] relative",
                                        selectedMatiere?.idMatiere === mat.idMatiere
                                            ? "border-black bg-black text-white shadow-md font-black"
                                            : mat.isComplete ? "border-green-200 bg-green-50/30 text-green-700" : "border-gray-100 hover:border-black hover:shadow-sm"
                                    )}
                                >
                                    <div className="font-black text-[9px] uppercase tracking-tight">{mat.libelle || mat.libelleMatiereFr}</div>
                                    <div className={clsx(
                                        "text-[8px] tracking-[0.2em] mt-0.5 font-bold uppercase",
                                        selectedMatiere?.idMatiere === mat.idMatiere ? "text-white/70" : "text-[#9E9E9E]"
                                    )}>COEF: {mat.coef}</div>
                                    {mat.isComplete && (
                                        <CheckCircle2 size={10} className="absolute top-2 right-2 text-green-500" />
                                    )}
                                </button>
                            )) : (
                                <div className="text-center text-[8px] text-[#9E9E9E] py-4 uppercase font-black tracking-widest">Aucune matière</div>
                            )) : (
                                <div className="text-center text-[8px] text-[#9E9E9E] py-4 uppercase font-black tracking-widest italic opacity-50">Sélectionnez salle/séquence</div>
                            )}
                        </div>
                    </div>

                    {/* Bloc 4: Élèves (Quick Entry) */}
                    <div className="bg-white border border-gray-100 rounded-[20px] p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-[#9E9E9E] flex items-center">
                                <User size={11} className="mr-1.5" /> Élèves
                            </h3>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => setEleveSort(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-400"
                                >
                                    {eleveSort === 'ASC' ? <SortAsc size={10} /> : <SortDesc size={10} />}
                                </button>
                                {eleves.length > 0 && (
                                    <span className="text-[8px] font-black text-accent">{completionPercentage}%</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {selectedSalle ? (
                                sortedEleves.filter(e => !e.isComplete).length > 0 ? (
                                    sortedEleves.filter(e => !e.isComplete).map(eleve => (
                                        <button
                                            key={eleve.idInscription}
                                            onClick={() => handleOpenGradeModal(eleve)}
                                            className={clsx(
                                                "w-full text-left border rounded-[14px] p-2.5 transition-all text-[9px] relative overflow-hidden",
                                                selectedEleve?.idInscription === eleve.idInscription
                                                    ? "border-black bg-black text-white shadow-md font-black"
                                                    : "border-gray-100 hover:border-black hover:shadow-sm"
                                            )}
                                        >
                                            <div className="font-black text-[9px] uppercase tracking-tight">{eleve.nomEleve}</div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {eleve.missingCompetencies?.map((c, i) => (
                                                    <span key={i} className="text-[7px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase">
                                                        {c.label}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className={clsx(
                                                "text-[8px] tracking-[0.2em] mt-1 font-bold",
                                                selectedEleve?.idInscription === eleve.idInscription ? "text-white/70" : "text-gray-300"
                                            )}>À COMPLÉTER</div>
                                        </button>
                                    ))
                                ) : eleves.length > 0 ? (
                                    <div className="text-center py-6 px-4 bg-green-50 rounded-[20px] border border-green-100 animate-in zoom-in-95">
                                        <CheckCircle2 size={24} className="mx-auto text-green-500 mb-2" />
                                        <div className="text-[9px] font-black text-green-700 uppercase tracking-widest">Saisie Terminée !</div>
                                        <p className="text-[8px] text-green-600/70 mt-1">Tous les élèves ont une note pour cette matière.</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-[8px] text-[#9E9E9E] py-4 uppercase font-black tracking-widest">Aucun élève</div>
                                )
                            ) : (
                                <div className="text-center text-[8px] text-[#9E9E9E] py-4 uppercase font-black tracking-widest italic opacity-50">Sélectionnez une salle</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="min-h-[60vh]">
                {selectedSalle && selectedSequence && activeView === 'matiere' && (
                    <SaisieMatiereView
                        salle={selectedSalle}
                        sequence={selectedSequence}
                        matiere={selectedMatiere}
                        refreshTrigger={refreshTrigger}
                    />
                )}
                {selectedSalle && activeView === 'eleve' && (
                    <SaisieEleveView
                        salle={selectedSalle}
                        eleve={selectedEleve}
                        sequence={selectedSequence}
                        refreshTrigger={refreshTrigger}
                    />
                )}
                {activeView === 'absences' && (
                    <AbsenceView />
                )}
                {activeView === 'pv' && (
                    <PVView />
                )}
                {activeView === 'config' && (
                    <div className="max-w-2xl mx-auto">
                        <JustificationManagement />
                    </div>
                )}
            </div>

            {/* Grade Entry Modal (Sequential Refactor) */}
            <GradeSequentialEntry
                isOpen={gradeModalOpen}
                onClose={() => setGradeModalOpen(false)}
                items={modalItems}
                currentIndex={modalIndex}
                onNavigate={setModalIndex}
                onSave={handleModalSave}
                mode="BY_MATIERE"
                noteSur={selectedMatiere?.noteSur || 20}
            />
        </div>
    );
};

export default GradeManagementPage;
