import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Zap,
    CheckCircle2,
    AlertCircle,
    Clock,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface DisciplineSequentialEntryProps {
    isOpen: boolean;
    onClose: () => void;
    items: any[]; // Students list
    currentIndex: number;
    onNavigate: (index: number) => void;
    onSave: (index: number, heuresAJ: number, heuresANJ: number) => Promise<void>;
    competenceLabel?: string;
    subjectLabel?: string;
}

const DisciplineSequentialEntry: React.FC<DisciplineSequentialEntryProps> = ({
    isOpen,
    onClose,
    items,
    currentIndex,
    onNavigate,
    onSave,
    competenceLabel,
    subjectLabel
}) => {
    const { t } = useTranslation();
    const [hAJ, setHAJ] = useState<string>('0');
    const [hANJ, setHANJ] = useState<string>('0');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFading, setIsFading] = useState(false);
    const hAJRef = useRef<HTMLInputElement>(null);

    const currentItem = items[currentIndex];

    useEffect(() => {
        if (isOpen && currentItem) {
            setHAJ(currentItem.heuresAJ?.toString() || '0');
            setHANJ(currentItem.heuresANJ?.toString() || '0');
            setTimeout(() => hAJRef.current?.focus(), 100);
        }
    }, [isOpen, currentIndex, currentItem?.idInscription]);

    if (!isOpen || !currentItem) return null;

    const handleSaveAndNext = async () => {
        setSaving(true);
        setError(null);
        try {
            const valAJ = parseInt(hAJ) || 0;
            const valANJ = parseInt(hANJ) || 0;

            await onSave(currentIndex, valAJ, valANJ);

            if (currentIndex < items.length - 1) {
                setIsFading(true);
                onNavigate(currentIndex + 1);
                setTimeout(() => setIsFading(false), 300);
            } else {
                onClose();
            }
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
            <div className={clsx(
                "bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border-[3px] border-black flex flex-col transition-all duration-300",
                isFading ? "opacity-0" : "opacity-100"
            )}>
                {/* Header */}
                <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center shadow-lg">
                            <Clock size={16} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-[11px] text-black">
                                Discipline / Absences
                            </h3>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                <span>{currentIndex + 1}/{items.length}</span>
                                <span className="text-gray-200">•</span>
                                <span className="truncate max-w-[100px]">{subjectLabel}</span>
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
                        className="h-full bg-black transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                    />
                </div>

                <div className="p-4 flex flex-col items-center space-y-4 text-center">
                    {/* Item Info */}
                    <div className="space-y-0.5">
                        <h2 className="text-lg font-black uppercase tracking-tighter text-black">
                            {currentItem.nomComplet}
                        </h2>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">
                            {currentItem.matricule}
                        </p>
                    </div>

                    {/* Competence Badge */}
                    <div className="bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 flex items-center gap-1.5">
                        <Zap size={10} className="text-accent fill-accent" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{competenceLabel}</span>
                    </div>

                    {/* Input Areas */}
                    <div className="w-full grid grid-cols-2 gap-3">
                        {/* Justified Absences */}
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-green-500 flex items-center justify-center gap-1">
                                <ThumbsUp size={10} /> Justifiées
                            </label>
                            <div className="relative bg-white border-2 border-green-500 rounded-[20px] p-3 shadow-sm">
                                <input
                                    ref={hAJRef}
                                    type="number"
                                    min="0"
                                    value={hAJ}
                                    onChange={(e) => setHAJ(e.target.value)}
                                    className="w-full text-center text-3xl font-black outline-none bg-transparent"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-green-200">H</span>
                            </div>
                        </div>

                        {/* Unjustified Absences */}
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-red-500 flex items-center justify-center gap-1">
                                <ThumbsDown size={10} /> Non Justifiées
                            </label>
                            <div className="relative bg-white border-2 border-red-500 rounded-[20px] p-3 shadow-sm">
                                <input
                                    type="number"
                                    min="0"
                                    value={hANJ}
                                    onChange={(e) => setHANJ(e.target.value)}
                                    className="w-full text-center text-3xl font-black outline-none bg-transparent"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-200">H</span>
                            </div>
                        </div>
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
                            className="p-2 hover:bg-white hover:shadow-sm rounded-[12px] transition-all text-gray-400 disabled:opacity-20 border border-transparent hover:border-gray-100"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={currentIndex === items.length - 1}
                            onClick={() => onNavigate(currentIndex + 1)}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-[12px] transition-all text-gray-400 disabled:opacity-20 border border-transparent hover:border-gray-100"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <button
                        onClick={handleSaveAndNext}
                        disabled={saving}
                        className="bg-black text-white px-5 py-2.5 rounded-[16px] font-black text-[9px] uppercase tracking-[0.1em] shadow-xl hover:scale-105 active:scale-[0.95] transition-all flex items-center space-x-2"
                    >
                        <span>{saving ? ".." : (currentIndex === items.length - 1 ? "Terminer" : "Suivant")}</span>
                        <CheckCircle2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisciplineSequentialEntry;
