import React, { useState, useEffect, useRef } from 'react';
import { NoteUiModel } from '../../../../types/grades';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Zap,
    CheckCircle2,
    AlertCircle,
    Binary,
    Type
} from 'lucide-react';
import { clsx } from 'clsx';

interface GradeSequentialEntryProps {
    isOpen: boolean;
    onClose: () => void;
    items: any[]; // Eleves or Matieres (Flattened with competencies)
    currentIndex: number;
    onNavigate: (index: number) => void;
    onSave: (index: number, note: number | null, mode: 'DECIMAL' | 'ALPHABETIC', cote?: string, competenceId?: number) => Promise<void>;
    mode: 'BY_MATIERE' | 'BY_ELEVE';
    noteSur?: number;
    studentName?: string;
    subjectLabel?: string;
}

const GradeSequentialEntry: React.FC<GradeSequentialEntryProps> = ({
    isOpen,
    onClose,
    items,
    currentIndex,
    onNavigate,
    onSave,
    mode,
    noteSur = 20,
    studentName,
    subjectLabel
}) => {
    const [entryMode, setEntryMode] = useState<'DECIMAL' | 'ALPHABETIC'>('DECIMAL');
    const [inputValue, setInputValue] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFading, setIsFading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const colors = [
        'border-blue-500 hover:border-blue-600',
        'border-purple-500 hover:border-purple-600',
        'border-pink-500 hover:border-pink-600',
        'border-emerald-500 hover:border-emerald-600',
        'border-orange-500 hover:border-orange-600',
        'border-indigo-500 hover:border-indigo-600',
        'border-cyan-500 hover:border-cyan-600',
        'border-yellow-500 hover:border-yellow-600',
        'border-rose-500 hover:border-rose-600',
        'border-violet-500 hover:border-violet-600'
    ];

    const currentItem = items[currentIndex];

    // Calculate sub-index (Compétence X/Y) for current item
    const mainId = mode === 'BY_MATIERE' ? currentItem?.idInscription : currentItem?.idRepartitionMatiere;
    const sameMainItems = items.filter(item => (mode === 'BY_MATIERE' ? item.idInscription : item.idRepartitionMatiere) === mainId);
    const subIndex = sameMainItems.indexOf(currentItem);
    const totalCompsForThisItem = sameMainItems.length;
    const isMultiComp = totalCompsForThisItem > 1;

    // Stable border color based on student's ID or name hash to stay consistent during the sub-loop
    const getStudentColorClass = () => {
        const id = currentItem?.idInscription || currentItem?.idRepartitionMatiere || 0;
        const name = currentItem?.nomComplet || '';

        let hash = Number(id) || 0;
        if (name) {
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const borderColor = getStudentColorClass();

    useEffect(() => {
        if (isOpen && currentItem) {
            setInputValue(currentItem?.note?.toString() || '');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, currentIndex, currentItem]);

    if (!isOpen || !currentItem) return null;

    const handleSaveAndNext = async () => {
        setSaving(true);
        setError(null);
        try {
            const val = entryMode === 'DECIMAL' ? parseFloat(inputValue) : null;
            const cote = entryMode === 'ALPHABETIC' ? inputValue : undefined;
            const competenceId = currentItem.idCompetence;

            if (!competenceId) {
                throw new Error("La compétence est obligatoire pour enregistrer une note.");
            }

            if (entryMode === 'DECIMAL' && !isNaN(val!) && (val! < 0 || val! > noteSur)) {
                throw new Error(`La note doit être entre 0 et ${noteSur}`);
            }

            await onSave(currentIndex, isNaN(val!) ? null : val, entryMode, cote, competenceId);

            // Next item (which is naturally the next competence if list is flattened)
            if (currentIndex < items.length - 1) {
                setIsFading(true);
                onNavigate(currentIndex + 1);
                setTimeout(() => setIsFading(false), 300);
            } else {
                onClose();
            }
        } catch (err: any) {
            setError(err.message || "Erreur d'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const alphabetGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E', 'F'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={clsx(
                "bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border-4 flex flex-col transition-all duration-300",
                borderColor,
                isFading ? "opacity-0" : "opacity-100"
            )}>
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-lg text-black">
                                {isMultiComp ? "Saisie Multi-Compétences" : "Saisie Rapide"}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                <span>{currentIndex + 1} / {items.length}</span>
                                <span className="text-gray-200">•</span>
                                <span>{mode === 'BY_MATIERE' ? (subjectLabel || 'Matière') : (studentName || 'Élève')}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-black">
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100">
                    <div
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                    />
                </div>

                <div className="p-10 flex flex-col items-center space-y-8 text-center">
                    {/* Item Info */}
                    <div className="space-y-1">
                        {mode === 'BY_MATIERE' ? (
                            <>
                                {subjectLabel && (
                                    <span className="text-[9px] font-black bg-black/5 text-black/60 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-2">
                                        {subjectLabel}
                                    </span>
                                )}
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-black">
                                    {currentItem.nomComplet}
                                </h2>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                    {currentItem.matricule}
                                </p>
                            </>
                        ) : (
                            <>
                                {studentName && (
                                    <span className="text-[9px] font-black bg-black/5 text-black/60 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-2">
                                        {studentName}
                                    </span>
                                )}
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-black">
                                    {currentItem.matiereLabel}
                                </h2>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                    {currentItem.coef !== undefined ? `Coef: ${currentItem.coef}` : ''}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Current Competence Display */}
                    <div className="w-full bg-[#F8F9FE] p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        {/* Decorative subtle background icon */}
                        <div className="absolute right-[-10px] top-[-10px] text-accent/5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                            <Zap size={120} className="fill-accent/5 text-transparent" />
                        </div>
                        <div className="flex items-center justify-center gap-3 text-accent mb-2 relative z-10">
                            <Zap size={18} className="fill-accent animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {isMultiComp ? `Compétence ${subIndex + 1} / ${totalCompsForThisItem}` : "Compétence Actuelle"}
                            </span>
                        </div>
                        <p className="text-sm font-black text-black uppercase leading-relaxed relative z-10">
                            {currentItem.competenceLabel || 'Générale'}
                        </p>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full max-w-[280px]">
                        <button
                            onClick={() => setEntryMode('DECIMAL')}
                            className={clsx(
                                "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                entryMode === 'DECIMAL' ? "bg-white text-black shadow-sm" : "text-gray-400"
                            )}
                        >
                            <Binary size={14} />
                            <span>Numérique</span>
                        </button>
                        <button
                            onClick={() => setEntryMode('ALPHABETIC')}
                            className={clsx(
                                "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                entryMode === 'ALPHABETIC' ? "bg-white text-black shadow-sm" : "text-gray-400"
                            )}
                        >
                            <Type size={14} />
                            <span>Alphabet</span>
                        </button>
                    </div>

                    {/* Input Area (Stepper Style) */}
                    <div className="w-full max-w-[320px]">
                        {entryMode === 'DECIMAL' ? (
                            <div className="relative bg-white border-[3px] border-black rounded-[40px] p-10 shadow-xl group">
                                <input
                                    ref={inputRef}
                                    type="number"
                                    step="0.25"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveAndNext()}
                                    placeholder="0.00"
                                    className="w-full text-center text-8xl font-black outline-none placeholder:text-gray-100"
                                />

                                {/* Stepper arrows (Simulated) */}
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                                    <button
                                        onClick={() => setInputValue(prev => (parseFloat(prev || '0') + 0.25).toString())}
                                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-all"
                                    >
                                        <ChevronRight size={28} className="-rotate-90" />
                                    </button>
                                    <button
                                        onClick={() => setInputValue(prev => Math.max(0, parseFloat(prev || '0') - 0.25).toString())}
                                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-all"
                                    >
                                        <ChevronRight size={28} className="rotate-90" />
                                    </button>
                                </div>

                                <div className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
                                    Sur {noteSur}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3">
                                {alphabetGrades.map(grade => (
                                    <button
                                        key={grade}
                                        onClick={() => { setInputValue(grade); }}
                                        className={clsx(
                                            "aspect-square flex items-center justify-center rounded-2xl font-black text-lg transition-all",
                                            inputValue === grade
                                                ? "bg-black text-white shadow-xl scale-110"
                                                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                        )}
                                    >
                                        {grade}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center space-x-2 text-red-500 bg-red-50 px-6 py-3 rounded-full animate-in slide-in-from-top-2">
                            <AlertCircle size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex space-x-3">
                        <button
                            disabled={currentIndex === 0}
                            onClick={() => onNavigate(currentIndex - 1)}
                            className="p-5 hover:bg-white hover:shadow-md rounded-[24px] transition-all text-gray-400 disabled:opacity-20 flex items-center justify-center border border-transparent hover:border-gray-100"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <button
                            disabled={currentIndex === items.length - 1}
                            onClick={() => onNavigate(currentIndex + 1)}
                            className="p-5 hover:bg-white hover:shadow-md rounded-[24px] transition-all text-gray-400 disabled:opacity-20 flex items-center justify-center border border-transparent hover:border-gray-100"
                        >
                            <ChevronRight size={28} />
                        </button>
                    </div>

                    <button
                        onClick={handleSaveAndNext}
                        disabled={saving}
                        className="bg-black text-white px-12 py-5 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-[0.95] transition-all flex items-center space-x-4"
                    >
                        <span>{saving ? "ATTENTE..." : (currentIndex === items.length - 1 ? "TERMINER" : "SUIVANT")}</span>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeSequentialEntry;
