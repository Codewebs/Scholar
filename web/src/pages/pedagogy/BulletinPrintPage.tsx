import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSchoolYear } from '../../context/SchoolYearContext';
import api from '../../api/axios';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Legend
} from 'recharts';
import {
    Printer,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Image as ImageIcon,
    User,
    CheckCircle2,
    XCircle,
    Info,
    Settings2,
    Check,
    LayoutGrid,
    List,
    Download,
    BarChart3,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';

interface BulletinData {
    school: any;
    student: any;
    salle: any;
    year: any;
    period: {
        label: string;
        subPeriods?: { id: number, label: string, abrev: string }[];
    };
    performance: {
        groups: SubjectGroup[];
        totalPoints: number;
        totalCoef: number;
        average: number;
        rank: number;
        appreciation: string;
    };
    stats: {
        maxMoy: number;
        minMoy: number;
        avgMoy: number;
        successRate: number;
    };
    discipline: {
        absencesJustified: number;
        absencesUnjustified: number;
        conductNotes: string[];
    };
}

interface SubjectGroup {
    name: string;
    subjects: SubjectPerformance[];
    groupAverage?: number;
    groupTotalPoints?: number;
    groupTotalCoef?: number;
    ordre?: number;
}

interface SubjectPerformance {
    name: string;
    teacher: string;
    note1: number | null;
    note2: number | null;
    coef: number;
    total: number | null;
    rank: number;
    appreciation: string;
    competencies: CompetencyNote[];
}

interface CompetencyNote {
    libelle: string;
    note: number | null;
    cote: string | null;
    appreciation: string | null;
}

// --- Helpers ---
const getGradeInfo = (note: number | null, max: number = 20) => {
    if (note === null) return { cote: '', color: 'gray', appreciation: '' };
    const ratio = note / max;
    if (ratio >= 0.9) return { cote: 'A+', color: '#10B981', appreciation: 'Excellent' };
    if (ratio >= 0.8) return { cote: 'A', color: '#10B981', appreciation: 'Très Bien' };
    if (ratio >= 0.7) return { cote: 'B+', color: '#3B82F6', appreciation: 'Bien' };
    if (ratio >= 0.6) return { cote: 'B', color: '#3B82F6', appreciation: 'Assez Bien' };
    if (ratio >= 0.5) return { cote: 'C', color: '#F59E0B', appreciation: 'Passable' };
    if (ratio >= 0.4) return { cote: 'D', color: '#EF4444', appreciation: 'Insuffisant' };
    return { cote: 'E', color: '#EF4444', appreciation: 'Médiocre' };
};

const getCoteColor = (cote: string | null | undefined) => {
    if (!cote) return 'gray';
    if (cote.startsWith('A')) return '#10B981'; // Green
    if (cote.startsWith('B')) return '#3B82F6'; // Blue
    if (cote.startsWith('C')) return '#F59E0B'; // Yellow/Orange
    if (cote.startsWith('D') || cote.startsWith('E') || cote.startsWith('F')) return '#EF4444'; // Red
    return 'gray';
};

const GradeDisplay: React.FC<{
    note: number | null,
    cote?: string | null,
    mode: string,
    failColor?: string,
    showMax?: boolean,
    className?: string,
    max?: number,
    coteColor?: string
}> = ({ note, cote, mode, failColor, showMax = true, className, max = 20, coteColor }) => {
    if (note === null && !cote) return <span className="text-gray-300">--</span>;

    const info = getGradeInfo(note, max);
    const finalCote = cote || info.cote;
    const isFail = note !== null && note < (max / 2);

    return (
        <div className={clsx("flex flex-col items-center justify-center", className)}>
            {(mode === 'NUMERIC' || mode === 'HYBRID' || mode === 'HYBRID_NUM_COLOR') && note !== null && (
                <span className="font-black" style={{ color: isFail ? (failColor || '#EF4444') : 'inherit' }}>
                    {note.toFixed(2)}{showMax && <span className="text-[7px] opacity-40 ml-0.5">/{max}</span>}
                </span>
            )}
            {(mode === 'LETTER' || mode === 'HYBRID') && finalCote && (
                <span className="text-[9px] font-black" style={{ color: coteColor || '#3b82f6' }}>{finalCote}</span>
            )}
            {(mode === 'COLOR' || mode === 'HYBRID' || mode === 'HYBRID_NUM_COLOR') && (
                <div className="flex gap-0.5 mt-0.5">
                    {['A', 'B', 'C', 'D'].map(grade => (
                        <div key={grade} className={clsx(
                            "w-3 h-3 rounded-full",
                            finalCote?.startsWith(grade) ? (grade === 'A' ? 'bg-green-500' : grade === 'B' ? 'bg-blue-500' : grade === 'C' ? 'bg-yellow-500' : 'bg-red-500') : 'bg-gray-100'
                        )} />
                    ))}
                </div>
            )}
        </div>
    );
};

const BulletinPrintPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { selectedYear } = useSchoolYear();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string, details?: any[] } | null>(null);
    const [bulletins, setBulletins] = useState<BulletinData[]>([]);

    // Config state from URL or LocalStorage
    const [config, setConfig] = useState<any>(null);
    const [showWidget, setShowWidget] = useState(false);

    // UI Overrides
    const [overrides, setOverrides] = useState({
        showGroups: true,
        showGroupSummaries: true,
        formatResult: true,
        formatClassStats: true,
        formatPoints: false,
        showRank: true,
        showCompetencies: true,
        showPeriodAbreviations: false,
        subjectFontSize: 8,
        globalScale: 100, // percentage
        compLayout: 'VERTICAL' as 'VERTICAL' | 'GRID' | 'HORIZONTAL',
        compNotePos: 'SIDE' as 'SIDE' | 'BOTTOM'
    });

    useEffect(() => {
        const loadConfigAndData = async () => {
            setLoading(true);
            try {
                // 1. Recover config
                const configStr = localStorage.getItem('bulletin_print_config');
                const currentConfig = configStr ? JSON.parse(configStr) : null;
                setConfig(currentConfig);

                if (currentConfig?.body) {
                    setOverrides(prev => ({
                        ...prev,
                        showPeriodAbreviations: !!currentConfig.body.showPeriodAbreviations
                    }));
                }

                if (!currentConfig || !currentConfig.selectedId) {
                    setError({ message: "Configuration d'impression manquante ou périmètre non défini." });
                    setLoading(false);
                    return;
                }

                // 2. Fetch Data
                const response = await api.get('/pedagogy/notes/bulletins/export', {
                    params: {
                        perimeter: currentConfig.selectedPerimeter,
                        id: currentConfig.selectedId,
                        periodType: currentConfig.periodType,
                        selectedPeriodId: currentConfig.selectedPeriodId,
                        idAnneeScolaire: selectedYear?.idServeur || selectedYear?.idAnneeScolaire,
                        allowIncompleteStudent: currentConfig.allowIncompleteStudent,
                        allowIncompleteRoom: currentConfig.allowIncompleteRoom
                    }
                });

                setBulletins(response.data);
                setLoading(false);
            } catch (err: any) {
                console.error("Error loading bulletins:", err);
                const apiError = err.response?.data;

                let errorMsg = "Une erreur est survenue lors de la récupération des données des bulletins.";
                if (typeof apiError === 'string') {
                    errorMsg = apiError;
                } else if (apiError && typeof apiError.message === 'string') {
                    errorMsg = apiError.message;
                } else if (apiError && apiError.error && typeof apiError.error === 'string') {
                    errorMsg = apiError.error;
                }

                setError({
                    message: errorMsg,
                    details: Array.isArray(apiError?.missingData) ? apiError.missingData :
                             Array.isArray(apiError?.details) ? apiError.details : null
                });
                setLoading(false);
            }
        };

        if (selectedYear) {
            loadConfigAndData();
        }
    }, [selectedYear, searchParams]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        const oldTitle = document.title;
        const filename = bulletins.length > 0
            ? `Bulletins_${bulletins[0].salle.nomSalle}_${bulletins[0].period.label}`.replace(/\s+/g, '_')
            : 'Bulletins_Export';
        document.title = filename;
        window.print();
        document.title = oldTitle;
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                <p className="font-black uppercase tracking-widest text-xs text-gray-400">Préparation des bulletins en cours...</p>
            </div>
        );
    }

    if (error) {
        const displayMessage = typeof error.message === 'string'
            ? error.message
            : (error.message as any)?.message || "Erreur de configuration ou de données.";

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
                <div className="w-full max-w-2xl bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>

                    <h1 className="text-2xl font-black uppercase mb-2 tracking-tighter">Erreur de Génération</h1>
                    <p className="text-gray-500 mb-8 text-center font-medium leading-relaxed">
                        {displayMessage}
                    </p>

                    {error.details && Array.isArray(error.details) && error.details.length > 0 && (
                        <div className="w-full bg-gray-50 rounded-[32px] p-8 mb-8 border border-gray-100">
                            <div className="flex items-center space-x-3 mb-6">
                                <Info className="text-accent" size={18} />
                                <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-400">Éléments manquants ou bloquants</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                {error.details.map((item: any, idx: number) => {
                                    const label = typeof item === 'string' ? item : (item.label || item.nomEleve || item.libelle || "Donnée inconnue");
                                    const reason = typeof item === 'string' ? "Information manquante" : (item.reason || item.message || "Note manquante ou incomplète");

                                    return (
                                        <div key={idx} className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                                                <XCircle size={16} className="text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-black uppercase tracking-tight">
                                                    {typeof label === 'string' ? label : "Élément complexe"}
                                                </p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {typeof reason === 'string' ? reason : "Détails non textuels"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => window.history.back()}
                            className="flex-1 py-5 bg-black text-white rounded-[20px] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all"
                        >
                            Retour au cockpit
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-200 py-10 print:bg-white print:p-0 no-print-bg">
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-2xl print:hidden">
                <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                    {bulletins.length} Bulletin{bulletins.length > 1 ? 's' : ''} Prêt{bulletins.length > 1 ? 's' : ''}
                </p>

                <button
                    onClick={() => setShowWidget(!showWidget)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400"
                >
                    <Settings2 size={20} className={clsx(showWidget && "text-accent")} />
                </button>

                <button
                    onClick={handleExportPDF}
                    className="ml-4 px-6 py-2 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center space-x-2"
                >
                    <Download size={16} />
                    <span>Exporter PDF</span>
                </button>

                <button
                    onClick={handlePrint}
                    className="ml-2 px-6 py-2 bg-accent text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center space-x-2"
                >
                    <Printer size={16} />
                    <span>Imprimer</span>
                </button>
            </div>

            {showWidget && (
                <div className="fixed top-24 right-10 z-[60] w-80 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-[32px] shadow-2xl p-6 animate-in slide-in-from-right-10 duration-500 print:hidden overflow-y-auto max-h-[80vh]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-gray-400 flex items-center">
                        <Settings2 size={14} className="mr-2" />
                        Options d'Affinage
                    </h3>

                    <div className="space-y-4">
                        <WidgetSwitch
                            label="Afficher Groupes Matières"
                            checked={overrides.showGroups}
                            onChange={(v) => setOverrides({...overrides, showGroups: v})}
                        />
                        {overrides.showGroups && (
                            <WidgetSwitch
                                label="Synthèse par Groupe"
                                checked={overrides.showGroupSummaries}
                                onChange={(v) => setOverrides({...overrides, showGroupSummaries: v})}
                            />
                        )}
                        <div className="h-px bg-gray-100 my-4" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-2">Formatage des Stats</p>
                        <WidgetSwitch
                            label="Résultat Élève (Système)"
                            checked={overrides.formatResult}
                            onChange={(v) => setOverrides({...overrides, formatResult: v})}
                        />
                        <WidgetSwitch
                            label="Stats Classe (Système)"
                            checked={overrides.formatClassStats}
                            onChange={(v) => setOverrides({...overrides, formatClassStats: v})}
                        />
                        <WidgetSwitch
                            label="Format Points (Système)"
                            checked={overrides.formatPoints}
                            onChange={(v) => setOverrides({...overrides, formatPoints: v})}
                        />
                        <WidgetSwitch
                            label="Afficher les Rangs"
                            checked={overrides.showRank}
                            onChange={(v) => setOverrides({...overrides, showRank: v})}
                        />
                        <WidgetSwitch
                            label="Afficher les Compétences"
                            checked={overrides.showCompetencies}
                            onChange={(v) => setOverrides({...overrides, showCompetencies: v})}
                        />
                        <WidgetSwitch
                            label="Abréviations Périodes"
                            checked={overrides.showPeriodAbreviations}
                            onChange={(v) => setOverrides({...overrides, showPeriodAbreviations: v})}
                        />

                        <div className="h-px bg-gray-100 my-4" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-2">Tailles & Échelle</p>

                        <div className="space-y-3 px-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Police Matières</span>
                                <input
                                    type="range" min="6" max="14" step="0.5"
                                    value={overrides.subjectFontSize}
                                    onChange={(e) => setOverrides({...overrides, subjectFontSize: parseFloat(e.target.value)})}
                                    className="w-24 accent-accent"
                                />
                                <span className="text-[9px] font-black w-6 text-right">{overrides.subjectFontSize}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Échelle Globale</span>
                                <input
                                    type="range" min="80" max="120" step="1"
                                    value={overrides.globalScale}
                                    onChange={(e) => setOverrides({...overrides, globalScale: parseInt(e.target.value)})}
                                    className="w-24 accent-accent"
                                />
                                <span className="text-[9px] font-black w-6 text-right">{overrides.globalScale}%</span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-4" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-2">Disposition Compétences</p>

                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setOverrides({...overrides, compLayout: 'VERTICAL'})}
                                className={clsx("flex-1 py-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5", overrides.compLayout === 'VERTICAL' ? "bg-white text-black shadow-sm" : "text-gray-400")}
                            >
                                <List size={10} /> Liste
                            </button>
                            <button
                                onClick={() => setOverrides({...overrides, compLayout: 'GRID'})}
                                className={clsx("flex-1 py-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5", overrides.compLayout === 'GRID' ? "bg-white text-black shadow-sm" : "text-gray-400")}
                            >
                                <LayoutGrid size={10} /> Grille
                            </button>
                            <button
                                onClick={() => setOverrides({...overrides, compLayout: 'HORIZONTAL'})}
                                className={clsx("flex-1 py-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5", overrides.compLayout === 'HORIZONTAL' ? "bg-white text-black shadow-sm" : "text-gray-400")}
                            >
                                <LayoutGrid size={10} className="rotate-90" /> Horizontal
                            </button>
                        </div>

                        {(overrides.compLayout === 'GRID' || overrides.compLayout === 'HORIZONTAL') && (
                            <div className="flex bg-gray-100 p-1 rounded-xl animate-in fade-in duration-300">
                                <button
                                    onClick={() => setOverrides({...overrides, compNotePos: 'SIDE'})}
                                    className={clsx("flex-1 py-2 rounded-lg text-[8px] font-black uppercase", overrides.compNotePos === 'SIDE' ? "bg-white text-accent shadow-sm" : "text-gray-400")}
                                >Note à côté</button>
                                <button
                                    onClick={() => setOverrides({...overrides, compNotePos: 'BOTTOM'})}
                                    className={clsx("flex-1 py-2 rounded-lg text-[8px] font-black uppercase", overrides.compNotePos === 'BOTTOM' ? "bg-white text-accent shadow-sm" : "text-gray-400")}
                                >Note dessous</button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowWidget(false)}
                        className="w-full mt-8 py-3 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                    >
                        Appliquer
                    </button>
                </div>
            )}

            <div className="flex flex-col items-center space-y-8 print:space-y-0">
                {bulletins.map((data, index) => (
                    <React.Fragment key={index}>
                        <BulletinPage data={data} config={config} overrides={overrides} />
                        {config?.stats?.showCharts && (
                            <StatisticsPage data={data} config={config} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .bulletin-page {
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        break-after: page !important;
                    }
                }
                .no-print-bg {
                    background-color: #E5E7EB;
                }
                @media print {
                    .no-print-bg {
                        background-color: white !important;
                    }
                }
            `}</style>
        </div>
    );
};

const WidgetSwitch: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className="w-full flex justify-between items-center group"
    >
        <span className={clsx("text-[10px] font-bold transition-all", checked ? "text-black" : "text-gray-400")}>{label}</span>
        <div className={clsx(
            "w-8 h-4 rounded-full relative transition-all",
            checked ? "bg-accent" : "bg-gray-200"
        )}>
            <div className={clsx(
                "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all",
                checked ? "left-[17px]" : "left-0.5"
            )} />
        </div>
    </button>
);

const BulletinPage: React.FC<{ data: BulletinData, config: any, overrides: any }> = ({ data, config, overrides }) => {
    const totalCols = 1 +
        (config?.periodType === 'ANNUAL' && config?.showSubPeriods ? 1 : 0) +
        (config?.periodType === 'TRIMESTER' && config?.showSubPeriods ? 2 : 0) +
        1 + 1 + 1 +
        (overrides.showRank ? 1 : 0) +
        1;

    const leftColSpan = Math.floor(totalCols * 0.45);
    const rightColSpan = totalCols - leftColSpan;

    return (
        <div
            className="bulletin-page w-[210mm] min-h-[297mm] bg-white shadow-2xl flex flex-col print:shadow-none print:w-[210mm] print:page-break-after-always relative origin-top"
            style={{
                paddingTop: `${config?.margins?.top || 5}mm`,
                paddingBottom: `${config?.margins?.bottom || 5}mm`,
                paddingLeft: '10mm',
                paddingRight: '10mm',
                zoom: `${overrides.globalScale}%`
            }}
        >
            {config?.schoolInfo?.logo && config?.schoolInfo?.logoPosition === 'CENTER_WATERMARK' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg]">
                    <img src={data.school.logo} alt="Watermark" className="w-[120mm]" />
                </div>
            )}

            <header className="flex justify-between items-start pb-1 mb-2 border-b border-black relative z-10">
                {/* 1. Bloc Ministerial Left or Logo */}
                <div className="w-[30%] text-[7px] font-black uppercase leading-[1.4] space-y-0.5 text-black">
                    {config?.schoolInfo?.logo && config?.schoolInfo?.logoPosition === 'LEFT' ? (
                        <div className="flex flex-col items-start">
                            <img src={data.school.logo} alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                    ) : (
                        config?.showMinisterialHeader && (
                            <>
                                <p>REPUBLIQUE DU CAMEROUN</p>
                                <p className="text-gray-400">REPUBLIC OF CAMEROON</p>
                                <p>Paix - Travail - Patrie</p>
                                <p className="text-gray-400 italic">Peace - Work - Fatherland</p>
                            </>
                        )
                    )}
                </div>

                {/* 2. Central School Info */}
                <div className="flex flex-col items-center flex-1 text-center px-4 space-y-0.5">
                    {config?.schoolInfo?.logo && config?.schoolInfo?.logoPosition === 'CENTER_WATERMARK' && (
                        <img src={data.school.logo} alt="Logo" className="w-14 h-14 object-contain mb-1" />
                    )}

                    {config?.schoolInfo?.name && (
                        <h2 className="text-sm font-black uppercase tracking-tighter leading-tight text-black">
                            {data.school.nomFr}
                        </h2>
                    )}

                    {config?.schoolInfo?.sigle && (
                        <p className="text-[8px] font-black text-accent uppercase tracking-[0.2em]">{data.school.abreviation}</p>
                    )}

                    {config?.schoolInfo?.devise && (
                        <p className="text-[7px] font-bold italic text-black opacity-70">"{data.school.devise}"</p>
                    )}

                    {config?.schoolInfo?.contacts && (
                        <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">
                            BP: {data.school.numBP} {data.school.ville} | Tel: {data.school.tel1}
                        </p>
                    )}

                    {config?.schoolInfo?.arrete && (
                        <p className="text-[6px] font-medium text-gray-400 uppercase tracking-tight">
                            Arrêté : {data.school.arrete}
                        </p>
                    )}
                </div>

                {/* 3. Bloc Ministerial Right or Logo */}
                <div className="w-[30%] text-[7px] font-black uppercase text-right leading-[1.4] space-y-0.5 text-black">
                    {config?.schoolInfo?.logo && config?.schoolInfo?.logoPosition === 'RIGHT' ? (
                        <div className="flex flex-col items-end">
                            <img src={data.school.logo} alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                    ) : (
                        config?.showMinisterialHeader && (
                            <>
                                <p>MINISTERE DES ENSEIGNEMENTS SECONDAIRES</p>
                                <p className="text-gray-400">MINISTRY OF SECONDARY EDUCATION</p>
                                <p>DELEGATION REGIONALE DU CENTRE</p>
                            </>
                        )
                    )}
                </div>
            </header>

           <div className="mb-1 text-center relative z-10">
               <div className="inline-flex items-center gap-4 border-2 border-black bg-white px-3 py-1 rounded-xl shadow-sm">
                   <h1 className="text-sm font-black uppercase tracking-[0.3em] text-black mb-0 whitespace-nowrap">
                       B U L L E T I N&nbsp;&nbsp;D E&nbsp;&nbsp;N O T E S
                   </h1>

                   {/* Séparateur vertical propre */}
                   <span className="text-gray-300 font-light">|</span>

                   <p className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-600 mb-0 whitespace-nowrap">
                       {data.period?.label || (config?.periodType === 'ANNUAL' ? 'BILAN ANNUEL' : config?.periodType)} — {data.year.libelle}
                   </p>
               </div>
           </div>

            <div className="flex gap-2 mb-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 relative z-10 items-center">
                {config?.body?.showStudentPhoto && (
                    <div className="w-12 h-12 bg-white border-2 border-white shadow-md rounded-xl overflow-hidden flex items-center justify-center text-gray-200 shrink-0">
                        {data.student.photo ? (
                            <img src={data.student.photo} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                            <User size={24} />
                        )}
                    </div>
                )}

                {/* Passage en grille de 12 colonnes pour contrôler finement la largeur des 5 blocs */}
                <div className="flex-1 grid grid-cols-12 gap-x-2 gap-y-0.5 items-center">

                    {/* Colonne 1 : Élève (Prend 4 colonnes sur 12) */}
                    <div className="space-y-0.5 col-span-4">
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">Élève</span>
                        <p className="text-xs font-black uppercase tracking-tight text-black truncate">{data.student.nomComplet}</p>
                    </div>

                    {/* Colonne 2 : Salle (Prend 3 colonnes sur 12) */}
                    <div className="space-y-0.5 col-span-3">
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">Salle</span>
                        <p className="text-xs font-black uppercase tracking-tight text-black whitespace-nowrap">{data.salle.nomSalle}</p>
                    </div>

                    {/* Colonne 3 : Effectif & Sexe (Prend 1 colonne sur 12) */}
                    <div className="space-y-0.5 col-span-1">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">Eff.</span>
                            <p className="text-xs font-black uppercase tracking-tight text-black whitespace-nowrap">{data.salle.effectif}</p>
                            <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mt-0.5">Sexe</span>
                            <p className="text-xs font-black uppercase tracking-tight text-black">{data.student.sexe}</p>
                        </div>
                    </div>

                    {/* Colonne 4 : Né(e) le (Prend 3 colonnes sur 12) */}
                    <div className="space-y-0.5 col-span-3">
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">Né(e) le</span>
                        <p className="text-[9px] font-bold uppercase text-black truncate">{data.student.dateNaissance} à {data.student.lieuNaissance}</p>
                    </div>

                    {/* Colonne 5 : Matricule (Prend 2 colonnes sur 12) */}
                    <div className="space-y-0.5 col-span-3">
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">Matricule</span>
                        <p className="text-[10px] font-bold uppercase text-black whitespace-nowrap">{data.student.matricule}</p>
                    </div>

                </div>
            </div>

            <div className="mb-2 relative z-10">
                <table className="w-full border-collapse" style={{ borderColor: config?.body?.tableBorderColor || '#000', fontSize: `${overrides.subjectFontSize}px` }}>
                    <thead>
                        <tr className="bg-black text-white">
                            <th className="p-0.5 font-black uppercase tracking-widest text-left" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>Matières / Compétences</th>
                            {config?.periodType === 'ANNUAL' && config?.showSubPeriods && (
                                <th className="p-0.5 font-black uppercase tracking-widest text-center text-[7px]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                    {overrides.showPeriodAbreviations ? 'ABRÉV. SÉQ.' : 'Détail Séquences'}
                                </th>
                            )}
                            {config?.periodType === 'TRIMESTER' && config?.showSubPeriods && (
                                <>
                                    <th className="p-0.5 font-black uppercase tracking-widest text-center w-10 text-[7px]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                        {overrides.showPeriodAbreviations ? (data.period.subPeriods?.[0]?.abrev || 'E1') : (data.period.subPeriods?.[0]?.label || 'EVAL 1')}
                                    </th>
                                    <th className="p-0.5 font-black uppercase tracking-widest text-center w-10 text-[7px]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                        {overrides.showPeriodAbreviations ? (data.period.subPeriods?.[1]?.abrev || 'E2') : (data.period.subPeriods?.[1]?.label || 'EVAL 2')}
                                    </th>
                                </>
                            )}
                            <th className="p-0.5 font-black uppercase tracking-widest text-center w-14" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>Moy /20</th>
                            <th className="p-0.5 font-black uppercase tracking-widest text-center w-8" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>Coef</th>
                            <th className="p-0.5 font-black uppercase tracking-widest text-center w-14" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>Points</th>
                            {overrides.showRank && (
                                <th className="p-0.5 font-black uppercase tracking-widest text-center w-8" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>Rang</th>
                            )}
                            <th className="p-0.5 font-black uppercase tracking-widest text-left" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>Appréciations</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.performance.groups.map((group: any, gIdx) => (
                            <React.Fragment key={gIdx}>
                                {overrides.showGroups && (
                                    <tr className="bg-gray-100">
                                        <td colSpan={totalCols} className="p-1 font-black uppercase text-[7.5px] tracking-[0.1em] text-black" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                            <div className="flex justify-between items-center px-1">
                                                <span>{group.name}</span>
                                                {overrides.showGroupSummaries && (
                                                    <div className="flex gap-4 text-[7px] text-accent">
                                                        <span>Moy. Gr : <strong>{group.groupAverage?.toFixed(2)}</strong></span>
                                                        <span>Total Pts Gr : <strong>{group.groupTotalPoints?.toFixed(2)}</strong></span>
                                                        <span>Total Coef : <strong>{group.groupTotalCoef}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {group.subjects.map((sub, sIdx) => (
                                    <React.Fragment key={sIdx}>
                                        <tr className="hover:bg-gray-50/50">
                                            <td className="p-0.5 font-bold uppercase text-black" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                                {sub.name}
                                                {config?.body?.showSubjectTeachers && (
                                                    <>
                                                        <br />
                                                        <span className="text-[6.5px] text-gray-400 normal-case font-medium">Enseignant: {sub.teacher}</span>
                                                    </>
                                                )}
                                            </td>
                                            {config?.periodType === 'ANNUAL' && config?.showSubPeriods && (
                                                <td className="p-0.5 text-center font-bold text-[7px] text-black" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                                    Bilan Séquentiel
                                                </td>
                                            )}
                                            {config?.periodType === 'TRIMESTER' && config?.showSubPeriods && (
                                                <>
                                                    <td className="p-0.5 text-center font-bold" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                                        <GradeDisplay note={sub.note1} mode={config?.calcMode} showMax={false} />
                                                    </td>
                                                    <td className="p-0.5 text-center font-bold" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                                        <GradeDisplay note={sub.note2} mode={config?.calcMode} showMax={false} />
                                                    </td>
                                                </>
                                            )}
                                            <td className="p-0.5 text-center" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                                <GradeDisplay
                                                    note={sub.total}
                                                    cote={sub.competencies[0]?.cote || null}
                                                    mode={config?.calcMode}
                                                    failColor={config?.body?.failColor}
                                                    coteColor={getCoteColor(sub.competencies[0]?.cote || null)}
                                                />
                                            </td>
                                            <td className="p-0.5 text-center font-bold text-black" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{sub.coef}</td>
                                            <td className="p-0.5 text-center" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                                <GradeDisplay
                                                    note={sub.total ? (sub.total * sub.coef) : null}
                                                    mode={overrides.formatPoints ? config?.calcMode : 'NUMERIC'}
                                                    max={20 * sub.coef}
                                                    showMax={!overrides.formatPoints}
                                                />
                                            </td>
                                            {overrides.showRank && (
                                                <td className="p-0.5 text-center font-bold text-black" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{sub.rank}<sup>{sub.rank === 1 ? 'er' : 'ème'}</sup></td>
                                            )}
                                            {(config?.body?.showAppreciations ?? true) && (
                                                <td className="p-0.5 text-[7.5px] italic text-black" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{sub.appreciation}</td>
                                            )}
                                        </tr>
                                        {overrides.showCompetencies && sub.competencies.length > 0 && (
                                            <tr>
                                                <td colSpan={totalCols} className="p-0" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                                    <div className={clsx(
                                                        "bg-gray-50/30",
                                                        overrides.compLayout === 'GRID' ? "grid grid-cols-2 p-0.5 gap-0.5" :
                                                        overrides.compLayout === 'HORIZONTAL' ? "flex flex-row flex-wrap p-0.5 gap-0.5" : "flex flex-col"
                                                    )}>
                                                        {sub.competencies.map((comp, cIdx) => (
                                                            <div key={cIdx} className={clsx(
                                                                "flex items-center px-0.5 py-0",
                                                                (overrides.compLayout === 'GRID' || overrides.compLayout === 'HORIZONTAL') ? "bg-white/60 rounded-lg border border-gray-100" : "border-t border-gray-100 first:border-t-0",
                                                                overrides.compLayout === 'HORIZONTAL' && "flex-1 min-w-[120px]",
                                                                overrides.compNotePos === 'BOTTOM' && "flex-col items-start gap-0"
                                                            )}>
                                                                {overrides.compLayout === 'VERTICAL' && <div className="w-1 h-1 rounded-full bg-gray-300 mr-0.5 shrink-0" />}
                                                                <span className={clsx("flex-1 text-[6.5px] font-bold text-gray-500 uppercase leading-tight", (overrides.compNotePos === 'BOTTOM' || overrides.compLayout === 'HORIZONTAL') && "w-full")}>
                                                                    {comp.libelle}
                                                                </span>
                                                                <div className={clsx(
                                                                    "min-w-[22px] flex",
                                                                    overrides.compNotePos === 'SIDE' ? "justify-end ml-0.5" : "justify-start w-full"
                                                                )}>
                                                                    <span
                                                                        className="font-black text-[7px]"
                                                                        style={{ color: getCoteColor(comp.cote) }}
                                                                    >
                                                                        {comp.cote}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot className="bg-white font-black text-black">
                        {/* Totaux Classiques */}
                        <tr className="bg-gray-100 font-black">
                            <td className="p-1.5 text-right uppercase text-[8px]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>Totaux</td>
                            {config?.periodType === 'ANNUAL' && config?.showSubPeriods && <td style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }} />}
                            {config?.periodType === 'TRIMESTER' && config?.showSubPeriods && <td colSpan={2} style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }} />}
                            <td className="p-1 text-center" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <GradeDisplay note={data.performance.average} mode={config?.calcMode} showMax={false} />
                            </td>
                            <td className="p-1 text-center" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{data.performance.totalCoef}</td>
                            <td className="p-1 text-center" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <GradeDisplay
                                    note={data.performance.totalPoints}
                                    mode={overrides.formatPoints ? config?.calcMode : 'NUMERIC'}
                                    max={20 * data.performance.totalCoef}
                                    showMax={!overrides.formatPoints}
                                />
                            </td>
                            <td colSpan={overrides.showRank ? 2 : 1} className="p-1 text-center text-accent uppercase tracking-widest text-[7px]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                {data.performance.appreciation}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* --- TABLEAU DÉTACHÉ DES SYNTHÈSES --- */}
            <div className="relative z-10 mt-1">
                <table className="w-full border-collapse" style={{ borderColor: config?.body?.tableBorderColor || '#000' }}>
                    <thead>
                        <tr className="bg-gray-200">
                            <td colSpan={6} className="p-1 font-black uppercase text-center text-[9px] tracking-[0.2em] border border-black" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                SYNTHÈSE {config?.periodType === 'ANNUAL' ? 'BILAN ANNUEL' : (data.period?.label || config?.periodType)} — {data.year.libelle}
                            </td>
                        </tr>
                    </thead>
                    <tbody className="text-black font-black">
                        {/* Ligne : BILAN DE LA CLASSE (2 colonnes) & RÉSULTAT DE L’ÉLÈVE (1 ou 2 colonnes) */}
                        <tr>
                            <td colSpan={1} className="p-0.5 border border-black align-top w-[15%]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <h4 className="text-[9px] font-black uppercase underline mb-0.5 leading-none">Moyennes</h4>
                                <div className="text-[9.5px] space-y-0">
                                    <div className="flex justify-between"><span>Max :</span> <strong>{data.stats.maxMoy.toFixed(2)}</strong></div>
                                    <div className="flex justify-between"><span>Min :</span> <strong>{data.stats.minMoy.toFixed(2)}</strong></div>
                                </div>
                            </td>
                            <td colSpan={1} className="p-0.5 border border-black align-top w-[15%]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <h4 className="text-[9px] font-black uppercase underline mb-0.5 leading-none">Stats Classe</h4>
                                <div className="text-[10px] space-y-0">
                                    <div className="flex justify-between"><span>Moy. :</span> <strong>{data.stats.avgMoy.toFixed(2)}</strong></div>
                                    <div className="flex justify-between"><span>Taux :</span> <strong>{data.stats.successRate.toFixed(2)}%</strong></div>
                                </div>
                            </td>

                            {overrides.showRank ? (
                                <>
                                    <td colSpan={2} className="p-0.5 border border-black text-center align-middle bg-gray-50/30" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                        <h4 className="text-[13px] font-black uppercase underline mb-0.5 leading-none">Moyenne Élève</h4>
                                        <p className="text-[19px] font-black">{data.performance.average.toFixed(2)}</p>
                                    </td>
                                    <td colSpan={2} className="p-0.5 border border-black text-center align-middle bg-gray-50/30" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                        <h4 className="text-[11px] font-black uppercase underline mb-0.5 leading-none">Rang</h4>
                                        <p className="text-[15px] font-black">{data.performance.rank}<sup>{data.performance.rank === 1 ? 'er' : 'ème'}</sup> / {data.salle.effectif}</p>
                                    </td>
                                </>
                            ) : (
                                <td colSpan={4} className="p-0.5 border border-black text-center align-middle bg-gray-50/30" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                    <h4 className="text-[9px] font-black uppercase underline mb-0.5 leading-none">Résultat de l'Élève</h4>
                                    <p className="text-[15px] font-black uppercase">MOYENNE : {data.performance.average.toFixed(2)}</p>
                                </td>
                            )}
                        </tr>

                        {/* Ligne : DISCIPLINE (3 colonnes) & DÉCISIONS (3 colonnes) */}
                        <tr>
                            {/* Discipline - 3 Cols */}
                            <td className="p-0.5 border border-black text-center w-[10%]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <span className="text-[8px] font-black block uppercase leading-none mb-0.5">Abs. Just.</span>
                                <strong className="text-[10px]">{data.discipline.absencesJustified} h</strong>
                            </td>
                            <td className="p-0.5 border border-black text-center w-[10%]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <span className="text-[8px] font-black block uppercase leading-none mb-0.5 text-red-600">Abs. N.J.</span>
                                <strong className="text-[10px] text-red-600">{data.discipline.absencesUnjustified} h</strong>
                            </td>


                            {/* Décisions - 3 Cols */}
                            <td className="p-0.5 border border-black text-center align-middle" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <h4 className="text-[8.5px] font-black uppercase underline leading-none mb-0.5">Décision</h4>
                                <span className="text-[9px] font-bold uppercase">{data.performance.average < 10 ? 'Avertissement' : 'Passage'}</span>
                            </td>
                            <td className="p-0.5 border border-black text-center align-middle" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <h4 className="text-[8.5px] font-black uppercase underline leading-none mb-0.5">Tableau d'Honneur</h4>
                                <span className="text-[9px] font-black uppercase whitespace-nowrap">{data.performance.average >= 12 ? '' : 'N/A'}</span>
                            </td>
                            <td className="p-0.5 border border-black align-middle" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <p className="text-[6px] italic leading-tight text-gray-400">Effort en : _________________</p>
                            </td>
                        </tr>

                        {/* Ligne : Espaces de Validation (Équilibrés) */}
                        <tr>
                            {[
                                { show: config?.signatures?.showParent ?? true, title: 'LE PARENT' },
                                { show: config?.signatures?.showTeacher ?? true, title: 'LE PROF PRINCIPAL' },
                                { show: config?.signatures?.showDirector ?? true, title: 'LE CHEF D\'ÉTABLISSEMENT' }
                            ].filter(s => s.show).map((s, idx, arr) => (
                                <td
                                    key={idx}
                                    colSpan={6 / arr.length}
                                    className="p-1 border border-black text-center h-20 align-top"
                                    style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}
                                >
                                    <h4 className="text-[8px] font-black uppercase underline">{s.title}</h4>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatisticsPage: React.FC<{ data: BulletinData, config: any }> = ({ data, config }) => {
    const getPerformanceColor = (avg: number) => {
        if (avg < 10) return '#EF4444'; // Rouge: Sous-moyenne
        if (avg < 12) return '#3B82F6'; // Bleu: Juste la moyenne/Passable
        return '#10B981'; // Vert: Bien/Au-dessus
    };

    // 1. Bar Chart Data with Proportionality (Weight) and Colors
    const barData = data.performance.groups.map(group => {
        const avg = group.groupAverage || 0;
        return {
            name: group.name,
            élève: avg,
            classe: data.stats.avgMoy || 0,
            weight: group.groupTotalCoef || 1,
            color: getPerformanceColor(avg),
            pointsEarned: group.groupTotalPoints || 0,
            maxPoints: (group.groupTotalCoef || 1) * 20
        };
    });

    // 2. Comparative Data for Radar (Seq 1 vs Seq 2)
    // We need to calculate averages per group for each sequence
    const radarData = data.performance.groups.map(group => {
        const getSeqGroupAvg = (seqIndex: number) => {
            const notes = group.subjects.map(s => seqIndex === 1 ? s.note1 : s.note2).filter(v => v !== null) as number[];
            if (notes.length === 0) return 0;
            // Weighted average for the group in this sequence
            let sumPts = 0;
            let sumCoef = 0;
            group.subjects.forEach(s => {
                const val = seqIndex === 1 ? s.note1 : s.note2;
                if (val !== null) {
                    sumPts += (val * s.coef);
                    sumCoef += s.coef;
                }
            });
            return sumCoef > 0 ? (sumPts / sumCoef) : 0;
        };

        return {
            subject: group.name,
            seq1: getSeqGroupAvg(1),
            seq2: getSeqGroupAvg(2),
            full: group.groupAverage || 0,
            weight: group.groupTotalCoef || 1
        };
    });

    const isComparative = config?.periodType === 'TRIMESTER' && data.period.subPeriods && data.period.subPeriods.length >= 1;

    return (
        <div className="bulletin-page w-[210mm] min-h-[297mm] bg-white shadow-2xl flex flex-col p-[15mm] print:shadow-none print:w-[210mm] print:page-break-before-always relative overflow-hidden">
            {/* Header Profil */}
            <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Diagnostic de Performance</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Analyse pondérée par coefficients — {data.student.nomComplet}</p>
                </div>
                <div className="text-right space-y-1">
                    <div className="px-4 py-1 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest inline-block">
                        {data.period.label}
                    </div>
                    <p className="text-[8px] font-black text-accent uppercase tracking-widest block">Moyenne Générale : {data.performance.average.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex-1 space-y-8">
                {/* 1. Bar Chartpondéré */}
                <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                                <BarChart3 size={16} className="text-accent" />
                                Bilan des Pôles d'Apprentissage
                            </h3>
                            <p className="text-[7px] font-medium text-gray-400 uppercase tracking-widest mt-1">La largeur des barres indique le poids (Coefficients) du groupe</p>
                        </div>
                    </div>

                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis
                                    dataKey="name"
                                    tick={{fontSize: 7, fontWeight: 900}}
                                    height={40}
                                />
                                <YAxis domain={[0, 20]} tick={{fontSize: 8, fontWeight: 800}} />
                                <Tooltip
                                    cursor={{fill: 'transparent'}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                                                    <p className="text-[9px] font-black uppercase mb-1">{d.name}</p>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-bold text-gray-500">Moyenne: <span className="text-black">{d.élève.toFixed(2)}/20</span></p>
                                                        <p className="text-[8px] font-bold text-gray-500">Poids: <span className="text-black">Coef. {d.weight}</span></p>
                                                        <p className="text-[8px] font-bold text-gray-500">Points: <span className="text-black">{d.pointsEarned.toFixed(1)} / {d.maxPoints}</span></p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="élève"
                                    name="Moyenne Élève"
                                    radius={[4, 4, 0, 0]}
                                >
                                    {barData.map((entry, index) => (
                                        <rect
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            // On simule la largeur par rapport au poids (coef)
                                            width={20 + (entry.weight * 2)}
                                        />
                                    ))}
                                </Bar>
                                <Bar dataKey="classe" name="Moyenne Classe" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Radar Chart Comparatif Pondéré */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                    <div className="bg-black text-white p-6 rounded-[32px] relative overflow-hidden flex flex-col h-[320px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />

                        <div className="relative z-10 mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                                <Zap size={14} />
                                {isComparative ? "Radar de Progression" : "Analyse d'Équilibre"}
                            </h3>
                            <p className="text-[8px] font-medium text-gray-400 leading-relaxed mt-1">
                                Visualisation de la maîtrise des compétences par pôle. {isComparative && "Comparaison entre les évaluations."}
                            </p>
                        </div>

                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 7, fontWeight: 900}} />
                                    <PolarRadiusAxis angle={30} domain={[0, 20]} tick={false} axisLine={false} />

                                    {isComparative ? (
                                        <>
                                            <Radar
                                                name={data.period.subPeriods?.[0]?.abrev || "Seq 1"}
                                                dataKey="seq1"
                                                stroke="#94a3b8"
                                                fill="#94a3b8"
                                                fillOpacity={0.3}
                                            />
                                            <Radar
                                                name={data.period.subPeriods?.[1]?.abrev || "Seq 2"}
                                                dataKey="seq2"
                                                stroke="#3b82f6"
                                                fill="#3b82f6"
                                                fillOpacity={0.5}
                                            />
                                        </>
                                    ) : (
                                        <Radar
                                            name="Performance"
                                            dataKey="full"
                                            stroke="#10b981"
                                            fill="#10b981"
                                            fillOpacity={0.5}
                                        />
                                    )}
                                    <Legend wrapperStyle={{fontSize: '8px', fontWeight: 900, color: '#fff'}} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-black p-6 rounded-[32px] flex flex-col">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4">Impact des Pôles (Points)</h3>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {barData.sort((a, b) => b.pointsEarned - a.pointsEarned).map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                            #{idx+1}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase leading-tight">{item.name}</p>
                                            <p className="text-[7px] font-bold text-gray-400 uppercase">Poids: x{item.weight}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black">+{item.pointsEarned.toFixed(1)} <span className="text-[7px] text-gray-400">pts</span></p>
                                        <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                                            <div className="h-full rounded-full" style={{ width: `${(item.élève/20)*100}%`, backgroundColor: item.color }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Points Totaux : {data.performance.totalPoints.toFixed(1)} / {data.performance.totalCoef * 20}</p>
                            </div>
                            <p className="text-[8px] font-bold text-black uppercase leading-relaxed">
                                Dominante Stratégique : <span className="text-accent">{barData.sort((a, b) => b.pointsEarned - a.pointsEarned)[0]?.name}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Diagnostic */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center opacity-40">
                <p className="text-[6px] font-black uppercase tracking-[0.3em]">Scholar Analyse System pondéré v3.1</p>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"/> <span className="text-[6px] font-bold">Alerte</span></div>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"/> <span className="text-[6px] font-bold">Passable</span></div>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"/> <span className="text-[6px] font-bold">Acquis</span></div>
                </div>
                <p className="text-[6px] font-black uppercase tracking-[0.3em]">Page 2 / 2</p>
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string, value?: string | null, children?: React.ReactNode }> = ({ label, value, children }) => (
    <div className="flex justify-between items-center text-[8px] border-b border-gray-100 pb-1">
        <span className="font-bold text-gray-500 uppercase">{label}</span>
        {children ? children : <span className="font-black text-black">{value}</span>}
    </div>
);

const SignatureBlock: React.FC<{ title: string }> = ({ title }) => (
    <div className="border border-black rounded-xl p-1.5 min-h-[60px] flex flex-col items-center">
        <p className="text-[7.5px] font-black uppercase underline mb-0.5 text-black">{title}</p>
    </div>
);

export default BulletinPrintPage;
