import React, { useState, useEffect, useRef } from 'react';
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
    const [zoomCompetence, setZoomCompetence] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const colors = [
        { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-500' },
        { border: 'border-purple-500', bg: 'bg-purple-500', text: 'text-purple-500' },
        { border: 'border-pink-500', bg: 'bg-pink-500', text: 'text-pink-500' },
        { border: 'border-emerald-500', bg: 'bg-emerald-500', text: 'text-emerald-500' },
        { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-500' },
        { border: 'border-indigo-500', bg: 'bg-indigo-500', text: 'text-indigo-500' },
        { border: 'border-cyan-500', bg: 'bg-cyan-500', text: 'text-cyan-500' },
        { border: 'border-yellow-500', bg: 'bg-yellow-500', text: 'text-yellow-500' },
        { border: 'border-rose-500', bg: 'bg-rose-500', text: 'text-rose-500' },
        { border: 'border-violet-500', bg: 'bg-violet-500', text: 'text-violet-500' }
    ];

    const currentItem = items[currentIndex];

    // Calculate sub-index (Compétence X/Y) for current item
    const mainId = mode === 'BY_MATIERE' ? currentItem?.idInscription : currentItem?.idRepartitionMatiere;
    const sameMainItems = items.filter(item => (mode === 'BY_MATIERE' ? item.idInscription : item.idRepartitionMatiere) === mainId);
    const subIndex = sameMainItems.indexOf(currentItem);
    const totalCompsForThisItem = sameMainItems.length;
    const isMultiComp = totalCompsForThisItem > 1;

    // Stable border color based on student's ID or name hash to stay consistent during the sub-loop
    const getStudentColorObj = () => {
        const id = currentItem?.idInscription || currentItem?.idRepartitionMatiere || 0;
        const name = currentItem?.nomComplet || currentItem?.matiereLabel || '';

        let hash = Number(id) || 0;
        if (name) {
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const studentColor = getStudentColorObj();
    const borderColor = studentColor.border;
    const progressColor = studentColor.bg;
    const nameColor = studentColor.text;

    useEffect(() => {
        if (isOpen && currentItem) {
            setInputValue(currentItem?.note?.toString() || '');
            setZoomCompetence(true);
            const timer = setTimeout(() => setZoomCompetence(false), 2000);
            setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, currentIndex, currentItem?.idCompetence]);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
            <div className={clsx(
                "bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border-[3px] flex flex-col transition-all duration-300",
                borderColor,
                isFading ? "opacity-0" : "opacity-100"
            )}>
                {/* Header */}
                <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                        <div className={clsx("w-8 h-8 text-white rounded-lg flex items-center justify-center shadow-lg", progressColor)}>
                            <Zap size={16} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-[11px] text-black">
                                {isMultiComp ? "Saisie Multi" : "Saisie"}
                            </h3>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                <span>{currentIndex + 1}/{items.length}</span>
                                <span className="text-gray-200">•</span>
                                <span className="truncate max-w-[80px]">{mode === 'BY_MATIERE' ? (subjectLabel || 'Mat') : (studentName || 'Élève')}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-black">
                        <X size={18} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100">
                    <div
                        className={clsx("h-full transition-all duration-500", progressColor)}
                        style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                    />
                </div>

                <div className="p-4 flex flex-col items-center space-y-3 text-center">
                    {/* Item Info */}
                    <div className="space-y-0.5">
                        {mode === 'BY_MATIERE' ? (
                            <>
                                <h2 className={clsx("text-lg font-black uppercase tracking-tighter transition-colors duration-500", nameColor)}>
                                    {currentItem.nomComplet}
                                </h2>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                    {currentItem.matricule}
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className={clsx("text-lg font-black uppercase tracking-tighter transition-colors duration-500", nameColor)}>
                                    {currentItem.matiereLabel}
                                </h2>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                    {currentItem.coef !== undefined ? `Coef: ${currentItem.coef}` : ''}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Current Competence Display */}
                    <div className="w-full bg-[#F8F9FE] p-3 rounded-[16px] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-center gap-1.5 text-accent mb-0.5 relative z-10">
                            <Zap size={10} className="fill-accent animate-pulse" />
                            <span className="text-[7px] font-black uppercase tracking-[0.1em]">
                                {isMultiComp ? `Comp ${subIndex + 1}/${totalCompsForThisItem}` : "Compétence"}
                            </span>
                        </div>
                        <p className={clsx(
                            "text-[11px] font-black text-black uppercase leading-tight relative z-10 transition-all duration-1000",
                            zoomCompetence ? "scale-105 text-accent" : "scale-100"
                        )}>
                            {currentItem.competenceLabel || 'Générale'}
                        </p>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex bg-gray-100 p-0.5 rounded-lg w-full max-w-[180px]">
                        <button
                            onClick={() => setEntryMode('DECIMAL')}
                            className={clsx(
                                "flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                                entryMode === 'DECIMAL' ? "bg-white text-black shadow-xs" : "text-gray-400"
                            )}
                        >
                            <Binary size={10} />
                            <span>Num</span>
                        </button>
                        <button
                            onClick={() => setEntryMode('ALPHABETIC')}
                            className={clsx(
                                "flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                                entryMode === 'ALPHABETIC' ? "bg-white text-black shadow-xs" : "text-gray-400"
                            )}
                        >
                            <Type size={10} />
                            <span>Alpha</span>
                        </button>
                    </div>

                    {/* Input Area (Stepper Style) */}
                    <div className="w-full max-w-[200px]">
                        {entryMode === 'DECIMAL' ? (
                            <div className="relative bg-white border-2 border-black rounded-[24px] p-4 shadow-lg group">
                                <input
                                    ref={inputRef}
                                    type="number"
                                    step="0.25"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveAndNext()}
                                    placeholder="0"
                                    className="w-full text-center text-4xl font-black outline-none placeholder:text-gray-100"
                                />

                                {/* Stepper arrows (Simulated) */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                    <button
                                        onClick={() => setInputValue(prev => (parseFloat(prev || '0') + 0.25).toString())}
                                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-all"
                                    >
                                        <ChevronRight size={16} className="-rotate-90" />
                                    </button>
                                    <button
                                        onClick={() => setInputValue(prev => Math.max(0, parseFloat(prev || '0') - 0.25).toString())}
                                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-all"
                                    >
                                        <ChevronRight size={16} className="rotate-90" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-1.5">
                                {alphabetGrades.map(grade => (
                                    <button
                                        key={grade}
                                        onClick={() => { setInputValue(grade); }}
                                        className={clsx(
                                            "aspect-square flex items-center justify-center rounded-lg font-black text-[10px] transition-all",
                                            inputValue === grade
                                                ? "bg-black text-white shadow-md scale-105"
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
                <div className="p-3 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex space-x-1.5">
                        <button
                            disabled={currentIndex === 0}
                            onClick={() => onNavigate(currentIndex - 1)}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-[12px] transition-all text-gray-400 disabled:opacity-20 flex items-center justify-center border border-transparent hover:border-gray-100"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={currentIndex === items.length - 1}
                            onClick={() => onNavigate(currentIndex + 1)}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-[12px] transition-all text-gray-400 disabled:opacity-20 flex items-center justify-center border border-transparent hover:border-gray-100"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <button
                        onClick={handleSaveAndNext}
                        disabled={saving}
                        className="bg-black text-white px-5 py-2.5 rounded-[16px] font-black text-[9px] uppercase tracking-[0.1em] shadow-xl hover:scale-105 active:scale-[0.95] transition-all flex items-center space-x-2"
                    >
                        <span>{saving ? ".." : (currentIndex === items.length - 1 ? "FIN" : "SUIV")}</span>
                        <CheckCircle2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeSequentialEntry;
