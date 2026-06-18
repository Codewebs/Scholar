import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { pedagogyService } from '../../api/pedagogyService';
import {
    CalendarClock,
    ArrowLeft,
    CheckCircle2,
    Layers,
    Building2,
    Check,
    Save,
    AlertCircle,
    History
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthButton from '../../components/ui/AuthButton';

const SequenceRepartitionPage: React.FC = () => {
    const { selectedYear } = useSchoolYear();
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

    const [classes, setClasses] = useState<any[]>([]);
    const [sequences, setSequences] = useState<any[]>([]);
    const [repartition, setRepartition] = useState<any[]>([]);

    const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
    const [selectedSequences, setSelectedSequences] = useState<number[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (yearId) {
            loadData();
        }
    }, [yearId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [roomsRes, periodsRes, repartitionRes] = await Promise.all([
                studentService.getRooms(yearId!),
                pedagogyService.getPeriodes(yearId!),
                pedagogyService.getSequenceRepartition(yearId!)
            ]);

            console.log("📦 Raw roomsRes.data:", roomsRes.data);

            // Extract unique classes from rooms (salles)
            // Salle structure: { idSalle, nomSalle, Classe: { idClasse, libelleClasseFr, ... } }
            const uniqueClasses: any[] = [];
            const classIds = new Set();
            
            roomsRes.data.forEach((salle: any) => {
                const classId = salle.Classe?.idClasse;
                
                if (classId && !classIds.has(classId)) {
                    classIds.add(classId);
                    uniqueClasses.push(salle.Classe);
                    console.log(`   ✅ Added class: idClasse=${classId}, libelleClasseFr=${salle.Classe.libelleClasseFr}`);
                }
            });
            
            console.log("📚 Loaded classes:", uniqueClasses.map(c => ({ idClasse: c.idClasse, libelleClasseFr: c.libelleClasseFr })));
            setClasses(uniqueClasses);

            // Extract sequences from periods
            const allSeqs: any[] = [];
            periodsRes.data.forEach((p: any) => {
                if (p.sousPeriodes) {
                    p.sousPeriodes.forEach((sp: any) => {
                        allSeqs.push({
                            ...sp,
                            idSousPeriode: sp.idSousPeriode,
                            periodeLabel: p.libellePeriodeFr
                        });
                    });
                }
            });
            
            console.log("📅 Loaded sequences:", allSeqs.map(s => ({ idSousPeriode: s.idSousPeriode, libelleSousPeriodeFr: s.libelleSousPeriodeFr })));
            setSequences(allSeqs);
            setRepartition(repartitionRes.data);
        } catch (err) {
            console.error("❌ Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleClass = (id: number) => {
        setSelectedClasses(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSequence = (id: number) => {
        setSelectedSequences(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // When selecting a single class, pre-fill its current sequences
    useEffect(() => {
        if (selectedClasses.length === 1) {
            const classId = selectedClasses[0];
            const currentSeqs = repartition
                .filter(r => r.idClasse === classId && !r.supprimer)
                .map(r => r.idSousPeriode);
            setSelectedSequences(currentSeqs);
        }
    }, [selectedClasses, repartition]);

    const handleSave = async () => {
        if (selectedClasses.length === 0 || selectedSequences.length === 0) {
            setError("Veuillez sélectionner au moins une classe et une séquence.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const payload = {
                idAnneeScolaire: yearId!,
                classIds: selectedClasses,
                sequenceIds: selectedSequences
            };
            
            console.log("🚀 Sending bulkAssignSequences payload:");
            console.log("   idAnneeScolaire:", payload.idAnneeScolaire);
            console.log("   classIds:", payload.classIds, "(should match classes.idClasse)");
            console.log("   sequenceIds:", payload.sequenceIds, "(should match sequences.idSousPeriode)");
            
            // Verify classIds exist in classes
            const validClassIds = classes.map(c => c.idClasse);
            const invalidClassIds = payload.classIds.filter(id => !validClassIds.includes(id));
            if (invalidClassIds.length > 0) {
                console.warn("⚠️ WARNING: Invalid classIds:", invalidClassIds, "Valid are:", validClassIds);
            }
            
            await pedagogyService.bulkAssignSequences(payload);
            setSuccess("Répartition mise à jour !");
            await loadData(); // Reload repartition
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error("❌ bulkAssignSequences error:", err.response?.data || err.message);
            setError(err.response?.data?.error || "Erreur lors de l'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                <div className="flex items-center space-x-6 relative z-10">
                    <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                        <ArrowLeft size={28} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Répartition des Séquences</h1>
                        <div className="flex items-center space-x-3 mt-2">
                            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                                <CalendarClock size={12} className="mr-1.5" /> Calendrier par classe
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Définissez les évaluations par niveau</p>
                        </div>
                    </div>
                </div>

                <AuthButton onClick={handleSave} disabled={saving || selectedClasses.length === 0} className="md:w-auto px-12 bg-black shadow-2xl">
                    <div className="flex items-center space-x-3">
                        <Save size={20} />
                        <span>{saving ? "Application..." : "Appliquer la Répartition"}</span>
                    </div>
                </AuthButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[65vh]">
                {/* Column 1: Classes */}
                <div className="bg-white rounded-[40px] border border-gray-100 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-lg">Classes & Niveaux</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedClasses.length} Sélectionnée(s)</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedClasses(classes.map(c => c.idClasse))}
                            className="text-[10px] font-black uppercase text-accent hover:underline"
                        >Tout sélectionner</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar">
                        {classes.map(c => {
                            const isSelected = selectedClasses.includes(c.idClasse);
                            const assignedCount = repartition.filter(r => r.idClasse === c.idClasse && !r.supprimer).length;

                            return (
                                <div
                                    key={c.idClasse}
                                    onClick={() => toggleClass(c.idClasse)}
                                    className={clsx(
                                        "p-6 rounded-[24px] cursor-pointer transition-all border-2 flex items-center justify-between group",
                                        isSelected ? "border-black bg-black text-white shadow-xl translate-x-2" : "border-transparent bg-gray-50 hover:bg-white hover:border-gray-200"
                                    )}
                                >
                                    <div className="flex items-center space-x-6">
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            isSelected ? "bg-accent border-accent" : "border-gray-200"
                                        )}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>
                                        <div>
                                            <span className="font-black text-sm uppercase tracking-tight">{c.libelleClasseFr}</span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <History size={10} className={isSelected ? "text-gray-400" : "text-gray-300"} />
                                                <span className={clsx("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-gray-400" : "text-gray-300")}>
                                                    {assignedCount} Séquences configurées
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column 2: Sequences */}
                <div className={clsx(
                    "bg-white rounded-[40px] border border-gray-100 flex flex-col overflow-hidden shadow-sm transition-all duration-500",
                    selectedClasses.length === 0 ? "opacity-30 grayscale pointer-events-none blur-[1px]" : "opacity-100"
                )}>
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-lg">Séquences Disponibles</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Choisir les évaluations à appliquer</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedSequences(sequences.map(s => s.idSousPeriode))}
                            className="text-[10px] font-black uppercase text-accent hover:underline"
                        >Tout sélectionner</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                        {sequences.map(s => {
                            const isSelected = selectedSequences.includes(s.idSousPeriode);
                            return (
                                <div
                                    key={s.idSousPeriode}
                                    onClick={() => toggleSequence(s.idSousPeriode)}
                                    className={clsx(
                                        "p-6 rounded-[24px] cursor-pointer transition-all border-2 flex items-center justify-between",
                                        isSelected ? "border-accent bg-accent/5" : "border-transparent bg-gray-50 hover:bg-white hover:border-gray-200"
                                    )}
                                >
                                    <div className="flex items-center space-x-6">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                            isSelected ? "bg-accent text-white" : "bg-white text-gray-300"
                                        )}>
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div>
                                            <span className={clsx("font-black text-sm uppercase tracking-tight", isSelected ? "text-accent" : "text-black")}>
                                                {s.libelleSousPeriodeFr}
                                            </span>
                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mt-1">
                                                {s.periodeLabel} • {s.dateDebut} — {s.dateFin}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && <div className="bg-accent h-2 w-2 rounded-full animate-pulse"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-[24px] border border-red-100 flex items-center space-x-4 animate-in slide-in-from-top-2">
                    <AlertCircle size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-6 rounded-[24px] border border-green-100 flex items-center space-x-4 animate-in slide-in-from-top-2">
                    <CheckCircle2 size={24} />
                    <span className="text-xs font-black uppercase tracking-widest">{success}</span>
                </div>
            )}
        </div>
    );
};

export default SequenceRepartitionPage;
