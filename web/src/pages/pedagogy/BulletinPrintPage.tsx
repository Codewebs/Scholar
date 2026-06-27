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
    salle: {
        idSalle?: number;
        idClasse?: number;
        nomSalle: string;
        effectif: number;
    };
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
    institutionalHeader?: any;
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

// --- Translations Dictionary ---
const bulletinTranslations: any = {
    FR: {
        bulletin: "B U L L E T I N  D E  N O T E S",
        pvTitle: "Procès-Verbal de la Salle de Classe",
        resultsTitle: "Liste des Résultats",
        honorsTitle: "Tableau d'Honneur",
        certExcellence: "Certification d'Excellence",
        awardedTo: "Décerné avec félicitations à",
        forResults: "Pour ses résultats exceptionnels au cours du",
        withAverage: "avec une moyenne générale de",
        deliveredBy: "Délivré par",
        officialSeal: "Sceau Officiel",
        student: "Élève",
        class: "Classe / Salle",
        eff: "Eff.",
        sex: "Sexe",
        bornOn: "Né(e) le",
        at: "à",
        matricule: "Matricule",
        subjects: "Matières / Compétences",
        moy20: "Moy /20",
        coef: "Coef",
        points: "Points",
        rank: "Rang",
        appreciation: "Appréciations",
        groupMoy: "Moy. Gr",
        groupTotal: "Total Pts Gr",
        totals: "Totaux",
        max: "Max",
        min: "Min",
        classStats: "Stats Classe",
        moyStudent: "Moyenne Élève",
        absJust: "Abs. Just.",
        absUnjust: "Abs. N.J.",
        decision: "Décision",
        effortIn: "Effort en",
        parent: "LE PARENT",
        teacher: "LE PROF PRINCIPAL",
        director: "LE CHEF D'ÉTABLISSEMENT",
        diagnostic: "Diagnostic de Performance",
        polesOverview: "Bilan des Pôles d'Apprentissage",
        radarProgression: "Radar de Progression",
        impactPoles: "Impact des Pôles (Points)",
        admitted: "Admis",
        failed: "Échec",
        warning: "Avertissement",
        promotion: "Passage"
    },
    EN: {
        bulletin: "R E P O R T  C A R D",
        pvTitle: "Classroom Performance Minutes",
        resultsTitle: "Results List",
        honorsTitle: "Honor Roll",
        certExcellence: "Certification of Excellence",
        awardedTo: "Proudly awarded to",
        forResults: "For outstanding academic performance during",
        withAverage: "with a cumulative average of",
        deliveredBy: "Issued by",
        officialSeal: "Official Seal",
        student: "Student",
        class: "Class / Room",
        eff: "Roll",
        sex: "Sex",
        bornOn: "Born on",
        at: "at",
        matricule: "ID Number",
        subjects: "Subjects / Competencies",
        moy20: "Avg /20",
        coef: "Coef",
        points: "Points",
        rank: "Rank",
        appreciation: "Remarks",
        groupMoy: "Group Avg",
        groupTotal: "Group Total",
        totals: "Totals",
        max: "Max",
        min: "Min",
        classStats: "Class Stats",
        moyStudent: "Student Average",
        absJust: "Exc. Abs.",
        absUnjust: "Unexc. Abs.",
        decision: "Decision",
        effortIn: "Effort in",
        parent: "PARENT",
        teacher: "CLASS TEACHER",
        director: "PRINCIPAL / HEADMASTER",
        diagnostic: "Performance Diagnostic",
        polesOverview: "Learning Areas Overview",
        radarProgression: "Progression Radar",
        impactPoles: "Subjects Impact (Points)",
        admitted: "Passed",
        failed: "Failed",
        warning: "Warning",
        promotion: "Promotion"
    },
    ES: {
        bulletin: "B O L E T Í N  D E  N O T A S",
        pvTitle: "Acta de Calificaciones del Aula",
        resultsTitle: "Lista de Resultados",
        honorsTitle: "Cuadro de Honor",
        certExcellence: "Certificación de Excelencia",
        awardedTo: "Otorgado con felicitaciones a",
        forResults: "Por su destacado rendimiento académico durante",
        withAverage: "con un promedio general de",
        deliveredBy: "Emitido por",
        officialSeal: "Sello Oficial",
        student: "Estudiante",
        class: "Clase / Aula",
        eff: "Cant.",
        sex: "Sexo",
        bornOn: "Nacido el",
        at: "en",
        matricule: "Matrícula",
        subjects: "Materias / Competencias",
        moy20: "Prom /20",
        coef: "Coef",
        points: "Puntos",
        rank: "Puesto",
        appreciation: "Apreciaciones",
        groupMoy: "Prom. Gr",
        groupTotal: "Total Pts Gr",
        totals: "Totales",
        max: "Máx",
        min: "Mín",
        classStats: "Estad. Clase",
        moyStudent: "Promedio Estudiante",
        absJust: "Aus. Just.",
        absUnjust: "Aus. N.J.",
        decision: "Decisión",
        effortIn: "Esfuerzo en",
        parent: "EL PADRE",
        teacher: "EL TUTOR",
        director: "EL DIRECTOR",
        diagnostic: "Diagnóstico de Rendimiento",
        polesOverview: "Resumen de Áreas de Aprendizaje",
        radarProgression: "Radar de Progresión",
        impactPoles: "Impacto de Materias (Puntos)",
        admitted: "Aprobado",
        failed: "Reprobado",
        warning: "Advertencia",
        promotion: "Promoción"
    }
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
                        perimeter: (currentConfig.printMode === 'PV' || currentConfig.printMode === 'LIST' || currentConfig.printMode === 'HONORS') && currentConfig.selectedPerimeter === 'SALLE'
                            ? 'CLASSE' // Fetch entire class for comparison
                            : currentConfig.selectedPerimeter,
                        id: currentConfig.selectedId,
                        periodType: currentConfig.periodType,
                        selectedPeriodId: currentConfig.selectedPeriodId,
                        idAnneeScolaire: selectedYear?.idServeur || selectedYear?.idAnneeScolaire,
                        allowIncompleteStudent: currentConfig.allowIncompleteStudent,
                        allowIncompleteRoom: currentConfig.allowIncompleteRoom
                    }
                });

                const data: BulletinData[] = response.data;
                setBulletins(data);

                // Update document title for browser tab and default filename
                if (data.length > 0) {
                    const first = data[0];

                    let periodPart = first.period.label;
                    if (currentConfig.periodType === 'ANNUAL') {
                        periodPart = `Ann ${first.year.libelle}`;
                    } else if (currentConfig.periodType === 'SEQUENCE') {
                        const num = first.period.label.match(/\d+/);
                        periodPart = num ? `Seq ${num[0]}` : first.period.label;
                    } else if (currentConfig.periodType === 'TRIMESTER') {
                        const num = first.period.label.match(/\d+/);
                        periodPart = num ? `Trim ${num[0]}` : first.period.label;
                    }

                    const salleLabel = first.salle.nomSalle;
                    const modeLabel = currentConfig.printMode === 'PV' ? 'PV de Classe' :
                                     currentConfig.printMode === 'LIST' ? 'Liste Résultats' :
                                     currentConfig.printMode === 'HONORS' ? 'Tableau d\'Honneur' :
                                     'Bulletins';
                    document.title = `${modeLabel} - ${salleLabel} - ${periodPart}`;
                }

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
        window.print();
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
                {config?.printMode === 'PV' ? (
                    <PVPage bulletins={bulletins} config={config} />
                ) : config?.printMode === 'LIST' ? (
                    <ResultsListPage bulletins={bulletins} config={config} />
                ) : config?.printMode === 'HONORS' ? (
                    <HonorsListPage bulletins={bulletins} config={config} />
                ) : (
                    bulletins.map((data, index) => (
                        <React.Fragment key={index}>
                            <BulletinPage data={data} config={config} overrides={overrides} />
                            {config?.stats?.showCharts && (
                                <StatisticsPage data={data} config={config} />
                            )}
                        </React.Fragment>
                    ))
                )}
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    .landscape-page {
                        @page { size: A4 landscape; }
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
                    .landscape-page {
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        break-after: page !important;
                    }
                }
                @media print and (orientation: landscape) {
                   .landscape-page {
                      width: 297mm !important;
                      height: 210mm !important;
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

const InstitutionalHeader: React.FC<{ school: any, customHeader?: any }> = ({ school, customHeader }) => {
    if (customHeader) {
        return (
            <div className="w-full flex justify-between items-start mb-8 text-[10px] uppercase font-black">
                <div className="text-center space-y-0.5">
                    {customHeader.blocGaucheLigne1 && <p>{customHeader.blocGaucheLigne1}</p>}
                    {customHeader.blocGaucheLigne2 && <p className="italic font-bold text-gray-500">{customHeader.blocGaucheLigne2}</p>}
                    <div className="h-px w-12 bg-gray-200 mx-auto my-1" />
                    {customHeader.blocGaucheLigne3 && <p>{customHeader.blocGaucheLigne3}</p>}
                    {customHeader.blocGaucheLigne4 && <p>{customHeader.blocGaucheLigne4}</p>}
                    {customHeader.blocGaucheLigne5 && <p>{customHeader.blocGaucheLigne5}</p>}
                    {customHeader.blocGaucheLigne6 && <p>{customHeader.blocGaucheLigne6}</p>}
                </div>

                {school?.logo && (
                    <div className="w-20 h-20">
                        <img src={school.logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                )}

                <div className="text-center space-y-0.5">
                    {customHeader.blocDroitLigne1 && <p>{customHeader.blocDroitLigne1}</p>}
                    {customHeader.blocDroitLigne2 && <p className="italic font-bold text-gray-500">{customHeader.blocDroitLigne2}</p>}
                    <div className="h-px w-12 bg-gray-200 mx-auto my-1" />
                    {customHeader.blocDroitLigne3 && <p>{customHeader.blocDroitLigne3}</p>}
                    {customHeader.blocDroitLigne4 && <p>{customHeader.blocDroitLigne4}</p>}
                    {customHeader.blocDroitLigne5 && <p>{customHeader.blocDroitLigne5}</p>}
                    {customHeader.blocDroitLigne6 && <p>{customHeader.blocDroitLigne6}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-between items-start mb-8 text-[10px] uppercase font-black">
            <div className="text-center space-y-0.5">
                <p>REPUBLIQUE DU CAMEROUN</p>
                <p className="italic font-bold text-gray-500">Paix - Travail - Patrie</p>
                <div className="h-px w-12 bg-gray-200 mx-auto my-1" />
                <p>MINISTERE DES ENSEIGNEMENTS SECONDAIRES</p>
                <p>{school?.delegationRegionale || "DELEGATION REGIONALE DU LITTORAL"}</p>
                <p>{school?.delegationDepartementale || "DELEGATION DEPARTEMENTALE DU WOURI"}</p>
            </div>

            {school?.logo && (
                <div className="w-20 h-20">
                    <img src={school.logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
            )}

            <div className="text-center space-y-0.5">
                <p>REPUBLIC OF CAMEROON</p>
                <p className="italic font-bold text-gray-500">Peace - Work - Fatherland</p>
                <div className="h-px w-12 bg-gray-200 mx-auto my-1" />
                <p>MINISTRY OF SECONDARY EDUCATION</p>
                <p>{school?.regionalDelegationEn || "LITTORAL REGIONAL DELEGATION"}</p>
                <p>{school?.divisionalDelegationEn || "WOURI DIVISIONAL DELEGATION"}</p>
            </div>
        </div>
    );
};

const BulletinPage: React.FC<{ data: BulletinData, config: any, overrides: any }> = ({ data, config, overrides }) => {
    const lang = config?.language || 'FR';
    const t = bulletinTranslations[lang] || bulletinTranslations.FR;

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
                       {t.bulletin}
                   </h1>

                   {/* Séparateur vertical propre */}
                   <span className="text-gray-300 font-light">|</span>

                   <p className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-600 mb-0 whitespace-nowrap">
                       {data.period?.label || (config?.periodType === 'ANNUAL' ? (lang === 'FR' ? 'BILAN ANNUEL' : lang === 'EN' ? 'ANNUAL REPORT' : 'BALANCE ANUAL') : config?.periodType)} — {data.year.libelle}
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
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">{t.student}</span>
                        <p className="text-xs font-black uppercase tracking-tight text-black truncate">{data.student.nomComplet}</p>
                    </div>

                    {/* Colonne 2 : Salle (Prend 3 colonnes sur 12) */}
                    <div className="space-y-0.5 col-span-3">
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">{t.class}</span>
                        <p className="text-xs font-black uppercase tracking-tight text-black whitespace-nowrap">{data.salle.nomSalle}</p>
                    </div>

                    {/* Colonne 3 : Effectif & Sexe (Prend 1 colonne sur 12) */}
                    <div className="space-y-0.5 col-span-1">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">{t.eff}</span>
                            <p className="text-xs font-black uppercase tracking-tight text-black whitespace-nowrap">{data.salle.effectif}</p>
                            <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block mt-0.5">{t.sex}</span>
                            <p className="text-xs font-black uppercase tracking-tight text-black">{data.student.sexe}</p>
                        </div>
                    </div>

                    {/* Colonne 4 : Né(e) le (Prend 3 colonnes sur 12) */}
                    <div className="space-y-0.5 col-span-3">
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">{t.bornOn}</span>
                        <p className="text-[9px] font-bold uppercase text-black truncate">{data.student.dateNaissance} {t.at} {data.student.lieuNaissance}</p>
                    </div>

                    {/* Colonne 5 : Matricule (Prend 2 colonnes sur 12) */}
                    <div className="space-y-0.5 col-span-3">
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-400 block">{t.matricule}</span>
                        <p className="text-[10px] font-bold uppercase text-black whitespace-nowrap">{data.student.matricule}</p>
                    </div>

                </div>
            </div>

            <div className="mb-2 relative z-10">
                <table className="w-full border-collapse" style={{ borderColor: config?.body?.tableBorderColor || '#000', fontSize: `${overrides.subjectFontSize}px` }}>
                    <thead>
                        <tr className="bg-black text-white">
                            <th className="p-0.5 font-black uppercase tracking-widest text-left" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{t.subjects}</th>
                            {config?.periodType === 'ANNUAL' && config?.showSubPeriods && (
                                <th className="p-0.5 font-black uppercase tracking-widest text-center text-[7px]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                    {overrides.showPeriodAbreviations ? 'ABRÉV.' : (lang === 'FR' ? 'Détail Périodes' : lang === 'EN' ? 'Period Details' : 'Detalles de Periodos')}
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
                            <th className="p-0.5 font-black uppercase tracking-widest text-center w-14" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{t.moy20}</th>
                            <th className="p-0.5 font-black uppercase tracking-widest text-center w-8" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{t.coef}</th>
                            <th className="p-0.5 font-black uppercase tracking-widest text-center w-14" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{t.points}</th>
                            {overrides.showRank && (
                                <th className="p-0.5 font-black uppercase tracking-widest text-center w-8" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{t.rank}</th>
                            )}
                            <th className="p-0.5 font-black uppercase tracking-widest text-left" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{t.appreciation}</th>
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
                                                        <span>{t.groupMoy} : <strong>{group.groupAverage?.toFixed(2)}</strong></span>
                                                        <span>{t.groupTotal} : <strong>{group.groupTotalPoints?.toFixed(2)}</strong></span>
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
                            <td className="p-1.5 text-right uppercase text-[8px]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>{t.totals}</td>
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
                                {t.totals.replace('T O T A U X', 'SYNTHÈSE').replace('T O T A L S', 'SUMMARY').replace('T O T A L E S', 'SÍNTESIS')} {config?.periodType === 'ANNUAL' ? (lang === 'FR' ? 'BILAN ANNUEL' : lang === 'EN' ? 'ANNUAL REPORT' : 'BALANCE ANUAL') : (data.period?.label || config?.periodType)} — {data.year.libelle}
                            </td>
                        </tr>
                    </thead>
                    <tbody className="text-black font-black">
                        {/* Ligne : BILAN DE LA CLASSE (2 colonnes) & RÉSULTAT DE L’ÉLÈVE (1 ou 2 colonnes) */}
                        <tr>
                            <td colSpan={1} className="p-0.5 border border-black align-top w-[15%]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <h4 className="text-[9px] font-black uppercase underline mb-0.5 leading-none">Moyennes</h4>
                                <div className="text-[9.5px] space-y-0">
                                    <div className="flex justify-between"><span>{t.max} :</span> <strong>{data.stats.maxMoy.toFixed(2)}</strong></div>
                                    <div className="flex justify-between"><span>{t.min} :</span> <strong>{data.stats.minMoy.toFixed(2)}</strong></div>
                                </div>
                            </td>
                            <td colSpan={1} className="p-0.5 border border-black align-top w-[15%]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <h4 className="text-[9px] font-black uppercase underline mb-0.5 leading-none">{t.classStats}</h4>
                                <div className="text-[10px] space-y-0">
                                    <div className="flex justify-between"><span>{t.moy20.replace('/20', '')} :</span> <strong>{data.stats.avgMoy.toFixed(2)}</strong></div>
                                    <div className="flex justify-between"><span>Taux :</span> <strong>{data.stats.successRate.toFixed(2)}%</strong></div>
                                </div>
                            </td>

                            {overrides.showRank ? (
                                <>
                                    <td colSpan={2} className="p-0.5 border border-black text-center align-middle bg-gray-50/30" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                        <h4 className="text-[13px] font-black uppercase underline mb-0.5 leading-none">{t.moyStudent}</h4>
                                        <p className="text-[19px] font-black">{data.performance.average.toFixed(2)}</p>
                                    </td>
                                    <td colSpan={2} className="p-0.5 border border-black text-center align-middle bg-gray-50/30" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                        <h4 className="text-[11px] font-black uppercase underline mb-0.5 leading-none">{t.rank}</h4>
                                        <p className="text-[15px] font-black">{data.performance.rank}<sup>{data.performance.rank === 1 ? (lang === 'FR' ? 'er' : 'st') : (lang === 'FR' ? 'ème' : lang === 'EN' ? (data.performance.rank === 2 ? 'nd' : data.performance.rank === 3 ? 'rd' : 'th') : 'º')}</sup> / {data.salle.effectif}</p>
                                    </td>
                                </>
                            ) : (
                                <td colSpan={4} className="p-0.5 border border-black text-center align-middle bg-gray-50/30" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                    <h4 className="text-[9px] font-black uppercase underline mb-0.5 leading-none">{lang === 'FR' ? "Résultat de l'Élève" : lang === 'EN' ? "Student Result" : "Resultado del Estudiante"}</h4>
                                    <p className="text-[15px] font-black uppercase">{t.moy20.replace('/20', '').toUpperCase()} : {data.performance.average.toFixed(2)}</p>
                                </td>
                            )}
                        </tr>

                        {/* Ligne : DISCIPLINE (3 colonnes) & DÉCISIONS (3 colonnes) */}
                        <tr>
                            {/* Discipline - 3 Cols */}
                            <td className="p-0.5 border border-black text-center w-[10%]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <span className="text-[8px] font-black block uppercase leading-none mb-0.5">{t.absJust}</span>
                                <strong className="text-[10px]">{data.discipline.absencesJustified} h</strong>
                            </td>
                            <td className="p-0.5 border border-black text-center w-[10%]" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <span className="text-[8px] font-black block uppercase leading-none mb-0.5 text-red-600">{t.absUnjust}</span>
                                <strong className="text-[10px] text-red-600">{data.discipline.absencesUnjustified} h</strong>
                            </td>


                            {/* Décisions - 3 Cols */}
                            <td className="p-0.5 border border-black text-center align-middle" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <h4 className="text-[8.5px] font-black uppercase underline leading-none mb-0.5">{t.decision}</h4>
                                <span className="text-[9px] font-bold uppercase">{data.performance.average < 10 ? t.warning : t.promotion}</span>
                            </td>
                            <td className="p-0.5 border border-black text-center align-middle" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <h4 className="text-[8.5px] font-black uppercase underline leading-none mb-0.5">{t.honorsTitle}</h4>
                                <span className="text-[9px] font-black uppercase whitespace-nowrap">{data.performance.average >= 12 ? '' : 'N/A'}</span>
                            </td>
                            <td className="p-0.5 border border-black align-middle" style={{ border: `${config?.body?.tableBorderWidth || '1px'} solid ${config?.body?.tableBorderColor || '#000'}` }}>
                                <p className="text-[6px] italic leading-tight text-gray-400">{t.effortIn} : _________________</p>
                            </td>
                        </tr>

                        {/* Ligne : Espaces de Validation (Équilibrés) */}
                        <tr>
                            {[
                                { show: config?.signatures?.showParent ?? true, title: t.parent },
                                { show: config?.signatures?.showTeacher ?? true, title: t.teacher },
                                { show: config?.signatures?.showDirector ?? true, title: t.director }
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
    const lang = config?.language || 'FR';
    const t = bulletinTranslations[lang] || bulletinTranslations.FR;

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
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{t.diagnostic}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{lang === 'FR' ? 'Analyse pondérée par coefficients' : lang === 'EN' ? 'Weighted analysis by coefficients' : 'Análisis ponderado por coeficientes'} — {data.student.nomComplet}</p>
                </div>
                <div className="text-right space-y-1">
                    <div className="px-4 py-1 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest inline-block">
                        {data.period.label}
                    </div>
                    <p className="text-[8px] font-black text-accent uppercase tracking-widest block">{t.moyStudent} : {data.performance.average.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex-1 space-y-8">
                {/* 1. Bar Chartpondéré */}
                <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                                <BarChart3 size={16} className="text-accent" />
                                {t.polesOverview}
                            </h3>
                            <p className="text-[7px] font-medium text-gray-400 uppercase tracking-widest mt-1">{lang === 'FR' ? 'La largeur des barres indique le poids (Coefficients) du groupe' : lang === 'EN' ? 'Bar width indicates group weight (Coefficients)' : 'El ancho de barra indica el peso del grupo (Coeficientes)'}</p>
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
                                {t.radarProgression}
                            </h3>
                            <p className="text-[8px] font-medium text-gray-400 leading-relaxed mt-1">
                                {lang === 'FR' ? 'Visualisation de la maîtrise des compétences par pôle.' : lang === 'EN' ? 'Visualization of competency mastery by learning area.' : 'Visualización del dominio de competencias por área.'} {isComparative && (lang === 'FR' ? "Comparaison entre les évaluations." : lang === 'EN' ? "Comparison between evaluations." : "Comparación entre evaluaciones.")}
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
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4">{t.impactPoles}</h3>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {barData.sort((a, b) => b.pointsEarned - a.pointsEarned).map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                            #{idx+1}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase leading-tight">{item.name}</p>
                                            <p className="text-[7px] font-bold text-gray-400 uppercase">{t.coef.replace('Coef', 'Peso')}: x{item.weight}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black">+{item.pointsEarned.toFixed(1)} <span className="text-[7px] text-gray-400">{t.points.toLowerCase()}</span></p>
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
                                <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">{lang === 'FR' ? 'Points Totaux' : lang === 'EN' ? 'Total Points' : 'Puntos Totales'} : {data.performance.totalPoints.toFixed(1)} / {data.performance.totalCoef * 20}</p>
                            </div>
                            <p className="text-[8px] font-bold text-black uppercase leading-relaxed">
                                {lang === 'FR' ? 'Dominante Stratégique' : lang === 'EN' ? 'Strategic Dominant' : 'Dominante Estratégico'} : <span className="text-accent">{barData.sort((a, b) => b.pointsEarned - a.pointsEarned)[0]?.name}</span>
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

// --- NEW COMPONENTS FOR PV, RESULTS AND HONORS ---

const PVPage: React.FC<{ bulletins: BulletinData[], config: any }> = ({ bulletins, config }) => {
    const lang = config?.language || 'FR';
    const t = bulletinTranslations[lang] || bulletinTranslations.FR;

    if (bulletins.length === 0) return null;

    // If we fetched the entire class but the user selected a specific SALLE,
    // we use the selectedId to filter the PV and identify the primary room.
    const selectedRoomId = config.selectedPerimeter === 'SALLE' ? config.selectedId : bulletins[0]?.salle?.idSalle;
    const currentRoomBulletins = bulletins.filter(b => b.salle.idSalle === selectedRoomId);

    // Fallback if filtering returns empty (e.g. selectedId is not an idSalle but a class)
    const targetBulletins = currentRoomBulletins.length > 0 ? currentRoomBulletins : bulletins;
    const first = targetBulletins[0];

    // Extract all unique subjects for the target bulletins
    const subjectNames = Array.from(new Set(
        targetBulletins.flatMap(b => b.performance.groups.flatMap(g => g.subjects.map(s => s.name)))
    ));

    // Stats for the room
    const averages = targetBulletins.map(b => b.performance.average);
    const roomAvg = averages.length > 0 ? averages.reduce((a, b) => a + b, 0) / averages.length : 0;
    const maxAvg = averages.length > 0 ? Math.max(...averages) : 0;
    const minAvg = averages.length > 0 ? Math.max(0, Math.min(...averages)) : 0;
    const successCount = averages.filter(a => a >= 10).length;

    // Room Comparison Data
    const rooms = Array.from(new Set(bulletins.map(b => b.salle.nomSalle)));
    const comparisonData = rooms.map(roomName => {
        const roomBulletins = bulletins.filter(b => b.salle.nomSalle === roomName);
        return {
            name: roomName,
            moyenne: roomBulletins.reduce((a, b) => a + b.performance.average, 0) / roomBulletins.length,
            isCurrent: roomBulletins.some(b => b.salle.idSalle === selectedRoomId)
        };
    });

    return (
        <div className="space-y-10">
            <div className="landscape-page w-[297mm] min-h-[210mm] bg-white p-10 print:p-5 print:shadow-none shadow-2xl relative overflow-hidden flex flex-col">
                <header className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                    <div className="w-1/3 text-[8px] font-black uppercase">
                        <p>{lang === 'FR' ? 'REPUBLIQUE DU CAMEROUN' : lang === 'EN' ? 'REPUBLIC OF CAMEROON' : 'REPÚBLICA DE CAMERÚN'}</p>
                        <p className="text-gray-400">{lang === 'FR' ? 'Année Scolaire' : lang === 'EN' ? 'Academic Year' : 'Año Escolar'} {first.year.libelle}</p>
                    </div>
                    <div className="flex-1 text-center">
                        <h1 className="text-xl font-black uppercase tracking-widest">{t.pvTitle}</h1>
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">
                            {first.salle.nomSalle} — {first.period.label}
                        </p>
                    </div>
                    <div className="w-1/3 text-right text-[8px] font-black uppercase">
                        <p>{first.school.nomFr}</p>
                        <p className="text-gray-400">{t.eff}: {targetBulletins.length}</p>
                    </div>
                </header>

                {/* Stat Block */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{t.moyStudent.replace('Élève', 'Générale').replace('Student', 'General')}</span>
                        <span className="text-xl font-black">{roomAvg.toFixed(2)}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{t.max} / {t.min}</span>
                        <span className="text-xl font-black">{maxAvg.toFixed(2)} / {minAvg.toFixed(2)}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{lang === 'FR' ? 'Taux de Réussite' : lang === 'EN' ? 'Success Rate' : 'Tasa de Éxito'}</span>
                        <span className="text-xl font-black text-green-600">{((successCount/targetBulletins.length)*100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{lang === 'FR' ? 'Présents / Absents' : lang === 'EN' ? 'Present / Absent' : 'Presentes / Ausentes'}</span>
                        <span className="text-xl font-black">{targetBulletins.length} / 0</span>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-[9px]">
                        <thead>
                            <tr className="bg-black text-white">
                                <th className="border border-black p-1 text-left sticky left-0 bg-black z-10" rowSpan={2}>{lang === 'FR' ? 'Noms & Prénoms' : lang === 'EN' ? 'Full Names' : 'Nombres y Apellidos'}</th>
                                <th className="border border-black p-1 text-center" colSpan={subjectNames.length}>{t.subjects.split(' / ')[0]}</th>
                                <th className="border border-black p-1 text-center" rowSpan={2}>{t.moy20.replace(' /20', '')}</th>
                                <th className="border border-black p-1 text-center" rowSpan={2}>{t.rank}</th>
                            </tr>
                            <tr className="bg-gray-100 text-black">
                                {subjectNames.map((name, i) => (
                                    <th key={i} className="border border-black p-1 text-center text-[7px] uppercase vertical-text h-32">{name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {targetBulletins.map((b, idx) => (
                                <tr key={idx} className={clsx(idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                                    <td className="border border-black p-1 font-black uppercase text-[8px] sticky left-0 bg-inherit z-10 whitespace-nowrap">
                                        {b.student.nomComplet}
                                    </td>
                                    {subjectNames.map((name, i) => {
                                        const sub = b.performance.groups.flatMap(g => g.subjects).find(s => s.name === name);
                                        const note = sub?.total;
                                        return (
                                            <td key={i} className={clsx(
                                                "border border-black p-1 text-center font-bold",
                                                note !== null && note < 10 ? "bg-red-50 text-red-600" : ""
                                            )}>
                                                {note?.toFixed(2) || '--'}
                                            </td>
                                        );
                                    })}
                                    <td className={clsx(
                                        "border border-black p-1 text-center font-black bg-gray-100",
                                        b.performance.average < 10 ? "text-red-600" : "text-black"
                                    )}>
                                        {b.performance.average.toFixed(2)}
                                    </td>
                                    <td className="border border-black p-1 text-center font-bold">
                                        {b.performance.rank}<sup>{b.performance.rank === 1 ? (lang === 'FR' ? 'er' : 'st') : (lang === 'FR' ? 'ème' : 'º')}</sup>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase underline">{t.teacher}</p>
                        <div className="h-20" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase underline">{t.director}</p>
                        <div className="h-20" />
                    </div>
                </div>
            </div>

            {/* Performance Comparison Page */}
            {comparisonData.length > 1 && (
                <div className="w-[210mm] min-h-[297mm] bg-white p-16 print:p-8 shadow-2xl flex flex-col items-center print:page-break-before-always">
                    <div className="w-full mb-12">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Comparaison de Performance Inter-Salles</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Analyse du niveau {first.salle.nomSalle.split(' ')[0]}</p>
                    </div>

                    <div className="h-[400px] w-full bg-gray-50 p-10 rounded-[40px] border border-gray-100 mb-12">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 900}} />
                                <YAxis domain={[0, 20]} tick={{fontSize: 10, fontWeight: 800}} />
                                <Tooltip
                                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="moyenne" radius={[10, 10, 0, 0]}>
                                    {comparisonData.map((entry, index) => (
                                        <rect key={`cell-${index}`} fill={entry.isCurrent ? '#6366f1' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full grid grid-cols-1 gap-4">
                        {comparisonData.sort((a,b) => b.moyenne - a.moyenne).map((room, idx) => (
                            <div key={idx} className={clsx(
                                "p-6 rounded-[24px] border-2 flex justify-between items-center",
                                room.isCurrent ? "border-black bg-black text-white" : "border-gray-100 bg-white"
                            )}>
                                <div className="flex items-center gap-6">
                                    <span className="text-2xl font-black opacity-20">{idx+1}</span>
                                    <span className="text-sm font-black uppercase tracking-widest">{room.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black">{room.moyenne.toFixed(2)}</p>
                                    <p className={clsx("text-[8px] font-black uppercase tracking-widest", room.isCurrent ? "text-white/50" : "text-gray-400")}>Moyenne de Salle</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .vertical-text {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    white-space: nowrap;
                    min-width: 25px;
                }
            `}</style>
        </div>
    );
};

const ResultsListPage: React.FC<{ bulletins: BulletinData[], config: any }> = ({ bulletins, config }) => {
    const lang = config?.language || 'FR';
    const t = bulletinTranslations[lang] || bulletinTranslations.FR;

    if (bulletins.length === 0) return null;
    const first = bulletins[0];

    return (
        <div className="w-[210mm] min-h-[297mm] bg-white p-10 print:p-5 shadow-2xl flex flex-col">
            <div className="flex justify-between items-start mb-10 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">{t.resultsTitle}</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {first.salle.nomSalle} — {first.period.label}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase">{first.school.nomFr}</p>
                    <p className="text-[8px] font-bold text-gray-400">{lang === 'FR' ? 'Année' : lang === 'EN' ? 'Year' : 'Año'}: {first.year.libelle}</p>
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-black text-white">
                        <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">{t.rank}</th>
                        <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">{lang === 'FR' ? "Nom de l'Élève" : lang === 'EN' ? "Student Name" : "Nombre del Estudiante"}</th>
                        <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest">{t.moy20.replace(' /20', '')}</th>
                        <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest">{t.decision}</th>
                    </tr>
                </thead>
                <tbody>
                    {bulletins.sort((a,b) => a.performance.rank - b.performance.rank).map((b, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-[11px] font-black">{b.performance.rank}<sup>{b.performance.rank === 1 ? (lang === 'FR' ? 'er' : 'st') : (lang === 'FR' ? 'ème' : 'º')}</sup></td>
                            <td className="p-4 text-[11px] font-black uppercase">{b.student.nomComplet}</td>
                            <td className={clsx(
                                "p-4 text-center text-[11px] font-black",
                                b.performance.average < 10 ? "text-red-500" : "text-green-600"
                            )}>
                                {b.performance.average.toFixed(2)}
                            </td>
                            <td className="p-4 text-center text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                {b.performance.average >= 10 ? t.admitted : t.failed}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const HonorsListPage: React.FC<{ bulletins: BulletinData[], config: any }> = ({ bulletins, config }) => {
    const lang = config?.language || 'FR';
    const t = bulletinTranslations[lang] || bulletinTranslations.FR;

    if (bulletins.length === 0) return null;
    const first = bulletins[0];
    const threshold = config?.honors?.threshold || 12.0;
    const honors = bulletins.filter(b => b.performance.average >= threshold).sort((a,b) => b.performance.average - a.performance.average);

    if (honors.length === 0) {
        return (
            <div className="w-[210mm] min-h-[297mm] bg-white p-16 shadow-2xl flex flex-col items-center justify-center">
                <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 w-full">
                    <p className="text-xl font-black uppercase tracking-widest text-gray-300">{lang === 'FR' ? "Aucun élève au tableau d'honneur" : lang === 'EN' ? "No students on the honor roll" : "Ningún estudiante en el cuadro de honor"} (Seuil: {threshold})</p>
                </div>
            </div>
        );
    }

    const design = config?.honors?.design || 'MINIMAL';

    return (
        <div className="flex flex-col gap-10">
            {honors.map((b, idx) => (
                <HonorsCertificate key={idx} data={b} config={config} design={design} />
            ))}
        </div>
    );
};

const HonorsCertificate: React.FC<{ data: BulletinData, config: any, design: string }> = ({ data, config, design }) => {
    switch (design) {
        case 'MINIMAL': return <MinimalHonors data={data} config={config} />;
        case 'CLASSIC': return <ClassicHonors data={data} config={config} />;
        case 'PLAYFUL': return <PlayfulHonors data={data} config={config} />;
        case 'CORPORATE': return <CorporateHonors data={data} config={config} />;
        default: return <MinimalHonors data={data} config={config} />;
    }
};

const MinimalHonors: React.FC<{ data: BulletinData, config: any }> = ({ data, config }) => {
    const lang = config?.language || 'FR';
    const t = bulletinTranslations[lang] || bulletinTranslations.FR;

    return (
        <div className="landscape-page w-[297mm] h-[210mm] bg-white relative overflow-hidden shadow-2xl print:shadow-none flex items-center">
            {/* Abstract Fluid Background */}
            <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 1000 1000" className="absolute -left-40 -top-40 w-[600px] h-[600px] opacity-20">
                    <path fill="#1E3A8A" d="M444.5,231.4c100.3-43,205.8-23.7,287.5,41.4s139.7,169.1,141.4,271c1.7,101.9-53,201.8-135.2,263.7s-191.9,85.8-292,52.3s-190.7-124.4-209.7-226.3S270.3,313,344.2,274.4C418.1,235.8,444.5,231.4,444.5,231.4z" />
                </svg>
                <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-br from-blue-600/10 to-transparent skew-x-[-15deg] -translate-x-20" />

                {/* Blue and Gold Waves like inspiration */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px]">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-blue-900 opacity-80">
                        <path fill="currentColor" d="M40,-62.7C52.2,-54.5,62.5,-44.4,69.5,-32.4C76.4,-20.3,80.1,-6.4,78.2,7C76.3,20.4,68.8,33.3,58.8,44.1C48.8,54.8,36.4,63.4,22.6,67.8C8.9,72.2,-6.1,72.3,-20.5,68.2C-34.9,64.1,-48.7,55.8,-59.4,44.4C-70.1,33.1,-77.7,18.7,-79,3.7C-80.3,-11.3,-75.4,-26.8,-66.1,-39.8C-56.9,-52.8,-43.3,-63.3,-29.4,-70.2C-15.6,-77,1.4,-80.1,16.6,-77.5C31.9,-75,40,-62.7,40,-62.7Z" transform="translate(100 100)" />
                    </svg>
                    <div className="absolute top-20 right-20 w-32 h-32 border-8 border-[#D4AF37] rounded-full opacity-30" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col justify-between p-16 h-full items-start pl-40 w-full">
                {config.honors.showInstitutionalHeader && <InstitutionalHeader school={data.school} customHeader={data.institutionalHeader} />}

                <div className="space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.5em] text-[#D4AF37]">{t.certExcellence}</p>
                    <h1 className="text-7xl font-black uppercase tracking-tighter text-[#1E3A8A] leading-none">{t.honorsTitle.split(' ').join('<br/>')}</h1>
                </div>

                <div className="space-y-6 max-w-2xl">
                    <p className="text-xl font-medium text-gray-500 italic">{t.awardedTo}</p>
                    <h2 className="text-6xl font-black text-[#1E3A8A] border-b-4 border-[#D4AF37] pb-4 inline-block">{data.student.nomComplet}</h2>
                    <p className="text-lg font-bold text-gray-400 uppercase tracking-widest mt-4">
                        {t.forResults} <span className="text-black">{data.period.label}</span>
                        <br/>{t.withAverage} <span className="text-accent text-2xl">{data.performance.average.toFixed(2)} / 20</span>
                    </p>
                </div>

                <div className="w-full flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.deliveredBy} {data.school.nomFr}</p>
                        <p className="text-[9px] font-bold text-gray-300">{lang === 'FR' ? 'Année Scolaire' : lang === 'EN' ? 'Academic Year' : 'Año Escolar'} {data.year.libelle}</p>
                    </div>

                    {config.honors.showSeal && (
                        <div className="w-32 h-32 relative flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-[#D4AF37] drop-shadow-lg">
                                <path fill="currentColor" d="M50 0 L58.8 31.2 L90.5 31.2 L64.8 50 L73.6 81.2 L50 62.4 L26.4 81.2 L35.2 50 L9.5 31.2 L41.2 31.2 Z" />
                            </svg>
                            <span className="absolute text-[10px] font-black text-white uppercase text-center leading-tight">{t.officialSeal.split(' ').join('<br/>')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClassicHonors: React.FC<{ data: BulletinData, config: any }> = ({ data, config }) => {
    const lang = config?.language || 'FR';
    const t = bulletinTranslations[lang] || bulletinTranslations.FR;

    return (
        <div className="landscape-page w-[297mm] h-[210mm] bg-[#FAF9F6] p-4 shadow-2xl print:shadow-none flex flex-col items-center justify-center">
            <div className="w-full h-full border-[12px] border-double border-[#1E3A8A] p-10 flex flex-col items-center justify-between text-center relative overflow-hidden">
                {config.honors.showInstitutionalHeader && <InstitutionalHeader school={data.school} customHeader={data.institutionalHeader} />}

                {/* Ornaments in corners */}
                <div className="absolute top-2 left-2 w-20 h-20 text-[#D4AF37] opacity-60">
                    <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 L100 0 L0 100 Z" /></svg>
                </div>
                <div className="absolute top-2 right-2 w-20 h-20 text-[#D4AF37] opacity-60 rotate-90">
                    <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 L100 0 L0 100 Z" /></svg>
                </div>
                <div className="absolute bottom-2 left-2 w-20 h-20 text-[#D4AF37] opacity-60 -rotate-90">
                    <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 L100 0 L0 100 Z" /></svg>
                </div>
                <div className="absolute bottom-2 right-2 w-20 h-20 text-[#D4AF37] opacity-60 rotate-180">
                    <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 L100 0 L0 100 Z" /></svg>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-gray-500">{data.school.nomFr}</p>
                    <div className="h-px w-32 bg-[#D4AF37] mx-auto" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-6xl font-serif font-bold uppercase tracking-widest text-[#1E3A8A]">{t.honorsTitle}</h1>
                    <p className="text-xl font-serif italic text-gray-600">{lang === 'FR' ? "Le conseil des professeurs de l'établissement décerne ce titre à" : lang === 'EN' ? "The school's teachers council awards this title to" : "El consejo de profesores del establecimiento otorga este título a"}</p>
                </div>

                <div className="space-y-2">
                    <h2 className="text-7xl font-serif font-black text-black tracking-tight underline decoration-[#D4AF37] decoration-4 underline-offset-8">{data.student.nomComplet}</h2>
                    <p className="text-xl font-bold uppercase tracking-widest text-gray-400 mt-4">{lang === 'FR' ? 'Élève en classe de' : lang === 'EN' ? 'Student in the class of' : 'Estudiante en la clase de'} <span className="text-black">{data.salle.nomSalle}</span></p>
                </div>

                <p className="text-lg font-serif italic max-w-3xl leading-relaxed">
                    {lang === 'FR' ? `En reconnaissance de son assiduité et de ses excellents résultats académiques obtenus durant la période de` : lang === 'EN' ? `In recognition of their attendance and excellent academic results obtained during the period of` : `En reconocimiento a su asistencia y excelentes resultados académicos obtenidos durante el período de`} <span className="font-bold not-italic">{data.period.label}</span>,
                    {lang === 'FR' ? `marquée par une moyenne générale de` : lang === 'EN' ? `marked by a cumulative average of` : `marcado por un promedio general de`} <span className="font-bold not-italic text-2xl">{data.performance.average.toFixed(2)} / 20</span>.
                </p>

                <div className="w-full flex justify-between items-center px-20 mt-10">
                    <div className="text-center">
                        <div className="w-48 border-t border-gray-400 pt-2">
                            <p className="text-[10px] font-black uppercase">{lang === 'FR' ? 'Le Titulaire' : lang === 'EN' ? 'Class Teacher' : 'El Tutor'}</p>
                        </div>
                    </div>

                    {config.honors.showSeal && (
                        <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37] bg-white flex items-center justify-center shadow-lg transform rotate-[-15deg]">
                             <ImageIcon size={40} className="text-[#D4AF37] opacity-20" />
                             <span className="absolute text-[8px] font-black text-[#D4AF37] uppercase text-center">{t.officialSeal.split(' ').join('<br/>')}</span>
                        </div>
                    )}

                    <div className="text-center">
                        <div className="w-48 border-t border-gray-400 pt-2">
                            <p className="text-[10px] font-black uppercase">{t.director}</p>
                        </div>
                    </div>
                </div>

                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">{lang === 'FR' ? 'Année Scolaire' : lang === 'EN' ? 'Academic Year' : 'Año Escolar'} {data.year.libelle}</p>
            </div>
        </div>
    );
};

const PlayfulHonors: React.FC<{ data: BulletinData, config: any }> = ({ data, config }) => (
    <div className="landscape-page w-[297mm] h-[210mm] bg-white p-8 shadow-2xl print:shadow-none flex flex-col relative overflow-hidden">
        {config.honors.showInstitutionalHeader && <InstitutionalHeader school={data.school} customHeader={data.institutionalHeader} />}

        {/* Playful dots border */}
        <div className="absolute inset-0 border-[16px] border-transparent" style={{ backgroundImage: 'radial-gradient(#3B82F6 20%, transparent 20%), radial-gradient(#10B981 20%, transparent 20%)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px', opacity: 0.1 }} />

        <div className="relative z-10 flex flex-col h-full border-4 border-dashed border-amber-400 rounded-[60px] p-12 bg-white/80 backdrop-blur-sm">
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3">
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">{data.school.nomFr}</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bravo pour tes efforts !</p>
                    </div>
                </div>
                <div className="px-6 py-2 bg-amber-100 text-amber-600 rounded-full font-black text-xs uppercase tracking-widest">
                    Année Scolaire {data.year.libelle}
                </div>
            </header>

            <div className="flex-1 flex gap-12 items-center">
                {config.honors.showStudentPhoto && (
                    <div className="w-64 h-64 shrink-0 rounded-[60px] border-8 border-white shadow-2xl overflow-hidden bg-gray-100 rotate-[-2deg]">
                        {data.student.photo ? (
                            <img src={data.student.photo} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <User size={100} />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 space-y-6">
                    <h1 className="text-7xl font-black text-green-500 tracking-tighter uppercase leading-none">Super<br/>Élève !</h1>
                    <div className="space-y-2">
                        <p className="text-2xl font-bold text-gray-500">Un grand bravo à</p>
                        <p className="text-6xl font-black text-blue-600 tracking-tight">{data.student.nomComplet}</p>
                    </div>
                    <p className="text-xl font-bold text-orange-500 uppercase tracking-widest">
                        Pour ton magnifique travail en classe de <span className="bg-orange-100 px-3 py-1 rounded-lg">{data.salle.nomSalle}</span>
                    </p>
                </div>
            </div>

            <div className="mt-auto flex justify-between items-end pt-10 border-t-2 border-dashed border-gray-100">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                            <Check size={24} />
                        </div>
                        <p className="text-lg font-black text-gray-600 uppercase">Moyenne : {data.performance.average.toFixed(2)}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Félicitations de toute l'équipe pédagogique !</p>
                </div>

                <div className="flex gap-12">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-blue-400 mb-8">Ma Maîtresse / Mon Maître</p>
                        <div className="w-40 h-px bg-gray-200 mx-auto" />
                    </div>
                    <div className="w-24 h-24 bg-amber-400 rounded-full flex items-center justify-center shadow-xl rotate-12">
                         <span className="text-[10px] font-black text-white uppercase text-center leading-tight">Champion<br/>Médaille d'Or</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CorporateHonors: React.FC<{ data: BulletinData, config: any }> = ({ data, config }) => (
    <div className="landscape-page w-[297mm] h-[210mm] bg-white relative overflow-hidden shadow-2xl print:shadow-none flex flex-col">
        {config.honors.showInstitutionalHeader && (
            <div className="absolute top-4 left-1/3 right-0 px-16 z-20">
                 <InstitutionalHeader school={data.school} customHeader={data.institutionalHeader} />
            </div>
        )}

        {/* Dark Sidebar Header */}
        <div className="absolute top-0 left-0 w-1/3 h-full bg-[#0F172A] flex flex-col p-16 justify-between text-white">
            <div className="space-y-4">
                <div className="w-16 h-1 bg-[#D4AF37]" />
                <h2 className="text-xl font-black uppercase tracking-[0.3em] opacity-50">{data.school.abreviation || 'SCHOOL'}</h2>
            </div>

            <div className="space-y-8">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Palmarès d'Excellence</p>
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Distinction Académique</h1>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="opacity-40">Moyenne</span>
                        <span className="text-xl text-[#D4AF37]">{data.performance.average.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="opacity-40">Rang</span>
                        <span className="text-xl">#{data.performance.rank}</span>
                    </div>
                </div>
            </div>

            <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30">Session {data.year.libelle}</p>
        </div>

        {/* Golden Waves */}
        <div className="absolute top-0 left-1/3 w-20 h-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-[#0F172A] to-transparent" />
            <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/50" />
        </div>

        <div className="ml-[33.33%] h-full p-24 flex flex-col justify-center items-start space-y-12">
            <div className="space-y-2">
                <p className="text-[12px] font-black uppercase tracking-widest text-gray-400">Le Comité Pédagogique certifie que l'élève</p>
                <h2 className="text-7xl font-black text-[#0F172A] tracking-tighter uppercase">{data.student.nomComplet}</h2>
            </div>

            <div className="space-y-4 max-w-xl">
                <p className="text-xl font-medium text-gray-500 leading-relaxed">
                    A figuré au <span className="font-black text-black">Tableau d'Honneur</span> pour ses performances remarquables
                    durant le <span className="font-black text-black">{data.period.label}</span>.
                </p>
                <div className="inline-flex items-center gap-4 bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-[#0F172A] text-[#D4AF37] rounded-xl flex items-center justify-center">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Discipline Majeure</p>
                        <p className="text-xs font-black uppercase text-black">Excellence Pédagogique</p>
                    </div>
                </div>
            </div>

            <div className="w-full pt-16 grid grid-cols-2 gap-20">
                <div className="space-y-4">
                    <div className="h-px w-full bg-[#0F172A]/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Le Principal</span>
                        <div className="w-12 h-1 bg-[#D4AF37]" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-px w-full bg-[#0F172A]/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Le Titulaire</span>
                        <div className="w-12 h-1 bg-[#D4AF37]" />
                    </div>
                </div>
            </div>
        </div>

        {config.honors.showSeal && (
            <div className="absolute bottom-16 right-16 w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full animate-pulse" />
                <div className="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-full shadow-2xl flex flex-col items-center justify-center text-white border-4 border-white">
                    <span className="text-[14px] font-black">2026</span>
                    <span className="text-[8px] font-black uppercase tracking-widest">Excellence</span>
                </div>
            </div>
        )}
    </div>
);

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
