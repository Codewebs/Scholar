import React, { useEffect, useState } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import api from '../../api/axios';
import {
    Printer,
    ArrowLeft,
    Settings2,
    Layout,
    Type,
    BarChart3,
    School,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Eye,
    Save,
    Trash2,
    AlertCircle,
    Copy,
    Image as ImageIcon
} from 'lucide-react';
import { clsx } from 'clsx';

interface BulletinTemplate {
    id: string;
    name: string;
    description: string;
    config: any;
}

const BulletinConfigPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
  const [openAccordions, setOpenAccordions] = useState<string[]>(['A']);
  const [config, setConfig] = useState({
    // Accordion A: Périmètre
    selectedPerimeter: 'SALLE' as 'SALLE' | 'CLASSE' | 'CYCLE',
    selectedId: null as number | null,
    periodType: 'SEQUENCE' as 'SEQUENCE' | 'TRIMESTER' | 'ANNUAL',
    selectedPeriodId: null as number | null, // ID of the SousPeriode (for SEQUENCE) or Periode (for TRIMESTER)
    showSubPeriods: true, // Show EVAL 1, EVAL 2, etc.
    showPeriodSummary: true, // Show Trimester/Annual total column

    // Notation Systems
    calcMode: 'HYBRID' as 'NUMERIC' | 'LETTER' | 'COLOR' | 'HYBRID_NUM_COLOR' | 'HYBRID_NUM_LETTER' | 'HYBRID_LETTER_COLOR' | 'ALPHA',
    hybridConfig: {
        showNumeric: true,
        showLetter: true,
        showColors: true
    },

    // Accordion B: En-tête
    showMinisterialHeader: true,
    margins: {
        top: 10,
        bottom: 10
    },
    schoolInfo: {
        name: true,
        sigle: true,
        logo: true,
        logoPosition: 'LEFT' as 'LEFT' | 'CENTER_WATERMARK' | 'RIGHT',
        devise: true,
        arrete: true,
        contacts: true
    },

    // Accordion C: Corps du Bulletin
    body: {
        showStudentPhoto: true,
        showMainTeacher: true,
        showSubjectTeachers: true,
        showAppreciations: true,
        showPeriodAbreviations: false,
        passingGrade: 10.0,
        successColor: '#10B981',
        failColor: '#EF4444',
        apcMode: 'BLOCKS' as 'TEXT' | 'BLOCKS',
        tableBorderColor: '#000000',
        tableBorderWidth: '1px'
    },

    // Accordion D: Statistiques
    stats: {
        showGlobalStats: true,
        showAverages: true,
        showMaxMin: true,
        showRank: true,
        showClassAverage: true,
        showSuccessRate: true,
        showCharts: false,
        chartType: 'BAR' as 'BAR' | 'RADAR',
        chartScope: 'GENERAL' as 'GENERAL' | 'SPECIFIC',
        showRadarAnalysis: true
    },

    // Advanced
    allowIncompleteStudent: false,
    allowIncompleteRoom: false,

    // Accordion E: Tableau d'Honneur
    honors: {
        threshold: 12.0,
        design: 'MINIMAL' as 'MINIMAL' | 'CLASSIC' | 'PLAYFUL' | 'CORPORATE',
        showStudentPhoto: true,
        showSeal: true,
        showSignatures: true,
        showInstitutionalHeader: true
    }
  });

  const [showLivePreview, setShowLivePreview] = useState(true);

  const [classes, setClasses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [filteredSequences, setFilteredSequences] = useState<any[]>([]);
  const [schoolData, setSchoolData] = useState<any>(null);

  const mockBulletinData = {
    school: schoolData || { nomFr: "ÉCOLE MODÈLE INTERNATIONALE", abreviation: "EMI", logo: null },
    student: { nomComplet: "NGAH NOAH Jean-Philippe", matricule: "24C001", sexe: "M", dateNaissance: "12/05/2012", lieuNaissance: "Douala", photo: null },
    salle: { nomSalle: "6ème Alizé", effectif: 42 },
    year: selectedYear || { libelle: "2024/2025" },
    period: { label: config.periodType === 'SEQUENCE' ? "SÉQUENCE 1" : config.periodType === 'TRIMESTER' ? "TRIMESTRE 1" : "BILAN ANNUEL" },
    performance: {
        groups: [
            {
                name: "Sciences & Technologie",
                subjects: [
                    { name: "Mathématiques", teacher: "M. TCHAPTCHET", note1: 14, note2: 12.5, coef: 4, total: 13.25, rank: 3, appreciation: "Très bon travail", competencies: [{ libelle: "Résoudre des problèmes complexes", cote: "A" }] },
                    { name: "SVT", teacher: "Mme NGONO", note1: 11, note2: 9.5, coef: 2, total: 10.25, rank: 12, appreciation: "Passable", competencies: [{ libelle: "Analyser l'environnement", cote: "B" }] }
                ],
                groupAverage: 12.25
            },
            {
                name: "Langues & Littérature",
                subjects: [
                    { name: "Français", teacher: "Mme FOUDA", note1: 15.5, note2: 14, coef: 3, total: 14.75, rank: 2, appreciation: "Excellent", competencies: [{ libelle: "Expression écrite", cote: "A+" }] },
                    { name: "Anglais", teacher: "Mr. SMITH", note1: 12, note2: 13.5, coef: 3, total: 12.75, rank: 8, appreciation: "Bien", competencies: [{ libelle: "Oral expression", cote: "B" }] }
                ],
                groupAverage: 13.75
            }
        ],
        average: 12.85,
        rank: 4,
        totalPoints: 154.2,
        totalCoef: 12,
        appreciation: "Félicitations"
    },
    stats: { maxMoy: 17.5, minMoy: 6.2, avgMoy: 11.2, successRate: 68.5 },
    discipline: { absencesJustified: 2, absencesUnjustified: 0, conductNotes: [] }
  };
  const [showPerimeterSheet, setShowPerimeterSheet] = useState(false);

  useEffect(() => {
    if (yearId) {
        api.get(`/pedagogy/periodes/annee/${yearId}`).then(res => setPeriods(res.data));
        api.get(`/salles/classes/stats/${yearId}`).then(res => {
            console.log("📊 Données Classes/Salles reçues:", res.data);
            setClasses(res.data);

            // Fallback: If classes have no salles, fetch salles directly
            const anySalle = res.data.some((c: any) => (c.salles || c.Salles || []).length > 0);
            if (!anySalle) {
                console.warn("⚠️ Aucune salle trouvée dans l'objet classe, tentative de récupération directe...");
                api.get(`/salles/annee/${yearId}`).then(sRes => {
                    console.log("📥 Salles récupérées par endpoint direct:", sRes.data);
                    // Map salles to their classes if possible
                    const updatedClasses = res.data.map((c: any) => ({
                        ...c,
                        salles: sRes.data.filter((s: any) => s.idClasse === c.idClasse)
                    }));
                    setClasses(updatedClasses);
                });
            }
        });
        api.get('/admin/etablissement/profile').then(res => setSchoolData(res.data)).catch(() => {});
    }
  }, [yearId]);

  useEffect(() => {
    if (config.selectedId && config.periodType === 'SEQUENCE') {
        let classId: number | null = null;
        if (config.selectedPerimeter === 'SALLE') {
            const foundClass = classes.find(c => (c.salles || c.Salles || []).some((s: any) => s.idSalle === config.selectedId));
            classId = foundClass ? foundClass.idClasse : null;
        } else if (config.selectedPerimeter === 'CLASSE') {
            classId = config.selectedId;
        }

        if (classId) {
            api.get(`/pedagogy/periodes/repartition/annee/${yearId}?idClasse=${classId}`).then(res => {
                // Repartition contains SousPeriode objects
                const seqs = res.data.map((r: any) => r.SousPeriode).filter(Boolean);
                setFilteredSequences(seqs);
            });
        } else {
            // Fallback to all sequences if no specific class found (e.g. CYCLE)
            setFilteredSequences(periods.flatMap(p => p.sousPeriodes || []));
        }
    } else {
        setFilteredSequences(periods.flatMap(p => p.sousPeriodes || []));
    }
  }, [config.selectedId, config.selectedPerimeter, config.periodType, classes, periods, yearId]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const templates: BulletinTemplate[] = [
    {
        id: 'cameroon-apc',
        name: 'Modèle APC Officiel Cameroun',
        description: 'Standard Bilingue (FR/EN) avec grille de compétences, EVAL 1/2 et blocs de discipline complets.',
        config: {
            ...config,
            calcMode: 'HYBRID',
            showMinisterialHeader: true,
            periodType: 'TRIMESTER',
            showSubPeriods: true,
            showPeriodSummary: true,
            body: { ...config.body, apcMode: 'BLOCKS', tableBorderWidth: '1px' },
            schoolInfo: { ...config.schoolInfo, logoPosition: 'CENTER_WATERMARK' }
        }
    },
    {
        id: 'intl-modern',
        name: 'Bulletin International Moderne',
        description: 'Design épuré, focus sur les Grades (A-F), commentaires narratifs et esthétique minimaliste.',
        config: {
            ...config,
            calcMode: 'LETTER',
            showMinisterialHeader: false,
            periodType: 'SEQUENCE',
            showSubPeriods: false,
            showPeriodSummary: true,
            body: { ...config.body, showSubjectTeachers: false, tableBorderWidth: '0.5px' },
            schoolInfo: { ...config.schoolInfo, logoPosition: 'RIGHT', name: true, sigle: false, devise: false }
        }
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-8 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-black flex items-center">
              Cockpit Pédagogique
              <div className="ml-4 px-3 py-1 bg-accent text-white rounded-full text-[10px] tracking-widest animate-pulse">
                GÉNÉRATEUR A4
              </div>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">
              Configuration & Impression des Bulletins de Notes
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex bg-white border border-gray-100 p-1.5 rounded-full shadow-sm">
                <button
                    disabled={!yearId || !config.selectedId || (config.periodType !== 'ANNUAL' && !config.selectedPeriodId)}
                    onClick={() => {
                        localStorage.setItem('bulletin_print_config', JSON.stringify({...config, printMode: 'PV'}));
                        window.open('/app/pedagogy/bulletins/print', '_blank');
                    }}
                    className="px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-gray-50 transition-all disabled:opacity-30"
                >PV de Classe</button>
                <button
                    disabled={!yearId || !config.selectedId || (config.periodType !== 'ANNUAL' && !config.selectedPeriodId)}
                    onClick={() => {
                        localStorage.setItem('bulletin_print_config', JSON.stringify({...config, printMode: 'LIST'}));
                        window.open('/app/pedagogy/bulletins/print', '_blank');
                    }}
                    className="px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-gray-50 transition-all disabled:opacity-30"
                >Résultats</button>
                <button
                    disabled={!yearId || !config.selectedId || (config.periodType !== 'ANNUAL' && !config.selectedPeriodId)}
                    onClick={() => {
                        localStorage.setItem('bulletin_print_config', JSON.stringify({...config, printMode: 'HONORS'}));
                        window.open('/app/pedagogy/bulletins/print', '_blank');
                    }}
                    className="px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-gray-50 transition-all disabled:opacity-30"
                >Honneurs</button>
            </div>

            <button
                disabled={!yearId || !config.selectedId || (config.periodType !== 'ANNUAL' && !config.selectedPeriodId)}
                onClick={() => {
                    localStorage.setItem('bulletin_print_config', JSON.stringify({...config, printMode: 'BULLETIN'}));
                    window.open('/app/pedagogy/bulletins/print', '_blank');
                }}
                className={clsx(
                    "flex items-center space-x-3 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest transition-all shadow-xl",
                    (!yearId || !config.selectedId || (config.periodType !== 'ANNUAL' && !config.selectedPeriodId))
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                        : "bg-accent text-white hover:scale-105 shadow-accent/20"
                )}
            >
                <Printer size={18} />
                <span>
                    {!config.selectedId ? "Sélectionnez un périmètre"
                    : !yearId ? "Sélectionnez une année"
                    : (config.periodType !== 'ANNUAL' && !config.selectedPeriodId) ? "Sélectionnez une période"
                    : "Générer les PDF"}
                </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Config Area */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
              {/* Accordion A: Périmètre */}
              <AccordionHeader
                id="A"
                title="Périmètre & Données de base"
                icon={Layout}
                isOpen={openAccordions.includes('A')}
                onClick={() => toggleAccordion('A')}
              />
              {openAccordions.includes('A') && (
                <div className="p-8 space-y-6 bg-gray-50/30 animate-in fade-in duration-500">
                  {/* Validation Overrides */}
                  <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-4 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Autorisations d'impression</p>
                    <ConfigSwitch
                        label="Imprimer même si notes incomplètes (Élève)"
                        checked={config.allowIncompleteStudent}
                        onChange={(v) => setConfig({...config, allowIncompleteStudent: v})}
                    />
                    <ConfigSwitch
                        label="Imprimer même si salle incomplète"
                        checked={config.allowIncompleteRoom}
                        onChange={(v) => setConfig({...config, allowIncompleteRoom: v})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Périmètre de génération</label>
                    <div className="flex gap-2">
                        {['SALLE', 'CLASSE', 'CYCLE'].map((p) => (
                            <button
                                key={p}
                                onClick={() => {
                                    setConfig({
                                        ...config,
                                        selectedPerimeter: p as any,
                                        selectedId: config.selectedPerimeter === p ? config.selectedId : null
                                    });
                                    setShowPerimeterSheet(true);
                                }}
                                className={clsx(
                                    "flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2",
                                    config.selectedPerimeter === p ? "border-black bg-black text-white" : "border-gray-100 bg-white text-gray-400"
                                )}
                            >
                                <span>{p}</span>
                                {config.selectedPerimeter === p && config.selectedId && (
                                    <span className="text-[8px] opacity-60">ID: {config.selectedId}</span>
                                )}
                            </button>
                        ))}
                    </div>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Périodicité</label>
                            <select
                                className="w-full p-5 bg-white border border-gray-100 rounded-[20px] text-xs font-black uppercase outline-none focus:border-black transition-all"
                                value={config.periodType}
                                onChange={(e) => setConfig({...config, periodType: e.target.value as any, selectedPeriodId: null})}
                            >
                                <option value="SEQUENCE">Séquentiel (Séquences)</option>
                                <option value="TRIMESTER">Trimestriel (Trimestres / Semestres)</option>
                                <option value="ANNUAL">Bilan Annuel</option>
                            </select>
                        </div>

                        {config.periodType !== 'ANNUAL' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                    Sélectionner {config.periodType === 'SEQUENCE' ? 'la Séquence' : 'le Trimestre'}
                                </label>
                                <select
                                    className="w-full p-5 bg-white border border-gray-100 rounded-[20px] text-xs font-black uppercase outline-none focus:border-black transition-all"
                                    value={config.selectedPeriodId || ''}
                                    onChange={(e) => setConfig({...config, selectedPeriodId: parseInt(e.target.value)})}
                                >
                                    <option value="">-- Choisir --</option>
                                    {config.periodType === 'SEQUENCE' ? (
                                        filteredSequences.map(sp => (
                                            <option key={sp.idSousPeriode} value={sp.idSousPeriode}>{sp.libelleSousPeriodeFr}</option>
                                        ))
                                    ) : (
                                        periods.map(p => (
                                            <option key={p.idPeriode} value={p.idPeriode}>{p.libellePeriodeFr}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        )}

                        {config.periodType === 'ANNUAL' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Détails à inclure</label>
                                <select
                                    className="w-full p-5 bg-white border border-gray-100 rounded-[20px] text-xs font-black uppercase outline-none focus:border-black transition-all"
                                    value={config.showSubPeriods ? 'SUB' : 'MAIN'}
                                    onChange={(e) => setConfig({...config, showSubPeriods: e.target.value === 'SUB'})}
                                >
                                    <option value="MAIN">Toutes les Périodes (Trimestres)</option>
                                    <option value="SUB">Toutes les Sous-Périodes (Séquences)</option>
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Système de notation</label>
                            <select
                                className="w-full p-5 bg-white border border-gray-100 rounded-[20px] text-xs font-black uppercase outline-none focus:border-black transition-all"
                                value={config.calcMode}
                                onChange={(e) => setConfig({...config, calcMode: e.target.value as any})}
                            >
                                <option value="NUMERIC">Tout Numérique (Notes /20)</option>
                                <option value="LETTER">Tout Cotation (Cotes A-E)</option>
                                <option value="COLOR">Tout Colorimétrique</option>
                                <option value="HYBRID">Hybride (Note + Cote + Couleur)</option>
                                <option value="HYBRID_NUM_COLOR">Note + Couleur</option>
                                <option value="HYBRID_NUM_LETTER">Hybride : Numérique + Cote</option>
                                <option value="HYBRID_LETTER_COLOR">Hybride : Cote + Couleur</option>
                                <option value="ALPHA">Mode Alpha (Correspondance Note/Cote)</option>
                            </select>
                        </div>
                    </div>

                    {config.periodType !== 'SEQUENCE' && (
                        <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Colonnes de Période</p>
                            <ConfigSwitch label="Afficher les séquences (EVAL 1, 2...)" checked={config.showSubPeriods} onChange={(v) => setConfig({...config, showSubPeriods: v})} />
                            <ConfigSwitch label="Afficher Moyenne Période" checked={config.showPeriodSummary} onChange={(v) => setConfig({...config, showPeriodSummary: v})} />
                        </div>
                    )}

                  {config.calcMode === 'HYBRID' && (
                    <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Paramètres Hybride</p>
                        <ConfigSwitch label="Afficher Notes Numériques" checked={config.hybridConfig.showNumeric} onChange={(v) => setConfig({...config, hybridConfig: {...config.hybridConfig, showNumeric: v}})} />
                        <ConfigSwitch label="Afficher Cotes (A+...)" checked={config.hybridConfig.showLetter} onChange={(v) => setConfig({...config, hybridConfig: {...config.hybridConfig, showLetter: v}})} />
                        <ConfigSwitch label="Afficher Couleurs" checked={config.hybridConfig.showColors} onChange={(v) => setConfig({...config, hybridConfig: {...config.hybridConfig, showColors: v}})} />
                    </div>
                  )}
                </div>
              )}

              {/* Accordion B: En-tête */}
              <AccordionHeader
                id="B"
                title="En-tête & Bloc Institutionnel"
                icon={School}
                isOpen={openAccordions.includes('B')}
                onClick={() => toggleAccordion('B')}
              />
              {openAccordions.includes('B') && (
                <div className="p-8 space-y-8 bg-gray-50/30 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-gray-400">En-tête Ministériel (Bilingue)</span>
                    <button
                        onClick={() => setConfig({...config, showMinisterialHeader: !config.showMinisterialHeader})}
                        className={clsx("w-12 h-6 rounded-full relative transition-all", config.showMinisterialHeader ? "bg-accent" : "bg-gray-200")}
                    >
                        <div className={clsx("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all", config.showMinisterialHeader ? "left-7" : "left-1")} />
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Marges de sécurité (mm)</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-5 rounded-2xl flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-400">HAUT</span>
                            <input type="number" className="w-12 text-right bg-transparent font-black text-black" value={config.margins.top} onChange={(e) => setConfig({...config, margins: {...config.margins, top: parseInt(e.target.value)}})} />
                        </div>
                        <div className="bg-gray-50 p-5 rounded-2xl flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-400">BAS</span>
                            <input type="number" className="w-12 text-right bg-transparent font-black text-black" value={config.margins.bottom} onChange={(e) => setConfig({...config, margins: {...config.margins, bottom: parseInt(e.target.value)}})} />
                        </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <ConfigSwitch label="Nom Établissement" checked={config.schoolInfo.name} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, name: v}})} />
                        <ConfigSwitch label="Sigle / Abréviation" checked={config.schoolInfo.sigle} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, sigle: v}})} />
                        <ConfigSwitch label="Devise de l'école" checked={config.schoolInfo.devise} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, devise: v}})} />
                        <ConfigSwitch label="Coordonnées" checked={config.schoolInfo.contacts} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, contacts: v}})} />
                        <ConfigSwitch label="Arrêté d'ouverture" checked={config.schoolInfo.arrete} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, arrete: v}})} />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <ConfigSwitch label="Logo Officiel" checked={config.schoolInfo.logo} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, logo: v}})} />
                    {config.schoolInfo.logo && (
                        <div className="flex bg-gray-50 p-2 rounded-2xl">
                            {['LEFT', 'CENTER_WATERMARK', 'RIGHT'].map(pos => (
                                <button
                                    key={pos}
                                    onClick={() => setConfig({...config, schoolInfo: {...config.schoolInfo, logoPosition: pos as any}})}
                                    className={clsx(
                                        "flex-1 py-4 rounded-xl text-[9px] font-black uppercase transition-all",
                                        config.schoolInfo.logoPosition === pos ? "bg-white text-black shadow-lg scale-[1.02]" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    {pos.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
              )}

              {/* Accordion C: Corps */}
              <AccordionHeader
                id="C"
                title="Corps du Bulletin (Notes & Styles)"
                icon={Type}
                isOpen={openAccordions.includes('C')}
                onClick={() => toggleAccordion('C')}
              />
              {openAccordions.includes('C') && (
                <div className="p-8 space-y-8 bg-gray-50/30">
                   <div className="grid grid-cols-2 gap-4">
                        <ConfigSwitch label="Photo Élève" checked={config.body.showStudentPhoto} onChange={(v) => setConfig({...config, body: {...config.body, showStudentPhoto: v}})} />
                        <ConfigSwitch label="Prof Principal" checked={config.body.showMainTeacher} onChange={(v) => setConfig({...config, body: {...config.body, showMainTeacher: v}})} />
                        <ConfigSwitch label="Noms Enseignants" checked={config.body.showSubjectTeachers} onChange={(v) => setConfig({...config, body: {...config.body, showSubjectTeachers: v}})} />
                        <ConfigSwitch label="Afficher Appréciations" checked={config.body.showAppreciations} onChange={(v) => setConfig({...config, body: {...config.body, showAppreciations: v}})} />
                        <ConfigSwitch label="Abrév. Périodes" checked={config.body.showPeriodAbreviations} onChange={(v) => setConfig({...config, body: {...config.body, showPeriodAbreviations: v}})} />
                   </div>

                   <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-gray-400">Seuil de validation</span>
                            <input
                                type="number" step="0.5"
                                className="w-16 text-right font-black text-sm outline-none bg-gray-50 p-2 rounded-lg"
                                value={config.body.passingGrade}
                                onChange={(e) => setConfig({...config, body: {...config.body, passingGrade: parseFloat(e.target.value)}})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <ColorPicker label="Notes ≥ Seuil" color={config.body.successColor} onChange={(c) => setConfig({...config, body: {...config.body, successColor: c}})} />
                            <ColorPicker label="Notes < Seuil" color={config.body.failColor} onChange={(c) => setConfig({...config, body: {...config.body, failColor: c}})} />
                        </div>
                   </div>

                   <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Affichage APC</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfig({...config, body: {...config.body, apcMode: 'TEXT'}})}
                                className={clsx("flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all", config.body.apcMode === 'TEXT' ? "border-black bg-black text-white" : "border-gray-100 bg-white text-gray-400")}
                            >Libellé Texte</button>
                            <button
                                onClick={() => setConfig({...config, body: {...config.body, apcMode: 'BLOCKS'}})}
                                className={clsx("flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all", config.body.apcMode === 'BLOCKS' ? "border-black bg-black text-white" : "border-gray-100 bg-white text-gray-400")}
                            >Blocs Colorés</button>
                        </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Bordures Tableau</label>
                            <input
                                type="color"
                                value={config.body.tableBorderColor}
                                onChange={(e) => setConfig({...config, body: {...config.body, tableBorderColor: e.target.value}})}
                                className="w-full h-10 rounded-lg cursor-pointer border-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Épaisseur</label>
                            <select
                                className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-black uppercase outline-none"
                                value={config.body.tableBorderWidth}
                                onChange={(e) => setConfig({...config, body: {...config.body, tableBorderWidth: e.target.value}})}
                            >
                                <option value="0.5px">0.5px</option>
                                <option value="1px">1px</option>
                                <option value="2px">2px</option>
                            </select>
                        </div>
                   </div>
                </div>
              )}

              {/* Accordion D: Statistiques */}
              <AccordionHeader
                id="D"
                title="Profil de Classe & Statistiques"
                icon={BarChart3}
                isOpen={openAccordions.includes('D')}
                onClick={() => toggleAccordion('D')}
              />
              {openAccordions.includes('D') && (
                <div className="p-8 space-y-6 bg-gray-50/30">
                    <ConfigSwitch label="Bloc Statistiques Globales" checked={config.stats.showGlobalStats} onChange={(v) => setConfig({...config, stats: {...config.stats, showGlobalStats: v}})} />
                    {config.stats.showGlobalStats && (
                        <div className="grid grid-cols-2 gap-4 ml-8">
                            <ConfigSwitch label="Moyennes" checked={config.stats.showAverages} onChange={(v) => setConfig({...config, stats: {...config.stats, showAverages: v}})} />
                            <ConfigSwitch label="Max / Min" checked={config.stats.showMaxMin} onChange={(v) => setConfig({...config, stats: {...config.stats, showMaxMin: v}})} />
                            <ConfigSwitch label="Rang de l'élève" checked={config.stats.showRank} onChange={(v) => setConfig({...config, stats: {...config.stats, showRank: v}})} />
                            <ConfigSwitch label="Moyenne de Classe" checked={config.stats.showClassAverage} onChange={(v) => setConfig({...config, stats: {...config.stats, showClassAverage: v}})} />
                            <ConfigSwitch label="Taux Réussite" checked={config.stats.showSuccessRate} onChange={(v) => setConfig({...config, stats: {...config.stats, showSuccessRate: v}})} />
                        </div>
                    )}
                    <ConfigSwitch label="Graphiques Analytiques" checked={config.stats.showCharts} onChange={(v) => setConfig({...config, stats: {...config.stats, showCharts: v}})} />

                    {config.stats.showCharts && (
                        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6 ml-8 animate-in slide-in-from-top-4">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type de Diagramme</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setConfig({...config, stats: {...config.stats, chartType: 'BAR'}})}
                                        className={clsx("flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all", config.stats.chartType === 'BAR' ? "border-black bg-black text-white" : "border-gray-100 bg-white text-gray-400")}
                                    >Barres (Histogramme)</button>
                                    <button
                                        onClick={() => setConfig({...config, stats: {...config.stats, chartType: 'RADAR'}})}
                                        className={clsx("flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all", config.stats.chartType === 'RADAR' ? "border-black bg-black text-white" : "border-gray-100 bg-white text-gray-400")}
                                    >Radar (Forces/Faiblesses)</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mode d'Affichage</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setConfig({...config, stats: {...config.stats, chartScope: 'GENERAL'}})}
                                        className={clsx("flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all", config.stats.chartScope === 'GENERAL' ? "border-black bg-black text-white" : "border-gray-100 bg-white text-gray-400")}
                                    >Général (Groupe Matières)</button>
                                    <button
                                        onClick={() => setConfig({...config, stats: {...config.stats, chartScope: 'SPECIFIC'}})}
                                        className={clsx("flex-1 p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all", config.stats.chartScope === 'SPECIFIC' ? "border-black bg-black text-white" : "border-gray-100 bg-white text-gray-400")}
                                    >Spécifique (Comparatif)</button>
                                </div>
                                <p className="text-[8px] text-gray-400 font-medium italic">Le mode spécifique permet de comparer les performances entre les séquences ou trimestres.</p>
                            </div>

                            {config.stats.chartType === 'RADAR' && (
                                <ConfigSwitch label="Analyse Profil (Scientifique/Littéraire)" checked={config.stats.showRadarAnalysis} onChange={(v) => setConfig({...config, stats: {...config.stats, showRadarAnalysis: v}})} />
                            )}
                        </div>
                    )}
                </div>
              )}

              {/* Accordion E: Tableau d'Honneur */}
              <AccordionHeader
                id="E"
                title="Tableau d'Honneur & Certificats"
                icon={ImageIcon}
                isOpen={openAccordions.includes('E')}
                onClick={() => toggleAccordion('E')}
              />
              {openAccordions.includes('E') && (
                <div className="p-8 space-y-8 bg-gray-50/30">
                    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-black uppercase text-gray-400 block">Moyenne Minimale d'Excellence</span>
                            <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Seuil pour figurer au tableau d'honneur</p>
                        </div>
                        <input
                            type="number" step="0.5"
                            className="w-16 text-right font-black text-sm outline-none bg-gray-50 p-2 rounded-lg"
                            value={config.honors.threshold}
                            onChange={(e) => setConfig({...config, honors: {...config.honors, threshold: parseFloat(e.target.value)}})}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Design du Certificat</label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'MINIMAL', name: 'Minimaliste & Fluide', desc: 'Moderne, formes courbes (Doodle)' },
                                { id: 'CLASSIC', name: 'Classique Académique', desc: 'Traditionnel, bordures royales' },
                                { id: 'PLAYFUL', name: 'Maternelle / Ludique', desc: 'Coloré, idéal pour les petits' },
                                { id: 'CORPORATE', name: 'Prestige Corporate', desc: 'Luxe, marine et or brillant' }
                            ].map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => setConfig({...config, honors: {...config.honors, design: d.id as any}})}
                                    className={clsx(
                                        "p-6 rounded-[24px] border-2 text-left transition-all",
                                        config.honors.design === d.id ? "border-black bg-black text-white" : "border-gray-100 bg-white hover:border-gray-300"
                                    )}
                                >
                                    <p className="text-[10px] font-black uppercase tracking-tight">{d.name}</p>
                                    <p className={clsx("text-[8px] mt-1 font-medium", config.honors.design === d.id ? "text-white/50" : "text-gray-400")}>{d.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                        <ConfigSwitch label="Afficher Photo de l'Élève" checked={config.honors.showStudentPhoto} onChange={(v) => setConfig({...config, honors: {...config.honors, showStudentPhoto: v}})} />
                        <ConfigSwitch label="Afficher En-tête Institutionnel" checked={config.honors.showInstitutionalHeader} onChange={(v) => setConfig({...config, honors: {...config.honors, showInstitutionalHeader: v}})} />
                        <ConfigSwitch label="Afficher Sceau d'Authenticité" checked={config.honors.showSeal} onChange={(v) => setConfig({...config, honors: {...config.honors, showSeal: v}})} />
                        <ConfigSwitch label="Afficher Blocs de Signature" checked={config.honors.showSignatures} onChange={(v) => setConfig({...config, honors: {...config.honors, showSignatures: v}})} />
                    </div>
                </div>
              )}
            </div>
          </div>

          {/* Templates & Shortcuts */}
          <div className="lg:col-span-5 space-y-8">
            {/* Live Preview Section */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-accent/10 sticky top-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center">
                        <Eye size={16} className="mr-3 text-accent" />
                        Aperçu en Direct
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Live</span>
                    </div>
                </div>

                <div className="bg-gray-100 p-6 rounded-[32px] border border-gray-100 flex justify-center items-start overflow-hidden min-h-[500px]">
                    <div className="w-full transform transition-all duration-500 hover:scale-[1.02]">
                        <LiveBulletinPreview data={mockBulletinData} config={config} />
                    </div>
                </div>

                <div className="mt-6 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                    <p className="text-[9px] font-bold text-accent uppercase leading-relaxed text-center">
                        Ceci est un aperçu simulé basé sur vos réglages actuels. Les couleurs, marges et blocs s'adaptent dynamiquement.
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex gap-4">
                    <button className="flex-1 py-4 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-accent transition-all">
                        Sauvegarder Modèle
                    </button>
                    <button className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-black transition-all">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50">
                <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center">
                    <Copy size={16} className="mr-3 text-accent" />
                    Modèles Prédéfinis
                </h3>
                <div className="space-y-4">
                    {templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setConfig(t.config)}
                            className="w-full text-left p-6 rounded-[30px] border border-gray-100 hover:border-black transition-all group"
                        >
                            <p className="text-[10px] font-black uppercase tracking-tight group-hover:text-accent transition-colors">{t.name}</p>
                            <p className="text-[8px] text-gray-400 mt-1 font-medium leading-relaxed">{t.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700" />
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 relative z-10">Status des Données</h3>
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">Saisies de notes</span>
                        <span className="font-black text-green-400 flex items-center"><CheckCircle2 size={12} className="mr-1" /> OK</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">Calculs moyennes</span>
                        <span className="font-black text-green-400 flex items-center"><CheckCircle2 size={12} className="mr-1" /> OK</span>
                    </div>
                    <div className="h-px bg-white/10 my-4" />
                    <button className="w-full py-4 bg-accent hover:bg-white hover:text-black rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all">
                        Actualiser le Cockpit
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Perimeter Selection Sheet (Overlay) */}
      {showPerimeterSheet && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Sélectionner {config.selectedPerimeter}</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Choisissez l'élément cible pour la génération</p>
                    </div>
                    <button onClick={() => setShowPerimeterSheet(false)} className="p-3 hover:bg-white rounded-full transition-all">
                        <AlertCircle size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-8 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {config.selectedPerimeter === 'SALLE' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {classes.flatMap(c => (c.salles || c.Salles || []).map((s: any) => (
                                <button
                                    key={s.idSalle}
                                    onClick={() => {
                                        setConfig({...config, selectedId: s.idSalle});
                                        setShowPerimeterSheet(false);
                                    }}
                                    className={clsx(
                                        "p-5 rounded-2xl border-2 text-left transition-all group",
                                        config.selectedId === s.idSalle ? "border-black bg-black text-white" : "border-gray-100 bg-white hover:border-gray-300"
                                    )}
                                >
                                    <p className="text-[10px] font-black uppercase tracking-tight">{c.libelleClasseFr} {s.nomSalle}</p>
                                    <p className={clsx("text-[8px] mt-1 uppercase font-bold tracking-widest", config.selectedId === s.idSalle ? "text-white/50" : "text-gray-400")}>
                                        Effectif: {s.effectif || 0} Élèves
                                    </p>
                                </button>
                            )))}
                        </div>
                    )}

                    {config.selectedPerimeter === 'CLASSE' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {classes.map(c => (
                                <button
                                    key={c.idClasse}
                                    onClick={() => {
                                        setConfig({...config, selectedId: c.idClasse});
                                        setShowPerimeterSheet(false);
                                    }}
                                    className={clsx(
                                        "p-5 rounded-2xl border-2 text-left transition-all",
                                        config.selectedId === c.idClasse ? "border-black bg-black text-white" : "border-gray-100 bg-white hover:border-gray-300"
                                    )}
                                >
                                    <p className="text-[10px] font-black uppercase tracking-tight">{c.libelleClasseFr}</p>
                                    <p className={clsx("text-[8px] mt-1 uppercase font-bold tracking-widest", config.selectedId === c.idClasse ? "text-white/50" : "text-gray-400")}>
                                        Total: {(c.salles || c.Salles || []).length} Salles
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex justify-end">
                    <button
                        onClick={() => setShowPerimeterSheet(false)}
                        className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                    >Fermer</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const AccordionHeader: React.FC<{ id: string, title: string, icon: any, onClick: () => void, isOpen: boolean }> = ({ id, title, icon: Icon, onClick, isOpen }) => (
    <div
        onClick={onClick}
        className="p-8 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all border-b border-gray-50"
    >
        <div className="flex items-center space-x-4">
            <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all",
                isOpen ? "bg-accent text-white" : "bg-black text-white"
            )}>
                <Icon size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-black">{title}</h3>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
    </div>
);

const ConfigSwitch: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className="flex justify-between items-center w-full group"
    >
        <span className={clsx("text-[10px] font-black uppercase tracking-widest transition-all", checked ? "text-black" : "text-gray-400")}>{label}</span>
        <div className={clsx(
            "w-12 h-6 rounded-full relative transition-all",
            checked ? "bg-accent" : "bg-gray-200"
        )}>
            <div className={clsx(
                "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                checked ? "left-7" : "left-1"
            )} />
        </div>
    </button>
);

// --- Live Preview Component ---
const LiveBulletinPreview: React.FC<{ data: any, config: any }> = ({ data, config }) => {
    return (
        <div className="bg-white shadow-2xl rounded-sm p-4 w-full aspect-[1/1.41] flex flex-col overflow-hidden text-[6px] origin-top scale-[1.0] transition-all">
            {/* Header */}
            <header className="flex justify-between items-start border-b border-black pb-1 mb-2">
                <div className="w-[30%] space-y-0.5">
                    {config.showMinisterialHeader && config.schoolInfo.logoPosition !== 'LEFT' && (
                        <>
                            <p className="font-black">REPUBLIQUE DU CAMEROUN</p>
                            <p className="italic">Paix - Travail - Patrie</p>
                        </>
                    )}
                    {config.schoolInfo.logo && config.schoolInfo.logoPosition === 'LEFT' && (
                        <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                    )}
                </div>
                <div className="flex-1 text-center flex flex-col items-center">
                    {config.schoolInfo.logo && config.schoolInfo.logoPosition === 'CENTER_WATERMARK' && (
                        <div className="w-6 h-6 bg-gray-100 rounded-full mb-0.5" />
                    )}
                    {config.schoolInfo.name && <h2 className="font-black uppercase text-[7px] leading-tight">{data.school.nomFr}</h2>}
                    {config.schoolInfo.sigle && <p className="font-black text-accent">{data.school.abreviation}</p>}
                    {config.schoolInfo.contacts && <p className="text-gray-400">BP: {data.school.numBP} {data.school.ville}</p>}
                </div>
                <div className="w-[30%] text-right space-y-0.5">
                    {config.showMinisterialHeader && config.schoolInfo.logoPosition !== 'RIGHT' && (
                        <>
                            <p className="font-black">REPUBLIC OF CAMEROON</p>
                            <p className="italic">Peace - Work - Fatherland</p>
                        </>
                    )}
                    {config.schoolInfo.logo && config.schoolInfo.logoPosition === 'RIGHT' && (
                        <div className="w-8 h-8 bg-gray-100 rounded-lg ml-auto" />
                    )}
                </div>
            </header>

            <div className="text-center mb-1">
                <div className="inline-block border border-black px-2 py-0.5 rounded-md bg-gray-50">
                    <p className="font-black uppercase tracking-widest text-[7px]">Bulletin de Notes — {data.period.label}</p>
                </div>
            </div>

            {/* Student Info */}
            <div className="bg-gray-50 p-1.5 rounded-lg mb-2 flex gap-2 items-center">
                {config.body.showStudentPhoto && <div className="w-6 h-6 bg-white rounded-md border border-gray-100" />}
                <div className="flex-1 grid grid-cols-2 gap-x-2">
                    <div>
                        <p className="text-gray-400 uppercase text-[4px] font-black">Élève</p>
                        <p className="font-black uppercase">{data.student.nomComplet}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 uppercase text-[4px] font-black">Matricule</p>
                        <p className="font-black">{data.student.matricule}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black mb-2">
                <thead>
                    <tr className="bg-black text-white">
                        <th className="border border-black p-0.5 text-left">Matières</th>
                        <th className="border border-black p-0.5 text-center">Moy</th>
                        <th className="border border-black p-0.5 text-center">Coef</th>
                        <th className="border border-black p-0.5 text-center">Pts</th>
                        {config.stats.showRank && <th className="border border-black p-0.5 text-center">Rang</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.performance.groups.map((g: any, i: number) => (
                        <React.Fragment key={i}>
                            <tr className="bg-gray-100 font-black">
                                <td colSpan={config.stats.showRank ? 5 : 4} className="p-0.5 text-[5px]">{g.name}</td>
                            </tr>
                            {g.subjects.map((s: any, j: number) => (
                                <tr key={j}>
                                    <td className="border border-black p-0.5 font-bold">{s.name}</td>
                                    <td className="border border-black p-0.5 text-center font-black" style={{ color: s.total < config.body.passingGrade ? config.body.failColor : 'inherit' }}>
                                        {config.calcMode === 'LETTER' ? (s.total >= 15 ? 'A' : s.total >= 12 ? 'B' : 'C') :
                                         config.calcMode === 'COLOR' ? <div className="w-2 h-2 rounded-full mx-auto" style={{ backgroundColor: s.total < 10 ? 'red' : 'green' }} /> :
                                         s.total}
                                    </td>
                                    <td className="border border-black p-0.5 text-center">{s.coef}</td>
                                    <td className="border border-black p-0.5 text-center">{(s.total * s.coef).toFixed(1)}</td>
                                    {config.stats.showRank && <td className="border border-black p-0.5 text-center">{s.rank}</td>}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-black">
                        <td className="border border-black p-0.5 text-right">TOTAL</td>
                        <td className="border border-black p-0.5 text-center">{data.performance.average.toFixed(2)}</td>
                        <td className="border border-black p-0.5 text-center">{data.performance.totalCoef}</td>
                        <td className="border border-black p-0.5 text-center">{data.performance.totalPoints.toFixed(1)}</td>
                        {config.stats.showRank && <td className="border border-black p-0.5 text-center">{data.performance.rank}</td>}
                    </tr>
                </tfoot>
            </table>

            {/* Stats & Footer */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
                <div className="border border-black p-1 rounded-md">
                    <p className="font-black uppercase mb-1 underline">Statistiques Classe</p>
                    <div className="space-y-0.5">
                        <p>Moy. Max : <strong>{data.stats.maxMoy}</strong></p>
                        <p>Moy. Min : <strong>{data.stats.minMoy}</strong></p>
                        <p>Moy. Classe : <strong>{data.stats.avgMoy}</strong></p>
                    </div>
                </div>
                <div className="border border-black p-1 rounded-md flex flex-col justify-between">
                    <p className="font-black uppercase mb-1 underline text-center">Signatures</p>
                    <div className="flex justify-between mt-auto">
                        <div className="w-6 h-6 border border-dashed border-gray-200" />
                        <div className="w-6 h-6 border border-dashed border-gray-200" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ColorPicker: React.FC<{ label: string, color: string, onChange: (c: string) => void }> = ({ label, color, onChange }) => (
    <div className="space-y-2">
        <label className="text-[8px] font-black uppercase text-gray-400 ml-1">{label}</label>
        <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl">
            <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-none" />
            <span className="text-[10px] font-black uppercase text-gray-400">{color}</span>
        </div>
    </div>
);

export default BulletinConfigPage;
