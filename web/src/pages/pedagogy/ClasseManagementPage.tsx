import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { pedagogyService } from '../../api/pedagogyService';
import { studentService } from '../../api/studentService';
import api from '../../api/axios';
import {
  Building2,
  Users,
  Plus,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  Zap,
  DoorOpen,
  Edit2,
  Trash2,
  X,
  Save,
  Sparkles,
  FileText,
  MoreVertical,
  Printer,
  FileSpreadsheet,
  FileDown,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';
import { useNavigate } from 'react-router-dom';

interface ClasseStat {
    idClasse: number;
    nomClasse: string;
    libelleClasseFr?: string;
    effectif: number;
    capacite: number;
    nbSalles: number;
    roomCount?: number;
    totalEnrolled?: number;
    totalCapacity?: number;
    enseignementLabel?: string;
    cycleLabel?: string;
    idCycle?: number;
    abreviation?: string;
}

interface Cycle {
    idCycle: number;
    libelleCycle: string;
}

const reportCategories = [
    {
        name: "I. Listes Administratives & Effectifs",
        reports: [
            { id: 'alpha_global', name: "Liste alphabétique globale", type: 'A' },
            { id: 'attendance_monthly', name: "Fiche de présence / Émégement mensuel", type: 'B' },
            { id: 'level_complete', name: "Liste des élèves par Cycle / Niveau complet", type: 'A' },
            { id: 'gender_split', name: "Liste de répartition par genre", type: 'A' },
            { id: 'trombinoscope', name: "Trombinoscope de la salle", type: 'C' },
            { id: 'new_vs_repeater', name: "Liste des nouveaux inscrits vs redoublants", type: 'A' },
        ]
    },
    {
        name: "💰 II. Listes Financières & Recouvrement",
        reports: [
            { id: 'insolvent_fees', name: "Liste des insolvables – Frais exigibles", type: 'A' },
            { id: 'global_financial', name: "Liste de situation financière globale", type: 'B' },
            { id: 'daily_payments', name: "État de paiement journalier", type: 'A' },
            { id: 'scholarship', name: "Liste des élèves boursiers / Exemptés", type: 'A' },
            { id: 'fees_bilan_exigible', name: "Bilan des frais scolaires", type: 'C' },
            { id: 'fees_bilan_perischool', name: "Bilan des frais périscolaires", type: 'C' },
            { id: 'fees_bilan_transport', name: "Bilan des frais de transport", type: 'C' },
        ]
    },
    {
        name: "🩺 III. Listes Sanitaires & Contacts",
        reports: [
            { id: 'emergency_contacts', name: "Fiche d'urgence et contacts des parents", type: 'A' },
            { id: 'medical_emergencies', name: "Registre des allergies et urgences médicales", type: 'A' },
            { id: 'exit_auth', name: "Liste des autorisations de sortie", type: 'A' },
        ]
    },
    {
        name: "📊 V. Statistiques & Histogrammes",
        reports: [
            { id: 'age_pyramid', name: "Histogramme de la pyramide des âges", type: 'C' },
        ]
    },
    {
        name: "🛠️ VI. Logistique",
        reports: [
            { id: 'material_dist', name: "Liste de distribution du matériel", type: 'B' },
        ]
    }
];

const ClasseManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [stats, setStats] = useState<ClasseStat[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [sequenceCount, setSequenceCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClasse, setCurrentClasse] = useState<Partial<ClasseStat>>({
    nomClasse: '',
    idCycle: undefined,
    abreviation: '',
    capacite: 0
  });

  // Report States
  const [activeReportMenu, setActiveReportMenu] = useState<number | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Fee Selection for Reports
  const [availableFees, setAvailableFees] = useState<any[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<number | string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isPreviewModalOpen && selectedReport && yearId) {
        loadAvailableFees();
    }
  }, [isPreviewModalOpen, selectedReport]);

  const loadAvailableFees = async () => {
      if (!selectedReport || !yearId) return;
      try {
          if (selectedReport.id === 'insolvent_fees') {
              const res = await api.get(`/finance/tarifs/all/${yearId}`);
              setAvailableFees(res.data.exigibles.filter((f: any) => f.idClasse === selectedClassId));
          } else if (selectedReport.id === 'insolvent_perischool') {
              const res = await api.get(`/finance/tarifs/all/${yearId}`);
              setAvailableFees(res.data.periscolaires);
          }
      } catch (error) {
          console.error("Error loading fees for selector:", error);
      }
  };

  const handleFeeChange = async (feeId: string) => {
      setSelectedFeeId(feeId);
      if (!selectedReport || !selectedClassId || !yearId) return;

      setLoading(true);
      try {
          const params: any = { idClasse: selectedClassId, idAnneeScolaire: yearId };
          if (selectedReport.id === 'insolvent_fees') params.idTarifFraisExigible = feeId;
          if (selectedReport.id === 'insolvent_perischool') params.idTarifFraisActivitePeriscolaire = feeId;

          const res = await pedagogyService.getReportData(selectedReport.id, params);
          setPreviewData(res.data);
      } catch (error) {
          alert("Erreur lors du filtrage");
      } finally {
          setLoading(false);
      }
  };

  const handleDateChange = async (date: string) => {
      setSelectedDate(date);
      if (!selectedReport || !selectedClassId || !yearId) return;

      setLoading(true);
      try {
          const res = await pedagogyService.getReportData(selectedReport.id, {
              idClasse: selectedClassId,
              idAnneeScolaire: yearId,
              date: date
          });
          setPreviewData(res.data);
      } catch (error) {
          alert("Erreur lors du chargement de la date");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (yearId) {
      loadData();
    }
  }, [yearId]);

  useEffect(() => {
    if (selectedClassId && yearId) {
      loadRoomsForClass(selectedClassId);
    }
  }, [selectedClassId, yearId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, cyclesRes] = await Promise.all([
        api.get(`/salles/classes/stats/${yearId}`),
        pedagogyService.getStructure(yearId!) // To get cycles info from structure
      ]);

      const normalizedStats: ClasseStat[] = statsRes.data.map((item: any) => ({
        ...item,
        nomClasse: item.libelleClasseFr || item.nomClasse || item.libelleClasseEn || item.libelleClasseEs || 'Classe',
        effectif: item.totalEnrolled ?? item.effectif ?? 0,
        capacite: item.totalCapacity ?? item.capacite ?? 0,
        nbSalles: item.roomCount ?? item.nbSalles ?? 0,
        enseignementLabel: item.enseignementLabel || item.enseignement || item.enseignementFr || 'N/A',
        cycleLabel: item.cycleLabel || item.libelleCycle || item.cycle || 'N/A'
      }));

      setStats(normalizedStats);
      if (!selectedClassId && normalizedStats.length > 0) {
        setSelectedClassId(normalizedStats[0].idClasse);
      }

      // Extract all cycles from structure
      const allCycles: Cycle[] = [];
      cyclesRes.data.forEach((ens: any) => {
          ens.cycles?.forEach((cyc: any) => {
              allCycles.push({
                  idCycle: cyc.idCycle,
                  libelleCycle: cyc.libelleCycle || cyc.libelleCycleFr
              });
          });
      });
      setCycles(allCycles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomsForClass = async (classId: number) => {
    if (!yearId) return;
    try {
      const [roomsRes, sequencesRes] = await Promise.all([
        studentService.getRooms(yearId),
        pedagogyService.getClassSequences(yearId!, classId)
      ]);

      setRooms(roomsRes.data.filter((room: any) => room.idClasse === classId));
      setSequenceCount(sequencesRes.data.length);
    } catch (error) {
      console.error("Erreur chargement salles ou séquences :", error);
      setRooms([]);
      setSequenceCount(0);
    }
  };

  const handleSelectClass = async (classId: number) => {
    setSelectedClassId(classId);
    await loadRoomsForClass(classId);
  };

  const selectedClass = stats.find(item => item.idClasse === selectedClassId) || stats[0] || null;

  const handleDelete = async (id: number) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette classe ?")) {
      setLoading(true);
      try {
        await pedagogyService.deleteClasse(id);
        loadData();
      } catch (error) {
        alert("Erreur lors de la suppression");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentClasse({ nomClasse: '', idCycle: cycles[0]?.idCycle, abreviation: '', capacite: 50 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (classe: ClasseStat) => {
    setIsEditing(true);
    setCurrentClasse({
        idClasse: classe.idClasse,
        nomClasse: classe.nomClasse,
        idCycle: classe.idCycle,
        abreviation: classe.abreviation,
        capacite: classe.capacite
    });
    setIsModalOpen(true);
  };

  const handleOpenReport = async (report: any, classeId: number) => {
    if (!yearId) return;
    setLoading(true);
    try {
        let reportId = report.id;
        let params: any = { idClasse: classeId, idAnneeScolaire: yearId };

        if (reportId.startsWith('fees_bilan_')) {
            params.type = reportId.split('_').pop();
            reportId = 'fees_bilan';
        }

        const res = await pedagogyService.getReportData(reportId, params);

        setSelectedReport({ ...report, classeId });
        setPreviewData(res.data);
        setIsPreviewModalOpen(true);
        setActiveReportMenu(null);
    } catch (error) {
        console.error("Erreur lors de la récupération du rapport:", error);
        alert("Impossible de charger les données du rapport");
    } finally {
        setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'print') => {
    if (format === 'print' && selectedReport && selectedClassId) {
        const url = `/app/reports/print?reportId=${selectedReport.id}&idClasse=${selectedClassId}&idAnneeScolaire=${yearId}&name=${encodeURIComponent(selectedReport.name)}&type=${selectedReport.type}&yearLabel=${encodeURIComponent(selectedYear?.libelleAnneeScolaire || '')}`;
        window.open(url, '_blank');
        return;
    }
    console.log(`Exporting ${selectedReport?.name} in ${format} format...`);
    alert(`Exportation lancée au format ${format.toUpperCase()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        libelleClasseFr: currentClasse.nomClasse,
        idCycle: currentClasse.idCycle,
        abreviation: currentClasse.abreviation,
        capacite: currentClasse.capacite
      };

      if (isEditing && currentClasse.idClasse) {
        await pedagogyService.updateClasse(currentClasse.idClasse, payload);
      } else {
        await pedagogyService.createClasse(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

        <div className="flex items-center space-x-6 relative z-10">
            <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                <ArrowLeft size={28} />
            </button>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Classes & Salles</h1>
                <div className="flex items-center space-x-3 mt-2">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                        <Zap size={12} className="mr-1.5" /> Live Statistics
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Effectifs de l'année {selectedYear?.libelleAnneeScolaire}</p>
                </div>
            </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-green-600 text-white py-4 px-10 rounded-sharp flex items-center space-x-3 shadow-2xl shadow-green-100 hover:scale-105 active:scale-95 transition-all font-black uppercase text-xs tracking-[0.2em]"
        >
          <Plus size={20} />
          <span>Nouvelle Classe</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_800px] gap-8 items-start relative">
        {/* Left Column: Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 2xl:grid-cols-2 gap-4">
          {stats.map((item, idx) => {
            const isActive = selectedClassId === item.idClasse;
            return (
              <div
                key={item.idClasse}
                onClick={() => handleSelectClass(item.idClasse)}
                className={clsx(
                  "bg-white border rounded-[32px] p-6 transition-all shadow-sm overflow-hidden relative cursor-pointer flex flex-col justify-between group h-[280px]",
                  isActive ? "border-black shadow-xl scale-[1.02] z-10" : "border-gray-100 hover:border-gray-300 hover:shadow-md"
                )}
              >
                 <div className={clsx(
                     "absolute left-0 top-0 w-full h-1.5 transition-all",
                     idx % 3 === 0 ? "bg-accent" : idx % 3 === 1 ? "bg-red-500" : "bg-green-600"
                 )}></div>

                 <div className="flex justify-between items-start">
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg group-hover:rotate-12",
                        idx % 3 === 0 ? "bg-accent shadow-violet-100" : idx % 3 === 1 ? "bg-red-500 shadow-red-100" : "bg-green-600 shadow-green-100"
                    )}>
                       <DoorOpen size={24} />
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                       <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black transition-all"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.idClasse); }}
                        className="p-2 hover:bg-red-50 rounded-xl text-red-300 hover:text-red-600 transition-all"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-black mb-1 line-clamp-2 leading-tight">{item.nomClasse}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.cycleLabel}</p>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-gray-400 flex items-center">
                          <Users size={12} className="mr-2" /> Élèves
                       </span>
                       <span className="text-black">{item.effectif} / {item.capacite || '∞'}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                       <div
                         className={clsx(
                             "h-full rounded-full transition-all duration-1000",
                             idx % 3 === 0 ? "bg-accent" : idx % 3 === 1 ? "bg-red-500" : "bg-green-600"
                         )}
                         style={{ width: `${Math.min(100, (item.effectif / (item.capacite || 100)) * 100)}%` }}
                       />
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center space-x-2">
                       <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-black font-black text-xs">
                          {item.nbSalles}
                       </div>
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Salles</span>
                    </div>
                    <ChevronRight size={16} className={clsx("transition-transform", isActive ? "text-black translate-x-1" : "text-gray-300")} />
                 </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Floating/Sticky Detail Panel */}
        <div className="xl:sticky xl:top-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 self-start">
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-2xl shadow-gray-200/50 animate-in slide-in-from-right-8 duration-500">
                <div className="flex flex-col gap-4 mb-6">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#9E9E9E]">Classe sélectionnée</p>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-black mt-2">{selectedClass ? selectedClass.nomClasse : 'Aucune classe'}</h2>
                    {selectedClass && (
                    <div className="flex flex-col gap-1 mt-4">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            Enseignement : <span className="text-black">{selectedClass.enseignementLabel || 'N/A'}</span>
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            Cycle : <span className="text-black">{selectedClass.cycleLabel || 'N/A'}</span>
                        </p>
                    </div>
                    )}
                </div>
                <div className="bg-accent/5 p-4 rounded-3xl border border-accent/10 flex justify-between items-center mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Évaluations actives</span>
                    <p className="text-2xl font-black text-accent">{sequenceCount}</p>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-[0.2em] font-black text-[#9E9E9E]">
                <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
                    <p className="text-black text-3xl font-black mb-1">{selectedClass?.nbSalles ?? 0}</p>
                    <p>Salles</p>
                </div>
                <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
                    <p className="text-black text-3xl font-black mb-1">{selectedClass?.effectif ?? 0}</p>
                    <p>Élèves</p>
                </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.35em] mb-6 text-[#9E9E9E] flex items-center gap-2">
                    <LayoutGrid size={14} /> Liste des Salles
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {rooms.length > 0 ? rooms.map(room => (
                    <div key={room.idSalle} className="bg-gray-50/50 border border-gray-100 rounded-[28px] p-5 flex flex-col gap-4 hover:border-black transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm font-black uppercase text-black group-hover:text-accent transition-colors">{room.nomSalle}</p>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#9E9E9E] mt-1">Capacité : {room.capacite || '–'} places</p>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400 group-hover:text-black">
                            <Users size={18} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-black uppercase tracking-widest">{room.elevesInscrits || 0} Inscrits</span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{Math.round(((room.elevesInscrits || 0) / (room.capacite || 1)) * 100)}%</span>
                    </div>
                    </div>
                )) : (
                    <div className="border-2 border-dashed border-gray-100 rounded-[32px] p-12 text-center text-[#9E9E9E]">
                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">Sélectionnez une classe</p>
                    </div>
                )}
                </div>
            </div>
          </div>

          {/* Right Column inside the detail area: Report Menu */}
          <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-2xl shadow-gray-200/50 flex flex-col h-full overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3 text-green-600">
                    <FileText size={20} />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Bibliothèque de Listes</span>
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-full text-[9px] font-black uppercase text-gray-400 tracking-widest border border-gray-100">
                   Prêt à imprimer
                </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                {reportCategories.map((cat, cIdx) => (
                    <div key={cIdx} className="space-y-4">
                        <h4 className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1 h-4 bg-green-600 rounded-full"></div>
                            {cat.name}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {cat.reports.map(report => (
                                <button
                                    key={report.id}
                                    onClick={() => selectedClassId && handleOpenReport(report, selectedClassId)}
                                    disabled={!selectedClassId}
                                    className={clsx(
                                        "w-full text-left px-6 py-4 rounded-2xl transition-all flex items-center justify-between group/btn",
                                        selectedClassId ? "hover:bg-gray-50 bg-gray-50/30 border border-transparent hover:border-gray-200" : "opacity-40 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-2 h-2 rounded-full bg-gray-200 group-hover/btn:bg-black group-hover/btn:scale-125 transition-all"></div>
                                        <span className="text-xs font-bold text-gray-600 group-hover/btn:text-black uppercase tracking-tight">{report.name}</span>
                                    </div>
                                    <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity translate-x-2 group-hover/btn:translate-x-0 transition-transform">
                                        <ChevronRight size={14} className="text-black" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
             </div>

             <div className="mt-8 p-6 bg-accent/5 rounded-[32px] border border-accent/10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent">Génération Intelligente</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">Données synchronisées en temps réel</p>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {!loading && stats.length === 0 && (
          <div className="p-32 text-center border-4 border-dashed border-gray-50 rounded-[56px] bg-white/50">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <LayoutGrid size={48} className="text-gray-200" />
              </div>
              <h3 className="text-2xl font-black uppercase text-black mb-3">Aucune classe définie</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9E9E9E]">Commencez par configurer votre structure académique</p>
          </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black uppercase text-[10px] tracking-widest text-black">Mise à jour...</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-white rounded-[56px] p-16 shadow-2xl relative overflow-hidden border border-gray-100">
              <div className="absolute top-0 left-0 w-full h-2 bg-green-600"></div>

              <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={24} />
              </button>

              <div className="flex items-center space-x-4 text-green-600 mb-4">
                  <DoorOpen size={28} />
                  <span className="text-[11px] font-black uppercase tracking-[0.5em]">Configuration Classe</span>
              </div>

              <h2 className="text-4xl font-black uppercase tracking-tighter text-black mb-10">
                {isEditing ? "Modifier Classe" : "Nouvelle Classe"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-4">Cycle d'appartenance</label>
                    <select
                        className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-green-600 transition-all outline-none shadow-inner appearance-none"
                        value={currentClasse.idCycle}
                        onChange={(e) => setCurrentClasse({...currentClasse, idCycle: parseInt(e.target.value)})}
                        required
                    >
                        {cycles.map(c => (
                            <option key={c.idCycle} value={c.idCycle}>{c.libelleCycle}</option>
                        ))}
                    </select>
                </div>

                <AuthInput
                  label="Nom de la classe (ex: Terminale C1)"
                  value={currentClasse.nomClasse}
                  onChange={e => setCurrentClasse({...currentClasse, nomClasse: e.target.value})}
                  placeholder="NOM COMPLET"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AuthInput
                        label="Abréviation"
                        value={currentClasse.abreviation}
                        onChange={e => setCurrentClasse({...currentClasse, abreviation: e.target.value.toUpperCase()})}
                        placeholder="EX: Tle C1"
                    />
                    <AuthInput
                        label="Capacité max."
                        type="number"
                        value={currentClasse.capacite}
                        onChange={e => setCurrentClasse({...currentClasse, capacite: parseInt(e.target.value)})}
                    />
                </div>

                <div className="pt-8 grid grid-cols-2 gap-4">
                  <AuthButton type="submit" disabled={loading}>
                    <div className="flex items-center justify-center space-x-3">
                        <Save size={20} />
                        <span>{isEditing ? "Enregistrer" : "Créer"}</span>
                    </div>
                  </AuthButton>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/finance/periscolaire/distribution`)}
                    className="flex-1 py-4 bg-accent text-white rounded-sharp font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-violet-100 hover:scale-[1.02] transition-all"
                  >
                    <Sparkles size={16} />
                    <span>Frais Périscolaires</span>
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedReport && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-[56px] shadow-2xl relative overflow-hidden flex flex-col border border-gray-100">

                  {/* Modal Header */}
                  <div className="p-8 md:p-12 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/50">
                      <div>
                          <div className="flex items-center space-x-3 text-green-600 mb-2">
                              <FileText size={20} />
                              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Aperçu Direct</span>
                          </div>
                          <h2 className="text-3xl font-black uppercase tracking-tight text-black">{selectedReport.name}</h2>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                              Classe : {stats.find(s => s.idClasse === selectedReport.classeId)?.nomClasse} • {selectedYear?.libelleAnneeScolaire}
                          </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleExport('pdf')}
                            className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 hover:bg-red-100 transition-all font-black uppercase text-[10px] tracking-widest"
                          >
                              <FileDown size={18} /> PDF
                          </button>
                          <button
                            onClick={() => handleExport('excel')}
                            className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-2 hover:bg-green-100 transition-all font-black uppercase text-[10px] tracking-widest"
                          >
                              <FileSpreadsheet size={18} /> Excel
                          </button>
                          <button
                            onClick={() => handleExport('print')}
                            className="bg-black text-white p-4 rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all font-black uppercase text-[10px] tracking-widest"
                          >
                              <Printer size={18} /> Imprimer
                          </button>
                          <button
                            onClick={() => setIsPreviewModalOpen(false)}
                            className="p-4 bg-white border border-gray-200 text-gray-400 hover:text-black rounded-2xl transition-all"
                          >
                              <X size={24} />
                          </button>
                      </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="px-12 py-6 bg-white flex items-center gap-6">
                      <div className="relative flex-1">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            placeholder="RECHERCHER UN ÉLÈVE, UN STATUT..."
                            className="w-full pl-16 pr-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold border-2 border-transparent focus:border-black focus:bg-white transition-all outline-none"
                            value={previewSearch}
                            onChange={(e) => setPreviewSearch(e.target.value)}
                          />
                      </div>

                      {(selectedReport.id === 'insolvent_fees' || selectedReport.id === 'insolvent_perischool') && (
                          <div className="w-72">
                              <select
                                className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] text-sm font-black uppercase outline-none focus:border-black transition-all appearance-none"
                                value={selectedFeeId}
                                onChange={(e) => handleFeeChange(e.target.value)}
                              >
                                  <option value="">Tous les frais</option>
                                  {availableFees.map(fee => (
                                      <option key={fee.idTarifFraisExigible || fee.idTarifFraisActivitePeriscolaire} value={fee.idTarifFraisExigible || fee.idTarifFraisActivitePeriscolaire}>
                                          {fee.Frais?.libelleFr || fee.Frais?.fraisFr}
                                      </option>
                                  ))}
                              </select>
                          </div>
                      )}

                      {selectedReport.id === 'daily_payments' && (
                          <div className="w-72">
                              <input
                                type="date"
                                className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] text-sm font-black outline-none focus:border-black transition-all"
                                value={selectedDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                              />
                          </div>
                      )}
                  </div>

                  {/* Data Content */}
                  <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar">
                      {previewData.map((section: any, sIdx: number) => (
                          <div key={section.idSalle || sIdx} className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${sIdx * 100}ms` }}>
                              {/* Room Header */}
                              <div className="flex items-center justify-between px-8 py-5 bg-gray-50 rounded-3xl border border-gray-100 mb-6">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-green-600">
                                          <DoorOpen size={20} />
                                      </div>
                                      <div>
                                          <h3 className="text-sm font-black uppercase text-black">Salle : {section.nomSalle}</h3>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Capacité : {section.capacite || '–'} places</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className="text-[10px] font-black bg-green-600 text-white px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-green-100">
                                          {section.eleves?.length || section.stats?.total || 0} Inscrits
                                      </span>
                                  </div>
                              </div>

                              {selectedReport.type === 'A' && section.eleves && (
                                  <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                                      <table className="w-full text-left">
                                          <thead className="bg-gray-50/50 border-b border-gray-100">
                                              <tr>
                                                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">ID</th>
                                                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Matricule</th>
                                                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Élève</th>
                                                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Sexe</th>
                                                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Statut</th>
                                                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] text-right">Montant Dû</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50">
                                              {section.eleves.filter((d: any) => d.nom.toLowerCase().includes(previewSearch.toLowerCase())).map((item: any) => (
                                                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                                      <td className="px-8 py-6 text-sm font-bold text-gray-400">{item.id}</td>
                                                      <td className="px-8 py-6 text-sm font-black text-black">{item.matricule}</td>
                                                      <td className="px-8 py-6">
                                                          <div className="font-black uppercase text-black group-hover:text-green-600 transition-colors">{item.nom} {item.prenom}</div>
                                                          <div className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Né(e) le {new Date(item.date).toLocaleDateString()}</div>
                                                      </td>
                                                      <td className="px-8 py-6 text-center">
                                                          <span className={clsx(
                                                              "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                                                              item.sexe === 'M' ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                                                          )}>{item.sexe === 'M' ? 'M' : 'F'}</span>
                                                      </td>
                                                      <td className="px-8 py-6">
                                                          <div className="flex items-center gap-2">
                                                              {item.statut === 'Nouveau' ? <Zap size={12} className="text-yellow-500" /> : <MoreVertical size={12} className="text-gray-300" />}
                                                              <span className="text-[10px] font-black uppercase tracking-widest">{item.statut}</span>
                                                          </div>
                                                      </td>
                                                      <td className="px-8 py-6 text-right font-black text-sm">
                                                          {item.solde > 0 ? (
                                                              <span className="text-red-500">{item.solde.toLocaleString()} FCFA</span>
                                                          ) : (
                                                              <span className="text-green-600 flex items-center justify-end gap-2">
                                                                  <CheckCircle2 size={14} /> SOLDÉ
                                                              </span>
                                                          )}
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                      <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex justify-end">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total : {section.eleves.length} élèves</p>
                                      </div>
                                  </div>
                              )}

                              {selectedReport.id === 'gender_split' && section.stats && (
                                  <div className="space-y-6">
                                      <div className="grid grid-cols-3 gap-6">
                                          <div className="bg-pink-50 border border-pink-100 p-6 rounded-[32px]">
                                              <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest">Filles</p>
                                              <p className="text-3xl font-black text-pink-700 mt-2">{section.stats.girls} ({section.stats.girlsPercent}%)</p>
                                          </div>
                                          <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px]">
                                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Garçons</p>
                                              <p className="text-3xl font-black text-blue-700 mt-2">{section.stats.boys} ({section.stats.boysPercent}%)</p>
                                          </div>
                                          <div className="bg-gray-50 border border-gray-100 p-6 rounded-[32px]">
                                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Effectif Total</p>
                                              <p className="text-3xl font-black text-black mt-2">{section.stats.total}</p>
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden">
                                              <div className="px-8 py-4 bg-pink-50/50 border-b border-pink-100 flex justify-between items-center">
                                                  <span className="text-[10px] font-black uppercase text-pink-600">Liste des Filles</span>
                                                  <span className="text-[10px] font-bold text-pink-400 uppercase">{section.girls.length} ÉLÈVES</span>
                                              </div>
                                              <table className="w-full text-left">
                                                  <tbody className="divide-y divide-gray-50">
                                                      {section.girls.map((f: any, idx: number) => (
                                                          <tr key={idx}>
                                                              <td className="px-8 py-3 text-xs font-bold text-gray-400 w-12">{idx + 1}</td>
                                                              <td className="px-4 py-3 text-[11px] font-black uppercase text-black">{f.nom} {f.prenom}</td>
                                                          </tr>
                                                      ))}
                                                  </tbody>
                                              </table>
                                          </div>
                                          <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden">
                                              <div className="px-8 py-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
                                                  <span className="text-[10px] font-black uppercase text-blue-600">Liste des Garçons</span>
                                                  <span className="text-[10px] font-bold text-blue-400 uppercase">{section.boys.length} ÉLÈVES</span>
                                              </div>
                                              <table className="w-full text-left">
                                                  <tbody className="divide-y divide-gray-50">
                                                      {section.boys.map((m: any, idx: number) => (
                                                          <tr key={idx}>
                                                              <td className="px-8 py-3 text-xs font-bold text-gray-400 w-12">{idx + 1}</td>
                                                              <td className="px-4 py-3 text-[11px] font-black uppercase text-black">{m.nom} {m.prenom}</td>
                                                          </tr>
                                                      ))}
                                                  </tbody>
                                              </table>
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {selectedReport.id === 'trombinoscope' && section.eleves && (
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                      {section.eleves.map((eleve: any) => (
                                          <div key={eleve.id} className="bg-white border border-gray-100 p-4 rounded-3xl text-center group hover:border-black transition-all">
                                              <div className="aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                                                  {eleve.photo ? (
                                                      <img src={eleve.photo} alt={eleve.nom} className="w-full h-full object-cover" />
                                                  ) : (
                                                      <div className="absolute inset-0 flex items-center justify-center">
                                                          <Users size={40} className="text-gray-300" />
                                                      </div>
                                                  )}
                                              </div>
                                              <p className="text-[11px] font-black uppercase text-black truncate">{eleve.nom} {eleve.prenom}</p>
                                              <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">{eleve.matricule}</p>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              {selectedReport.id === 'attendance_monthly' && section.eleves && (
                                  <div className="bg-white border border-gray-100 rounded-[32px] overflow-x-auto shadow-sm">
                                      <table className="w-full text-left border-collapse min-w-[1200px]">
                                          <thead>
                                              <tr className="bg-gray-50/50">
                                                  <th className="border-r border-gray-100 px-6 py-4 text-[9px] font-black uppercase tracking-widest w-[250px]">Nom de l'élève</th>
                                                  {[...Array(31)].map((_, i) => (
                                                      <th key={i} className="border-r border-gray-100 px-0 py-4 text-center text-[7px] font-black uppercase w-[40px]">
                                                          <div className="mb-1">{i + 1}</div>
                                                          <div className="flex border-t border-gray-100">
                                                              <span className="flex-1 border-r border-gray-100">M</span>
                                                              <span className="flex-1">S</span>
                                                          </div>
                                                      </th>
                                                  ))}
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {section.eleves.map((item: any) => (
                                                  <tr key={item.id} className="border-t border-gray-100">
                                                      <td className="border-r border-gray-100 px-6 py-3 font-black uppercase text-[10px]">{item.nom} {item.prenom}</td>
                                                      {[...Array(31)].map((_, i) => (
                                                          <td key={i} className="border-r border-gray-100 p-0 h-10">
                                                              <div className="flex h-full">
                                                                  <div className="flex-1 border-r border-gray-50 bg-white group-hover:bg-gray-50/30"></div>
                                                                  <div className="flex-1 bg-white group-hover:bg-gray-50/30"></div>
                                                              </div>
                                                          </td>
                                                      ))}
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ClasseManagementPage;
