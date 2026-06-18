import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import {
  Layout,
  Type,
  Users,
  BarChart3,
  CheckSquare,
  Save,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Eye,
  ArrowLeft,
  Printer,
  Grid,
  Zap,
  School,
  FileText,
  AlertCircle,
  Clock,
  Award,
  FileSignature as Signature
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../api/axios';

interface BulletinTemplate {
  id: string;
  name: string;
  description: string;
  config: any;
}

const BulletinConfigPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [activeTab, setActiveTab] = useState<'COCKPIT' | 'LIBRARY'>('COCKPIT');
  const [openAccordions, setOpenAccordions] = useState<string[]>(['A', 'B']);

  // --- Configuration State (The JSON Profile) ---
  const [config, setConfig] = useState({
    profileName: "",
    // Accordion A: Périmètre
    selectedClassId: null,
    periodType: 'SEQUENCE' as 'SEQUENCE' | 'TRIMESTER' | 'ANNUAL',
    calcMode: 'HYBRID' as 'TRADITIONAL' | 'COTATION' | 'HYBRID',

    // Accordion B: En-tête
    showMinisterialHeader: true,
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
        showSuccessRate: true,
        showCharts: true,
        chartType: 'BAR' as 'BAR' | 'RADAR'
    },

    // Accordion E: Bas de page
    footer: {
        showAppreciations: true,
        showDiscipline: true,
        showAbsences: true,
        showConduct: true, // Heures de colle, avertissements
        showDecisions: true,
        signatures: {
            parent: true,
            teacher: true,
            principal: true,
            useDigitalSign: false
        }
    }
  });

  const [classes, setClasses] = useState<any[]>([]);
  const [schoolData, setSchoolData] = useState<any>(null);

  useEffect(() => {
    if (yearId) {
        api.get(`/salles/classes/stats/${yearId}`).then(res => setClasses(res.data));
        api.get('/admin/etablissement/profile').then(res => setSchoolData(res.data)).catch(() => {});
    }
  }, [yearId]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const templates: BulletinTemplate[] = [
    {
        id: 'cameroon-apc',
        name: 'Modèle Officiel Cameroun APC',
        description: 'Standard Bilingue (FR/EN) avec compétences',
        config: { ...config, calcMode: 'HYBRID', showMinisterialHeader: true, body: { ...config.body, apcMode: 'BLOCKS' } }
    },
    {
        id: 'classic-fr',
        name: 'Modèle Classique Français',
        description: 'Épuré, focus sur les moyennes et appréciations',
        config: { ...config, calcMode: 'TRADITIONAL', showMinisterialHeader: false, schoolInfo: { ...config.schoolInfo, logoPosition: 'RIGHT' } }
    },
    {
        id: 'intl-grades',
        name: 'Modèle International Grades',
        description: 'Système par cotes (A+, B, C...) sans notes numériques',
        config: { ...config, calcMode: 'COTATION', body: { ...config.body, tableBorderColor: '#E2E8F0' } }
    }
  ];

  const handleApplyTemplate = (tpl: BulletinTemplate) => {
    setConfig(tpl.config);
    setActiveTab('COCKPIT');
    setOpenAccordions(['A', 'B', 'C', 'D', 'E']);
  };

  const AccordionHeader: React.FC<{ id: string, title: string, icon: any }> = ({ id, title, icon: Icon }) => (
    <button
      onClick={() => toggleAccordion(id)}
      className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors border-b border-gray-100 group"
    >
      <div className="flex items-center space-x-4">
        <div className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            openAccordions.includes(id) ? "bg-black text-white shadow-lg" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
        )}>
          <Icon size={20} />
        </div>
        <span className="font-black uppercase tracking-tight text-sm text-black">{title}</span>
      </div>
      {openAccordions.includes(id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F5F7FB] overflow-hidden">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center space-x-8">
            <button onClick={() => window.history.back()} className="p-3 hover:bg-gray-100 rounded-full transition-all bg-gray-50">
                <ArrowLeft size={24} />
            </button>
            <div className="flex bg-gray-100 p-1.5 rounded-[20px]">
                <button
                    onClick={() => setActiveTab('COCKPIT')}
                    className={clsx(
                        "px-8 py-2.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                        activeTab === 'COCKPIT' ? "bg-white text-black shadow-md scale-105" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Zap size={14} />
                    <span>Cockpit de Configuration</span>
                </button>
                <button
                    onClick={() => setActiveTab('LIBRARY')}
                    className={clsx(
                        "px-8 py-2.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                        activeTab === 'LIBRARY' ? "bg-white text-black shadow-md scale-105" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Grid size={14} />
                    <span>Bibliothèque de Maquettes</span>
                </button>
            </div>
        </div>

        <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />)}
            </div>
            <button className="flex items-center space-x-3 px-8 py-4 bg-accent text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-accent/20">
                <Printer size={18} />
                <span>Générer les PDF</span>
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: The Cockpit Controls */}
        <div className="w-[40%] bg-white border-r border-gray-200 overflow-y-auto custom-scrollbar flex flex-col relative z-20">
          {activeTab === 'COCKPIT' ? (
            <div className="pb-32">
              {/* Accordion A: Périmètre */}
              <AccordionHeader id="A" title="Périmètre & Données de base" icon={Layout} />
              {openAccordions.includes('A') && (
                <div className="p-8 space-y-6 bg-gray-50/30 animate-in fade-in duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Classe / Niveau</label>
                    <select
                        className="w-full p-5 bg-white border border-gray-100 rounded-[20px] text-xs font-black uppercase outline-none focus:border-black transition-all shadow-sm"
                        value={config.selectedClassId || ''}
                        onChange={(e) => setConfig({...config, selectedClassId: e.target.value as any})}
                    >
                        <option value="">Toute l'école</option>
                        {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelleClasseFr}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Périodicité</label>
                        <select
                            className="w-full p-5 bg-white border border-gray-100 rounded-[20px] text-xs font-black uppercase outline-none focus:border-black"
                            value={config.periodType}
                            onChange={(e) => setConfig({...config, periodType: e.target.value as any})}
                        >
                            <option value="SEQUENCE">Séquentiel</option>
                            <option value="TRIMESTER">Trimestriel</option>
                            <option value="ANNUAL">Bilan Annuel</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Système de notation</label>
                        <select
                            className="w-full p-5 bg-white border border-gray-100 rounded-[20px] text-xs font-black uppercase outline-none focus:border-black"
                            value={config.calcMode}
                            onChange={(e) => setConfig({...config, calcMode: e.target.value as any})}
                        >
                            <option value="TRADITIONAL">Traditionnel (Points)</option>
                            <option value="COTATION">Cotes / Grades</option>
                            <option value="HYBRID">Hybride (APC + Notes)</option>
                        </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Accordion B: En-tête */}
              <AccordionHeader id="B" title="En-tête & Bloc Institutionnel" icon={School} />
              {openAccordions.includes('B') && (
                <div className="p-8 space-y-6 bg-gray-50/30 animate-in fade-in duration-500">
                  <ConfigSwitch
                    label="En-tête Ministériel (Bilingue)"
                    checked={config.showMinisterialHeader}
                    onChange={(v) => setConfig({...config, showMinisterialHeader: v})}
                  />
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-100">
                    <ConfigSwitch label="Nom Établissement" checked={config.schoolInfo.name} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, name: v}})} />
                    <ConfigSwitch label="Sigle / Abréviation" checked={config.schoolInfo.sigle} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, sigle: v}})} />
                    <ConfigSwitch label="Devise de l'école" checked={config.schoolInfo.devise} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, devise: v}})} />
                    <ConfigSwitch label="Coordonnées" checked={config.schoolInfo.contacts} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, contacts: v}})} />
                    <ConfigSwitch label="Arrêté d'ouverture" checked={config.schoolInfo.arrete} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, arrete: v}})} />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <ConfigSwitch label="Logo Officiel" checked={config.schoolInfo.logo} onChange={(v) => setConfig({...config, schoolInfo: {...config.schoolInfo, logo: v}})} />
                    {config.schoolInfo.logo && (
                        <div className="flex bg-gray-100 p-1 rounded-xl ml-8">
                            {['LEFT', 'CENTER_WATERMARK', 'RIGHT'].map(pos => (
                                <button
                                    key={pos}
                                    onClick={() => setConfig({...config, schoolInfo: {...config.schoolInfo, logoPosition: pos as any}})}
                                    className={clsx(
                                        "flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all",
                                        config.schoolInfo.logoPosition === pos ? "bg-white text-black shadow-sm" : "text-gray-400"
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
              <AccordionHeader id="C" title="Corps du Bulletin (Notes & Styles)" icon={Type} />
              {openAccordions.includes('C') && (
                <div className="p-8 space-y-8 bg-gray-50/30">
                   <div className="grid grid-cols-2 gap-4">
                        <ConfigSwitch label="Photo Élève" checked={config.body.showStudentPhoto} onChange={(v) => setConfig({...config, body: {...config.body, showStudentPhoto: v}})} />
                        <ConfigSwitch label="Prof Principal" checked={config.body.showMainTeacher} onChange={(v) => setConfig({...config, body: {...config.body, showMainTeacher: v}})} />
                        <ConfigSwitch label="Noms Enseignants" checked={config.body.showSubjectTeachers} onChange={(v) => setConfig({...config, body: {...config.body, showSubjectTeachers: v}})} />
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
              <AccordionHeader id="D" title="Profil de Classe & Statistiques" icon={BarChart3} />
              {openAccordions.includes('D') && (
                <div className="p-8 space-y-6 bg-gray-50/30">
                    <ConfigSwitch label="Bloc Statistiques Globales" checked={config.stats.showGlobalStats} onChange={(v) => setConfig({...config, stats: {...config.stats, showGlobalStats: v}})} />
                    {config.stats.showGlobalStats && (
                        <div className="grid grid-cols-2 gap-4 ml-8">
                            <ConfigSwitch label="Moyennes" checked={config.stats.showAverages} onChange={(v) => setConfig({...config, stats: {...config.stats, showAverages: v}})} />
                            <ConfigSwitch label="Max / Min" checked={config.stats.showMaxMin} onChange={(v) => setConfig({...config, stats: {...config.stats, showMaxMin: v}})} />
                            <ConfigSwitch label="Taux Réussite" checked={config.stats.showSuccessRate} onChange={(v) => setConfig({...config, stats: {...config.stats, showSuccessRate: v}})} />
                        </div>
                    )}
                    <ConfigSwitch label="Graphiques Analytiques" checked={config.stats.showCharts} onChange={(v) => setConfig({...config, stats: {...config.stats, showCharts: v}})} />
                    {config.stats.showCharts && (
                        <div className="flex gap-4 ml-8">
                             <button
                                onClick={() => setConfig({...config, stats: {...config.stats, chartType: 'BAR'}})}
                                className={clsx("flex-1 p-3 rounded-xl border text-[8px] font-black uppercase transition-all", config.stats.chartType === 'BAR' ? "bg-black text-white" : "bg-white text-gray-400")}
                            >Bâtons</button>
                            <button
                                onClick={() => setConfig({...config, stats: {...config.stats, chartType: 'RADAR'}})}
                                className={clsx("flex-1 p-3 rounded-xl border text-[8px] font-black uppercase transition-all", config.stats.chartType === 'RADAR' ? "bg-black text-white" : "bg-white text-gray-400")}
                            >Radar</button>
                        </div>
                    )}
                </div>
              )}

              {/* Accordion E: Bas de page */}
              <AccordionHeader id="E" title="Bas de page & Décisions" icon={CheckSquare} />
              {openAccordions.includes('E') && (
                <div className="p-8 space-y-6 bg-gray-50/30">
                    <ConfigSwitch label="Appréciations Enseignants" checked={config.footer.showAppreciations} onChange={(v) => setConfig({...config, footer: {...config.footer, showAppreciations: v}})} />
                    <ConfigSwitch label="Tableau de Discipline" checked={config.footer.showDiscipline} onChange={(v) => setConfig({...config, footer: {...config.footer, showDiscipline: v}})} />
                    {config.footer.showDiscipline && (
                        <div className="grid grid-cols-2 gap-4 ml-8">
                            <ConfigSwitch label="Absences" checked={config.footer.showAbsences} onChange={(v) => setConfig({...config, footer: {...config.footer, showAbsences: v}})} />
                            <ConfigSwitch label="Conduite / Sanctions" checked={config.footer.showConduct} onChange={(v) => setConfig({...config, footer: {...config.footer, showConduct: v}})} />
                        </div>
                    )}
                    <ConfigSwitch label="Décisions du Conseil" checked={config.footer.showDecisions} onChange={(v) => setConfig({...config, footer: {...config.footer, showDecisions: v}})} />

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 block">Espaces de Signature</label>
                        <div className="grid grid-cols-2 gap-3">
                            <ConfigSwitch label="Parent" checked={config.footer.signatures.parent} onChange={(v) => setConfig({...config, footer: {...config.footer, signatures: {...config.footer.signatures, parent: v}}})} />
                            <ConfigSwitch label="Enseignant" checked={config.footer.signatures.teacher} onChange={(v) => setConfig({...config, footer: {...config.footer, signatures: {...config.footer.signatures, teacher: v}}})} />
                            <ConfigSwitch label="Principal" checked={config.footer.signatures.principal} onChange={(v) => setConfig({...config, footer: {...config.footer, signatures: {...config.footer.signatures, principal: v}}})} />
                            <ConfigSwitch label="Signature Numérisée" checked={config.footer.signatures.useDigitalSign} onChange={(v) => setConfig({...config, footer: {...config.footer, signatures: {...config.footer.signatures, useDigitalSign: v}}})} />
                        </div>
                    </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 grid grid-cols-1 gap-6 bg-gray-50/50 flex-1 h-full overflow-y-auto">
                <div className="flex items-center space-x-3 mb-4">
                    <Grid size={20} className="text-accent" />
                    <h3 className="font-black uppercase tracking-tighter text-lg">Maquettes Prédéfinies</h3>
                </div>
                {templates.map((tpl) => (
                    <div
                        key={tpl.id}
                        onClick={() => handleApplyTemplate(tpl)}
                        className="p-8 bg-white border border-gray-100 rounded-[32px] cursor-pointer hover:border-black hover:shadow-2xl transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all shadow-inner">
                                <Layout size={28} />
                            </div>
                            <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Premium</div>
                        </div>
                        <h4 className="font-black uppercase tracking-tight text-md text-black mb-2">{tpl.name}</h4>
                        <p className="text-[11px] font-medium text-gray-400 leading-relaxed uppercase tracking-wide">{tpl.description}</p>

                        <div className="absolute right-0 bottom-0 p-8 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
                            <div className="bg-black text-white p-3 rounded-full shadow-xl">
                                <Eye size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}

          {/* Persistent Action Bar */}
          <div className="mt-auto p-8 border-t border-gray-100 bg-white sticky bottom-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
             <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    placeholder="NOMMER CE PROFIL..."
                    className="flex-1 bg-gray-50 border border-gray-100 px-6 py-4 rounded-[18px] text-xs font-black uppercase tracking-widest outline-none focus:bg-white focus:border-black transition-all"
                    value={config.profileName}
                    onChange={(e) => setConfig({...config, profileName: e.target.value})}
                />
             </div>
             <div className="flex gap-4">
                <button className="flex-1 py-5 bg-black text-white rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-3">
                    <Save size={18} />
                    <span>Sauvegarder</span>
                </button>
             </div>
          </div>
        </div>

        {/* Right Panel: The Dynamic A4 Preview */}
        <div className="w-[60%] bg-[#E5E7EB] overflow-auto flex items-center justify-center p-20 custom-scrollbar relative">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Preview Temps Réel (Rayonné)</span>
            </div>

            {/* A4 Paper */}
            <div
                className="w-[794px] min-h-[1123px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] p-[50px] flex flex-col transition-all duration-700 ease-in-out border-2 border-transparent"
                style={{ borderColor: config.profileName ? '#000' : 'transparent' }}
            >
                {/* Accordion B: Header Logic */}
                <div className={clsx(
                    "flex justify-between items-start pb-6 mb-8",
                    config.schoolInfo.logo && config.schoolInfo.logoPosition === 'CENTER_WATERMARK' && "relative"
                )} style={{ borderBottom: `${config.body.tableBorderWidth} solid black` }}>
                    {config.showMinisterialHeader && (
                        <div className="w-1/3 text-[7px] font-black uppercase leading-[1.4] space-y-1">
                            <p>REPUBLIQUE DU CAMEROUN</p>
                            <p className="text-gray-400">REPUBLIC OF CAMEROON</p>
                            <p>Paix - Travail - Patrie</p>
                            <p className="text-gray-400 italic">Peace - Work - Fatherland</p>
                        </div>
                    )}

                    <div className={clsx(
                        "flex flex-col items-center flex-1 text-center",
                        config.schoolInfo.logo && config.schoolInfo.logoPosition === 'LEFT' && "order-first",
                        config.schoolInfo.logo && config.schoolInfo.logoPosition === 'RIGHT' && "order-last"
                    )}>
                        {config.schoolInfo.logo && config.schoolInfo.logoPosition !== 'CENTER_WATERMARK' && (
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl mb-3 flex items-center justify-center border border-gray-100 shadow-inner">
                                <ImageIcon className="text-gray-200" size={32} />
                            </div>
                        )}
                        {config.schoolInfo.name && (
                            <h2 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">
                                {schoolData?.nomFr || "NOM DE L'ÉTABLISSEMENT"}
                            </h2>
                        )}
                        {config.schoolInfo.sigle && <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-2">{schoolData?.abreviation || "SIGLE"}</p>}
                        {config.schoolInfo.devise && (
                            <p className="text-[8px] font-bold italic text-gray-400 uppercase tracking-widest px-4 border-t border-gray-100 pt-2">
                                "{schoolData?.deviseFr || "Savoir - Travail - Succès"}"
                            </p>
                        )}
                        {config.schoolInfo.arrete && <p className="text-[7px] font-medium text-gray-400 mt-1 uppercase">Arrêté : {schoolData?.arrete || "N° 001/MINESEC/CAB"}</p>}
                    </div>

                    {config.showMinisterialHeader && (
                        <div className="w-1/3 text-[7px] font-black uppercase text-right leading-[1.4] space-y-1">
                            <p>MINISTERE DES ENSEIGNEMENTS SECONDAIRES</p>
                            <p className="text-gray-400">MINISTRY OF SECONDARY EDUCATION</p>
                            <p>DELEGATION REGIONALE DU CENTRE</p>
                        </div>
                    )}

                    {config.schoolInfo.logo && config.schoolInfo.logoPosition === 'CENTER_WATERMARK' && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none scale-150 rotate-[-15deg]">
                            <ImageIcon size={400} />
                        </div>
                    )}
                </div>

                {/* Bulletin Title */}
                <div className="mb-10 text-center">
                    <div className="inline-block bg-black text-white px-10 py-5 rounded-[20px] shadow-xl">
                        <h1 className="text-2xl font-black uppercase tracking-[0.4em] mb-1">Bulletin de Notes</h1>
                        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/50">
                            {config.periodType} — ANNÉE {selectedYear?.libelleAnneeScolaire || "2024-2025"}
                        </p>
                    </div>
                </div>

                {/* Accordion C: Student Info */}
                <div className="flex gap-10 mb-12 bg-gray-50/50 p-8 rounded-[32px] border border-gray-100">
                    {config.body.showStudentPhoto && (
                        <div className="w-32 h-32 bg-white border-4 border-white shadow-xl rounded-[24px] flex items-center justify-center text-gray-200">
                            <Users size={48} />
                        </div>
                    )}
                    <div className="flex-1 grid grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Élève</span>
                                <p className="text-lg font-black uppercase tracking-tight">KOUAMÉ Jean-Luc</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Matricule</span>
                                <p className="text-xs font-black">SCH24-00159</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Classe / Effectif</span>
                                <p className="text-lg font-black uppercase tracking-tight">6ème ALFA — 42 Élèves</p>
                            </div>
                            {config.body.showMainTeacher && (
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Prof Principal</span>
                                    <p className="text-xs font-black uppercase">M. NJIPDI Armand</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Accordion C: Grades Table */}
                <div className="flex-1 mb-10 overflow-hidden">
                    <table
                        className="w-full border-collapse"
                        style={{ borderColor: config.body.tableBorderColor }}
                    >
                        <thead>
                            <tr className="bg-black text-white">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>Matières / Compétences</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center w-24" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>Note /20</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center w-16" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>Coef</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center w-24" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>Points</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>Appréciations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { m: "Mathématiques", n: 14.5, c: 5 },
                                { m: "Langue Française", n: 9.25, c: 4 },
                                { m: "Histoire-Géo", n: 12.0, c: 2 }
                            ].map((row, i) => (
                                <React.Fragment key={i}>
                                    <tr className={clsx(i % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                                        <td className="p-4" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>
                                            <p className="text-[11px] font-black uppercase mb-1">{row.m}</p>
                                            {config.body.showSubjectTeachers && <p className="text-[8px] font-bold text-gray-400 uppercase">M. Professeur {i+1}</p>}
                                        </td>
                                        <td className="p-4 text-center text-sm font-black" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}`, color: row.n >= config.body.passingGrade ? config.body.successColor : config.body.failColor }}>
                                            {row.n.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center font-bold text-xs" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>{row.c}</td>
                                        <td className="p-4 text-center font-black" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>{(row.n * row.c).toFixed(1)}</td>
                                        <td className="p-4" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>
                                            <p className="text-[9px] font-bold uppercase">{row.n >= 12 ? "Très Satisfaisant" : "À renforcer"}</p>
                                        </td>
                                    </tr>
                                    {config.calcMode === 'HYBRID' && (
                                        <tr>
                                            <td colSpan={5} className="p-0" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>
                                                <div className="flex bg-gray-100/50 p-2 gap-2">
                                                    {config.body.apcMode === 'BLOCKS' ? (
                                                        <>
                                                            <div className="flex-1 h-3 bg-green-500 rounded-full" />
                                                            <div className="flex-1 h-3 bg-green-200 rounded-full" />
                                                            <div className="flex-1 h-3 bg-gray-200 rounded-full" />
                                                        </>
                                                    ) : (
                                                        <p className="text-[7px] font-bold text-accent px-2 uppercase tracking-widest italic">
                                                            Compétence transversale {i+1} : Acquisition en cours de validation
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                            <tr>
                                <td className="p-4 font-black text-xs uppercase text-right" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>Moyenne Générale</td>
                                <td className="p-4 text-center font-black text-lg" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>11.91</td>
                                <td className="p-4 text-center font-bold" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>11</td>
                                <td className="p-4 text-center font-black" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>131.0</td>
                                <td className="p-4 font-black text-xs uppercase text-accent" style={{ border: `${config.body.tableBorderWidth} solid ${config.body.tableBorderColor}` }}>Passable</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Accordion D: Stats & Charts */}
                <div className="grid grid-cols-2 gap-10 mb-10">
                    {config.stats.showGlobalStats && (
                        <div className="p-6 border-2 border-black rounded-[24px] space-y-4">
                            <h4 className="text-[10px] font-black uppercase underline text-center mb-4">Profil de la Classe</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-gray-400 uppercase">Min / Max</p>
                                    <p className="text-xs font-black">04.50 / 18.25</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-gray-400 uppercase">Rang</p>
                                    <p className="text-xs font-black">12ème / 42</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-gray-400 uppercase">Moyenne Classe</p>
                                    <p className="text-xs font-black">10.45</p>
                                </div>
                                {config.stats.showSuccessRate && (
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-gray-400 uppercase">Taux Réussite</p>
                                        <p className="text-xs font-black">64.28 %</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {config.stats.showCharts && (
                        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[24px] border-2 border-dashed border-gray-200">
                            <div className="text-center opacity-30">
                                {config.stats.chartType === 'BAR' ? <BarChart3 size={40} className="mx-auto mb-2" /> : <Zap size={40} className="mx-auto mb-2" />}
                                <p className="text-[8px] font-black uppercase">{config.stats.chartType} CHART AREA</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Accordion E: Discipline & Decisions */}
                {(config.footer.showDiscipline || config.footer.showDecisions) && (
                    <div className="grid grid-cols-2 gap-10 mb-10">
                        {config.footer.showDiscipline && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase underline">Discipline / Conduite</h4>
                                <table className="w-full text-[9px] font-bold border-collapse border border-gray-200">
                                    <tbody>
                                        {config.footer.showAbsences && (
                                            <>
                                                <tr>
                                                    <td className="p-2 border border-gray-200 uppercase">Absences Justifiées</td>
                                                    <td className="p-2 border border-gray-200 text-center">02h</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border border-gray-200 uppercase">Absences Non Justifiées</td>
                                                    <td className="p-2 border border-gray-200 text-center">04h</td>
                                                </tr>
                                            </>
                                        )}
                                        {config.footer.showConduct && (
                                            <>
                                                <tr>
                                                    <td className="p-2 border border-gray-200 uppercase">Heures de Colle</td>
                                                    <td className="p-2 border border-gray-200 text-center">00h</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 border border-gray-200 uppercase">Avertissements</td>
                                                    <td className="p-2 border border-gray-200 text-center">Néant</td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {config.footer.showDecisions && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase underline">Décisions du Conseil</h4>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-wrap gap-2">
                                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase">Félicitations</div>
                                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[8px] font-black uppercase">Tableau d'Honneur</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Accordion E: Footer */}
                <div className="grid grid-cols-3 gap-8 mt-auto">
                    {config.footer.signatures.parent && (
                        <div className="p-4 border-2 border-black rounded-[20px] min-h-[120px] flex flex-col items-center">
                            <p className="text-[9px] font-black uppercase underline mb-4">Visa du Parent</p>
                        </div>
                    )}
                    {config.footer.signatures.teacher && (
                        <div className="p-4 border-2 border-black rounded-[20px] min-h-[120px] flex flex-col items-center">
                            <p className="text-[9px] font-black uppercase underline mb-4">Professeur Principal</p>
                        </div>
                    )}
                    {config.footer.signatures.principal && (
                        <div className="p-4 border-2 border-black rounded-[20px] min-h-[120px] flex flex-col items-center bg-gray-50 relative">
                            <p className="text-[9px] font-black uppercase underline mb-4">Le Chef d'Établissement</p>
                            <div className="opacity-[0.05] mt-2">
                                <Signature size={48} />
                            </div>
                            {config.footer.signatures.useDigitalSign && (
                                <div className="absolute bottom-4 text-[8px] font-black uppercase text-red-600 border border-red-600 px-2 py-1 rotate-[-10deg]">
                                    Signé numériquement
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ConfigSwitch: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between group cursor-pointer" onClick={() => onChange(!checked)}>
        <span className="text-[11px] font-bold uppercase tracking-tight text-gray-600 group-hover:text-black transition-colors">{label}</span>
        <div className={clsx(
            "w-10 h-5 rounded-full relative transition-all duration-300",
            checked ? "bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]" : "bg-gray-200"
        )}>
            <div className={clsx(
                "w-3 h-3 bg-white rounded-full absolute top-1 transition-all duration-300",
                checked ? "right-1" : "left-1"
            )} />
        </div>
    </div>
);

const ColorPicker: React.FC<{ label: string, color: string, onChange: (c: string) => void }> = ({ label, color, onChange }) => (
    <div className="flex items-center space-x-3">
        <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border-none p-0"
        />
        <span className="text-[10px] font-black uppercase text-gray-500">{label}</span>
    </div>
);

export default BulletinConfigPage;
